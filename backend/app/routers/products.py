from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CartItem, Product
from app.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.security import require_admin


router =APIRouter(
    prefix = "/api/v1/products",
    tags = ["products"]
)

@router.get("/")
def get_products():
    return {"message": "Products API is working!"}

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
    product = Product(**data.model_dump())

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


# READ: Get all products
@router.get("/", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


# READ: Get one product
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

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
        raise HTTPException(status_code=404, detail="Product not found")

    changes = data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


# DELETE: Remove a product (admin only)
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
        raise HTTPException(status_code=404, detail="Product not found")

    db.query(CartItem).filter(CartItem.product_id == product_id).delete(
        synchronize_session=False
    )
    db.delete(product)
    db.commit()

    return {"message": "Product deleted successfully"}