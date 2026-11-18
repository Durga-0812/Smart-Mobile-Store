import logging

import httpx

from app.config import settings
from app.models import Order, OrderItem, User

logger = logging.getLogger(__name__)


def send_order_notification(
    db,
    order: Order,
    order_items: list[OrderItem],
) -> bool:
    """
    Send a successfully paid order to the n8n webhook.

    Webhook failure must never cancel a confirmed order.
    """

    webhook_url = settings.N8N_ORDER_WEBHOOK_URL
    webhook_secret = settings.N8N_WEBHOOK_SECRET

    if not webhook_url or not webhook_secret:
        logger.warning(
            "n8n order webhook is not configured. "
            "Order notification skipped."
        )
        return False

    try:
        customer = (
            db.query(User)
            .filter(User.id == order.user_id)
            .first()
        )

        if not customer:
            logger.error(
                "Customer not found for order %s",
                order.id,
            )
            return False

        payload = {
            "event": "order.paid",
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

        response = httpx.post(
            webhook_url,
            json=payload,
            headers={
                "X-TechLite-Webhook-Secret": webhook_secret,
            },
            timeout=5.0,
        )

        response.raise_for_status()

        logger.info(
            "n8n order notification accepted for order %s",
            order.id,
        )

        return True

    except httpx.HTTPError:
        logger.exception(
            "Unable to send n8n notification for order %s",
            order.id,
        )
        return False

    except Exception:
        logger.exception(
            "Unexpected error sending order notification for %s",
            order.id,
        )
        return False