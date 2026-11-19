import smtplib
from email.message import EmailMessage

from app.config import settings


def send_email(to: str, subject: str, text: str):
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        raise RuntimeError("Gmail SMTP credentials are not configured.")

    message = EmailMessage()
    message["From"] = f"TechLite <{settings.SMTP_EMAIL}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)

    try:
        with smtplib.SMTP_SSL(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=30
        ) as server:
            server.login(
                settings.SMTP_EMAIL,
                settings.SMTP_PASSWORD
            )
            server.send_message(message)

        return {"status": "sent", "to": to}

    except Exception as error:
        raise RuntimeError(f"Gmail email delivery failed: {error}") from error
