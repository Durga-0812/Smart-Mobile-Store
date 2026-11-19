import os
import httpx

RESEND_API_URL = "https://api.resend.com/emails"


def send_email(to: str, subject: str, text: str):
    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise RuntimeError("Resend API key is not configured.")

    payload = {
        "from": "TechLite <onboarding@resend.dev>",
        "to": [to],
        "subject": subject,
        "text": text,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = httpx.post(
            RESEND_API_URL,
            json=payload,
            headers=headers,
            timeout=30,
        )

        if response.is_error:
            raise RuntimeError(
                f"Resend API error {response.status_code}: {response.text}"
            )

        return {
            "status": "sent",
            "to": to,
            "provider": "Resend",
        }

    except httpx.HTTPError as error:
        raise RuntimeError(
            f"Resend email delivery failed: {error}"
        ) from error