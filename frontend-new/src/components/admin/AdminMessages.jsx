import React, { useEffect, useState } from "react";
import "./AdminMessages.css";

const API = "http://127.0.0.1:8000/api/v1/messages/";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyStatus, setReplyStatus] = useState("");

  const token = localStorage.getItem("access_token");

  async function loadMessages() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? "Admin access required."
            : "Unable to load messages."
        );
      }

      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function toggleRead(message) {
    setActionLoading(message.id);
    setError("");

    try {
      const response = await fetch(`${API}${message.id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to update message status.");
      }

      const updatedMessage = await response.json();

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? updatedMessage : item
        )
      );

      if (selectedMessage?.id === message.id) {
        setSelectedMessage(updatedMessage);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteMessage(message) {
    const confirmed = window.confirm(
      `Delete the message from ${message.name}?`
    );

    if (!confirmed) return;

    setActionLoading(message.id);
    setError("");

    try {
      const response = await fetch(`${API}${message.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to delete message.");
      }

      setMessages((current) =>
        current.filter((item) => item.id !== message.id)
      );

      if (selectedMessage?.id === message.id) {
        setSelectedMessage(null);
        setReplyText("");
        setReplyStatus("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function sendReply(message) {
    if (!replyText.trim()) {
      setReplyStatus("Please enter your reply.");
      return;
    }

    setReplyLoading(true);
    setReplyStatus("");

    try {
      const response = await fetch(`${API}${message.id}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reply: replyText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to send email."
        );
      }

      setReplyStatus("Reply sent successfully!");
      setReplyText("");
    } catch (err) {
      setReplyStatus(err.message || "Failed to send reply.");
    } finally {
      setReplyLoading(false);
    }
  }

  const unreadCount = messages.filter(
    (message) => !message.is_read
  ).length;

  if (loading) {
    return <div className="admin-messages">Loading messages...</div>;
  }

  return (
    <div className="admin-messages">
      <div className="messages-header">
        <div>
          <h2>Customer Messages</h2>
          <p>
            {messages.length} total messages · {unreadCount} unread
          </p>
        </div>

        <button
          type="button"
          className="messages-refresh"
          onClick={loadMessages}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="messages-error" role="alert">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="messages-empty">
          <h3>No messages yet</h3>
          <p>
            Customer messages submitted through Contact Us will appear here.
          </p>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((message) => (
            <div
              className={`message-card ${
                message.is_read ? "read" : "unread"
              }`}
              key={message.id}
            >
              <div className="message-card-header">
                <div>
                  <h3>{message.subject}</h3>

                  <p className="message-sender">
                    {message.name} · {message.email}
                  </p>

                  <small>
                    {new Date(message.created_at).toLocaleString()}
                  </small>
                </div>

                <span
                  className={`message-status ${
                    message.is_read ? "read" : "unread"
                  }`}
                >
                  {message.is_read ? "Read" : "Unread"}
                </span>
              </div>

              {selectedMessage?.id === message.id && (
                <div className="message-full-content">
                  <h4>Customer Message</h4>

                  <p>{message.message}</p>

                  <div className="message-reply-section">
                    <h4>Reply to Customer</h4>

                    <textarea
                      value={replyText}
                      onChange={(e) => {
                        setReplyText(e.target.value);
                        setReplyStatus("");
                      }}
                      placeholder="Write your reply here..."
                      rows={5}
                      maxLength={5000}
                      disabled={replyLoading}
                    />

                    <button
                      type="button"
                      className="message-send-reply"
                      onClick={() => sendReply(message)}
                      disabled={replyLoading || !replyText.trim()}
                    >
                      {replyLoading ? "Sending..." : "Send Reply"}
                    </button>

                    {replyStatus && (
                      <p
                        className={`message-reply-status ${
                          replyStatus === "Reply sent successfully!"
                            ? "success"
                            : "error"
                        }`}
                      >
                        {replyStatus}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="message-actions">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMessage?.id === message.id) {
                      setSelectedMessage(null);
                      setReplyText("");
                      setReplyStatus("");
                    } else {
                      setSelectedMessage(message);
                      setReplyText("");
                      setReplyStatus("");
                    }
                  }}
                >
                  {selectedMessage?.id === message.id
                    ? "Close"
                    : "View Message"}
                </button>

                <button
                  type="button"
                  disabled={actionLoading === message.id}
                  onClick={() => toggleRead(message)}
                >
                  {actionLoading === message.id
                    ? "Please wait..."
                    : message.is_read
                    ? "Mark Unread"
                    : "Mark Read"}
                </button>

                <button
                  type="button"
                  className="message-delete"
                  disabled={actionLoading === message.id}
                  onClick={() => deleteMessage(message)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}