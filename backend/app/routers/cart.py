from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CartItem, Product, User
from app.schemas import CartItemAdd, CartItemUpdate, CartResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/v1/cart", tags=["Cart"])


def serialize_cart(db: Session, user_id: str) -> dict:
    rows = (
        db.query(CartItem, Product)
        .join(Product, CartItem.product_id == Product.id)
        .filter(CartItem.user_id == user_id)
        .order_by(Product.name)
        .all()
    )
    items = [
        {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "stock_quantity": product.stock_quantity,
            "category": product.category,
            "image_url": product.image_url,
            "quantity": cart_item.quantity,
        }
        for cart_item, product in rows
    ]
    return {
        "items": items,
        "total_items": sum(item["quantity"] for item in items),
    }


@router.get("/", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return serialize_cart(db, current_user.id)


@router.post("/items", response_model=CartResponse)
def add_cart_item(
    payload: CartItemAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = (
        db.query(Product)
        .filter(Product.id == payload.product_id)
        .with_for_update()
        .first()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")

    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == product.id,
        )
        .with_for_update()
        .first()
    )
    new_quantity = (cart_item.quantity if cart_item else 0) + payload.quantity

    if new_quantity > 100:
        raise HTTPException(
            status_code=400,
            detail="Maximum quantity per product is 100.",
        )
    if new_quantity > product.stock_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for {product.name}. Available: {product.stock_quantity}.",
        )

    if cart_item:
        cart_item.quantity = new_quantity
    else:
        db.add(
            CartItem(
                user_id=current_user.id,
                product_id=product.id,
                quantity=new_quantity,
            )
        )

    db.commit()
    return serialize_cart(db, current_user.id)


@router.put("/items/{product_id}", response_model=CartResponse)
def update_cart_item(
    product_id: str,
    payload: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    if payload.quantity > product.stock_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for {product.name}. Available: {product.stock_quantity}.",
        )

    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == product_id,
        )
        .first()
    )
    if cart_item is None:
        raise HTTPException(status_code=404, detail="Cart item not found.")

    cart_item.quantity = payload.quantity
    db.commit()
    return serialize_cart(db, current_user.id)


@router.delete("/items/{product_id}", response_model=CartResponse)
def remove_cart_item(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == product_id,
    ).delete(synchronize_session=False)
    db.commit()
    return serialize_cart(db, current_user.id)


@router.delete("/", response_model=CartResponse)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete(
        synchronize_session=False
    )
    db.commit()
    return serialize_cart(db, current_user.id)
