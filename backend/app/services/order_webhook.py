
import logging
import time
from datetime import datetime

import httpx

from app.config import settings
from app.models import Order, OrderItem, User, Product

logger = logging.getLogger(__name__)


def send_order_notification(
    db,
    order: Order,
    order_items: list[OrderItem],
) -> bool:
    """Send a paid order to n8n with bounded retries."""

    if order.payment_status != "PAID":
        logger.warning("Notification skipped for unpaid order %s", order.id)
        return False

    if order.notification_status == "SENT":
        logger.info("Notification already sent for order %s", order.id)
        return True

    webhook_url = settings.N8N_ORDER_WEBHOOK_URL
    webhook_secret = settings.N8N_WEBHOOK_SECRET

    if not webhook_url or not webhook_secret:
        order.notification_status = "FAILED"
        order.notification_last_error = "n8n webhook is not configured"
        db.commit()
        logger.warning("n8n webhook is not configured for order %s", order.id)
        return False

    try:
        customer = db.query(User).filter(User.id == order.user_id).first()

        if not customer:
            raise ValueError("Customer not found")

        payload = {
            "event": "order.paid",
            "event_id": f"order.paid:{order.id}",
            "order_id": order.id,
            "customer_name": customer.full_name or "Customer",
            "customer_email": customer.email,
            "customer_phone": customer.phone,
            "items": [
                {
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "line_total": float(item.line_total),
                }
                for item in order_items
            ],
            "subtotal": float(order.subtotal),
            "discount": float(order.discount),
            "tax": float(order.tax),
            "shipping": float(order.shipping),
            "total_amount": float(order.total),
            "currency": "INR",
            "payment_status": order.payment_status,
            "payment_method": order.payment_method,
            "payment_id": order.razorpay_payment_id,
            "order_status": order.status,
            "delivery_address": order.delivery_address,
            "created_at": (
                order.created_at.isoformat()
                if order.created_at
                else None
            ),
        }

        headers = {
            "X-TechLite-Webhook-Secret": webhook_secret,
            "Idempotency-Key": f"order.paid:{order.id}",
        }

        last_error = None

        for attempt in range(1, 4):
            order.notification_attempts = (
                (order.notification_attempts or 0) + 1
            )
            db.commit()

            try:
                response = httpx.post(
                    webhook_url,
                    json=payload,
                    headers=headers,
                    timeout=8.0,
                )
                response.raise_for_status()

                order.notification_status = "SENT"
                order.notification_last_error = None
                order.notification_sent_at = datetime.utcnow()
                db.commit()

                logger.info(
                    "n8n notification sent for order %s on attempt %s",
                    order.id,
                    attempt,
                )
                return True

            except httpx.HTTPError as exc:
                last_error = str(exc)[:1000]
                logger.warning(
                    "n8n notification attempt %s failed for order %s",
                    attempt,
                    order.id,
                )

                if attempt < 3:
                    time.sleep(attempt)

        order.notification_status = "FAILED"
        order.notification_last_error = last_error or "Unknown webhook error"
        db.commit()

        logger.error("All n8n notification attempts failed for order %s", order.id)
        return False

    except Exception as exc:
        db.rollback()

        try:
            order.notification_status = "FAILED"
            order.notification_last_error = str(exc)[:1000]
            db.commit()
        except Exception:
            db.rollback()
            logger.exception(
                "Could not save notification failure for order %s",
                order.id,
            )

        logger.exception("Unexpected error sending n8n notification for order %s", order.id)
        return False


def send_stock_update(
    db,
    order: Order,
    order_items: list[OrderItem],
) -> bool:
    """
    Send the actual remaining database stock to n8n.

    The backend has already deducted stock after successful payment.
    This function only synchronises the current quantity to Google Sheets.
    """

    if order.payment_status != "PAID":
        return False

    webhook_url = settings.N8N_STOCK_UPDATE_WEBHOOK_URL
    webhook_secret = settings.N8N_WEBHOOK_SECRET

    if not webhook_url or not webhook_secret:
        logger.warning("Stock update webhook is not configured")
        return False

    headers = {
        "X-TechLite-Webhook-Secret": webhook_secret,
    }

    all_successful = True

    for item in order_items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .first()
        )

        if not product:
            logger.warning("Product %s not found for stock sync", item.product_id)
            all_successful = False
            continue

        payload = {
            "event": "product.stock_updated",
            "event_id": f"stock.updated:{order.id}:{product.id}",
            "order_id": order.id,
            "product_id": product.id,
            "product_name": product.name,
            "stock_quantity": product.stock_quantity,
        }

        headers["Idempotency-Key"] = (
            f"stock.updated:{order.id}:{product.id}"
        )

        try:
            response = httpx.post(
                webhook_url,
                json=payload,
                headers=headers,
                timeout=8.0,
            )
            response.raise_for_status()

            logger.info(
                "Stock synced for product %s: %s",
                product.id,
                product.stock_quantity,
            )

        except httpx.HTTPError:
            all_successful = False
            logger.exception(
                "Stock sync failed for product %s",
                product.id,
            )

        time.sleep(0.2)

    return all_successful
