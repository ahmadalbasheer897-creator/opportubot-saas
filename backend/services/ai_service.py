from typing import List, Optional
import anthropic
from config import get_settings
from schemas.schemas import SearchResult

settings = get_settings()


async def generate_search_summary(query: str, results: List[SearchResult]) -> Optional[str]:
    """Use Claude to generate a smart summary of search results."""
    if not settings.ANTHROPIC_API_KEY or not results:
        return None

    results_text = "\n".join(
        f"- {r.title}: {r.description or ''} ({r.url or ''})"
        for r in results[:5]
    )

    prompt = f"""You are an opportunity advisor. The user searched for: "{query}"

Here are the top results found:
{results_text}

Write a concise 2-3 sentence summary in Arabic that:
1. Highlights the best opportunities found
2. Gives a quick action tip for the user
Keep it friendly and motivating."""

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text
    except Exception:
        return None


async def enhance_opportunity_description(title: str, raw_description: str) -> str:
    """Enhance a scraped opportunity description using Claude."""
    if not settings.ANTHROPIC_API_KEY:
        return raw_description

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": f"Summarize this opportunity in 2 sentences (Arabic preferred):\nTitle: {title}\nDescription: {raw_description}"
            }],
        )
        return message.content[0].text
    except Exception:
        return raw_description
