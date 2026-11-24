import React, { useEffect, useState } from "react";
import "./CustomerFeedback.css";

const API_URL = "/api/v1/feedback";

export default function CustomerFeedback({
  isAuthenticated,
  onLoginClick,
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  const loadFeedback = async () => {
    if (!isAuthenticated || !token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load your feedback.");
      }

      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [isAuthenticated]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      onLoginClick?.();
      return;
    }

    if (comment.trim().length < 5) {
      setError("Please enter at least 5 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          product_id: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Feedback submission failed.");
      }

      setMessage("Thank you! Your feedback was submitted successfully.");
      setComment("");
      setRating(5);

      await loadFeedback();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="customer-feedback" id="customer-feedback">
      <div className="feedback-heading">
        <span>WE VALUE YOUR OPINION</span>
        <h2>Share Your Experience</h2>
        <p>Your feedback helps us make TechLite better.</p>
      </div>

      {!isAuthenticated ? (
        <div className="feedback-login">
          <p>Please log in to share your shopping experience.</p>
          <button type="button" onClick={onLoginClick}>
            Login to Give Feedback
          </button>
        </div>
      ) : (
        <>
          <form className="feedback-form" onSubmit={handleSubmit}>
            <label>How was your experience?</label>

            <div className="feedback-stars" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= rating ? "active" : ""}
                  onClick={() => setRating(star)}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  aria-pressed={rating === star}
                >
                  ★
                </button>
              ))}
            </div>

            <label htmlFor="feedback-comment">
              Your feedback or suggestions
            </label>

            <textarea
              id="feedback-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell us about your TechLite experience..."
              minLength={5}
              maxLength={2000}
              rows={5}
              required
            />

            <div className="feedback-character-count">
              {comment.length}/2000
            </div>

            <button
              className="feedback-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>

          {message && <p className="feedback-success">{message}</p>}
          {error && <p className="feedback-error" role="alert">{error}</p>}

          <div className="my-feedback">
            <h3>My Feedback</h3>

            {loading ? (
              <p>Loading your feedback...</p>
            ) : feedbackList.length === 0 ? (
              <p>You haven't submitted any feedback yet.</p>
            ) : (
              feedbackList.map((item) => (
                <article className="feedback-item" key={item.id}>
                  <div className="feedback-item-top">
                    <span className="feedback-item-stars">
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)}
                    </span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <p>{item.comment}</p>

                  {item.admin_reply && (
                    <div className="feedback-admin-reply">
                      <strong>TechLite Admin Reply</strong>
                      <p>{item.admin_reply}</p>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}