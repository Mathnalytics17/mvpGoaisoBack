def parse_ranking(decoded: dict):
    """
    Espera:
      ranking => ["Nike Air Max", "Adidas Ultraboost", ...]
    """
    ranking = decoded.get("ranking")

    if not ranking or not isinstance(ranking, list):
        return None

    parsed = []
    for idx, raw in enumerate(ranking, start=1):
        parts = raw.split(" ", 1)
        brand = parts[0].strip()
        model = parts[1].strip() if len(parts) > 1 else ""
        parsed.append({
            "position": idx,
            "brand": brand,
            "model": model,
            "raw_text": raw.strip(),
        })

    return parsed
