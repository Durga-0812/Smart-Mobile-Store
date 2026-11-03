const HIGH_RESOLUTION_IMAGES = {
  smartphones: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
  ],

  earbuds: [
    "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?auto=format&fit=crop&w=800&q=80",
  ],

  headphones: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
  ],

  chargers: [
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=800&q=80",
  ],

  cases: [
    "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1603313011108-34cf9212c076?auto=format&fit=crop&w=800&q=80",
  ],

  smartwatches: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80",
  ],

  laptops: [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  ],

  accessories: [
    "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=800&q=80",
  ],
};

function getCategory(product) {
  const value = `${product.category || ""} ${product.name || ""}`.toLowerCase();

  if (/headphone|wh-|tune|rockerz/.test(value)) return "headphones";
  if (/earbud|airpod|buds/.test(value)) return "earbuds";
  if (/laptop|notebook|computer|macbook/.test(value)) return "laptops";
  if (/watch|smartwatch/.test(value)) return "smartwatches";
  if (/charger|adapter|power bank/.test(value)) return "chargers";
  if (/case|cover/.test(value)) return "cases";
  if (/phone|mobile|smartphone|iphone|samsung|galaxy/.test(value)) {
    return "smartphones";
  }

  return "accessories";
}

function selectCategoryImage(product, category) {
  const images = HIGH_RESOLUTION_IMAGES[category];
  const name = String(product.name || "");

  const index =
    [...name].reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0
    ) % images.length;

  return images[index];
}

export function getProductImageUrl(product) {
  const name = String(product.name || "").toLowerCase();

  // Google Pixel 8a
  if (name.includes("google pixel 8a")) {
    return HIGH_RESOLUTION_IMAGES.smartphones[0];
  }

  // OnePlus 9 Pro 5G
  if (name.includes("oneplus 9 pro")) {
    return HIGH_RESOLUTION_IMAGES.smartphones[1];
  }

  // OnePlus Nord 4
  if (name.includes("oneplus nord 4")) {
    return HIGH_RESOLUTION_IMAGES.smartphones[2];
  }

  // Sony WH-1000XM5
  if (name.includes("sony") && name.includes("wh-1000xm5")) {
    return HIGH_RESOLUTION_IMAGES.headphones[0];
  }

  // JBL Tune 770NC
  if (name.includes("jbl") && name.includes("770nc")) {
    return HIGH_RESOLUTION_IMAGES.headphones[1];
  }

  // boAt Rockerz 550
  if (name.includes("boat") && name.includes("rockerz 550")) {
    return HIGH_RESOLUTION_IMAGES.headphones[2];
  }

  // Spigen Rugged Armor Case
  if (name.includes("spigen") && name.includes("case")) {
    return "https://partners.spigen.com/cdn/shop/files/title_web_sp691_rugged_armor_magfit_blk_01_410be53b-b8b0-4cc2-a6e4-32a225866dbe.jpg?v=1747864274";
  }

  // Galaxy S25 Ultra
  if (name.includes("galaxy s25 ultra")) {
    return "https://www.mobileciti.com.au/media/catalog/product/s/a/samsung-galaxy-s25-ultra-256gb-titanium-black-5.jpg";
  }

  // Samsung Galaxy Buds3 Pro
  if (name.includes("buds3 pro")) {
    return "https://storage.comprasmartphone.com/headphones/samsung-galaxy-buds-3-pro.png";
  }

  if (name.includes("45w") && name.includes("adapter")) {
    return HIGH_RESOLUTION_IMAGES.chargers[0];
  }

  if (name.includes("watch8")) {
    return "https://images.fravega.com/f1000/caf4e6ea987370dcffcdb638a1bff7f9.png";
  }

  if (name.includes("galaxy a56")) {
    return "/images/galaxy-a56.jpg";
  }

  if (name.includes("watch7")) {
    return HIGH_RESOLUTION_IMAGES.smartwatches[1];
  }

  if (name.includes("256gb usb")) {
    return "https://images.unsplash.com/photo-1477949331575-2763034b5fb5?auto=format&fit=crop&w=800&q=80";
  }

  if (name.includes("wireless charging pad")) {
    return "https://www.mytrendyphone.eu/images/Universal-Fast-Qi-Wireless-Charging-Pad-Q25-Black-05112021-01-p.jpg";
  }

  if (name.includes("oneplus") && name.includes("case")) {
    return HIGH_RESOLUTION_IMAGES.cases[0];
  }

  if (name.includes("iphone")) {
    return HIGH_RESOLUTION_IMAGES.smartphones[2];
  }

  if (name.includes("samsung") || name.includes("galaxy")) {
    return "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80";
  }

  const image = String(product.image_url || product.image || "").trim();

  if (
    image &&
    /^https?:\/\//i.test(image) &&
    !image.includes("placehold.co") &&
    !image.includes("encrypted-tbn0.gstatic.com")
  ) {
    return image;
  }

  return selectCategoryImage(product, getCategory(product));
}