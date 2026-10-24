import re
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import Product

products_file = (
    backend_dir.parent
    / "frontend-new"
    / "src"
    / "data"
    / "products.js"
)

if not products_file.exists():
    print(f"Products file not found: {products_file}")
    sys.exit(1)

source = products_file.read_text(encoding="utf-8")

pattern = re.compile(r"\{\s*id:\s*\d+,(.*?)\n\s*\}", re.DOTALL)
matches = pattern.findall(source)

db = SessionLocal()
added = 0

try:
    for item in matches:
        name_match = re.search(r'name:\s*["\']([^"\']+)["\']', item)
        price_match = re.search(r"priceNum:\s*(\d+(?:\.\d+)?)", item)
        category_match = re.search(r'category:\s*["\']([^"\']+)["\']', item)
        image_match = re.search(r'image:\s*["\']([^"\']*)["\']', item)

        if not name_match or not price_match or not category_match:
            continue

        name = name_match.group(1)

        if db.query(Product).filter(Product.name == name).first():
            continue

        product = Product(
            name=name,
            description=f"{name} from the TechLite sample catalog",
            price=float(price_match.group(1)),
            stock_quantity=10,
            category=category_match.group(1),
            image_url=(
                image_match.group(1)
                if image_match and image_match.group(1)
                else "https://placehold.co/300x300?text=Product"
            ),
        )

        db.add(product)
        added += 1

    db.commit()
    print(f"Products added: {added}")
    print(f"Products found in source: {len(matches)}")

except Exception:
    db.rollback()
    raise

finally:
    db.close()