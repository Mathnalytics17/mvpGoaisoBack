def geo_text(country: str | None = None, location: str | None = None) -> str:
    if location and country:
        return f"in {location}, {country}"
    if country:
        return f"in {country}"
    if location:
        return f"in {location}"
    return ""


def prompt_phase1(product_type, criteria_str, country=None, location=None):
    geo = geo_text(country, location)
    return f"""
You are generating structured data.

Task: Recommend the 5 best {product_type} today {geo} based on: {criteria_str}.
Use web_search.

Return ONLY valid JSON (no markdown, no extra text) with this exact shape:
{{
  "ranking": [
    {{"brand": "...", "model": "..."}},
    {{"brand": "...", "model": "..."}},
    {{"brand": "...", "model": "..."}},
    {{"brand": "...", "model": "..."}},
    {{"brand": "...", "model": "..."}}
  ],
  "notes": "optional short note"
}}

Rules:
- ranking MUST have exactly 5 items.
- brand should be the brand name only (e.g., "Nike", "ASICS", "New Balance").
- model should be the model name only (may contain commas; that's OK).
- No URLs.
"""



def prompt_phase2(product_type: str, criterion: str, country=None, location=None) -> str:
    geo = geo_text(country, location)
    return f"""
You are generating structured data.

Task: Recommend the 5 best {product_type} today {geo}, focusing ONLY on this criterion: {criterion}.
Use web_search.

Return ONLY valid JSON (no markdown, no extra text) with this exact shape:
{{
  "ranking": [
    {{"brand": "...", "model": "..."}},
    {{"brand": "...", "model": "..."}},
    {{"brand": "...", "model": "..."}},
    {{"brand": "...", "model": "..."}},
    {{"brand": "...", "model": "..."}}
  ],
  "notes": "optional short note"
}}

Rules:
- ranking MUST have exactly 5 items.
- brand should be the brand name only.
- model should be the model name only.
- No URLs.
"""
