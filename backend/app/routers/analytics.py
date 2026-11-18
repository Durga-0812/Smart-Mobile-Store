from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Product, Order, OrderItem
from app.security import require_admin


router = APIRouter(
    prefix="/api/v1/admin/analytics",
    tags=["Admin Analytics"]
)


def get_last_six_months():
    today = datetime.utcnow()
    months = []

    year = today.year
    month = today.month

    for _ in range(6):
        months.append(datetime(year, month, 1))

        month -= 1
        if month == 0:
            month = 12
            year -= 1

    return list(reversed(months))


@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    # BASIC STATISTICS

    total_products = db.query(Product).count()

    total_customers = (
        db.query(User)
        .filter(func.upper(User.role) != "ADMIN")
        .count()
    )

    products = db.query(Product).all()

    inventory_value = sum(
        (
            Decimal(str(product.price)) * product.stock_quantity
            for product in products
        ),
        Decimal("0.00")
    )

    low_stock_products = (
        db.query(Product)
        .filter(Product.stock_quantity <= 5)
        .order_by(Product.stock_quantity.asc())
        .all()
    )

    # ORDER STATISTICS

    all_orders = db.query(Order).all()

    total_orders = len(all_orders)

    cancelled_orders = [
        order for order in all_orders
        if order.status.upper() == "CANCELLED"
    ]

    valid_orders = [
        order for order in all_orders
        if order.status.upper() != "CANCELLED"
    ]

    total_order_value = sum(
        (Decimal(str(order.total)) for order in valid_orders),
        Decimal("0.00")
    )

    # ORDER STATUS DISTRIBUTION

    order_status_counts = {}

    for order in all_orders:
        status = order.status.upper()
        order_status_counts[status] = (
            order_status_counts.get(status, 0) + 1
        )

    order_status = [
        {
            "status": status,
            "count": count
        }
        for status, count in sorted(order_status_counts.items())
    ]

    # MONTHLY STATISTICS

    month_starts = get_last_six_months()

    monthly_data = []

    for index, month_start in enumerate(month_starts):

        if index < 5:
            next_month = month_starts[index + 1]
        else:
            if month_start.month == 12:
                next_month = datetime(month_start.year + 1, 1, 1)
            else:
                next_month = datetime(
                    month_start.year,
                    month_start.month + 1,
                    1
                )

        month_orders = [
            order for order in all_orders
            if order.created_at
            and month_start <= order.created_at < next_month
        ]

        month_valid_orders = [
            order for order in month_orders
            if order.status.upper() != "CANCELLED"
        ]

        month_order_value = sum(
            (
                Decimal(str(order.total))
                for order in month_valid_orders
            ),
            Decimal("0.00")
        )

        # CUSTOMER REGISTRATIONS

        month_customers = (
            db.query(User)
            .filter(
                func.upper(User.role) != "ADMIN",
                User.created_at >= month_start,
                User.created_at < next_month
            )
            .count()
        )

        monthly_data.append({
            "month": month_start.strftime("%b %Y"),
            "orders": len(month_orders),
            "order_value": float(month_order_value),
            "customers": month_customers,
        })

    # TOP 5 ORDERED PRODUCTS

    top_products_query = (
        db.query(
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("units_sold")
        )
        .join(Order, Order.id == OrderItem.order_id)
        .filter(func.upper(Order.status) != "CANCELLED")
        .group_by(OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    top_products = [
        {
            "name": product_name,
            "units_sold": int(units_sold or 0),
        }
        for product_name, units_sold in top_products_query
    ]

    # RESPONSE

    return {
        "summary": {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "cancelled_orders": len(cancelled_orders),
            "total_order_value": float(total_order_value),
            "inventory_value": float(inventory_value),
            "low_stock_count": len(low_stock_products),
        },

        "monthly": monthly_data,

        "order_status": order_status,

        "top_products": top_products,

        "low_stock_products": [
            {
                "id": product.id,
                "name": product.name,
                "stock_quantity": product.stock_quantity,
            }
            for product in low_stock_products
        ],
    }