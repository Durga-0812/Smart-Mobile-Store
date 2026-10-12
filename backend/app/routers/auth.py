from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, SignupRequest, TokenResponse, UserResponse
from app.security import verify_password, hash_password, create_access_token, get_current_user, require_admin

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(email=payload.email, full_name=payload.full_name, phone=payload.phone,
                password_hash=hash_password(payload.password), role="USER")
    db.add(user); db.commit(); db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    requested_role = payload.role.upper()
    if requested_role not in ("USER", "ADMIN"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Role must be USER or ADMIN")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled")
    if user.role != requested_role:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"This account is not registered as {requested_role.title()}")
    return {"access_token": create_access_token(str(user.id), user.role),
            "token_type": "bearer", "role": user.role, "full_name": user.full_name}

@router.get("/me", response_model=UserResponse)
def me(current: User = Depends(get_current_user)):
    return current

@router.get("/admin/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(User).all()
