import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* NAVBAR */}
      <header className="navbar">

        <div
          className="logo"
          onClick={() => navigate("/")}
        >
          <span>🌾</span>
          Farmer<span>Trade</span>
        </div>

        <nav>
          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button onClick={() => navigate("/market-prices")} style={{ border: 0, background: 'none', color: '#2e7d32', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            📊 Mandi Prices
          </button>

          <a href="#features">
            Features
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#about">
            About
          </a>

          <button
            onClick={() => {
              const btn = document.getElementById("chatbot-open-button") || document.querySelector(".chatbot-greeting-tooltip");
              btn?.click();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#eaf4e8",
              color: "#1e5e2e",
              padding: "6px 14px",
              borderRadius: "20px",
              fontWeight: "700",
              border: "1px solid #c7e0c4",
              cursor: "pointer",
              fontSize: "13px"
            }}
            title="Open FarmerDesk Agricultural AI Advisor"
          >
            ✨ AI Advisor
          </button>
        </nav>

        <div className="nav-actions">

          <button
            className="nav-login"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="nav-register"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>

        </div>

      </header>


      {/* HERO */}
      <section className="hero" id="home">

        <div className="hero-content">

          <div className="hero-badge">
            🌱 Simple. Transparent. Farmer First.
          </div>

          <h1>
            Better Markets,
            <br />
            <span>Better Opportunities.</span>
          </h1>

          <p>
            Farmer Trade helps farmers check market prices,
            find buyers and sell their crops with confidence.
          </p>

          <div className="hero-buttons">

            <button
              className="primary-button"
              onClick={() => navigate("/register")}
            >
              Get Started →
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              How It Works
            </button>

            <button
              className="secondary-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderColor: "#327d3b",
                color: "#1d5828",
                background: "#f0f8ee"
              }}
              onClick={() => {
                const btn = document.getElementById("chatbot-open-button") || document.querySelector(".chatbot-greeting-tooltip");
                btn?.click();
              }}
            >
              <span>🌾</span> Ask AI Advisor
            </button>

          </div>

          <div className="hero-stats">

            <div>
              <strong>10K+</strong>
              <span>Farmers</span>
            </div>

            <div>
              <strong>500+</strong>
              <span>Buyers</span>
            </div>

            <div>
              <strong>100+</strong>
              <span>Markets</span>
            </div>

          </div>

        </div>


        {/* HERO VISUAL */}
        <div className="hero-visual">

          <div
            className="market-card"
            onClick={() => navigate("/market-prices")}
            style={{ cursor: "pointer" }}
            title="Click to view live Mandi market prices"
          >

            <div className="market-card-top">
              <span>🌾</span>

              <div>
                <small>Today's Market Price</small>
                <h3>Wheat</h3>
              </div>
            </div>

            <div className="price">
              ₹2,450
              <small>/ Quintal</small>
            </div>

            <div className="price-up">
              ↑ 8.4% from yesterday
            </div>

            <div className="market-location">
              📍 Punjab Markets
            </div>

          </div>


          <div className="offer-card">

            <span>🤝</span>

            <div>
              <small>New Buyer Offer</small>
              <strong>₹2,520 / Quintal</strong>
              <em>✓ Verified Buyer</em>
            </div>

          </div>

        </div>

      </section>


      {/* FEATURES */}
      <section
        className="section"
        id="features"
      >

        <div className="section-title">

          <span>WHAT FARMER TRADE OFFERS</span>

          <h2>
            Everything you need,
            <br />
            in one simple place.
          </h2>

          <p>
            No complicated process. Just the important
            information and actions you need.
          </p>

        </div>


        <div className="feature-grid">

          <div className="feature-card">

            <div className="feature-icon">
              📊
            </div>

            <h3>
              Market Prices
            </h3>

            <p>
              See current crop prices and compare
              different markets.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              🤝
            </div>

            <h3>
              Find Buyers
            </h3>

            <p>
              Connect directly with verified buyers
              interested in your crops.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              💰
            </div>

            <h3>
              Compare Offers
            </h3>

            <p>
              See buyer offers clearly before
              deciding to sell.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              🔐
            </div>

            <h3>
              Safe & Transparent
            </h3>

            <p>
              Secure accounts and transparent
              transactions.
            </p>

          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}
      <section
        className="section how-section"
        id="how-it-works"
      >

        <div className="section-title">

          <span>HOW IT WORKS</span>

          <h2>
            Four simple steps.
          </h2>

          <p>
            Farmer Trade is designed for everyone,
            including first-time users.
          </p>

        </div>


        <div className="steps-grid">

          <div className="step-card">

            <div className="step-number">
              01
            </div>

            <div className="step-icon">
              👤
            </div>

            <h3>
              Create Account
            </h3>

            <p>
              Create your farmer account in a few
              simple steps.
            </p>

          </div>


          <div className="step-card">

            <div className="step-number">
              02
            </div>

            <div className="step-icon">
              🌾
            </div>

            <h3>
              Add Your Crop
            </h3>

            <p>
              Tell us what crop you want to sell
              and how much you have.
            </p>

          </div>


          <div className="step-card">

            <div className="step-number">
              03
            </div>

            <div className="step-icon">
              🤝
            </div>

            <h3>
              Receive Offers
            </h3>

            <p>
              Buyers can see your crop and
              send offers.
            </p>

          </div>


          <div className="step-card">

            <div className="step-number">
              04
            </div>

            <div className="step-icon">
              ✅
            </div>

            <h3>
              Sell With Confidence
            </h3>

            <p>
              Compare offers and choose what
              works for you.
            </p>

          </div>

        </div>

      </section>


      {/* ABOUT SECTION */}
      <section
        id="about"
        style={{
          background: "#ffffff",
          padding: "70px 24px",
          borderTop: "1px solid #e8eee6",
          borderBottom: "1px solid #e8eee6"
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              background: "#eaf4e8",
              color: "#1e5e2e",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "1px",
              padding: "6px 16px",
              borderRadius: "20px",
              marginBottom: "16px",
              textTransform: "uppercase"
            }}
          >
            About Farmer Trade
          </span>

          <h2
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#18361f",
              marginBottom: "24px",
              lineHeight: "1.3"
            }}
          >
            Empowering Farmers Through Technology & Transparency
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              fontSize: "17px",
              lineHeight: "1.7",
              color: "#475449",
              textAlign: "left",
              background: "#f9fbf9",
              padding: "36px",
              borderRadius: "16px",
              border: "1px solid #e2ede0",
              boxShadow: "0 6px 20px rgba(0,0,0,0.03)"
            }}
          >
            <p style={{ margin: 0 }}>
              Agriculture feeds our nation, yet farmers often struggle to receive the true value of their hard work.
            </p>

            <p style={{ margin: 0 }}>
              <strong>Farmer Trade</strong> is an AI-powered agricultural marketplace that connects farmers directly with buyers, providing market price insights, price comparisons, and better trading opportunities.
            </p>

            <p style={{ margin: 0 }}>
              By combining technology and transparency, we aim to bridge the gap between farmers and markets, making agricultural trading smarter, fairer, and more accessible.
            </p>

            <div
              style={{
                marginTop: "10px",
                padding: "16px 20px",
                background: "#eaf4e8",
                borderLeft: "4px solid #1e5e2e",
                borderRadius: "8px",
                color: "#18361f",
                fontWeight: "600",
                fontSize: "17px"
              }}
            >
              🌱 Our vision is simple: Every farmer deserves the opportunity to earn the true value of their hard work.
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">

        <div>

          <span>
            BUILT FOR FARMERS
          </span>

          <h2>
            Your crop.
            <br />
            Your choice.
            <br />
            Your market.
          </h2>

          <p>
            Start using Farmer Trade today.
          </p>

        </div>

        <button
          className="cta-button"
          onClick={() => navigate("/register")}
        >
          Create My Account →
        </button>

      </section>


      {/* FOOTER */}
      <footer>

        <div className="logo">
          🌾 Farmer<span>Trade</span> <small style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>— by Shinobi Sync</small>
        </div>

        <p>
          Connecting farmers with better market opportunities.
        </p>

        <button
          onClick={() => navigate("/login")}
        >
          Login
        </button>

      </footer>

    </div>
  );
}

export default Home;
