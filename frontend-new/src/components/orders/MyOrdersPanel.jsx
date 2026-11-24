import React, { useEffect, useState } from "react";
import "./MyOrdersPanel.css";

const ORDERS_URL = "/api/v1/orders/my-orders";
const TRACKING_URL = "/api/v1/orders";

const TRACKING_STEPS = [
  { status: "PENDING", label: "Order Placed", icon: "🛍️" },
  { status: "CONFIRMED", label: "Confirmed", icon: "✅" },
  { status: "PROCESSING", label: "Processing", icon: "📦" },
  { status: "SHIPPED", label: "Shipped", icon: "🚚" },
  { status: "DELIVERED", label: "Delivered", icon: "🏠" },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const formatDateTime = (value) => {
  if (!value) return "Time unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const formatStatus = (value) =>
  String(value || "PENDING").replaceAll("_", " ");

export default function MyOrdersPanel({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackingRefresh, setTrackingRefresh] = useState(0);

  // Load customer orders.
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            typeof data?.detail === "string"
              ? data.detail
              : "Unable to load your orders."
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response from orders service.");
        }

        setOrders(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load your orders.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => controller.abort();
  }, [refreshCount]);

  // Load tracking details and refresh every 30 seconds.
  useEffect(() => {
    if (!selectedOrderId) return;

    const controller = new AbortController();

    async function loadTracking() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setTrackingError("Please sign in to track your order.");
        setTrackingLoading(false);
        return;
      }

      try {
        setTrackingLoading(true);
        setTrackingError("");

        const response = await fetch(
          `${TRACKING_URL}/${encodeURIComponent(selectedOrderId)}/tracking`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            typeof data?.detail === "string"
              ? data.detail
              : "Unable to load tracking information."
          );
        }

        setTracking(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setTrackingError(
            err.message || "Unable to load tracking information."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setTrackingLoading(false);
        }
      }
    }

    loadTracking();

    const interval = window.setInterval(loadTracking, 30000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [selectedOrderId, trackingRefresh]);

  const openTracking = (orderId) => {
    setTracking(null);
    setTrackingError("");
    setSelectedOrderId(orderId);
  };

  const closeTracking = () => {
    setSelectedOrderId(null);
    setTracking(null);
    setTrackingError("");
  };

  // Tracking details screen.
  if (selectedOrderId) {
    const order = tracking?.order;
    const history = Array.isArray(tracking?.history)
      ? tracking.history
      : [];

    const currentStatus = String(order?.status || "").toUpperCase();
    const isCancelled = currentStatus === "CANCELLED";

    const currentStepIndex = TRACKING_STEPS.findIndex(
      (step) => step.status === currentStatus
    );

    return (
      <main className="my-orders-page">
        <header className="my-orders-heading">
          <div>
            <p className="my-orders-eyebrow">TechLite delivery</p>
            <h1>Track your order</h1>
            <p>Follow your purchase from placement to delivery.</p>
          </div>

          <button
            type="button"
            className="orders-back-button"
            onClick={closeTracking}
          >
            ← Back to orders
          </button>
        </header>

        {trackingLoading && !tracking ? (
          <p className="orders-state">Loading tracking information...</p>
        ) : trackingError && !tracking ? (
          <div className="orders-state orders-error" role="alert">
            <p>{trackingError}</p>
            <button
              type="button"
              onClick={() => setTrackingRefresh((count) => count + 1)}
            >
              Try again
            </button>
          </div>
        ) : tracking ? (
          <section className="tracking-container">
            <div className="tracking-top-card">
              <div>
                <p className="order-label">Order ID</p>
                <h2>{order.id}</h2>
                <p className="order-date">
                  Placed on {formatDate(order.created_at)}
                </p>
              </div>

              <span
                className={`order-status order-status-${currentStatus.toLowerCase()}`}
              >
                {formatStatus(currentStatus)}
              </span>
            </div>

            {isCancelled ? (
              <div className="tracking-cancelled">
                <span>❌</span>
                <div>
                  <h3>Order Cancelled</h3>
                  <p>This order has been cancelled.</p>
                </div>
              </div>
            ) : (
              <div className="tracking-progress-card">
                <h2>Delivery progress</h2>

                <div className="tracking-timeline">
                  {TRACKING_STEPS.map((step, index) => {
                    const completed = currentStepIndex >= index;
                    const historyEntry = history.find(
                      (entry) => entry.status === step.status
                    );

                    return (
                      <div
                        className={`tracking-step ${
                          completed ? "completed" : ""
                        }`}
                        key={step.status}
                      >
                        <div className="tracking-step-marker">
                          <span>{completed ? "✓" : index + 1}</span>
                        </div>

                        <div className="tracking-step-content">
                          <h3>
                            {step.icon} {step.label}
                          </h3>

                          {historyEntry ? (
                            <>
                              <p>
                                {historyEntry.description ||
                                  step.label}
                              </p>
                              <small>
                                {formatDateTime(historyEntry.updated_at)}
                              </small>
                            </>
                          ) : (
                            <p>
                              {completed
                                ? "Status recorded"
                                : "Waiting for this stage"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="tracking-details-grid">
              <article className="tracking-info-card">
                <h2>📍 Delivery information</h2>
                <p className="tracking-info-label">Delivery address</p>
                <p>
                  {order.delivery_address || "Address not available"}
                </p>
              </article>

              <article className="tracking-info-card">
                <h2>💳 Payment information</h2>

                <p className="tracking-info-label">Payment method</p>
                <p>{order.payment_method || "Not available"}</p>

                <p className="tracking-info-label">Payment status</p>
                <p>{formatStatus(order.payment_status || "PENDING")}</p>

                <p className="tracking-info-label">Order total</p>
                <strong>{formatPrice(order.total)}</strong>
              </article>
            </div>

            <article className="tracking-info-card tracking-products">
              <h2>📦 Ordered products</h2>

              {Array.isArray(order.items) && order.items.length > 0 ? (
                <ul className="order-items">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.product_name}
                        <small> × {item.quantity}</small>
                      </span>
                      <strong>{formatPrice(item.line_total)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No product information available.</p>
              )}
            </article>

            <div className="tracking-refresh-area">
              <button
                type="button"
                className="orders-refresh-button"
                onClick={() =>
                  setTrackingRefresh((count) => count + 1)
                }
                disabled={trackingLoading}
              >
                {trackingLoading ? "Refreshing..." : "↻ Refresh tracking"}
              </button>

              <p>Tracking information refreshes automatically every 30 seconds.</p>
              {trackingError && (
                <p className="tracking-refresh-error">{trackingError}</p>
              )}
            </div>
          </section>
        ) : null}
      </main>
    );
  }

  // My Orders screen.
  return (
    <main className="my-orders-page">
      <header className="my-orders-heading">
        <div>
          <p className="my-orders-eyebrow">Your account</p>
          <h1>My orders</h1>
          <p>Follow your TechLite purchases from checkout to delivery.</p>
        </div>

        <div className="my-orders-actions">
          <button
            type="button"
            className="orders-back-button"
            onClick={onBack}
          >
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
          <button type="button" onClick={onBack}>
            Explore products
          </button>
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
                  className={`order-status order-status-${String(
                    order.status || "pending"
                  ).toLowerCase()}`}
                >
                  {formatStatus(order.status)}
                </span>
              </header>

              <p className="order-date">
                Placed {formatDate(order.created_at)}
              </p>

              <ul className="order-items">
                {(Array.isArray(order.items) ? order.items : []).map(
                  (item) => (
                    <li key={item.id}>
                      <span>
                        {item.product_name}
                        <small> × {item.quantity}</small>
                      </span>
                      <strong>{formatPrice(item.line_total)}</strong>
                    </li>
                  )
                )}
              </ul>

              <footer className="order-card-footer">
                <span>{order.items?.length || 0} product types</span>
                <strong>Total {formatPrice(order.total)}</strong>
              </footer>

              <div className="order-track-action">
                <button
                  type="button"
                  onClick={() => openTracking(order.id)}
                >
                  🚚 Track Order
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}