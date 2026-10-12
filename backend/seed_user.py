from app.database import SessionLocal, Base, engine
from app.models import User
from app.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed = [
    {"email": "vinay12bhupathi@gmail.com", "full_name": "Vinay Bhupathi", "password": "secret123", "role": "USER"},
    {"email": "admin@techlite.com", "full_name": "TechLite Admin", "password": "admin123",  "role": "ADMIN"},
]

for s in seed:
    if not db.query(User).filter(User.email == s["email"]).first():
        db.add(User(email=s["email"], full_name=s["full_name"],
                    password_hash=hash_password(s["password"]), role=s["role"]))
        print(f"Created {s['role']}: {s['email']}")
    else:
        print(f"Exists: {s['email']}")
db.commit(); db.close()