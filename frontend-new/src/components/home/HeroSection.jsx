import React, { useEffect, useState } from "react";
import "./HeroSection.css";

const HERO_SLIDES = [
  {
    eyebrow: "TechLite Featured",
    title: "Find your perfect mobile",
    description:
      "Explore the latest smartphones, compare your favourites, and find the right device for you.",
    image:
      "https://www.cnet.com/wp-content/uploads/sites/2/b8a56cbc-bf6f-4d93-8b66-82c3e7196f6a.jpg",
    imageAlt: "Smartphone photographed on a clean desk",
    action: "Explore mobiles",
    category: "mobiles",
    theme: "mobile",
  },
  {
    eyebrow: "Work. Create. Play.",
    title: "Power up your productivity",
    description:
      "Discover laptops built for study, work, and everything you want to create.",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=3840&q=95",
    imageAlt: "Laptop displayed on a desk",
    action: "Shop laptops",
    category: "laptops",
    theme: "laptop",
  },
  {
    eyebrow: "Sound that moves with you",
    title: "Make every moment sound better",
    description:
      "Find earbuds and audio accessories for calls, commutes, and your favourite music.",
    image:
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=3840&q=95",
    imageAlt: "Wireless earbuds",
    action: "Explore earbuds",
    category: "earbuds",
    theme: "audio",
  },
  {
    eyebrow: "Everyday essentials",
    title: "The details make the difference",
    description:
      "Complete your setup with practical accessories made for everyday use.",
    image:
      "https://www.cnet.com/wp-content/uploads/sites/2/teen-gifts-1.jpg?resize=768,432",
    imageAlt: "Everyday technology accessories arranged together",
    action: "Shop accessories",
    category: "accessories",
    theme: "essentials",
  },
  {
    eyebrow: "Stay in sync",
    title: "A smarter way to keep moving",
    description:
      "Explore smart watches that keep your everyday essentials close at hand.",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=3840&q=95",
    imageAlt: "Modern smartwatch photographed close up",
    action: "Shop smart watches",
    category: "smartwatches",
    theme: "watch",
  },
  {
    eyebrow: "Power, wherever you go",
    title: "Stay charged through the day",
    description:
      "Find reliable charging essentials for your phone, laptop, and daily carry.",
    image:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=3840&q=95",
    imageAlt: "Modern phone charging accessory",
    action: "Shop chargers",
    category: "chargers",
    theme: "power",
  },
];

export default function HeroSection({ fullName, onCategorySelect }) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const goToSlide = (index) => {
    setActiveSlide((index + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleTouchStart = (event) => {
    event.currentTarget.dataset.touchStartX = String(
      event.touches[0].clientX
    );
  };

  const handleTouchEnd = (event) => {
    const startX = Number(event.currentTarget.dataset.touchStartX);
    const distance = event.changedTouches[0].clientX - startX;
    if (Math.abs(distance) < 45) return;
    goToSlide(activeSlide + (distance < 0 ? 1 : -1));
  };

  const slide = HERO_SLIDES[activeSlide];

  return (
    <section
      className="home-hero"
      id="home"
      aria-label="Featured products"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`hero-slide hero-slide-${slide.theme}`}
        key={slide.theme}
        aria-live="polite"
      >
        <div className="hero-slide-copy">
          <p className="home-welcome">
            {fullName
              ? `Welcome back, ${fullName.split(" ")[0]}`
              : slide.eyebrow}
          </p>
          <h1>{slide.title}</h1>
          <p className="hero-slide-description">{slide.description}</p>
          <button
            type="button"
            className="shop-btn"
            onClick={() => onCategorySelect?.(slide.category)}
          >
            {slide.action}
          </button>
        </div>

        <div className="hero-slide-image">
          <img src={slide.image} alt={slide.imageAlt} />
          <span className="hero-image-caption">{slide.eyebrow}</span>
        </div>
      </div>

      <button
        type="button"
        className="hero-arrow hero-arrow-previous"
        onClick={() => goToSlide(activeSlide - 1)}
        aria-label="Previous banner"
      >
        ‹
      </button>
      <button
        type="button"
        className="hero-arrow hero-arrow-next"
        onClick={() => goToSlide(activeSlide + 1)}
        aria-label="Next banner"
      >
        ›
      </button>

      <div className="hero-dots" aria-label="Choose banner">
        {HERO_SLIDES.map((item, index) => (
          <button
            type="button"
            key={item.theme}
            className={index === activeSlide ? "active" : ""}
            onClick={() => goToSlide(index)}
            aria-label={`Show banner ${index + 1}: ${item.title}`}
            aria-current={index === activeSlide ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
