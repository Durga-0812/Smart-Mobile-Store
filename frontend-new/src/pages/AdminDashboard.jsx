import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import AdminOrders from "../components/admin/AdminOrders";

const API = "http://127.0.0.1:8000/api/v1";

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock_quantity: "",
  image_url: "",
};

export default function AdminDashboard({ fullName, onLogout }) {
  const [section, setSection] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("access_token");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [productResponse, customerResponse] = await Promise.all([
        fetch(`${API}/products/`),
        fetch(`${API}/auth/admin/users`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
      ]);

      if (!productResponse.ok) {
        throw new Error("Unable to load products.");
      }

      const productData = await productResponse.json();
      setProducts(Array.isArray(productData) ? productData : []);

      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        setCustomers(Array.isArray(customerData) ? customerData : []);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyProduct });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditingId(product.id);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      category: product.category ?? "",
      stock_quantity: String(product.stock_quantity ?? ""),
      image_url: product.image_url ?? "",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const price = Number(form.price);
    const stock = Number(form.stock_quantity);

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setError("Enter a valid non-negative price.");
      return;
    }

    if (
      form.stock_quantity.trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Stock quantity must be a non-negative whole number.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      category: form.category.trim(),
      stock_quantity: stock,
      image_url: form.image_url.trim() || null,
    };

    setSaving(true);

    try {
      const response = await fetch(
        editingId
          ? `${API}/products/${editingId}`
          : `${API}/products/`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = data?.detail;
        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(", ")
          : detail;
        throw new Error(
          message ||
            `Unable to ${editingId ? "update" : "create"} product.`
        );
      }

      setShowForm(false);
      setForm({ ...emptyProduct });
      setEditingId(null);
      setNotice(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/products/${product.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const detail = data?.detail;
        throw new Error(
          (typeof detail === "string" && detail) ||
            "Unable to delete product."
        );
      }

      setNotice("Product deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  }

  const menuItems = [
    ["Dashboard", "▦"],
    ["Orders", "🛒"],
    ["Categories", "☷"],
    ["Products", "⬡"],
    ["Customers", "♟"],
    ["Messages", "✉"],
    ["Settings", "⚙"],
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          Tech<span>Lite</span>
        </div>

        <nav className="admin-menu">
          {menuItems.map(([label, symbol]) => (
            <button
              key={label}
              className={section === label ? "selected" : ""}
              onClick={() => {
                setSection(label);
                setShowForm(false);
                setError("");
                setNotice("");
              }}
            >
              <span>{symbol}</span>
              {label}
            </button>
          ))}
        </nav>

        <button className="admin-logout" onClick={onLogout}>
          ⇥ Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{section}</h1>
            <p>Welcome back, {fullName || "Administrator"}</p>
          </div>

          <button className="admin-refresh" onClick={loadData}>
            Refresh data
          </button>
        </header>

        {error && <div className="admin-error">{error}</div>}
        {notice && <div className="admin-notice">{notice}</div>}

        {loading ? (
          <p>Loading dashboard data...</p>
        ) : (
          <>
            <div className="admin-stats">
              <article className="admin-stat">
                <span className="stat-icon">▣</span>
                <div>
                  <p>Total Products</p>
                  <strong>{products.length}</strong>
                </div>
              </article>

              <article className="admin-stat">
                <span className="stat-icon">♟</span>
                <div>
                  <p>Registered Accounts</p>
                  <strong>{customers.length}</strong>
                </div>
              </article>

              <article className="admin-stat">
                <span className="stat-icon">₹</span>
                <div>
                  <p>Inventory Value</p>
                  <strong>
                    ₹
                    {products
                      .reduce(
                        (sum, item) =>
                          sum +
                          Number(item.price || 0) *
                            Number(item.stock_quantity || 0),
                        0
                      )
                      .toLocaleString("en-IN")}
                  </strong>
                </div>
              </article>
            </div>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <h2>
                  {section === "Dashboard"
                    ? "Product Overview"
                    : section}
                </h2>

                {section === "Products" && (
                  <button
                    className="admin-add-button"
                    onClick={openAddForm}
                  >
                    + Add Product
                  </button>
                )}
              </div>

              {showForm && section === "Products" && (
                <form className="product-admin-form" onSubmit={saveProduct}>
                  <h3>
                    {editingId ? "Edit Product" : "Add New Product"}
                  </h3>

                  <div className="product-form-grid">
                    <label>
                      Product Name *
                      <input
                        name="name"
                        value={form.name}
                        onChange={updateField}
                        required
                        maxLength={200}
                      />
                    </label>

                    <label>
                      Category
                      <input
                        name="category"
                        value={form.category}
                        onChange={updateField}
                        placeholder="e.g. Smartphones"
                      />
                    </label>

                    <label>
                      Price (₹) *
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={updateField}
                        required
                      />
                    </label>

                    <label>
                      Stock Quantity *
                      <input
                        name="stock_quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={form.stock_quantity}
                        onChange={updateField}
                        required
                      />
                    </label>

                    <label className="product-form-full">
                      Image URL
                      <input
                        name="image_url"
                        type="url"
                        value={form.image_url}
                        onChange={updateField}
                        placeholder="https://example.com/product.jpg"
                      />
                    </label>

                    <label className="product-form-full">
                      Description
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={updateField}
                        rows="3"
                      />
                    </label>
                  </div>

                  <div className="product-form-actions">
                    <button type="submit" disabled={saving}>
                      {saving
                        ? "Saving..."
                        : editingId
                          ? "Save Changes"
                          : "Add Product"}
                    </button>

                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setShowForm(false);
                        setError("");
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {section === "Dashboard" || section === "Products" ? (
                products.length === 0 ? (
                  <p>No products found in the database.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          {section === "Products" && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.category || "—"}</td>
                            <td>
                              ₹
                              {Number(product.price || 0).toLocaleString(
                                "en-IN"
                              )}
                            </td>
                            <td>{product.stock_quantity ?? "—"}</td>

                            {section === "Products" && (
                              <td>
                                <div className="product-row-actions">
                                  <button
                                    type="button"
                                    onClick={() => openEditForm(product)}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="delete-button"
                                    onClick={() => deleteProduct(product)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : section === "Customers" ? (
                customers.length === 0 ? (
                  <p>No customer accounts are available to display.</p>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td>{customer.full_name}</td>
                            <td>{customer.email}</td>
                            <td>{customer.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : section === "Orders" ? (
  <AdminOrders />
) : section !== "Dashboard" && section !== "Products" ? (
  <p>
    The {section.toLowerCase()} section requires its corresponding
    backend functionality before it can manage real data.
  </p>
) : null}
            </section>
          </>
        )}
      </main>
    </div>
  );
}