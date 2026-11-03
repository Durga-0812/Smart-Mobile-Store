import React, { useState } from "react";
import "./ContactForm.css";

const API_URL = "http://localhost:8000/api/v1/messages/";

export default function ContactForm() {
const [formData, setFormData] = useState({
name: "",
email: "",
subject: "",
message: "",
});

const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState("");
const [error, setError] = useState("");

const handleChange = (event) => {
setFormData({
...formData,
[event.target.name]: event.target.value,
});
};

const handleSubmit = async (event) => {
event.preventDefault();


setLoading(true);
setSuccess("");
setError("");

try {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      Array.isArray(data.detail)
        ? data.detail.map((item) => item.msg).join(", ")
        : data.detail || "Unable to send your message."
    );
  }

  setSuccess("Your message has been sent successfully!");

  setFormData({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
} catch (err) {
  setError(err.message || "Something went wrong. Please try again.");
} finally {
  setLoading(false);
}


};

return ( <section className="contact-section" id="contact"> <div className="contact-container"> <div className="contact-heading"> <span>WE ARE HERE TO HELP</span> <h2>Contact Us</h2> <p>
Have a question about a product or order?
Send us a message and we'll get back to you. </p> </div>


    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-row">
        <div className="contact-field">
          <label htmlFor="contact-name">Your Name</label>
          <input
            id="contact-name"
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            minLength={2}
            maxLength={120}
            required
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">Email Address</label>
          <input
            id="contact-email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="contact-field">
        <label htmlFor="contact-subject">Subject</label>
        <input
          id="contact-subject"
          type="text"
          name="subject"
          placeholder="What is your question about?"
          value={formData.subject}
          onChange={handleChange}
          minLength={2}
          maxLength={200}
          required
        />
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">Your Message</label>
        <textarea
          id="contact-message"
          name="message"
          placeholder="Write your message here..."
          value={formData.message}
          onChange={handleChange}
          minLength={5}
          maxLength={2000}
          rows={5}
          required
        />
      </div>

      {success && (
        <p className="contact-success" role="status">
          {success}
        </p>
      )}

      {error && (
        <p className="contact-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="contact-submit"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  </div>
</section>


);
}

