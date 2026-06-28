from typing import List, Optional, Dict
import anthropic
import json
import re
from config import get_settings

settings = get_settings()


def _client():
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


async def generate_search_summary(query: str, results) -> Optional[str]:
    """Generate Arabic summary of search results."""
    if not settings.ANTHROPIC_API_KEY or not results:
        return None
    results_text = "\n".join(
        f"- {getattr(r,'title','')} ({getattr(r,'url','')})"
        for r in results[:5]
    )
    prompt = f"""أنت مستشار فرص. المستخدم بحث عن: "{query}"
أفضل النتائج:
{results_text}
اكتب ملخصاً بـ 2-3 جمل بالعربية يبرز أفضل الفرص ويحفّز المستخدم على التقديم."""
    try:
        msg = _client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text
    except Exception:
        return None


async def score_opportunities_batch(
    opportunities: List[Dict],
    user_profile: Optional[str] = None,
) -> List[Dict]:
    """
    Score a batch of opportunities using Claude (0-100).
    Returns list of {id, score, analysis} dicts.
    """
    if not settings.ANTHROPIC_API_KEY or not opportunities:
        return [{"id": o.get("id", i), "score": 50, "analysis": ""} for i, o in enumerate(opportunities)]

    profile_ctx = ""
    if user_profile:
        profile_ctx = f"\nملف المستخدم:\n{user_profile}\n"

    opps_text = "\n".join(
        f'[{i}] title="{o.get("title","")}" type="{o.get("type","")}" desc="{(o.get("description") or "")[:200]}"'
        for i, o in enumerate(opportunities)
    )

    prompt = f"""أنت محلل فرص عالمي. قيّم كل فرصة من 0-100 بناءً على:
- جودة الفرصة وموثوقية المصدر (40%)
- الملاءمة للمستخدم (40%)
- وضوح متطلبات التقديم (20%)
{profile_ctx}
الفرص:
{opps_text}

أرجع JSON فقط بهذا الشكل:
[{{"index":0,"score":85,"reason":"سبب قصير"}},{{"index":1,"score":72,"reason":"..."}}]
لا تضف أي نص خارج JSON."""

    try:
        msg = _client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        # Extract JSON array
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON array found")
        scores = json.loads(match.group())
        result = []
        for item in scores:
            idx = item.get("index", 0)
            opp_id = opportunities[idx].get("id", idx) if idx < len(opportunities) else idx
            result.append({
                "id": opp_id,
                "score": max(0, min(100, int(item.get("score", 50)))),
                "analysis": item.get("reason", ""),
            })
        return result
    except Exception as e:
        return [{"id": o.get("id", i), "score": 50, "analysis": ""} for i, o in enumerate(opportunities)]


async def extract_cv_profile(cv_text: str) -> Dict:
    """
    Use Claude to extract structured profile from CV text.
    Returns {summary, skills, experience_years, target_roles, languages}
    """
    if not settings.ANTHROPIC_API_KEY or not cv_text:
        return {"summary": "", "skills": "", "experience_years": 0, "target_roles": "", "languages": ""}

    prompt = f"""استخرج المعلومات التالية من هذا الـ CV:

{cv_text[:3000]}

أرجع JSON فقط:
{{
  "summary": "ملخص احترافي 2-3 جمل",
  "skills": "skill1, skill2, skill3 (comma-separated)",
  "experience_years": 3,
  "target_roles": "job title 1, job title 2",
  "languages": "English, Arabic"
}}"""

    try:
        msg = _client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON found")
        return json.loads(match.group())
    except Exception:
        return {"summary": "", "skills": "", "experience_years": 0, "target_roles": "", "languages": ""}


async def enhance_opportunity_description(title: str, raw_description: str) -> str:
    if not settings.ANTHROPIC_API_KEY:
        return raw_description
    try:
        msg = _client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": f"Summarize in 2 sentences (Arabic):\nTitle: {title}\nDesc: {raw_description}"}],
        )
        return msg.content[0].text
    except Exception:
        return raw_description
