import React, { useEffect, useState } from "react";
import "./MyOrdersPanel.css";

const ORDERS_URL = "https://techlite-5x6a.onrender.com/api/v1/orders/my-orders";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

export default function MyOrdersPanel({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Please sign in to view your orders.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetch(ORDERS_URL, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const detail = data?.detail;
          throw new Error(
            (typeof detail === "string" && detail) ||
              "Unable to load your orders. Please try again."
          );
        }
        if (!Array.isArray(data)) {
          throw new Error("The orders service returned an unexpected response.");
        }
        setOrders(data);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          console.error("Order loading error:", loadError);
          setError(loadError.message || "Unable to load your orders.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadOrders();
    return () => controller.abort();
  }, [refreshCount]);

  return (
    <main className="my-orders-page">
      <header className="my-orders-heading">
        <div>
          <p className="my-orders-eyebrow">Your account</p>
          <h1>My orders</h1>
          <p>Follow your TechLite purchases from checkout to delivery.</p>
        </div>
        <div className="my-orders-actions">
          <button type="button" className="orders-back-button" onClick={onBack}>
            Continue shopping
          </button>
          <button
            type="button"
            className="orders-refresh-button"
            onClick={() => setRefreshCount((count) => count + 1)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <p className="orders-state">Loading your orders...</p>
      ) : error ? (
        <div className="orders-state orders-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRefreshCount((count) => count + 1)}
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-state orders-empty">
          <span aria-hidden="true">📦</span>
          <h2>No orders yet</h2>
          <p>Your orders will appear here once you complete checkout.</p>
          <button type="button" onClick={onBack}>Explore products</button>
        </div>
      ) : (
        <section className="orders-list" aria-label="Your orders">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <header className="order-card-header">
                <div>
                  <p className="order-label">Order</p>
                  <h2 title={order.id}>{order.id}</h2>
                </div>
                <span
                  className={`order-status order-status-${String(order.status || "pending").toLowerCase()}`}
                >
                  {String(order.status || "Pending").replaceAll("_", " ")}
                </span>
              </header>
              <p className="order-date">Placed {formatDate(order.created_at)}</p>
              <ul className="order-items">
                {(Array.isArray(order.items) ? order.items : []).map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.product_name} <small>× {item.quantity}</small>
                    </span>
                    <strong>{formatPrice(item.line_total)}</strong>
                  </li>
                ))}
              </ul>
              <footer className="order-card-footer">
                <span>{order.items?.length || 0} product types</span>
                <strong>Total {formatPrice(order.total)}</strong>
              </footer>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
