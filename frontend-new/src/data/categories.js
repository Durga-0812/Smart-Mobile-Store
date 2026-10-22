export const PRODUCT_CATEGORIES = [
  {
    id: "mobiles",
    name: "Mobiles",
    icon: "📱",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=90",
  },
  {
    id: "laptops",
    name: "Laptops",
    icon: "💻",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=90",
  },
  {
    id: "earbuds",
    name: "Earbuds",
    icon: "🎧",
    image:
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=90",
  },
  {
    id: "chargers",
    name: "Chargers",
    icon: "🔌",
    image:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=90",
  },
  {
    id: "cases",
    name: "Cases",
    icon: "📱",
    image:
      "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=90",
  },
  {
    id: "smartwatches",
    name: "Smart Watches",
    icon: "⌚",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=90",
  },
  {
    id: "accessories",
    name: "Accessories",
    icon: "✨",
    image:
      "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=900&q=90",
  },
];

const CATEGORY_ALIASES = new Map([
  ["mobile", "mobiles"],
  ["mobiles", "mobiles"],
  ["phone", "mobiles"],
  ["phones", "mobiles"],
  ["smartphone", "mobiles"],
  ["smartphones", "mobiles"],
  ["smartmobile", "mobiles"],
  ["smartmobiles", "mobiles"],
  ["laptop", "laptops"],
  ["laptops", "laptops"],
  ["computer", "laptops"],
  ["computers", "laptops"],
  ["notebook", "laptops"],
  ["notebooks", "laptops"],
  ["earbud", "earbuds"],
  ["earbuds", "earbuds"],
  ["headphone", "earbuds"],
  ["headphones", "earbuds"],
  ["airpods", "earbuds"],
  ["charger", "chargers"],
  ["chargers", "chargers"],
  ["adapter", "chargers"],
  ["adapters", "chargers"],
  ["case", "cases"],
  ["cases", "cases"],
  ["cover", "cases"],
  ["covers", "cases"],
  ["smartwatch", "smartwatches"],
  ["smartwatches", "smartwatches"],
  ["watch", "smartwatches"],
  ["watches", "smartwatches"],
  ["accessory", "accessories"],
  ["accessories", "accessories"],
]);

export function getCategoryId(category) {
  const normalized = String(category || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return CATEGORY_ALIASES.get(normalized) || normalized;
}

export function getCategoryName(category) {
  const categoryId = getCategoryId(category);
  return (
    PRODUCT_CATEGORIES.find((item) => item.id === categoryId)?.name ||
    String(category || "—")
  );
}

export function getCanonicalCategory(category) {
  const categoryId = getCategoryId(category);
  return (
    PRODUCT_CATEGORIES.find((item) => item.id === categoryId)?.name || ""
  );
}
