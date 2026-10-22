from pydantic import BaseModel, EmailStr, Field, ConfigDict
from decimal import Decimal
from typing import Optional
from datetime import datetime
from typing import List


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    full_name: str
    phone: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "USER"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str | None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    phone: str | None
    role: str

    class Config:
        from_attributes = True



class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: Optional[str] = None
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    stock_quantity: int = Field(default=0, ge=0)
    category: str = Field(min_length=1, max_length=100)
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(
        default=None, gt=0, max_digits=10, decimal_places=2
    )
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int
    category: str
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0, le=100)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(min_length=1)
    coupon_code: str | None = None


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(default=1, gt=0, le=100)


class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0, le=100)


class CartProductResponse(BaseModel):
    id: str
    name: str
    price: Decimal
    stock_quantity: int
    category: str
    image_url: Optional[str] = None
    quantity: int


class CartResponse(BaseModel):
    items: List[CartProductResponse]
    total_items: int


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: str
    user_id: str
    status: str
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    shipping: Decimal
    total: Decimal
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str