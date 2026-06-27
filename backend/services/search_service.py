import httpx
from typing import Optional, List
from config import get_settings
from schemas.schemas import SearchResult

settings = get_settings()

OPPORTUNITY_TYPES = {
    "scholarship": ["scholarship", "منحة", "grant", "fellowship", "funding for students"],
    "job": ["job", "وظيفة", "career", "hiring", "position", "vacancy"],
    "internship": ["internship", "تدريب", "intern", "trainee"],
    "volunteering": ["volunteering", "تطوع", "volunteer", "نشاط تطوعي"],
    "conference": ["conference", "مؤتمر", "summit", "symposium", "workshop", "webinar"],
    "training": ["training", "تدريب", "course", "دورة", "certification", "bootcamp"],
}


async def search_opportunities(
    query: str,
    opp_type: Optional[str] = None,
    country: Optional[str] = None,
    limit: int = 10,
) -> List[SearchResult]:
    """Search for opportunities using Serper API (Google Search)."""

    # Build enriched query
    type_keywords = ""
    if opp_type and opp_type in OPPORTUNITY_TYPES:
        type_keywords = " OR ".join(OPPORTUNITY_TYPES[opp_type][:2])

    full_query = query
    if type_keywords:
        full_query += f" ({type_keywords})"
    if country:
        full_query += f" {country}"
    full_query += " 2024 OR 2025 apply now"

    payload = {
        "q": full_query,
        "num": min(limit, 10),
        "gl": "us",
        "hl": "en",
    }

    headers = {
        "X-API-KEY": settings.SERPER_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        return []

    results = []
    for item in data.get("organic", [])[:limit]:
        result = SearchResult(
            title=item.get("title", ""),
            type=opp_type or _detect_type(item.get("title", "") + " " + item.get("snippet", "")),
            description=item.get("snippet"),
            url=item.get("link"),
            source=item.get("displayLink"),
            deadline=None,
            country=country,
            tags=opp_type,
        )
        results.append(result)

    return results


def _detect_type(text: str) -> str:
    text_lower = text.lower()
    for opp_type, keywords in OPPORTUNITY_TYPES.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                return opp_type
    return "job"
