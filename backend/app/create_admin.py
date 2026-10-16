

from getpass import getpass

from app.database import SessionLocal
from app.models import User
from app.security import hash_password


db = SessionLocal()

try:
    email = input("Admin email: ").strip().lower()
    full_name = input("Admin name: ").strip()
    password = getpass("Admin password (min 6 characters): ")

    if len(password) < 6:
        raise ValueError("Password must contain at least 6 characters.")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user:
        # Promote the existing account and set its password.
        user.role = "ADMIN"
        user.password_hash = hash_password(password)
        user.is_active = True
        print("Existing account updated to ADMIN.")
    else:
        # Create a new admin account.
        user = User(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role="ADMIN",
            is_active=True,
        )
        db.add(user)
        print("New ADMIN account created.")

    db.commit()
    print("Admin setup completed successfully.")

except Exception:
    db.rollback()
    raise

finally:
    db.close()
