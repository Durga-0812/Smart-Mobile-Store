import React from "react";
import "./HeroSection.css";

export default function HeroSection({ fullName }) {
  return (
    <section className="home-hero" id="home">
      <div className="home-hero-text">
        <p className="home-welcome">
          {fullName ? `Welcome back, ${fullName}` : "Welcome to TechLite"}
        </p>

        <h1>
          Find Your <span>Perfect Mobile</span>
        </h1>

        <p>
          Discover the latest smartphones and premium accessories at competitive prices.
          Experience trusted quality, exceptional value, and a seamless shopping experience with TechLite.
        </p>

        <a href="#mobiles" className="shop-btn">
          Shop Now
        </a>
      </div>

      <div className="hero-phone" aria-hidden="true">
        <div className="hero-device hero-device-back">
          <span className="hero-camera-module">
            <i />
            <i />
            <i />
            <b />
          </span>
        </div>
        <div className="hero-device hero-device-front">
          <span className="hero-screen-notch" />
        </div>
      </div>
    </section>
  );
}
