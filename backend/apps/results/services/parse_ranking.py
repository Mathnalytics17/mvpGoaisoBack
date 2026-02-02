import re
from typing import Any

def parse_ranking(decoded: dict):
    ranking = decoded.get("ranking")

    if not ranking or not isinstance(ranking, list):
        return []

    parsed = []

    def clean_text(x: Any) -> str:
        s = "" if x is None else str(x)
        s = s.strip()
        s = re.sub(r"\s+", " ", s)
        return s

    for idx, item in enumerate(ranking[:5], start=1):
        if isinstance(item, dict):
            brand = clean_text(item.get("brand"))
            model = clean_text(item.get("model"))
            raw_text = clean_text(f"{brand} {model}".strip())
        else:
            raw = clean_text(item)
            # fallback: intenta Brand | Model, si no, deja todo como raw_text
            if "|" in raw:
                left, right = raw.split("|", 1)
                brand = clean_text(left)
                model = clean_text(right)
            else:
                # fallback mínimo
                parts = raw.split(" ", 1)
                brand = clean_text(parts[0]) if parts else ""
                model = clean_text(parts[1]) if len(parts) > 1 else ""
            raw_text = raw

        # eliminar URLs si se cuelan
        raw_text = re.sub(r"https?://\S+", "", raw_text).strip()

        parsed.append({
            "position": idx,
            "brand": brand,
            "model": model,
            "raw_text": raw_text,
        })

    return parsed
