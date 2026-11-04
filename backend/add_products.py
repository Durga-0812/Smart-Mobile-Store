from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Product

products = [
# MOBILES — 14 new products
("Apple iPhone 16", "Apple smartphone with advanced camera features", 69900, 15, "Mobiles", "https://placehold.co/400x400/png"),
("Apple iPhone 15", "Apple smartphone with OLED display", 59900, 12, "Mobiles", "https://placehold.co/400x400/png"),
("Samsung Galaxy S24 FE", "Samsung smartphone with vibrant AMOLED display", 49999, 10, "Mobiles", "https://placehold.co/400x400/png"),
("Samsung Galaxy A55", "Samsung mid-range smartphone", 39999, 14, "Mobiles", "https://placehold.co/400x400/png"),
("Samsung Galaxy M35", "Samsung smartphone with large battery", 19999, 18, "Mobiles", "https://placehold.co/400x400/png"),
("Redmi Note 14 Pro", "Redmi smartphone with high-resolution camera", 24999, 16, "Mobiles", "https://placehold.co/400x400/png"),
("Redmi Note 13", "Redmi smartphone for everyday use", 16999, 20, "Mobiles", "https://placehold.co/400x400/png"),
("Redmi 14C", "Budget Redmi smartphone", 9999, 20, "Mobiles", "https://placehold.co/400x400/png"),
("Realme 14 Pro", "Realme smartphone with stylish design", 27999, 12, "Mobiles", "https://placehold.co/400x400/png"),
("Realme Narzo 70", "Realme smartphone for daily use", 14999, 15, "Mobiles", "https://placehold.co/400x400/png"),
("Vivo V40", "Vivo smartphone with portrait camera features", 34999, 10, "Mobiles", "https://placehold.co/400x400/png"),
("Vivo Y200", "Vivo smartphone with modern design", 21999, 12, "Mobiles", "https://placehold.co/400x400/png"),
("OPPO Reno 12", "OPPO smartphone with AI camera features", 32999, 10, "Mobiles", "https://placehold.co/400x400/png"),
("OnePlus Nord CE4", "OnePlus smartphone with fast charging", 24999, 14, "Mobiles", "https://placehold.co/400x400/png"),

# LAPTOPS — 8 products
("HP 15s Laptop", "HP laptop for study and office work", 45999, 8, "Laptops", "https://placehold.co/400x400/png"),
("Dell Inspiron 15", "Dell laptop for productivity", 52999, 7, "Laptops", "https://placehold.co/400x400/png"),
("Lenovo IdeaPad Slim 3", "Lenovo everyday laptop", 42999, 9, "Laptops", "https://placehold.co/400x400/png"),
("ASUS VivoBook 15", "ASUS laptop for students", 47999, 6, "Laptops", "https://placehold.co/400x400/png"),
("Acer Aspire 5", "Acer laptop for work and entertainment", 49999, 6, "Laptops", "https://placehold.co/400x400/png"),
("Apple MacBook Air M2", "Apple laptop with M2 chip", 79900, 4, "Laptops", "https://placehold.co/400x400/png"),
("Lenovo LOQ Gaming Laptop", "Lenovo laptop designed for gaming", 74999, 3, "Laptops", "https://placehold.co/400x400/png"),
("MSI Modern 14", "Compact MSI productivity laptop", 55999, 5, "Laptops", "https://placehold.co/400x400/png"),

# EARBUDS — 6 products
("Apple AirPods 4", "Apple wireless earbuds", 12900, 12, "Earbuds", "https://placehold.co/400x400/png"),
("Samsung Galaxy Buds FE", "Samsung wireless earbuds", 7999, 10, "Earbuds", "https://placehold.co/400x400/png"),
("OnePlus Buds 3", "OnePlus wireless earbuds", 5499, 15, "Earbuds", "https://placehold.co/400x400/png"),
("Realme Buds Air 6", "Realme wireless earbuds", 3299, 18, "Earbuds", "https://placehold.co/400x400/png"),
("OPPO Enco Air 3", "OPPO Bluetooth earbuds", 2499, 14, "Earbuds", "https://placehold.co/400x400/png"),
("boAt Airdopes 141", "Affordable wireless earbuds", 1299, 25, "Earbuds", "https://placehold.co/400x400/png"),

# CHARGERS — 5 products
("Samsung 25W Charger", "Samsung USB-C fast charger", 1299, 20, "Chargers", "https://placehold.co/400x400/png"),
("Apple 20W USB-C Adapter", "Apple USB-C power adapter", 1900, 15, "Chargers", "https://placehold.co/400x400/png"),
("OnePlus 80W Charger", "OnePlus fast charging adapter", 1999, 12, "Chargers", "https://placehold.co/400x400/png"),
("Anker 30W Charger", "Compact USB-C fast charger", 2499, 10, "Chargers", "https://placehold.co/400x400/png"),
("Portronics 20W Charger", "Compact mobile charger", 699, 22, "Chargers", "https://placehold.co/400x400/png"),

# CASES — 6 products
("iPhone 16 Silicone Case", "Protective silicone case for iPhone 16", 999, 20, "Cases", "https://placehold.co/400x400/png"),
("iPhone 15 Clear Case", "Transparent protective iPhone case", 699, 18, "Cases", "https://placehold.co/400x400/png"),
("Samsung S24 Protective Case", "Protective case for Samsung Galaxy S24", 799, 15, "Cases", "https://placehold.co/400x400/png"),
("Redmi Note 14 Case", "Flexible protective Redmi case", 399, 25, "Cases", "https://placehold.co/400x400/png"),
("OnePlus Nord Case", "Shock-resistant OnePlus phone case", 499, 20, "Cases", "https://placehold.co/400x400/png"),
("Universal Flip Cover", "Universal-style mobile flip cover", 349, 20, "Cases", "https://placehold.co/400x400/png"),

# SMART WATCHES — 5 products
("Apple Watch SE", "Apple smartwatch for fitness and notifications", 24900, 5, "Smart Watches", "https://placehold.co/400x400/png"),
("Samsung Galaxy Watch FE", "Samsung smartwatch with fitness tracking", 14999, 6, "Smart Watches", "https://placehold.co/400x400/png"),
("OnePlus Watch 2R", "OnePlus smartwatch with fitness features", 17999, 5, "Smart Watches", "https://placehold.co/400x400/png"),
("Noise ColorFit Pro 5", "Smartwatch with health tracking", 3999, 12, "Smart Watches", "https://placehold.co/400x400/png"),
("boAt Wave Sigma", "Affordable smartwatch with notifications", 1499, 15, "Smart Watches", "https://placehold.co/400x400/png"),

# ACCESSORIES — 5 products
("Anker Power Bank 20000mAh", "Portable high-capacity power bank", 2999, 10, "Accessories", "https://placehold.co/400x400/png"),
("Portronics USB-C Cable", "USB-C charging and data cable", 299, 30, "Accessories", "https://placehold.co/400x400/png"),
("SanDisk 128GB USB Drive", "128GB USB storage drive", 999, 15, "Accessories", "https://placehold.co/400x400/png"),
("Logitech Wireless Mouse", "Wireless mouse for laptops and computers", 799, 12, "Accessories", "https://placehold.co/400x400/png"),
("Ambrane Power Bank 10000mAh", "Compact portable power bank", 1299, 12, "Accessories", "https://placehold.co/400x400/png"),


]
def main():
    db: Session = SessionLocal()

    try:
        added = 0
        skipped = 0

        for name, description, price, stock, category, image_url in products:
            existing = db.query(Product).filter(Product.name == name).first()

            if existing:
                skipped += 1
                continue

            product = Product(
                name=name,
                description=description,
                price=Decimal(str(price)),
                stock_quantity=stock,
                category=category,
                image_url=image_url,
            )

            db.add(product)
            added += 1

        db.commit()

        total = db.query(Product).count()
        print(f"Products added: {added}")
        print(f"Existing products skipped: {skipped}")
        print(f"Total products in connected database: {total}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()