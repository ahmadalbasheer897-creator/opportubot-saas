"""
Email service — uses Resend (HTTPS API) as primary, SMTP as fallback.
Resend is preferred because Render free tier blocks outbound SMTP port 587.
"""
import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def _send_via_resend(to: str, subject: str, html_body: str) -> bool:
    """Send email via Resend HTTP API."""
    if not settings.RESEND_API_KEY:
        return False
    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        params = {
            "from": "OpportuBot <onboarding@resend.dev>",
            "to": [to],
            "subject": subject,
            "html": html_body,
        }
        r = resend.Emails.send(params)
        logger.info("Resend email sent to %s: %s (id=%s)", to, subject, r.get("id"))
        return True
    except Exception as e:
        logger.error("Resend failed for %s: %s", to, e)
        return False


async def _send_via_smtp(to: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Fallback: send via SMTP (may be blocked on Render free tier)."""
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured – skipping email to %s: %s", to, subject)
        return False
    try:
        import aiosmtplib
    except ImportError:
        logger.error("aiosmtplib not installed")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"OpportuBot <{settings.SMTP_USER}>"
    msg["To"] = to
    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=(settings.SMTP_PORT == 465),
            start_tls=(settings.SMTP_PORT == 587),
        )
        logger.info("SMTP email sent to %s: %s", to, subject)
        return True
    except Exception as e:
        logger.error("SMTP failed for %s: %s", to, e)
        return False


async def _send_email(to: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Send email: try Resend first, fall back to SMTP."""
    if settings.RESEND_API_KEY:
        return await _send_via_resend(to, subject, html_body)
    return await _send_via_smtp(to, subject, html_body, text_body)


# ── Verification Email ────────────────────────────────────────────────────────

async def send_verification_email(to_email: str, name: str, token: str) -> bool:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background:#0f172a; color:#e2e8f0; padding:40px;">
  <div style="max-width:520px; margin:auto; background:#1e293b; border-radius:12px; padding:32px;">
    <h1 style="color:#a78bfa; margin-top:0;">🚀 OpportuBot</h1>
    <h2 style="color:#e2e8f0;">Verify your email, {name}!</h2>
    <p>Thanks for signing up. Click the button below to verify your email address and unlock your personalized opportunity pipeline.</p>
    <a href="{verify_url}"
       style="display:inline-block; background:#7c3aed; color:#fff; padding:14px 28px;
              border-radius:8px; text-decoration:none; font-weight:bold; margin:20px 0;">
      ✅ Verify My Email
    </a>
    <p style="color:#94a3b8; font-size:13px;">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    <hr style="border-color:#334155; margin:24px 0;">
    <p style="color:#64748b; font-size:12px;">
      OpportuBot — Your AI-powered opportunity tracker<br>
      <a href="{settings.FRONTEND_URL}" style="color:#7c3aed;">{settings.FRONTEND_URL}</a>
    </p>
  </div>
</body>
</html>
"""
    text = f"Verify your OpportuBot account:\n{verify_url}\n\nLink expires in 24 hours."
    return await _send_email(to_email, "Verify your OpportuBot account", html, text)


# ── Welcome Email ─────────────────────────────────────────────────────────────

async def send_welcome_email(to_email: str, name: str) -> bool:
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background:#0f172a; color:#e2e8f0; padding:40px;">
  <div style="max-width:520px; margin:auto; background:#1e293b; border-radius:12px; padding:32px;">
    <h1 style="color:#a78bfa; margin-top:0;">🎉 Welcome to OpportuBot!</h1>
    <h2 style="color:#e2e8f0;">Hello {name},</h2>
    <p>Your account is verified and ready. Here's what you can do:</p>
    <ul style="color:#cbd5e1; line-height:1.8;">
      <li>🔍 <strong>Run Pipeline</strong> — AI-powered search for scholarships, jobs &amp; internships</li>
      <li>📄 <strong>Upload Your CV</strong> — Get personalized matches based on your profile</li>
      <li>⭐ <strong>Track Opportunities</strong> — Save and manage your applications</li>
    </ul>
    <a href="{settings.FRONTEND_URL}/dashboard"
       style="display:inline-block; background:#7c3aed; color:#fff; padding:14px 28px;
              border-radius:8px; text-decoration:none; font-weight:bold; margin:20px 0;">
      Go to Dashboard →
    </a>
  </div>
</body>
</html>
"""
    return await _send_email(to_email, "Welcome to OpportuBot! 🚀", html)


# ── Pipeline Results Email ────────────────────────────────────────────────────

async def send_pipeline_results_email(
    to_email: str,
    name: str,
    opportunities: List[dict],
    total_found: int,
) -> bool:
    top = opportunities[:5]

    rows = ""
    for i, opp in enumerate(top, 1):
        score = opp.get("score", 0)
        score_color = "#22c55e" if score >= 70 else ("#f59e0b" if score >= 50 else "#ef4444")
        rows += f"""
        <tr style="border-bottom:1px solid #334155;">
          <td style="padding:12px 8px; color:#e2e8f0; font-weight:bold;">#{i} {opp.get('title','Untitled')[:60]}</td>
          <td style="padding:12px 8px; color:{score_color}; font-weight:bold; text-align:center;">{score}%</td>
          <td style="padding:12px 8px; text-align:center;">
            <a href="{opp.get('url','#')}" style="color:#a78bfa; text-decoration:none;">View →</a>
          </td>
        </tr>"""

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background:#0f172a; color:#e2e8f0; padding:40px;">
  <div style="max-width:600px; margin:auto; background:#1e293b; border-radius:12px; padding:32px;">
    <h1 style="color:#a78bfa; margin-top:0;">🔍 Pipeline Results</h1>
    <p>Hi <strong>{name}</strong>, your AI pipeline found <strong>{total_found}</strong> new opportunities!</p>
    <p style="color:#94a3b8;">Here are your top matches:</p>
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <thead>
        <tr style="background:#0f172a; color:#94a3b8; font-size:12px; text-transform:uppercase;">
          <th style="padding:10px 8px; text-align:left;">Opportunity</th>
          <th style="padding:10px 8px; text-align:center;">Match</th>
          <th style="padding:10px 8px; text-align:center;">Link</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
    <a href="{settings.FRONTEND_URL}/dashboard"
       style="display:inline-block; background:#7c3aed; color:#fff; padding:14px 28px;
              border-radius:8px; text-decoration:none; font-weight:bold; margin:16px 0;">
      View All in Dashboard →
    </a>
    <p style="color:#64748b; font-size:12px; margin-top:24px;">
      OpportuBot · <a href="{settings.FRONTEND_URL}" style="color:#7c3aed;">Visit site</a>
    </p>
  </div>
</body>
</html>
"""
    subject = f"🎯 {total_found} new opportunities found for you!"
    return await _send_email(to_email, subject, html)


# ── Daily Digest Email ───────────────────────────────────────────────────────

async def send_daily_digest_email(
    to_email: str,
    name: str,
    opportunities: List[dict],
) -> bool:
    """Send a daily digest with the user's top 5 opportunities."""
    if not opportunities:
        return False

    rows = ""
    for i, opp in enumerate(opportunities[:5], 1):
        score = opp.get("score", 0)
        score_color = "#22c55e" if score >= 70 else ("#f59e0b" if score >= 50 else "#ef4444")
        opp_type = opp.get("type", "opportunity")
        deadline = opp.get("deadline", "")
        deadline_html = (
            f'<br><span style="color:#f59e0b; font-size:11px;">⏰ {deadline}</span>'
            if deadline and deadline != "Not found" else ""
        )
        country = opp.get("country", "")
        country_html = (
            f'<br><span style="color:#94a3b8; font-size:11px;">🌍 {country}</span>'
            if country and country != "Not found" else ""
        )
        rows += f"""
        <tr style="border-bottom:1px solid #334155;">
          <td style="padding:14px 8px;">
            <span style="background:#1e293b; color:#94a3b8; font-size:10px; padding:2px 7px;
                         border-radius:10px; text-transform:uppercase;">{opp_type}</span>
            <div style="color:#e2e8f0; font-weight:bold; margin-top:6px; font-size:14px;">
              {opp.get('title','Untitled')[:65]}
            </div>
            {country_html}{deadline_html}
          </td>
          <td style="padding:14px 8px; text-align:center; white-space:nowrap;">
            <span style="color:{score_color}; font-weight:bold; font-size:16px;">{score}%</span>
          </td>
          <td style="padding:14px 8px; text-align:center;">
            <a href="{opp.get('url','#')}"
               style="background:#7c3aed; color:#fff; padding:6px 14px; border-radius:6px;
                      text-decoration:none; font-size:12px; font-weight:bold;">View →</a>
          </td>
        </tr>"""

    from datetime import date
    today = date.today().strftime("%B %d, %Y")

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background:#0f172a; color:#e2e8f0; padding:40px; margin:0;">
  <div style="max-width:620px; margin:auto; background:#1e293b; border-radius:14px; overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4c1d95,#1e40af); padding:28px 32px;">
      <div style="font-size:24px; font-weight:bold; color:white;">🤖 OpportuBot</div>
      <div style="font-size:13px; color:#c4b5fd; margin-top:6px;">Daily Digest · {today}</div>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin-top:0;">Hi <strong>{name}</strong> 👋</p>
      <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">
        Here are your top {len(opportunities[:5])} opportunities waiting for you today:
      </p>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#0f172a; color:#64748b; font-size:11px; text-transform:uppercase;">
            <th style="padding:10px 8px; text-align:left;">Opportunity</th>
            <th style="padding:10px 8px; text-align:center; width:60px;">Match</th>
            <th style="padding:10px 8px; text-align:center; width:80px;">Action</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <div style="margin-top:24px; text-align:center;">
        <a href="{settings.FRONTEND_URL}"
           style="display:inline-block; background:#7c3aed; color:#fff; padding:14px 32px;
                  border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px;">
          Open Dashboard →
        </a>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px; background:#0f172a; text-align:center;">
      <p style="color:#475569; font-size:11px; margin:0;">
        OpportuBot · AI-powered opportunity tracker ·
        <a href="{settings.FRONTEND_URL}" style="color:#7c3aed;">Visit site</a>
      </p>
    </div>
  </div>
</body>
</html>
"""
    return await _send_email(to_email, f"📬 Your Daily Digest — {today}", html)


# ── Password Reset Email ──────────────────────────────────────────────────────

async def send_password_reset_email(to_email: str, name: str, token: str) -> bool:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background:#0f172a; color:#e2e8f0; padding:40px;">
  <div style="max-width:520px; margin:auto; background:#1e293b; border-radius:12px; padding:32px;">
    <h1 style="color:#a78bfa; margin-top:0;">🔐 Password Reset</h1>
    <p>Hi {name}, we received a request to reset your password.</p>
    <a href="{reset_url}"
       style="display:inline-block; background:#7c3aed; color:#fff; padding:14px 28px;
              border-radius:8px; text-decoration:none; font-weight:bold; margin:20px 0;">
      Reset My Password
    </a>
    <p style="color:#94a3b8; font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  </div>
</body>
</html>
"""
    return await _send_email(to_email, "Reset your OpportuBot password", html)
