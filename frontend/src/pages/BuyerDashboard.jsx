import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

function BuyerDashboard() {
  const navigate = useNavigate();
  const { unreadCount } = useSocket();
  const user = JSON.parse(localStorage.getItem("user") || "{}");


  const [availableCropsCount, setAvailableCropsCount] = useState(0);
  const [offersSentCount, setOffersSentCount] = useState(0);
  const [acceptedOffersCount, setAcceptedOffersCount] = useState(0);
  const [logisticsCount, setLogisticsCount] = useState(0);
  const [storageCount, setStorageCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch available crops count
        const cropsRes = await fetch("http://localhost:5000/api/marketplace/crops");
        const cropsData = await cropsRes.json();
        if (cropsRes.ok && cropsData.success) {
          setAvailableCropsCount(cropsData.count || 0);
        }

        // Fetch my sent offers
        if (token) {
          const offersRes = await fetch("http://localhost:5000/api/offers/my", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const offersData = await offersRes.json();
          if (offersRes.ok && offersData.success && Array.isArray(offersData.offers)) {
            setOffersSentCount(offersData.offers.length);
            const accepted = offersData.offers.filter(o => o.status === "accepted").length;
            setAcceptedOffersCount(accepted);
          }

          // Fetch logistics stats
          const logRes = await fetch("http://localhost:5000/api/logistics/my", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const logData = await logRes.json();
          if (logRes.ok && logData.success && Array.isArray(logData.logistics)) {
            setLogisticsCount(logData.logistics.length);
          }

          // Fetch storage stats
          const storeRes = await fetch("http://localhost:5000/api/storage/my", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const storeData = await storeRes.json();
          if (storeRes.ok && storeData.success && Array.isArray(storeData.storage)) {
            setStorageCount(storeData.storage.length);
          }
        }
      } catch (e) { }
    };
    fetchStats();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="farmer-dashboard">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar" style={{ background: '#0e1c26' }}>
        <div className="dashboard-logo" style={{ color: '#ffffff' }}>
          🏪 Farmer<span>Trade</span>
          <div style={{ fontSize: '11px', color: '#7a96a8', marginTop: '2px', fontWeight: '500' }}>by Shinobi Sync</div>
        </div>

        <nav>
          <button className="dashboard-nav active">
            🏠 <span>Home</span>
          </button>

          <Link to="/buyer/marketplace" className="dashboard-nav" style={{ textDecoration: 'none', color: '#c2c7d0' }}>
            🔎 <span>Find Crops</span>
          </Link>

          <Link to="/buyer/offers" className="dashboard-nav" style={{ textDecoration: 'none', color: '#c2c7d0' }}>
            📨 <span>My Offers</span>
          </Link>

          <Link to="/buyer/deals" className="dashboard-nav" style={{ textDecoration: 'none', color: '#c2c7d0' }}>
            🤝 <span>My Deals</span>
          </Link>

          <Link to="/buyer/logistics" className="dashboard-nav" style={{ textDecoration: 'none', color: '#c2c7d0' }}>
            🚛 <span>My Logistics</span>
          </Link>

          <Link to="/buyer/storage" className="dashboard-nav" style={{ textDecoration: 'none', color: '#c2c7d0' }}>
            🏢 <span>My Storage</span>
          </Link>

          <Link to="/chat" className="dashboard-nav" style={{ textDecoration: 'none', color: '#c2c7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              💬 <span>Messages & Chat</span>
            </div>
            {unreadCount > 0 && (
              <span style={{ background: '#e11d48', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 'bold' }}>
                {unreadCount}
              </span>
            )}
          </Link>

          <Link to="/buyer/profile" className="dashboard-nav" style={{ textDecoration: 'none', color: '#c2c7d0' }}>
            👤 <span>My Profile</span>
          </Link>
        </nav>


        <div className="dashboard-bottom">
          <button className="dashboard-nav">
            ❓ <span>Help</span>
          </button>

          <button className="dashboard-nav" onClick={logout}>
            🚪 <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p>Welcome, 👋</p>
            <h1>{user.name ? user.name : "Buyer"}</h1>
            {user.businessName && (
              <p style={{ margin: "5px 0 0", color: "#666" }}>
                🏢 {user.businessName}
              </p>
            )}
          </div>

          <div className="profile-circle" style={{ background: '#2c3e50', color: 'white' }}>
            {user.name ? user.name.charAt(0).toUpperCase() : "B"}
          </div>
        </header>

        {/* BIG ACTIONS */}
        <section className="big-actions">
          <button className="big-action" onClick={() => navigate("/buyer/marketplace")} style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
            <div className="big-action-icon blue">🔎</div>
            <div>
              <h3 style={{ color: '#212529' }}>Find Crops</h3>
              <p>Search for crops available from farmers.</p>
            </div>
            <strong style={{ color: '#495057' }}>→</strong>
          </button>

          <button className="big-action" onClick={() => navigate("/buyer/offers")} style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
            <div className="big-action-icon orange">📨</div>
            <div>
              <h3 style={{ color: '#212529' }}>My Offers</h3>
              <p>View the offers you have sent to farmers.</p>
            </div>
            <strong style={{ color: '#495057' }}>→</strong>
          </button>

          <button className="big-action" onClick={() => navigate("/buyer/deals")} style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
            <div className="big-action-icon">🤝</div>
            <div>
              <h3 style={{ color: '#212529' }}>My Deals</h3>
              <p>View your completed & active deals.</p>
            </div>
            <strong style={{ color: '#495057' }}>→</strong>
          </button>
        </section>

        {/* STATS */}
        <section className="activity-section">
          <div className="section-heading-small">
            <span>QUICK VIEW</span>
            <h2>Dashboard Statistics</h2>
          </div>

          <div className="activity-grid">
            <div className="activity-card" style={{ background: '#f1f3f5', cursor: 'pointer' }} onClick={() => navigate("/buyer/marketplace")}>
              <span>🔎</span>
              <strong>{availableCropsCount}</strong>
              <p>Crops Available</p>
            </div>

            <div className="activity-card" style={{ background: '#f1f3f5', cursor: 'pointer' }} onClick={() => navigate("/buyer/offers")}>
              <span>📨</span>
              <strong>{offersSentCount}</strong>
              <p>Offers Sent</p>
            </div>

            <div className="activity-card" style={{ background: '#f1f3f5', cursor: 'pointer' }} onClick={() => navigate("/buyer/deals")}>
              <span>🤝</span>
              <strong>{acceptedOffersCount}</strong>
              <p>Offers Accepted</p>
            </div>

            <div className="activity-card" style={{ background: '#f1f3f5', cursor: 'pointer' }} onClick={() => navigate("/buyer/logistics")}>
              <span>🚛</span>
              <strong>{logisticsCount}</strong>
              <p>Active Logistics</p>
            </div>

            <div className="activity-card" style={{ background: '#f1f3f5', cursor: 'pointer' }} onClick={() => navigate("/buyer/storage")}>
              <span>🏢</span>
              <strong>{storageCount}</strong>
              <p>Active Storage</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BuyerDashboard;
