import React, { useState } from 'react';
import "./home.css"

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="home">
      <header className="hero">
        <div className="hero-content">
          <h1>Welcome to SuiteFlow</h1>
          <p>Experience unparalleled comfort and elegance</p>
          <a href="/bookings" className="cta-button">Book Now</a>
        </div>
      </header>

      <section className="features">
        <h2>Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Luxury Rooms</h3>
            <p>Spacious rooms with modern amenities</p>
          </div>
          <div className="feature-card">
            <h3>Fine Dining</h3>
            <p>World-class restaurants and bars</p>
          </div>
          <div className="feature-card">
            <h3>Spa & Wellness</h3>
            <p>Premium spa and fitness facilities</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
