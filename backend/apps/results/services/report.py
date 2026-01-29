from __future__ import annotations

from collections import defaultdict
from typing import Dict, Optional, List, Tuple
import re
import unicodedata

from apps.results.api.models.index import (
    PromptRun,
    RankingItem,
    EvaluationCriterion,
)

# Regla de puntos (solo top 5)
POSITION_SCORE = {1: 5, 2: 4, 3: 3, 4: 2, 5: 1}


# =========================
# Normalización (sin marcas fijas)
# =========================
def _clean(s: str) -> str:
    s = (s or "").strip()
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"\s+", " ", s)
    return s


def normalize_brand_key(brand: str) -> str:
    """
    Clave estable para agrupar: case-insensitive.
    Evita duplicados tipo Adidas/adidas/ADIDAS.
    """
    return _clean(brand).casefold()


def normalize_brand_display(brand: str) -> str:
    """
    Nombre "bonito" para mostrar, sin lista fija.
    """
    b = _clean(brand)
    if not b:
        return ""

    # Si viene en mayúsculas y es corto, respetar (ASICS, NB)
    if b.isupper() and len(b) <= 8 and " " not in b:
        return b

    # Title case suave
    return " ".join(
        (w[:1].upper() + w[1:].lower()) if w else ""
        for w in b.split(" ")
    )


def normalize_model(model: str) -> str:
    return _clean(model)


# =========================
# Iterador seguro (evita cargar todo)
# =========================
def items_por_iter(qs):
    """
    Evita cargar todo en memoria si hay muchos items.
    """
    try:
        return qs.iterator()
    except Exception:
        return qs


# =========================
# Parse Brand/Model (fallback)
# =========================
def parse_brand_model_from_raw(raw_text: str) -> Tuple[str, str]:
    """
    Fallback SOLO si no tienes brand/model en DB.

    IMPORTANTE:
    - No soporta marcas compuestas: "New Balance 9060" -> ("New", "Balance 9060")
    - Lo ideal es guardar brand/model en DB desde el parser original.
    """
    raw_text = _clean(raw_text)
    if not raw_text:
        return ("", "")
    parts = raw_text.split(" ", 1)
    if len(parts) == 1:
        return (parts[0], "")
    return (parts[0].strip(), parts[1].strip())


def calc_share_percent(score: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((score / total) * 100.0, 2)


# =========================
# Helpers: obtener brand/model por item
# =========================
def get_item_brand_model(item: RankingItem) -> Tuple[str, str, str]:
    """
    Devuelve (brand_raw, model_raw, raw_text)
    - Si RankingItem tiene brand/model -> usa eso
    - Si no -> intenta parsear raw_text (fallback)
    """
    raw_text = _clean(getattr(item, "raw_text", "") or "")

    brand = _clean(getattr(item, "brand", "") or "")
    model = _clean(getattr(item, "model", "") or "")

    if brand or model:
        return (brand, model, raw_text)

    # fallback
    b, m = parse_brand_model_from_raw(raw_text)
    return (b, m, raw_text)


# =========================
# Report builder
# =========================
def build_report(evaluation) -> dict:
    """
    JSON final para frontend (TSX) cumpliendo:
    - score = suma de puntos por posición (calidad)
    - share = score / total_points_real * 100 (siempre % sobre 100)
    - Deduplicación de marcas por normalización (sin lista fija)

    NOTA IMPORTANTE:
    - La matriz debe reflejar TODAS las marcas que aparecen en las gráficas
      (phase2_summary), no solo "top 12" arbitrario.
    """

    # ==========================
    # Phase 1: runs + raw table + scoring (brands/models)
    # ==========================
    phase1_runs = PromptRun.objects.filter(
        evaluation=evaluation, phase="PHASE1"
    ).order_by("created_at")

    phase1_results: List[Dict[str, str]] = []

    # brand_key -> score
    brand_score: Dict[str, int] = defaultdict(int)
    # brand_key -> display
    brand_display: Dict[str, str] = {}

    # model_key -> score  (brand_key, model_norm)
    model_score: Dict[Tuple[str, str], int] = defaultdict(int)
    # model_key -> display
    model_display: Dict[Tuple[str, str], str] = {}

    total_points_phase1 = 0

    for run in phase1_runs:
        ranking: Dict[str, str] = {}

        # OJO: puede venir menos de 5 si hubo fallo en un run.
        items = run.items.all().order_by("position")

        for item in items_por_iter(items):
            pos = int(getattr(item, "position", 0) or 0)
            pts = POSITION_SCORE.get(pos, 0)

            # tabla raw para frontend
            ranking[str(pos)] = getattr(item, "raw_text", "") or ""

            if pts <= 0:
                continue

            total_points_phase1 += pts

            b_raw, m_raw, raw_text = get_item_brand_model(item)

            b_key = normalize_brand_key(b_raw) if b_raw else ""
            b_disp = normalize_brand_display(b_raw) if b_raw else ""

            # Marca
            if b_key:
                brand_score[b_key] += pts
                if b_key not in brand_display and b_disp:
                    brand_display[b_key] = b_disp

            # Modelo
            model_norm = normalize_model(m_raw) if m_raw else ""
            if not model_norm and raw_text:
                # fallback: si no hay model, usamos raw_text entero
                model_norm = raw_text

            if b_key and model_norm:
                m_key = (b_key, model_norm)
                model_score[m_key] += pts
                if m_key not in model_display:
                    brand_name = brand_display.get(b_key, b_disp or b_key)
                    model_display[m_key] = f"{brand_name} {model_norm}".strip()

        phase1_results.append(ranking)

    # Top brands (por puntos)
    phase1_topBrands = []
    for b_key, score in sorted(brand_score.items(), key=lambda x: x[1], reverse=True)[:10]:
        name = brand_display.get(b_key) or normalize_brand_display(b_key) or b_key
        phase1_topBrands.append({
            "name": name,
            "score": score,
            "share": calc_share_percent(score, total_points_phase1),
        })

    # Top models (por puntos, NO frecuencia)
    phase1_topModels = []
    for m_key, score in sorted(model_score.items(), key=lambda x: x[1], reverse=True)[:10]:
        name = model_display.get(m_key) or ""
        phase1_topModels.append({
            "name": name,
            "score": score,
            "share": calc_share_percent(score, total_points_phase1),
        })

    metrics = {
        # nº de runs en fase 1 (no "5" fijo)
        "totalEvaluations": phase1_runs.count(),
        "topBrand": phase1_topBrands[0]["name"] if phase1_topBrands else "N/A",
        "topShare": phase1_topBrands[0]["share"] if phase1_topBrands else 0.0,
        # marcas únicas (dedupe)
        "uniqueBrands": len(brand_score),
    }

    # ==========================
    # Phase 2: por criterio (raw + scoring)
    # ==========================
    criteria_qs = EvaluationCriterion.objects.filter(
        evaluation=evaluation
    ).order_by("order")

    phase2_results: List[Dict[str, object]] = []
    phase2_summary: List[Dict[str, object]] = []

    # score_by_criterion[criterion_name][brand_key] = score
    score_by_criterion: Dict[str, Dict[str, int]] = {}

    # display_by_criterion[criterion_name][brand_key] = display
    display_by_criterion: Dict[str, Dict[str, str]] = {}

    for crit in criteria_qs:
        runs = PromptRun.objects.filter(
            evaluation=evaluation,
            phase="PHASE2",
            criterion=crit
        ).order_by("created_at")

        criterion_rankings: List[Dict[str, str]] = []
        crit_brand_score: Dict[str, int] = defaultdict(int)
        crit_brand_display: Dict[str, str] = {}

        crit_total_points = 0

        for run in runs:
            ranking: Dict[str, str] = {}
            items = run.items.all().order_by("position")

            for item in items_por_iter(items):
                pos = int(getattr(item, "position", 0) or 0)
                pts = POSITION_SCORE.get(pos, 0)

                ranking[str(pos)] = getattr(item, "raw_text", "") or ""

                if pts <= 0:
                    continue

                crit_total_points += pts

                b_raw, _, _ = get_item_brand_model(item)
                b_key = normalize_brand_key(b_raw) if b_raw else ""
                b_disp = normalize_brand_display(b_raw) if b_raw else ""

                if b_key:
                    crit_brand_score[b_key] += pts
                    if b_key not in crit_brand_display and b_disp:
                        crit_brand_display[b_key] = b_disp

                    # también “aprendemos” display global si no existe
                    if b_key not in brand_display and b_disp:
                        brand_display[b_key] = b_disp

            criterion_rankings.append(ranking)

        phase2_results.append({
            "criterion": crit.name,
            "results": criterion_rankings
        })

        score_by_criterion[crit.name] = dict(crit_brand_score)
        display_by_criterion[crit.name] = dict(crit_brand_display)

        # Resumen del criterio (top brands por puntos + share % sobre puntos reales)
        topBrands = []
        for b_key, score in sorted(crit_brand_score.items(), key=lambda x: x[1], reverse=True)[:10]:
            display = (
                crit_brand_display.get(b_key)
                or brand_display.get(b_key)
                or normalize_brand_display(b_key)
                or b_key
            )
            topBrands.append({
                "name": display,
                "score": score,
                "share": calc_share_percent(score, crit_total_points),
            })

        phase2_summary.append({
            "criterion": crit.name,
            "topBrands": topBrands,
        })

    # ==========================
    # Matriz: rank por criterio (DEBE reflejar todas las marcas)
    # ==========================
    criteria_list = [c.name for c in criteria_qs]

    # ✅ Marcas para matriz:
    # - todas las que aparecen en score_by_criterion (porque eso alimenta las gráficas)
    matrix_brand_keys_set = set()
    for crit_name in criteria_list:
        for b_key in (score_by_criterion.get(crit_name, {}) or {}).keys():
            if b_key:
                matrix_brand_keys_set.add(b_key)

    # fallback: si no hay phase2, al menos las de phase1
    if not matrix_brand_keys_set:
        matrix_brand_keys_set = set(brand_score.keys())

    # Ordenamos por fuerza global (score total en phase2 + si no, phase1)
    def total_score_for_brand(b_key: str) -> int:
        s = 0
        for crit_name in criteria_list:
            s += (score_by_criterion.get(crit_name, {}) or {}).get(b_key, 0)
        if s == 0:
            s = brand_score.get(b_key, 0)
        return s

    matrix_brand_keys = sorted(
        list(matrix_brand_keys_set),
        key=lambda k: total_score_for_brand(k),
        reverse=True
    )

    # display final
    def display_for_key(k: str) -> str:
        return brand_display.get(k) or normalize_brand_display(k) or k

    matrix_brands = [display_for_key(k) for k in matrix_brand_keys]

    # ranks[criterion][brand_display] = rank | None
    rank_by_criterion: Dict[str, Dict[str, Optional[int]]] = {}

    for crit_name in criteria_list:
        scores = score_by_criterion.get(crit_name, {}) or {}

        # ranking solo con los que tienen score>0
        sorted_brands = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        ranks_by_key: Dict[str, int] = {}
        r = 1
        for b_key, sc in sorted_brands:
            if sc <= 0:
                continue
            ranks_by_key[b_key] = r
            r += 1

        # Aseguramos que todas las marcas estén en la tabla (None si no aparece)
        rank_by_criterion[crit_name] = {
            display_for_key(k): ranks_by_key.get(k) for k in matrix_brand_keys
        }

    matrix = {
        "brands": matrix_brands,
        "criteria": criteria_list,
        "ranks": rank_by_criterion,
    }

    # ==========================
    # Final report JSON
    # ==========================
    return {
        "uuid": str(evaluation.uuid),
        "product_type": evaluation.product_type,
        "timestamp": evaluation.created_at.isoformat(),
        "status": evaluation.status,
        "metrics": metrics,
        "phase1_results": phase1_results,
        "phase2_results": phase2_results,
        "phase1": {
            "topBrands": phase1_topBrands,
            "topModels": phase1_topModels,
        },
        "phase2": phase2_summary,
        "matrix": matrix,
    }
