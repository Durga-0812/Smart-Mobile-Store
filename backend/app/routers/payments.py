import logging
from decimal import Decimal, ROUND_HALF_UP

import razorpay
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import CartItem, Order, OrderItem, Product, User
from app.security import get_current_user, require_admin
from app.services.order_webhook import (
    send_order_notification,
    send_stock_update,
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/payments",
    tags=["Payments"],
)


FREE_SHIPPING_LIMIT = Decimal("2000.00")
SHIPPING_CHARGE = Decimal("99.00")
TAX_RATE = Decimal("0.10")


def money(value):
    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Razorpay credentials are not configured.",
        )

    return razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET,
        )
    )


class CreatePaymentOrderRequest(BaseModel):
    coupon_code: str | None = None
    delivery_address: str | None = None
    delivery_latitude: Decimal | None = None
    delivery_longitude: Decimal | None = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order")
def create_payment_order(
    request: CreatePaymentOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = get_razorpay_client()

    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )

    if not cart_items:
        raise HTTPException(
            status_code=400,
            detail="Your cart is empty.",
        )

    subtotal = Decimal("0.00")
    order_items_data = []

    for cart_item in cart_items:
        product = (
            db.query(Product)
            .filter(Product.id == cart_item.product_id)
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="A product in your cart is no longer available.",
            )

        if cart_item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quantity for {product.name}.",
            )

        if product.stock_quantity < cart_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}.",
            )

        unit_price = money(product.price)
        line_total = money(unit_price * cart_item.quantity)

        subtotal += line_total

        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "unit_price": unit_price,
            "quantity": cart_item.quantity,
            "line_total": line_total,
        })

    subtotal = money(subtotal)

    # Coupon calculation
    discount = Decimal("0.00")
    coupon_code = (request.coupon_code or "").strip().upper()

    if coupon_code == "SAVE10":
        discount = money(subtotal * Decimal("0.10"))

    elif coupon_code == "SAVE200":
        if subtotal >= FREE_SHIPPING_LIMIT:
            discount = Decimal("200.00")
        else:
            raise HTTPException(
                status_code=400,
                detail="SAVE200 requires a minimum cart value of ₹2000.",
            )

    elif coupon_code:
        raise HTTPException(
            status_code=400,
            detail="Invalid coupon code.",
        )

    discount = min(discount, subtotal)

    taxable_amount = money(subtotal - discount)
    tax = money(taxable_amount * TAX_RATE)

    if subtotal >= FREE_SHIPPING_LIMIT:
        shipping = Decimal("0.00")
    else:
        shipping = SHIPPING_CHARGE

    total = money(taxable_amount + tax + shipping)

    if total <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid payment amount.",
        )

    # Create a local pending order.
    order = Order(
        user_id=current_user.id,
        status="PENDING",
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        shipping=shipping,
        total=total,
        delivery_address=request.delivery_address,
        delivery_latitude=request.delivery_latitude,
        delivery_longitude=request.delivery_longitude,
        payment_status="PENDING",
        payment_method="RAZORPAY",
    )

    try:
        db.add(order)
        db.flush()

        # Razorpay amount must be in paise.
        amount_in_paise = int(total * 100)

        razorpay_order = client.order.create({
            "amount": amount_in_paise,
            "currency": settings.RAZORPAY_CURRENCY,
            "receipt": str(order.id),
        })

        order.razorpay_order_id = razorpay_order["id"]

        for item in order_items_data:
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=item["product_id"],
                    product_name=item["product_name"],
                    unit_price=item["unit_price"],
                    quantity=item["quantity"],
                    line_total=item["line_total"],
                )
            )

        db.commit()
        db.refresh(order)

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()

        logger.exception(
            "Razorpay order creation failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=502,
            detail="Unable to create Razorpay payment order.",
        )

    return {
        "message": "Payment order created successfully.",
        "order_id": order.id,
        "razorpay_order_id": order.razorpay_order_id,
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "amount": amount_in_paise,
        "currency": settings.RAZORPAY_CURRENCY,
        "subtotal": float(subtotal),
        "discount": float(discount),
        "tax": float(tax),
        "shipping": float(shipping),
        "total": float(total),
    }


@router.post("/verify")
def verify_payment(
    request: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = get_razorpay_client()

    order = (
        db.query(Order)
        .filter(
            Order.razorpay_order_id == request.razorpay_order_id,
            Order.user_id == current_user.id,
        )
        .with_for_update()
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Payment order not found.",
        )

    # Make verification idempotent and retry failed notifications.
    if order.payment_status == "PAID":
        if order.razorpay_payment_id == request.razorpay_payment_id:
            if order.notification_status != "SENT":
                existing_items = (
                    db.query(OrderItem)
                    .filter(OrderItem.order_id == order.id)
                    .all()
                )

                send_order_notification(
                    db=db,
                    order=order,
                    order_items=existing_items,
                )

            return {
                "message": "Payment was already verified.",
                "order_id": order.id,
                "payment_status": order.payment_status,
                "order_status": order.status,
                "notification_status": order.notification_status,
            }

        raise HTTPException(
            status_code=409,
            detail="This order has already been paid.",
        )

    # Verify Razorpay signature.
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_payment_id": request.razorpay_payment_id,
            "razorpay_signature": request.razorpay_signature,
        })

    except Exception as exc:
        logger.exception(
            "Razorpay signature verification failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=400,
            detail="Payment signature verification failed.",
        )

    # Fetch payment directly from Razorpay.
    try:
        payment = client.payment.fetch(
            request.razorpay_payment_id
        )

    except Exception as exc:
        logger.exception(
            "Razorpay payment fetch failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=502,
            detail="Unable to verify payment with Razorpay.",
        )

    expected_amount = int(money(order.total) * 100)

    if payment.get("order_id") != order.razorpay_order_id:
        raise HTTPException(
            status_code=400,
            detail="Payment does not belong to this order.",
        )

    if int(payment.get("amount", 0)) != expected_amount:
        raise HTTPException(
            status_code=400,
            detail="Payment amount does not match the order.",
        )

    if payment.get("currency") != settings.RAZORPAY_CURRENCY:
        raise HTTPException(
            status_code=400,
            detail="Payment currency does not match.",
        )

    if payment.get("status") != "captured":
        raise HTTPException(
            status_code=400,
            detail="Payment has not been captured yet.",
        )

    # Check stock again before confirming the order.
    order_items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .all()
    )

    try:
        for item in order_items:
            product = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .with_for_update()
                .first()
            )

            if not product or product.stock_quantity < item.quantity:
                order.payment_status = "PAID_STOCK_ISSUE"
                order.razorpay_payment_id = request.razorpay_payment_id
                db.commit()

                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Payment was captured, but stock is no longer "
                        "available. The order needs manual review and "
                        "a refund may be required."
                    ),
                )

        # Deduct stock only after verified payment.
        for item in order_items:
            product = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .with_for_update()
                .first()
            )

            product.stock_quantity -= item.quantity

        # Clear the user's cart after successful payment.
        db.query(CartItem).filter(
            CartItem.user_id == current_user.id
        ).delete(synchronize_session=False)

        order.payment_status = "PAID"
        order.payment_method = "RAZORPAY"
        order.razorpay_payment_id = request.razorpay_payment_id
        order.status = "CONFIRMED"

        db.commit()
        db.refresh(order)

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        logger.exception(
            "Paid order processing failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Payment was verified, but order processing failed.",
        )

    # Notify admin after successful payment and database commit.
    try:
        send_order_notification(
            db=db,
            order=order,
            order_items=order_items,
        )

    except Exception as exc:
        logger.exception(
            "Order notification failed for order %s: %s",
            order.id,
            exc,
        )

    # Synchronise current stock with Google Sheets.
    try:
        send_stock_update(
            db=db,
            order=order,
            order_items=order_items,
        )

    except Exception as exc:
        logger.exception(
            "Stock synchronisation failed for order %s: %s",
            order.id,
            exc,
        )

    return {
        "message": "Payment verified successfully.",
        "order_id": order.id,
        "payment_status": order.payment_status,
        "order_status": order.status,
    }


@router.get("/notifications/failed")
def list_failed_notifications(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """List paid orders whose n8n notifications failed."""

    failed_orders = (
        db.query(Order)
        .filter(
            Order.payment_status == "PAID",
            Order.notification_status == "FAILED",
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    return {
        "count": len(failed_orders),
        "notifications": [
            {
                "order_id": order.id,
                "customer_id": order.user_id,
                "total_amount": float(order.total),
                "notification_status": order.notification_status,
                "notification_attempts": order.notification_attempts,
                "notification_last_error": order.notification_last_error,
                "created_at": (
                    order.created_at.isoformat()
                    if order.created_at else None
                ),
            }
            for order in failed_orders
        ],
    }


@router.post("/notifications/{order_id}/retry")
def retry_order_notification(
    order_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Manually retry a failed paid-order notification."""

    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    if order.payment_status != "PAID":
        raise HTTPException(
            status_code=400,
            detail="Only successfully paid orders can be notified.",
        )

    if order.notification_status == "SENT":
        return {
            "message": "Notification was already sent.",
            "order_id": order.id,
            "notification_status": order.notification_status,
        }

    order_items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .all()
    )

    success = send_order_notification(
        db=db,
        order=order,
        order_items=order_items,
    )

    db.refresh(order)

    return {
        "message": (
            "Notification sent successfully."
            if success
            else "Notification delivery failed. Check the error details."
        ),
        "order_id": order.id,
        "notification_status": order.notification_status,
        "notification_attempts": order.notification_attempts,
        "notification_last_error": order.notification_last_error,
    }