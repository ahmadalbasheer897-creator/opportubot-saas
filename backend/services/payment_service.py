import httpx
from config import get_settings

LSQ_API = "https://api.lemonsqueezy.com/v1"


async def create_checkout_url(user_email: str, user_id: int) -> str:
    """Create a Lemon Squeezy checkout session and return the URL."""
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {settings.LSQ_API_KEY}",
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
    }
    body = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "email": user_email,
                    "custom": {"user_id": str(user_id)},
                },
                "product_options": {
                    "redirect_url": f"{settings.FRONTEND_URL}/?checkout=success",
                },
            },
            "relationships": {
                "store": {"data": {"type": "stores", "id": settings.LSQ_STORE_ID}},
                "variant": {"data": {"type": "variants", "id": settings.LSQ_VARIANT_ID}},
            },
        }
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{LSQ_API}/checkouts", headers=headers, json=body)
        r.raise_for_status()
        return r.json()["data"]["attributes"]["url"]
