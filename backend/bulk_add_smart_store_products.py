import json
import getpass
import urllib.request
import urllib.error

API = "https://smart-mobile-store.onrender.com/api/v1"

# Category images are direct image URLs. Each product receives a working image URL.
IMAGES = {
    "Mobiles": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=85",
    "Laptops": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=85",
    "Earbuds": "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=85",
    "Chargers": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=85",
    "Cases": "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=700&q=85",
    "Smart Watches": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85",
    "Accessories": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=700&q=85",
}

# These are the 49 products prepared for the store. The script adds only enough
# missing products to reach 50 total, and skips names already in the live store.
PRODUCTS = [
    ("Apple iPhone 16", "Apple smartphone with advanced camera features", 69900, 15, "Mobiles"),
    ("Apple iPhone 15", "Apple smartphone with OLED display", 59900, 12, "Mobiles"),
    ("Samsung Galaxy S24 FE", "Samsung smartphone with vibrant AMOLED display", 49999, 10, "Mobiles"),
    ("Samsung Galaxy A55", "Samsung mid-range smartphone", 39999, 14, "Mobiles"),
    ("Samsung Galaxy M35", "Samsung smartphone with large battery", 19999, 18, "Mobiles"),
    ("Redmi Note 14 Pro", "Redmi smartphone with high-resolution camera", 24999, 16, "Mobiles"),
    ("Redmi Note 13", "Redmi smartphone for everyday use", 16999, 20, "Mobiles"),
    ("Redmi 14C", "Budget Redmi smartphone", 9999, 20, "Mobiles"),
    ("Realme 14 Pro", "Realme smartphone with stylish design", 27999, 12, "Mobiles"),
    ("Realme Narzo 70", "Realme smartphone for daily use", 14999, 15, "Mobiles"),
    ("Vivo V40", "Vivo smartphone with portrait camera features", 34999, 10, "Mobiles"),
    ("Vivo Y200", "Vivo smartphone with modern design", 21999, 12, "Mobiles"),
    ("OPPO Reno 12", "OPPO smartphone with AI camera features", 32999, 10, "Mobiles"),
    ("OnePlus Nord CE4", "OnePlus smartphone with fast charging", 24999, 14, "Mobiles"),
    ("HP 15s Laptop", "HP laptop for study and office work", 45999, 8, "Laptops"),
    ("Dell Inspiron 15", "Dell laptop for productivity", 52999, 7, "Laptops"),
    ("Lenovo IdeaPad Slim 3", "Lenovo everyday laptop", 42999, 9, "Laptops"),
    ("ASUS VivoBook 15", "ASUS laptop for students", 47999, 6, "Laptops"),
    ("Acer Aspire 5", "Acer laptop for work and entertainment", 49999, 6, "Laptops"),
    ("Apple MacBook Air M2", "Apple laptop with M2 chip", 79900, 4, "Laptops"),
    ("Lenovo LOQ Gaming Laptop", "Lenovo laptop designed for gaming", 74999, 3, "Laptops"),
    ("MSI Modern 14", "Compact MSI productivity laptop", 55999, 5, "Laptops"),
    ("Apple AirPods 4", "Apple wireless earbuds", 12900, 12, "Earbuds"),
    ("Samsung Galaxy Buds FE", "Samsung wireless earbuds", 7999, 10, "Earbuds"),
    ("OnePlus Buds 3", "OnePlus wireless earbuds", 5499, 15, "Earbuds"),
    ("Realme Buds Air 6", "Realme wireless earbuds", 3299, 18, "Earbuds"),
    ("OPPO Enco Air 3", "OPPO Bluetooth earbuds", 2499, 14, "Earbuds"),
    ("boAt Airdopes 141", "Affordable wireless earbuds", 1299, 25, "Earbuds"),
    ("Samsung 25W Charger", "Samsung USB-C fast charger", 1299, 20, "Chargers"),
    ("Apple 20W USB-C Adapter", "Apple USB-C power adapter", 1900, 15, "Chargers"),
    ("OnePlus 80W Charger", "OnePlus fast charging adapter", 1999, 12, "Chargers"),
    ("Anker 30W Charger", "Compact USB-C fast charger", 2499, 10, "Chargers"),
    ("Portronics 20W Charger", "Compact mobile charger", 699, 22, "Chargers"),
    ("iPhone 16 Silicone Case", "Protective silicone case for iPhone 16", 999, 20, "Cases"),
    ("iPhone 15 Clear Case", "Transparent protective iPhone case", 699, 18, "Cases"),
    ("Samsung S24 Protective Case", "Protective case for Samsung Galaxy S24", 799, 15, "Cases"),
    ("Redmi Note 14 Case", "Flexible protective Redmi case", 399, 25, "Cases"),
    ("OnePlus Nord Case", "Shock-resistant OnePlus phone case", 499, 20, "Cases"),
    ("Universal Flip Cover", "Universal-style mobile flip cover", 349, 20, "Cases"),
    ("Apple Watch SE", "Apple smartwatch for fitness and notifications", 24900, 5, "Smart Watches"),
    ("Samsung Galaxy Watch FE", "Samsung smartwatch with fitness tracking", 14999, 6, "Smart Watches"),
    ("OnePlus Watch 2R", "OnePlus smartwatch with fitness features", 17999, 5, "Smart Watches"),
    ("Noise ColorFit Pro 5", "Smartwatch with health tracking", 3999, 12, "Smart Watches"),
    ("boAt Wave Sigma", "Affordable smartwatch with notifications", 1499, 15, "Smart Watches"),
    ("Anker Power Bank 20000mAh", "Portable high-capacity power bank", 2999, 10, "Accessories"),
    ("Portronics USB-C Cable", "USB-C charging and data cable", 299, 30, "Accessories"),
    ("SanDisk 128GB USB Drive", "128GB USB storage drive", 999, 15, "Accessories"),
    ("Logitech Wireless Mouse", "Wireless mouse for laptops and computers", 799, 12, "Accessories"),
    ("Ambrane Power Bank 10000mAh", "Compact portable power bank", 1299, 12, "Accessories"),
]

def request_json(url, method="GET", data=None, token=None):
    body = None if data is None else json.dumps(data).encode("utf-8")
    headers = {"Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(raw)
        except Exception:
            detail = raw
        return e.code, detail

def main():
    print("Smart Mobile Store — bulk product uploader")
    print("This connects to the LIVE website API, not your local SQLite database.")
    email = input("Admin email: ").strip()
    password = getpass.getpass("Admin password (hidden while typing): ")

    status, result = request_json(
        API + "/auth/login",
        method="POST",
        data={"email": email, "password": password, "role": "ADMIN"},
    )
    if status != 200 or not isinstance(result, dict) or not result.get("access_token"):
        print("\nLogin failed. HTTP status:", status)
        print("Response:", result)
        print("Check the admin email/password and try again.")
        return

    token = result["access_token"]
    status, current = request_json(API + "/products/")
    if status != 200 or not isinstance(current, list):
        print("\nCould not read the live product list. HTTP status:", status)
        print("Response:", current)
        return

    existing_names = {str(p.get("name", "")).strip().casefold() for p in current}
    total = len(current)
    print(f"\nProducts currently in live store: {total}")

    if total >= 50:
        print("The store already has 50 or more products. No products were added.")
        return

    added = 0
    failed = []
    for name, description, price, stock, category in PRODUCTS:
        if total + added >= 50:
            break
        if name.casefold() in existing_names:
            continue

        payload = {
            "name": name,
            "description": description,
            "price": price,
            "stock_quantity": stock,
            "category": category,
            "image_url": IMAGES[category],
        }
        code, response = request_json(
            API + "/products/",
            method="POST",
            data=payload,
            token=token,
        )
        if code in (200, 201):
            added += 1
            existing_names.add(name.casefold())
            print(f"Added ({total + added}/50): {name}")
        else:
            failed.append((name, code, response))
            print(f"FAILED: {name} (HTTP {code})")

    print("\nFinished.")
    print("Products added this run:", added)
    print("Products expected in store:", total + added)
    if failed:
        print("\nSome products failed. Details:")
        for name, code, response in failed:
            print(f"- {name}: HTTP {code}: {response}")
    else:
        print("All attempted products were added successfully.")
    print("\nRefresh the live website to see the products.")
    print("Note: this uses category-level image URLs, so products in the same category share an image.")

if __name__ == "__main__":
    main()
