const HIGH_RESOLUTION_IMAGES = {
  smartphones: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97",
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab",
  ],
  earbuds: [
    "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1",
    "https://images.unsplash.com/photo-1608156639585-b3a032ef9689",
    "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77",
  ],
  chargers: [
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0",
    "https://images.unsplash.com/photo-1615526675159-e248c3021d3f",
  ],
  cases: [
    "https://images.unsplash.com/photo-1601593346740-925612772716",
    "https://images.unsplash.com/photo-1603313011108-34cf9212c076",
  ],
  smartwatches: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314",
  ],
  laptops: [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
  ],
  accessories: [
    "https://images.unsplash.com/photo-1523206489230-c012c64b2b48",
  ],
};

function getCategory(product) {
  const value = `${product.category || ""} ${product.name || ""}`.toLowerCase();

  if (/earbud|headphone|airpod|buds/.test(value)) return "earbuds";
  if (/laptop|notebook|computer|macbook/.test(value)) return "laptops";
  if (/watch|smartwatch/.test(value)) return "smartwatches";
  if (/charger|adapter|power bank/.test(value)) return "chargers";
  if (/case|cover/.test(value)) return "cases";
  if (/phone|mobile|smartmobiles|smartphone/.test(value)) return "smartphones";
  return "accessories";
}

function highResolutionUrl(url) {
  const imageUrl = new URL(url);
  imageUrl.searchParams.set("auto", "format");
  imageUrl.searchParams.set("w", "3840");
  imageUrl.searchParams.delete("h");
  imageUrl.searchParams.delete("fit");
  imageUrl.searchParams.set("q", "95");
  return imageUrl.toString();
}

function selectCategoryImage(product, category) {
  const images = HIGH_RESOLUTION_IMAGES[category];
  const productName = String(product.name || "");
  const index = [...productName].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0
  ) % images.length;
  return highResolutionUrl(images[index]);
}

export function getProductImageUrl(product) {
  const category = getCategory(product);
  const image = String(product.image || product.image_url || "").trim();

  if (image.includes("images.unsplash.com")) {
    return highResolutionUrl(image);
  }

  if (
    image.includes("encrypted-tbn0.gstatic.com") ||
    /smartprix\.com\/.*-w\d+-h\d+/i.test(image)
  ) {
    return selectCategoryImage(product, category);
  }

  return image;
}
