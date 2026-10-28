
import React, { useEffect, useState } from "react";
import "./AdminOrders.css";
const API = "https://smart-mobile-store.onrender.com/api/v1";



export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/orders/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load orders. Check your admin login.");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId, status) {
    try {
      const response = await fetch(`${API}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Unable to update order status.");
      }

      await loadOrders();
    } catch (err) {
      setError(err.message || "Status update failed.");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <section className="admin-orders admin-orders-panel">
      <header className="admin-orders-panel__header">
        <div>
          <p className="admin-orders-panel__eyebrow">Store activity</p>
          <h2>Order Management</h2>
          <p className="admin-orders-panel__subtitle">
            Review purchases and keep customers up to date.
          </p>
        </div>

        <button
          type="button"
          className="admin-orders-panel__refresh"
          onClick={loadOrders}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh orders"}
        </button>
      </header>

      {error && (
        <p className="admin-orders-panel__error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="admin-orders-panel__empty">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="admin-orders-panel__empty">
          <span aria-hidden="true">📦</span>
          <strong>No orders yet</strong>
          <p>New customer orders will appear here.</p>
        </div>
      ) : (
        <div className="admin-orders-panel__table-wrap">
          <table className="admin-orders-panel__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.user_id}</td>
                  <td>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td>
                    <strong className="admin-orders-panel__total">
                      ₹{Number(order.total ?? order.total_amount ?? 0).toLocaleString("en-IN")}
                    </strong>
                  </td>
                  <td>
                    <span
                      className={`admin-orders-panel__status admin-orders-panel__status--${String(order.status || "pending").toLowerCase()}`}
                    >
                      {order.status || "PENDING"}
                    </span>
                  </td>
                  <td>
                    <select
                      className="admin-orders-panel__status-select"
                      value={order.status}
                      aria-label={`Update order ${order.id} status`}
                      onChange={(event) =>
                        updateStatus(order.id, event.target.value)
                      }
                    >
                      {[
                        "PENDING",
                        "CONFIRMED",
                        "PROCESSING",
                        "SHIPPED",
                        "DELIVERED",
                        "CANCELLED",
                      ].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}