import React, { useEffect, useState } from "react";
import "./AdminFeedback.css";

const API = "/api/v1/feedback";

export default function AdminFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyTexts, setReplyTexts] = useState({});
  const [replyLoading, setReplyLoading] = useState(null);
  const [notice, setNotice] = useState("");

  const [satisfactionStats, setSatisfactionStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  const token = localStorage.getItem("access_token");

  async function loadFeedback() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load customer feedback."
        );
      }

      setFeedbackList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSatisfactionStats() {
    setStatsError("");

    try {
      const response = await fetch(
        `${API}/admin/satisfaction-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load satisfaction statistics."
        );
      }

      setSatisfactionStats(data);
    } catch (err) {
      setStatsError(err.message || "Unable to load ML statistics.");
    }
  }

  async function refreshDashboard() {
    await Promise.all([
      loadFeedback(),
      loadSatisfactionStats(),
    ]);
  }

  useEffect(() => {
    refreshDashboard();
  }, []);

  async function sendReply(feedback) {
    const reply = (replyTexts[feedback.id] || "").trim();

    if (reply.length < 2) {
      setError("Please enter a reply with at least 2 characters.");
      return;
    }

    setReplyLoading(feedback.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/admin/${feedback.id}/reply`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_reply: reply,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to save reply."
        );
      }

      setReplyTexts((current) => ({
        ...current,
        [feedback.id]: "",
      }));

      setNotice("Your reply was saved successfully.");

      await loadFeedback();
    } catch (err) {
      setError(err.message || "Failed to save reply.");
    } finally {
      setReplyLoading(null);
    }
  }

  const repliedCount = feedbackList.filter(
    (item) => item.admin_reply
  ).length;

  const pendingCount = feedbackList.length - repliedCount;

  function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) {
    return (
      <div className="admin-feedback">
        <p className="feedback-loading">
          Loading customer feedback...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-feedback">
      <div className="feedback-header">
        <div>
          <h2>Customer Feedback</h2>
          <p>Read customer reviews and respond to them.</p>
        </div>

        <button
          type="button"
          className="feedback-refresh"
          onClick={refreshDashboard}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Existing Feedback Summary */}
      <div className="feedback-summary">
        <div className="feedback-summary-card">
          <span>Total Feedback</span>
          <strong>{feedbackList.length}</strong>
        </div>

        <div className="feedback-summary-card">
          <span>Replied</span>
          <strong>{repliedCount}</strong>
        </div>

        <div className="feedback-summary-card">
          <span>Pending Replies</span>
          <strong>{pendingCount}</strong>
        </div>
      </div>

      {/* Customer Satisfaction ML Dashboard */}
      <section className="satisfaction-dashboard">
        <div className="satisfaction-heading">
          <div>
            <h2>Customer Satisfaction Prediction</h2>
            <p>
              AI-based sentiment analysis of customer feedback.
            </p>
          </div>
          <span className="satisfaction-ai-badge">
            ML Powered
          </span>
        </div>

        {statsError && (
          <div className="feedback-alert feedback-error">
            {statsError}
          </div>
        )}

        {satisfactionStats ? (
          <div className="satisfaction-summary">
            <div className="satisfaction-card">
              <span>Total Analyzed</span>
              <strong>
                {satisfactionStats.analyzed_feedback}
              </strong>
            </div>

            <div className="satisfaction-card satisfied">
              <span>Satisfied Customers</span>
              <strong>
                {satisfactionStats.satisfied_customers}
              </strong>
            </div>

            <div className="satisfaction-card not-satisfied">
              <span>Not Satisfied</span>
              <strong>
                {satisfactionStats.not_satisfied_customers}
              </strong>
            </div>

            <div className="satisfaction-card percentage">
              <span>Satisfaction Percentage</span>
              <strong>
                {satisfactionStats.satisfaction_percentage}%
              </strong>
            </div>

            <div className="satisfaction-card confidence">
              <span>Average Prediction Confidence</span>
              <strong>
                {satisfactionStats.average_prediction_confidence}%
              </strong>
            </div>
          </div>
        ) : (
          !statsError && (
            <p className="feedback-loading">
              Loading satisfaction statistics...
            </p>
          )
        )}

        <p className="satisfaction-note">
          Note: Predictions estimate review sentiment using the
          trained machine learning model. They are not verified
          customer satisfaction measurements.
        </p>
      </section>

      {error && (
        <div className="feedback-alert feedback-error">
          {error}
        </div>
      )}

      {notice && (
        <div className="feedback-alert feedback-success">
          {notice}
        </div>
      )}

      {feedbackList.length === 0 ? (
        <div className="feedback-empty">
          <span>⭐</span>
          <h3>No customer feedback yet</h3>
          <p>Customer reviews will appear here.</p>
        </div>
      ) : (
        <div className="feedback-list">
          {feedbackList.map((feedback) => (
            <article
              className="feedback-card"
              key={feedback.id}
            >
              <div className="feedback-card-header">
                <div>
                  <h3>{feedback.customer_name}</h3>
                  <p>{feedback.customer_email}</p>
                </div>

                <span
                  className={
                    feedback.admin_reply
                      ? "feedback-status replied"
                      : "feedback-status pending"
                  }
                >
                  {feedback.admin_reply
                    ? "Replied"
                    : "Pending"}
                </span>
              </div>

              <div className="feedback-product">
                <strong>Product:</strong>{" "}
                {feedback.product_name || "Store Feedback"}
              </div>

              <div
                className="feedback-stars"
                aria-label={`${feedback.rating} out of 5 stars`}
              >
                {"★".repeat(feedback.rating)}
                {"☆".repeat(5 - feedback.rating)}
                <span>{feedback.rating}/5</span>
              </div>

              <div className="feedback-comment">
                <strong>Customer Review</strong>
                <p>{feedback.comment}</p>
              </div>

              {/* Individual ML Prediction */}
              <div className="feedback-prediction">
                <strong>ML Satisfaction Prediction</strong>

                <span
                  className={
                    feedback.satisfaction_prediction === "SATISFIED"
                      ? "prediction-badge prediction-positive"
                      : feedback.satisfaction_prediction === "NOT SATISFIED"
                      ? "prediction-badge prediction-negative"
                      : "prediction-badge prediction-unknown"
                  }
                >
                  {feedback.satisfaction_prediction || "Not Analyzed"}
                </span>

                {feedback.satisfaction_confidence !== null &&
                  feedback.satisfaction_confidence !== undefined && (
                    <small>
                      Prediction confidence:{" "}
                      {feedback.satisfaction_confidence}%
                    </small>
                  )}
              </div>

              <div className="feedback-date">
                Submitted: {formatDate(feedback.created_at)}
              </div>

              {feedback.admin_reply && (
                <div className="feedback-existing-reply">
                  <strong>Admin Reply</strong>
                  <p>{feedback.admin_reply}</p>

                  {feedback.replied_at && (
                    <small>
                      Replied: {formatDate(feedback.replied_at)}
                    </small>
                  )}
                </div>
              )}

              <div className="feedback-reply-box">
                <label htmlFor={`reply-${feedback.id}`}>
                  {feedback.admin_reply
                    ? "Update Admin Reply"
                    : "Write Admin Reply"}
                </label>

                <textarea
                  id={`reply-${feedback.id}`}
                  rows="3"
                  maxLength="2000"
                  placeholder="Write your response to the customer..."
                  value={replyTexts[feedback.id] || ""}
                  onChange={(event) =>
                    setReplyTexts((current) => ({
                      ...current,
                      [feedback.id]: event.target.value,
                    }))
                  }
                />

                <button
                  type="button"
                  disabled={replyLoading === feedback.id}
                  onClick={() => sendReply(feedback)}
                >
                  {replyLoading === feedback.id
                    ? "Saving..."
                    : feedback.admin_reply
                    ? "Update Reply"
                    : "Send Reply"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}