from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CartItem, Product, OrderItem
from app.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.security import require_admin
from app.services.admin_notifications import create_admin_notification

router = APIRouter(
    prefix="/api/v1/products",
    tags=["Products"]
)


# CREATE: Add a product (admin only)
@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    product_data = data.model_dump(exclude_unset=True)

    if not product_data.get("image_url"):
        raise HTTPException(
            status_code=400,
            detail="Product image URL is required"
        )

    product = Product(**product_data, is_archived=False)

    db.add(product)
    db.flush()

    if product.stock_quantity <= 5:
        create_admin_notification(
            db=db,
            notification_type="LOW_STOCK",
            title="Low Product Stock",
            message=(
                f"{product.name} was added with only "
                f"{product.stock_quantity} units in stock."
            ),
            related_type="PRODUCT",
            related_id=product.id,
        )

    db.commit()
    db.refresh(product)

    return product


# READ: Get active products for customers
@router.get("/", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(
        Product.is_archived.is_(False)
    ).all()


# READ: Get all products for admin
# Keep this route before /{product_id}
@router.get("/admin/all", response_model=list[ProductResponse])
def get_all_products(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    return db.query(Product).order_by(
        Product.created_at.desc()
    ).all()


# ARCHIVE: Hide a product without deleting its order history
@router.post("/{product_id}/archive")
def archive_product(
    product_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.is_archived:
        raise HTTPException(
            status_code=400,
            detail="Product is already archived."
        )

    product.is_archived = True

    # Remove this product from customer carts
    db.query(CartItem).filter(
        CartItem.product_id == product_id
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": f"{product.name} archived successfully."
    }


# RESTORE: Make an archived product available again
@router.post("/{product_id}/restore")
def restore_product(
    product_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if not product.is_archived:
        raise HTTPException(
            status_code=400,
            detail="Product is already active."
        )

    product.is_archived = False
    db.commit()

    return {
        "message": f"{product.name} restored successfully."
    }


# READ: Get one active product
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_archived.is_(False)
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# UPDATE: Edit a product (admin only)
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    changes = data.model_dump(exclude_unset=True)
    previous_stock = product.stock_quantity

    for field, value in changes.items():
        setattr(product, field, value)

    if (
        "stock_quantity" in changes
        and previous_stock > 5
        and product.stock_quantity <= 5
    ):
        create_admin_notification(
            db=db,
            notification_type="LOW_STOCK",
            title="Low Product Stock",
            message=(
                f"{product.name} now has only "
                f"{product.stock_quantity} units remaining."
            ),
            related_type="PRODUCT",
            related_id=product.id,
        )

    db.commit()
    db.refresh(product)

    return product


# DELETE: Permanently delete only products without order history
@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    existing_order = db.query(OrderItem).filter(
        OrderItem.product_id == product_id
    ).first()

    if existing_order:
        raise HTTPException(
            status_code=409,
            detail="This product has order history. Archive it instead."
        )

    db.query(CartItem).filter(
        CartItem.product_id == product_id
    ).delete(synchronize_session=False)

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }