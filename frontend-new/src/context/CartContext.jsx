import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext(null);

const API_URL = "http://127.0.0.1:8000/api/v1/cart";

async function requestCart(path = "", options = {}) {
const token = localStorage.getItem("access_token");

if (!token) {
throw new Error("Please log in to manage your cart.");
}

const url = path ? `${API_URL}${path}` : `${API_URL}/`;

const response = await fetch(url, {
...options,
headers: {
...(options.body ? { "Content-Type": "application/json" } : {}),
Authorization: `Bearer ${token}`,
...options.headers,
},
signal: options.signal,
});

const data = await response.json().catch(() => ({}));

if (!response.ok) {
const detail = data.detail;


const message = Array.isArray(detail)
  ? detail.map((error) => error.msg).join(", ")
  : typeof detail === "string"
    ? detail
    : "Unable to update your cart.";

throw new Error(message);


}

if (!Array.isArray(data.items)) {
throw new Error("Invalid cart response from server.");
}

return data;
}

function normalizeCartItems(items) {
return items.map((item) => ({
...item,
id: String(item.id),
priceNum: Number(item.price),
image: item.image_url,
quantity: Number(item.quantity),
}));
}

export function CartProvider({ children, isAuthenticated = false }) {
const [cartItems, setCartItems] = useState([]);
const [isCartOpen, setIsCartOpen] = useState(false);
const [cartError, setCartError] = useState("");
const [cartLoading, setCartLoading] = useState(false);

useEffect(() => {
if (!isAuthenticated) {
setCartItems([]);
setCartError("");
return undefined;
}


const controller = new AbortController();

async function loadCart() {
  setCartLoading(true);

  try {
    const data = await requestCart("", {
      signal: controller.signal,
    });

    setCartItems(normalizeCartItems(data.items));
    setCartError("");
  } catch (error) {
    if (error.name !== "AbortError") {
      setCartError(error.message || "Unable to load your cart.");
    }
  } finally {
    if (!controller.signal.aborted) {
      setCartLoading(false);
    }
  }
}

loadCart();

return () => controller.abort();


}, [isAuthenticated]);

const applyCartResponse = (data) => {
setCartItems(normalizeCartItems(data.items));
setCartError("");
};

const addToCart = async (product) => {
if (!product || product.id === undefined || product.id === null) {
throw new Error("Product ID is missing.");
}


try {
  const data = await requestCart("/items", {
    method: "POST",
    body: JSON.stringify({
      product_id: String(product.id),
      quantity: 1,
    }),
  });

  applyCartResponse(data);
} catch (error) {
  setCartError(error.message || "Unable to add product.");
  throw error;
}


};

const removeFromCart = async (productId) => {
try {
const data = await requestCart(
`/items/${encodeURIComponent(productId)}`,
{ method: "DELETE" }
);


  applyCartResponse(data);
} catch (error) {
  setCartError(error.message || "Unable to remove product.");
  throw error;
}


};

const updateQuantity = async (productId, amount) => {
const item = cartItems.find(
(cartItem) => String(cartItem.id) === String(productId)
);


if (!item) return;

const quantity = Number(item.quantity) + Number(amount);

if (quantity <= 0) {
  return removeFromCart(productId);
}

try {
  const data = await requestCart(
    `/items/${encodeURIComponent(productId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }
  );

  applyCartResponse(data);
} catch (error) {
  setCartError(error.message || "Unable to update quantity.");
  throw error;
}


};

const clearCart = async () => {
try {
const data = await requestCart("", {
method: "DELETE",
});


  applyCartResponse(data);
} catch (error) {
  setCartError(error.message || "Unable to clear cart.");
  throw error;
}


};

const clearLocalCart = () => {
setCartItems([]);
setCartError("");
};

const totalItems = cartItems.reduce(
(sum, item) => sum + Number(item.quantity || 0),
0
);

const totalPrice = cartItems.reduce(
(sum, item) =>
sum + Number(item.priceNum ?? item.price) * Number(item.quantity || 0),
0
);

return (
<CartContext.Provider
value={{
cartItems,
isCartOpen,
setIsCartOpen,
addToCart,
removeFromCart,
updateQuantity,
clearCart,
clearLocalCart,
totalItems,
totalPrice,
cartError,
cartLoading,
dismissCartError: () => setCartError(""),
}}
>
{children}
</CartContext.Provider>
);
}

export default CartProvider;
