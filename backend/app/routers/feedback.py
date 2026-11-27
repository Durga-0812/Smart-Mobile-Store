from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Feedback, Product, User
from app.security import get_current_user, require_admin
from app.services.admin_notifications import create_admin_notification
from app.services.customer_satisfaction import predict_customer_satisfaction


router = APIRouter(
    prefix="/api/v1/feedback",
    tags=["Customer Feedback"]
)


# ---------------- REQUEST SCHEMAS ----------------

class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=5, max_length=2000)
    product_id: str | None = None


class FeedbackReply(BaseModel):
    admin_reply: str = Field(min_length=2, max_length=2000)


# ---------------- CUSTOMER: SUBMIT FEEDBACK ----------------

@router.post("/", status_code=201)
def submit_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.upper() != "USER":
        raise HTTPException(
            status_code=403,
            detail="Only customers can submit feedback."
        )

    if data.product_id:
        product = db.query(Product).filter(
            Product.id == data.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found."
            )

    # Predict customer satisfaction using the trained ML model
    prediction = predict_customer_satisfaction(data.comment.strip())

    feedback = Feedback(
        user_id=current_user.id,
        product_id=data.product_id,
        rating=data.rating,
        comment=data.comment.strip(),
        satisfaction_prediction=prediction["prediction"],
        satisfaction_confidence=prediction["confidence"],
    )

    db.add(feedback)
    db.flush()

    create_admin_notification(
        db=db,
        notification_type="FEEDBACK",
        title="New Customer Feedback",
        message=(
            f"{current_user.full_name or current_user.email} "
            f"submitted a {data.rating}-star review."
        ),
        related_type="FEEDBACK",
        related_id=feedback.id,
    )

    db.commit()
    db.refresh(feedback)

    return {
        "message": "Feedback submitted successfully.",
        "feedback_id": feedback.id,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "satisfaction_prediction": feedback.satisfaction_prediction,
        "satisfaction_confidence": feedback.satisfaction_confidence,
        "created_at": feedback.created_at,
    }


# ---------------- CUSTOMER: VIEW OWN FEEDBACK ----------------

@router.get("/my")
def get_my_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    feedback_list = (
        db.query(Feedback)
        .filter(Feedback.user_id == current_user.id)
        .order_by(Feedback.created_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else "Store Feedback",
            "rating": item.rating,
            "comment": item.comment,
            "satisfaction_prediction": item.satisfaction_prediction,
            "satisfaction_confidence": item.satisfaction_confidence,
            "admin_reply": item.admin_reply,
            "created_at": item.created_at,
            "replied_at": item.replied_at,
        }
        for item in feedback_list
    ]


# ---------------- PUBLIC: VIEW PRODUCT REVIEWS ----------------

@router.get("/product/{product_id}")
def get_product_feedback(
    product_id: str,
    db: Session = Depends(get_db),
):
    feedback_list = (
        db.query(Feedback)
        .filter(
            Feedback.product_id == product_id,
            Feedback.admin_reply.isnot(None)
        )
        .order_by(Feedback.created_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "rating": item.rating,
            "comment": item.comment,
            "created_at": item.created_at,
        }
        for item in feedback_list
    ]


# ---------------- ADMIN: VIEW ALL FEEDBACK ----------------

@router.get("/admin")
def get_all_feedback(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    feedback_list = (
        db.query(Feedback)
        .order_by(Feedback.created_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "customer_name": item.user.full_name or item.user.email,
            "customer_email": item.user.email,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else "Store Feedback",
            "rating": item.rating,
            "comment": item.comment,
            "satisfaction_prediction": item.satisfaction_prediction,
            "satisfaction_confidence": item.satisfaction_confidence,
            "admin_reply": item.admin_reply,
            "is_read": item.is_read,
            "created_at": item.created_at,
            "replied_at": item.replied_at,
        }
        for item in feedback_list
    ]


# ---------------- ADMIN: REPLY TO FEEDBACK ----------------

@router.patch("/admin/{feedback_id}/reply")
def reply_to_feedback(
    feedback_id: str,
    data: FeedbackReply,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    feedback = db.query(Feedback).filter(
        Feedback.id == feedback_id
    ).first()

    if not feedback:
        raise HTTPException(
            status_code=404,
            detail="Feedback not found."
        )

    feedback.admin_reply = data.admin_reply.strip()
    feedback.is_read = True
    feedback.replied_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Reply saved successfully.",
        "feedback_id": feedback.id,
        "admin_reply": feedback.admin_reply,
    }
# ---------------- ADMIN: CUSTOMER SATISFACTION STATISTICS ----------------

@router.get("/admin/satisfaction-stats")
def get_satisfaction_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    total_feedback = db.query(Feedback).count()

    analyzed_feedback = db.query(Feedback).filter(
        Feedback.satisfaction_prediction.in_(
            ["SATISFIED", "NOT SATISFIED"]
        )
    ).all()

    satisfied = sum(
        1 for item in analyzed_feedback
        if item.satisfaction_prediction == "SATISFIED"
    )

    not_satisfied = sum(
        1 for item in analyzed_feedback
        if item.satisfaction_prediction == "NOT SATISFIED"
    )

    analyzed_count = len(analyzed_feedback)

    satisfaction_percentage = (
        round(satisfied / analyzed_count * 100, 2)
        if analyzed_count else 0
    )

    confidence_values = [
        item.satisfaction_confidence
        for item in analyzed_feedback
        if item.satisfaction_confidence is not None
    ]

    average_confidence = (
        round(sum(confidence_values) / len(confidence_values), 2)
        if confidence_values else 0
    )

    return {
        "total_feedback": total_feedback,
        "analyzed_feedback": analyzed_count,
        "satisfied_customers": satisfied,
        "not_satisfied_customers": not_satisfied,
        "satisfaction_percentage": satisfaction_percentage,
        "average_prediction_confidence": average_confidence,
    }

