def geo_text(country: str | None = None, location: str | None = None) -> str:
    if location and country:
        return f"in {location}, {country}"
    if country:
        return f"in {country}"
    if location:
        return f"in {location}"
    return ""


def prompt_toon_phase1(product_type, criteria_str, country=None, location=None):
    geo = geo_text(country, location)
    return f"""
Return ONE LINE ONLY.

Task: recommend the 5 best {product_type} today {geo} based on: {criteria_str}.
Use web_search.

Rules:
- Exactly 5 items separated by commas
- Each item MUST be: Brand | Model
- Keep brand casing consistent (use the brand's official casing; do not output the same brand with different casing)
- No quotes. No extra text.

OUTPUT MUST BE EXACTLY:
ranking[5]: Brand | Model,Brand | Model,Brand | Model,Brand | Model,Brand | Model
"""


def prompt_toon_phase2(product_type: str, criterion: str, country=None, location=None) -> str:
    geo = geo_text(country, location)
    return f"""
Return ONE LINE ONLY.

Task: recommend the 5 best {product_type} today {geo}, focusing ONLY on this criterion: {criterion}.
Use web_search.

Rules:
- Exactly 5 items separated by commas
- Each item MUST be: Brand | Model
- Keep brand casing consistent (use the brand's official casing; do not output the same brand with different casing)
- No quotes. No extra text.

OUTPUT MUST BE EXACTLY:
ranking[5]: Brand | Model,Brand | Model,Brand | Model,Brand | Model,Brand | Model
"""
