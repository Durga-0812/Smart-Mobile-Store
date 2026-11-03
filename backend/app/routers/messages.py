import smtplib

from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import StoreMessage, User
from app.schemas import MessageCreate, MessageResponse
from app.security import require_admin


router = APIRouter(
    prefix="/api/v1/messages",
    tags=["Messages"]
)


class MessageReply(BaseModel):
    reply: str = Field(min_length=2, max_length=5000)


# Customers can submit messages without logging in.
@router.post(
    "/",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED
)
def create_message(
    payload: MessageCreate,
    db: Session = Depends(get_db)
):
    new_message = StoreMessage(
        name=payload.name.strip(),
        email=str(payload.email).strip().lower(),
        subject=payload.subject.strip(),
        message=payload.message.strip()
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return new_message


# Only admins can view customer messages.
@router.get("/", response_model=list[MessageResponse])
def get_messages(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return (
        db.query(StoreMessage)
        .order_by(StoreMessage.created_at.desc())
        .all()
    )


# Admin can mark a message as read or unread.
@router.patch("/{message_id}/read", response_model=MessageResponse)
def update_message_read_status(
    message_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    message = (
        db.query(StoreMessage)
        .filter(StoreMessage.id == message_id)
        .first()
    )

    if message is None:
        raise HTTPException(
            status_code=404,
            detail="Message not found."
        )

    message.is_read = not message.is_read

    db.commit()
    db.refresh(message)

    return message


# Admin can reply to a customer through email.
@router.post("/{message_id}/reply")
def reply_to_message(
    message_id: str,
    payload: MessageReply,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    message = (
        db.query(StoreMessage)
        .filter(StoreMessage.id == message_id)
        .first()
    )

    if message is None:
        raise HTTPException(
            status_code=404,
            detail="Message not found."
        )

    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Email settings are not configured."
        )

    email_message = EmailMessage()

    email_message["Subject"] = (
        f"Re: {message.subject}"
    )

    email_message["From"] = settings.SMTP_EMAIL
    email_message["To"] = message.email

    email_message.set_content(
        f"Hello {message.name},\n\n"
        f"{payload.reply.strip()}\n\n"
        "Regards,\n"
        "Smart Mobile Store Support Team"
    )

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

            server.send_message(email_message)

    except Exception as e:
        print(
            "REPLY EMAIL ERROR:",
            type(e).__name__,
            str(e),
            flush=True
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to send reply email."
        )

    return {
        "message": "Reply sent successfully.",
        "recipient": message.email
    }


# Admin can delete a message.
@router.delete("/{message_id}")
def delete_message(
    message_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    message = (
        db.query(StoreMessage)
        .filter(StoreMessage.id == message_id)
        .first()
    )

    if message is None:
        raise HTTPException(
            status_code=404,
            detail="Message not found."
        )

    db.delete(message)
    db.commit()

    return {
        "message": "Message deleted successfully."
    }