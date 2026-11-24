from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AdminNotification
from app.security import require_admin

router = APIRouter(
    prefix="/api/v1/admin/notifications",
    tags=["Admin Notifications"],
)


@router.get("/")
def get_admin_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    notifications = (
        db.query(AdminNotification)
        .order_by(AdminNotification.created_at.desc())
        .limit(100)
        .all()
    )

    unread_count = (
        db.query(AdminNotification)
        .filter(AdminNotification.is_read == False)
        .count()
    )

    return {
        "items": [
            {
                "id": item.id,
                "notification_type": item.notification_type,
                "title": item.title,
                "message": item.message,
                "related_type": item.related_type,
                "related_id": item.related_id,
                "is_read": item.is_read,
                "created_at": item.created_at,
            }
            for item in notifications
        ],
        "unread_count": unread_count,
        "total": len(notifications),
    }


@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    notification = (
        db.query(AdminNotification)
        .filter(AdminNotification.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()

    return {"message": "Notification marked as read"}


@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    db.query(AdminNotification).filter(
        AdminNotification.is_read == False
    ).update(
        {AdminNotification.is_read: True},
        synchronize_session=False,
    )

    db.commit()

    return {"message": "All notifications marked as read"}
