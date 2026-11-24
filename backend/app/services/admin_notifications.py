from sqlalchemy.orm import Session

from app.models import AdminNotification


def create_admin_notification(
    db: Session,
    notification_type: str,
    title: str,
    message: str,
    related_type: str | None = None,
    related_id: str | None = None,
):
    notification = AdminNotification(
        notification_type=notification_type,
        title=title,
        message=message,
        related_type=related_type,
        related_id=related_id,
        is_read=False,
    )

    db.add(notification)
    return notification
