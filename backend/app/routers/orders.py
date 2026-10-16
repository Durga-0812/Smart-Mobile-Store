
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Order, OrderItem, Product, User
from app.schemas import OrderCreate, OrderResponse, OrderStatusUpdate
from app.security import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])

ZERO = Decimal("0.00")
TAX_RATE = Decimal("0.10")
FREE_SHIPPING_LIMIT = Decimal("2000.00")
SHIPPING_CHARGE = Decimal("99.00")


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_discount(subtotal: Decimal, coupon_code: str | None) -> Decimal:
    if not coupon_code:
        return ZERO

    code = coupon_code.strip().upper()

    if code == "SAVE10":
        return money(subtotal * Decimal("0.10"))

    if code == "SAVE200" and subtotal >= FREE_SHIPPING_LIMIT:
        return Decimal("200.00")

    if code in {"SAVE10", "SAVE200"}:
        raise HTTPException(
            status_code=400,
            detail="SAVE200 requires a subtotal of at least ₹2,000."
            if code == "SAVE200"
            else "Invalid coupon.",
        )

    raise HTTPException(status_code=400, detail="Invalid coupon code.")


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Combine duplicate product IDs and validate quantities.
    quantities: dict[str, int] = {}
    for item in payload.items:
        quantities[item.product_id] = (
            quantities.get(item.product_id, 0) + item.quantity
        )

    if any(quantity > 100 for quantity in quantities.values()):
        raise HTTPException(status_code=400, detail="Maximum quantity per product is 100.")

    try:
        subtotal = ZERO
        order_items = []

        for product_id, quantity in quantities.items():
            product = (
                db.query(Product)
                .filter(Product.id == product_id)
                .with_for_update()
                .first()
            )

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {product_id} was not found.",
                )

            if product.stock_quantity < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}. Available: {product.stock_quantity}.",
                )

            unit_price = money(Decimal(str(product.price)))
            line_total = money(unit_price * quantity)
            subtotal += line_total

            order_items.append(
                {
                    "product": product,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "line_total": line_total,
                    "product_name": product.name,
                }
            )

        subtotal = money(subtotal)
        discount = calculate_discount(subtotal, payload.coupon_code)
        discounted_subtotal = max(ZERO, subtotal - discount)
        tax = money(discounted_subtotal * TAX_RATE)
        shipping = ZERO if subtotal >= FREE_SHIPPING_LIMIT else SHIPPING_CHARGE
        total = money(discounted_subtotal + tax + shipping)

        order = Order(
            user_id=current_user.id,
            status="PENDING",
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            shipping=shipping,
            total=total,
        )
        db.add(order)
        db.flush()

        for item in order_items:
            product = item["product"]
            product.stock_quantity -= item["quantity"]

            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=item["product_name"],
                    unit_price=item["unit_price"],
                    quantity=item["quantity"],
                    line_total=item["line_total"],
                )
            )

        db.commit()

        created_order = (
            db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.id == order.id)
            .first()
        )
        return created_order

    except Exception:
        db.rollback()
        raise


@router.get("/my-orders", response_model=list[OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/", response_model=list[OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )

    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="You cannot access this order.")

    return order


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    allowed_statuses = {
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
    }

    new_status = payload.status.strip().upper()
    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {', '.join(sorted(allowed_statuses))}.",
        )

    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )

    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.status in {"CANCELLED", "DELIVERED"} and order.status != new_status:
        raise HTTPException(
            status_code=400,
            detail=f"A {order.status.lower()} order cannot be changed.",
        )

    order.status = new_status
    db.commit()

    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
