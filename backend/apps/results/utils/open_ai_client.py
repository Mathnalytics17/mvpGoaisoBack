import os
import time
import json

import re
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, Alignment

import logging
load_dotenv()

# -------------------------
# Logger
# -------------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
console_handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(console_handler)

# -------------------------
# OpenAI client
# -------------------------
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger.debug(os.getenv("OPENAI_API_KEY"))
DEFAULT_MODEL = "gpt-4o-mini"

# -------------------------
# Excel helpers
# -------------------------
DEFAULT_XLSX_PATH = "websearch_logs.xlsx"

HEADERS = [
    "timestamp",
    "model",
    "phase",
    "criterion",
    "evaluation_uuid",
    "attempt",
    "elapsed_seconds",
    # antes era "toon_valid"; lo dejo igual para no romper tu Excel existente
    "toon_valid",
    "prompt",
    "output_text",
    "sources",
]

def ensure_workbook(path: str) -> tuple[Workbook, any]:
    """Crea o abre el Excel y asegura header + estilos."""
    if os.path.exists(path):
        wb = load_workbook(path)
        ws = wb.active
    else:
        wb = Workbook()
        ws = wb.active
        ws.title = "logs"
        ws.append(HEADERS)

        header_font = Font(bold=True)
        for col_idx in range(1, len(HEADERS) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.alignment = Alignment(vertical="center")

        widths = {
            "A": 20,
            "B": 14,
            "C": 10,
            "D": 18,
            "E": 38,
            "F": 8,
            "G": 14,
            "H": 10,  # "toon_valid" (ahora significa JSON válido)
            "I": 70,
            "J": 70,
            "K": 70,
        }
        for col_letter, w in widths.items():
            ws.column_dimensions[col_letter].width = w

        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions

    return wb, ws


def append_log_row(
    xlsx_path: str,
    *,
    model: str,
    attempt: int,
    elapsed: float,
    toon_valid: bool,
    prompt: str,
    output_text: str,
    sources: list[str],
    phase: str = "",
    criterion: str = "",
    evaluation_uuid: str = "",
):
    wb, ws = ensure_workbook(xlsx_path)

    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sources_str = " | ".join(sources)

    ws.append([
        ts,
        model,
        phase,
        criterion,
        evaluation_uuid,
        attempt,
        float(elapsed),
        "YES" if toon_valid else "NO",
        prompt,
        output_text,
        sources_str,
    ])

    ws.auto_filter.ref = ws.dimensions
    wb.save(xlsx_path)

# -------------------------
# Core logic
# -------------------------
def _clean_output_text(text: str) -> str:
    """
    Limpia wrappers típicos (```json ... ```) y espacios.
    """
    text = (text or "").strip()

    # eliminar fences
    text = text.replace("```json", "").replace("```", "").strip()

    # si viene con texto antes/después, intenta recortar al JSON
    # (busca primer { y último })
    if "{" in text and "}" in text:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start:end+1].strip()

    # colapsar espacios raros
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_sources(res) -> list[str]:
    sources = []
    try:
        for item in res.output:
            if getattr(item, "type", None) == "web_search_call":
                results = getattr(item, "results", None)
                if results:
                    for r in results:
                        url = r.get("url")
                        if url:
                            sources.append(url)
    except Exception as e:
        logger.warning(f"[SOURCES ERROR] {str(e)}")

    return list(dict.fromkeys(sources))[:10]


def _safe_json_loads(text: str) -> dict | None:
    """
    Intenta cargar JSON. Si falla, devuelve None.
    """
    try:
        return json.loads(text)
    except Exception:
        return None


def _is_valid_json_ranking(decoded: dict) -> bool:
    """
    Valida que exista ranking como lista con al menos 3 items.
    (Flexible para no romper por respuestas incompletas)
    Acepta:
      - [{"brand": "...", "model": "..."}, ...]
      - ["Brand | Model", ...]  (fallback)
    """
    if not isinstance(decoded, dict):
        return False

    ranking = decoded.get("ranking")
    if not isinstance(ranking, list) or len(ranking) < 3:
        return False

    # Validación suave: que los primeros 3 tengan contenido
    ok = 0
    for it in ranking[:5]:
        if isinstance(it, dict):
            b = str(it.get("brand", "")).strip()
            m = str(it.get("model", "")).strip()
            if b and m:
                ok += 1
        else:
            s = str(it).strip()
            if s:
                ok += 1

    return ok >= 3


def completion_with_web_search(
    prompt: str,
    model: str = DEFAULT_MODEL,
    max_retries: int = 2,
    *,
    xlsx_path: str = DEFAULT_XLSX_PATH,
    phase: str = "",
    criterion: str = "",
    evaluation_uuid: str = "",
):
    """
    ✅ web_search + logs + retry
    ✅ Ya NO usa TOON. Ahora espera JSON.
    ✅ Flexible: si hay JSON con ranking >= 3, lo acepta.
    ✅ Nunca rompe por separadores/comas/etc.
    """

    last_output_text = ""
    last_sources: list[str] = []

    for attempt in range(1, max_retries + 2):
        start = time.time()

        logger.debug("=" * 60)
        logger.debug(f"[WEBSEARCH] Attempt {attempt}")
        logger.debug(f"[WEBSEARCH] Model: {model}")
        logger.debug(f"[PROMPT PREVIEW] {prompt[:250]}...")

        # OJO: sigue usando tools web_search
        res = client.responses.create(
            model=model,
            input=prompt,
            tools=[{"type": "web_search", "search_context_size": "low"}],
        )

        elapsed = round(time.time() - start, 2)

        output_text = _clean_output_text(res.output_text)
        sources = _extract_sources(res)

        decoded = _safe_json_loads(output_text)
        valid = _is_valid_json_ranking(decoded) if decoded else False

        logger.debug(f"[OUTPUT RAW] {output_text[:400]}...")
        logger.debug(f"[TIME] {elapsed}s")
        logger.debug(f"[SOURCES] {len(sources)} found")
        logger.debug(f"[JSON VALID] {valid}")

        # ✅ guarda SIEMPRE el intento en Excel
        append_log_row(
            xlsx_path,
            model=model,
            attempt=attempt,
            elapsed=elapsed,
            toon_valid=valid,  # ahora significa JSON válido (mantengo columna)
            prompt=prompt,
            output_text=output_text,
            sources=sources,
            phase=phase,
            criterion=criterion,
            evaluation_uuid=evaluation_uuid,
        )

        last_output_text = output_text
        last_sources = sources

        if valid:
            return output_text, sources

        # retry suave
        logger.warning("[RETRYING] JSON inválido o ranking insuficiente, intentando de nuevo...")
        time.sleep(1)

    logger.error("[FAILED] No se obtuvo JSON válido tras varios intentos")
    # ✅ no matamos: devolvemos lo último, aunque sea inválido
    return last_output_text, last_sources
