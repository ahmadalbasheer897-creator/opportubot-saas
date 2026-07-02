import httpx
from typing import Optional, List
from config import get_settings
from schemas.schemas import SearchResult

settings = get_settings()

# ─── Curated Sources ────────────────────────────────────────────────────────
# Organized by opportunity type. Each has a display name and searchable domain.
CURATED_SOURCES = {
    "scholarship": [
        {"name": "Opportunity Desk",       "domain": "opportunitydesk.org"},
        {"name": "Scholars4Dev",           "domain": "scholars4dev.com"},
        {"name": "Scholarships Ads",       "domain": "scholarshipsads.com"},
        {"name": "Opportunities for Youth","domain": "opportunitiesforyouth.org"},
        {"name": "Opportunities Corners",  "domain": "opportunitiescorners.com"},
        {"name": "Apply Index",            "domain": "applyindex.com"},
        {"name": "Chevening",             "domain": "chevening.org"},
        {"name": "DAAD Germany",           "domain": "daad.de"},
        {"name": "WeMakeScholars",        "domain": "wemakescholars.com"},
        {"name": "Go Overseas",            "domain": "gooverseas.com"},
    ],
    "job": [
        {"name": "LinkedIn",               "domain": "linkedin.com"},
        {"name": "Indeed",                 "domain": "indeed.com"},
        {"name": "Glassdoor",              "domain": "glassdoor.com"},
        {"name": "Idealist",               "domain": "idealist.org"},
        {"name": "Global Jobs",            "domain": "globaljobs.org"},
        {"name": "Remote OK",              "domain": "remoteok.com"},
        {"name": "Opportunity Desk",       "domain": "opportunitydesk.org"},
        {"name": "Opportunities for Youth","domain": "opportunitiesforyouth.org"},
        {"name": "Relocate.me",           "domain": "relocate.me"},
        {"name": "We Work Remotely",       "domain": "weworkremotely.com"},
    ],
    "internship": [
        {"name": "Internshala",            "domain": "internshala.com"},
        {"name": "Go Abroad",              "domain": "goabroad.com"},
        {"name": "AIESEC",                 "domain": "aiesec.org"},
        {"name": "WayUp",                  "domain": "wayup.com"},
        {"name": "LinkedIn",               "domain": "linkedin.com"},
        {"name": "Handshake",              "domain": "joinhandshake.com"},
        {"name": "Virtual Internships",    "domain": "virtualinternships.com"},
        {"name": "Opportunity Desk",       "domain": "opportunitydesk.org"},
        {"name": "Indeed",                 "domain": "indeed.com"},
    ],
    "volunteering": [
        {"name": "Volunteer World",        "domain": "volunteerworld.com"},
        {"name": "Idealist",               "domain": "idealist.org"},
        {"name": "VolunteerMatch",         "domain": "volunteermatch.org"},
        {"name": "Go Abroad",              "domain": "goabroad.com"},
        {"name": "AIESEC",                 "domain": "aiesec.org"},
        {"name": "European Youth Portal",  "domain": "youth.europa.eu"},
        {"name": "Zelos",                  "domain": "getzelos.com"},
    ],
    "conference": [
        {"name": "Opportunity Desk",       "domain": "opportunitydesk.org"},
        {"name": "Opportunities Corners",  "domain": "opportunitiescorners.com"},
        {"name": "Eventbrite",             "domain": "eventbrite.com"},
        {"name": "Opportunities for Youth","domain": "opportunitiesforyouth.org"},
    ],
    "training": [
        {"name": "Coursera",               "domain": "coursera.org"},
        {"name": "edX",                    "domain": "edx.org"},
        {"name": "FutureLearn",            "domain": "futurelearn.com"},
        {"name": "Udemy",                  "domain": "udemy.com"},
        {"name": "Opportunity Desk",       "domain": "opportunitydesk.org"},
    ],
}

# All sources flattened — for the frontend to display
ALL_SOURCES = {}
for _type, _sources in CURATED_SOURCES.items():
    for s in _sources:
        ALL_SOURCES[s["domain"]] = s["name"]

OPPORTUNITY_TYPES = {
    "scholarship": ["scholarship", "منحة", "grant", "fellowship"],
    "job":         ["job", "وظيفة", "career", "hiring", "vacancy"],
    "internship":  ["internship", "تدريب", "intern", "trainee"],
    "volunteering":["volunteering", "تطوع", "volunteer"],
    "conference":  ["conference", "مؤتمر", "summit", "symposium", "workshop"],
    "training":    ["training", "دورة", "course", "certification", "bootcamp"],
}


def get_sources_for_type(opp_type: Optional[str], selected_domains: Optional[List[str]] = None) -> List[str]:
    """
    Return the list of domains to target for a given opportunity type.
    If selected_domains is provided (user's saved sources), use those.
    Otherwise, use the default curated list for this type.
    """
    if selected_domains:
        # Filter only sources relevant to this type if possible
        type_domains = {s["domain"] for s in CURATED_SOURCES.get(opp_type or "job", [])}
        # Use selected that overlap with this type, OR all selected if no overlap
        overlap = [d for d in selected_domains if d in type_domains]
        return overlap if overlap else selected_domains[:6]

    # Default: top 5 curated domains for this type
    sources = CURATED_SOURCES.get(opp_type or "job", CURATED_SOURCES["job"])
    return [s["domain"] for s in sources[:5]]


async def search_opportunities(
    query: str,
    opp_type: Optional[str] = None,
    country: Optional[str] = None,
    limit: int = 10,
    selected_sources: Optional[List[str]] = None,
) -> List[SearchResult]:
    """Search for opportunities using Serper API with targeted site: filtering."""

    # Get domains to target
    domains = get_sources_for_type(opp_type, selected_sources)

    # Build site: filter
    site_filter = " OR ".join(f"site:{d}" for d in domains)

    # Build keyword enrichment
    type_kw = ""
    if opp_type and opp_type in OPPORTUNITY_TYPES:
        type_kw = " OR ".join(OPPORTUNITY_TYPES[opp_type][:2])

    # Compose query: (site:a OR site:b) + keywords + country + year
    full_query = f"({site_filter}) "
    if query and query.strip():
        full_query += f"{query} "
    if type_kw:
        full_query += f"({type_kw}) "
    if country:
        full_query += f"{country} "
    full_query += "2025 OR 2026 apply"

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

    results = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()

        for item in data.get("organic", [])[:limit]:
            result = SearchResult(
                title=item.get("title", ""),
                type=opp_type or _detect_type(
                    item.get("title", "") + " " + item.get("snippet", "")
                ),
                description=item.get("snippet"),
                url=item.get("link"),
                source=item.get("displayLink"),
                deadline=None,
                country=country,
                tags=opp_type,
            )
            results.append(result)

    except Exception:
        pass

    # If targeted search gave < 5 results, fall back to broad Google search
    if len(results) < 5:
        fallback_q = query
        if type_kw:
            fallback_q += f" ({type_kw})"
        if country:
            fallback_q += f" {country}"
        fallback_q += " 2026 apply"
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://google.serper.dev/search",
                    json={"q": fallback_q, "num": limit - len(results), "gl": "us", "hl": "en"},
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()
            existing_urls = {r.url for r in results}
            for item in data.get("organic", []):
                if item.get("link") not in existing_urls:
                    results.append(SearchResult(
                        title=item.get("title", ""),
                        type=opp_type or _detect_type(
                            item.get("title", "") + " " + item.get("snippet", "")
                        ),
                        description=item.get("snippet"),
                        url=item.get("link"),
                        source=item.get("displayLink"),
                        deadline=None,
                        country=country,
                        tags=opp_type,
                    ))
        except Exception:
            pass

    return results[:limit]


def get_all_sources():
    """Return all curated sources grouped by type — for the frontend."""
    return CURATED_SOURCES


def _detect_type(text: str) -> str:
    text_lower = text.lower()
    for opp_type, keywords in OPPORTUNITY_TYPES.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                return opp_type
    return "job"
