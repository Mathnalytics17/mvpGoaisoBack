from __future__ import annotations

from collections import defaultdict
import re
import unicodedata
from typing import Iterable, Optional

from apps.results.api.models.index import RankingSummary, RankingItem

# Regla de puntos (solo top 5)
POSITION_SCORE = {1: 5, 2: 4, 3: 3, 4: 2, 5: 1}


def _clean(s: str) -> str:
    """
    Normaliza espacios y unicode para evitar duplicados por caracteres raros.
    """
    s = (s or "").strip()
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"\s+", " ", s)
    return s


def normalize_brand_key(brand: str) -> str:
    """
    Clave para deduplicar marcas de forma case-insensitive:
    'Adidas', 'adidas', 'ADIDAS' -> 'adidas'
    """
    return _clean(brand).casefold()


def normalize_brand_display(brand: str) -> str:
    """
    Versión bonita para mostrar:
    - Acrónimos cortos en mayúsculas se respetan (NB, ASICS)
    - Resto: Title Case suave por palabras
    """
    b = _clean(brand)
    if not b:
        return ""

    # Mantener acrónimos cortos (sin espacios)
    if b.isupper() and len(b) <= 8 and " " not in b:
        return b

    # Title Case palabra a palabra (sin lista fija)
    return " ".join((w[:1].upper() + w[1:].lower()) if w else "" for w in b.split(" "))


def items_por_iter(qs):
    """
    Evita cargar todo en memoria si hay muchos items.
    """
    try:
        return qs.iterator()
    except Exception:
        return qs


def compute_brand_summary(evaluation, phase: str, criterion=None):
    """
    Calcula scores por marca para PHASE1 o PHASE2 (por criterio).
    Guarda en RankingSummary.

    Reglas:
    - cada aparición suma puntos según posición: 1º=5 ... 5º=1
    - share (%) se calcula sobre el total REAL de puntos del conjunto filtrado
      (no 75 fijo, porque puede haber menos/más runs/items)
    - dedup por marca (case-insensitive) sin lista fija
    """

    # borrar summaries anteriores para evitar duplicados
    RankingSummary.objects.filter(
        evaluation=evaluation, phase=phase, criterion=criterion
    ).delete()

    # filtrar items según fase
    items_qs = RankingItem.objects.filter(
        prompt_run__evaluation=evaluation,
        prompt_run__phase=phase
    )

    if criterion:
        items_qs = items_qs.filter(prompt_run__criterion=criterion)

    # scoring
    brand_scores = defaultdict(int)   # brand_key -> score
    brand_display = {}               # brand_key -> display

    total_points = 0  # total real de puntos distribuidos en este subconjunto

    for item in items_por_iter(items_qs):
        pos = int(getattr(item, "position", 0) or 0)
        pts = POSITION_SCORE.get(pos, 0)

        # En teoría solo guardas top5, pero si entra algo fuera: pts=0
        if pts <= 0:
            continue

        total_points += pts

        b_raw = getattr(item, "brand", "") or ""
        b_key = normalize_brand_key(b_raw)
        b_disp = normalize_brand_display(b_raw)

        if not b_key:
            continue

        brand_scores[b_key] += pts
        # guardamos el primer display "bonito" que veamos
        if b_key not in brand_display and b_disp:
            brand_display[b_key] = b_disp

    # evitar división por 0
    total_points = total_points or 1

    # persistimos ordenado por score desc
    for b_key, score in sorted(brand_scores.items(), key=lambda x: x[1], reverse=True):
        share = round((score / total_points) * 100.0, 2)

        RankingSummary.objects.create(
            evaluation=evaluation,
            phase=phase,
            criterion=criterion,
            brand=brand_display.get(b_key, b_key),
            score=score,
            share=share
        )
