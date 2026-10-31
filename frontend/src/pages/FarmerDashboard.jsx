import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";


const content = {
  en: {
    home: "Home",
    myCrops: "My Crops",
    marketPrices: "Market Prices",
    buyerOffers: "Buyer Offers",
    mySales: "My Transactions",
    logistics: "My Logistics",
    storage: "My Storage",
    myProfile: "My Profile",
    help: "Help",
    language: "Language",
    logout: "Logout",
    greeting: "Good morning",
    farmerSuffix: "",
    addCrop: "Add My Crop",
    addCropDesc: "List a crop you want to sell.",
    checkPrices: "Check Market Prices",
    checkPricesDesc: "View current market prices.",
    seeOffers: "See Buyer Offers",
    seeOffersDesc: "View offers for your crops.",
    statsTitle: "QUICK VIEW",
    statsSubtitle: "Your Activity",
    completedSales: "Transactions",
    activeLogistics: "Active Logistics",
    activeStorage: "Stored Batches",
    helpTitle: "Need Help?",
    helpDesc: "Don't worry. Farmer Trade will guide you step-by-step.",
    helpBtn: "Get Help",
    langSwitch: "हिंदी"
  },
  hi: {
    home: "होम",
    myCrops: "मेरी फसल",
    marketPrices: "बाजार भाव",
    buyerOffers: "खरीदारों के ऑफर",
    mySales: "मेरे सौदे",
    logistics: "मेरा परिवहन",
    storage: "मेरा भंडारण",
    myProfile: "मेरी प्रोफाइल",
    help: "मदद",
    language: "भाषा",
    logout: "Logout",
    greeting: "नमस्ते",
    farmerSuffix: "जी",
    addCrop: "मेरी फसल जोड़ें",
    addCropDesc: "जो फसल आप बेचना चाहते हैं, उसकी जानकारी दें।",
    checkPrices: "आज का बाजार भाव देखें",
    checkPricesDesc: "अपनी फसल का आज का भाव देखें।",
    seeOffers: "खरीदारों के ऑफर देखें",
    seeOffersDesc: "आपकी फसल के लिए आए ऑफर देखें।",
    statsTitle: "QUICK VIEW",
    statsSubtitle: "आपकी जानकारी",
    completedSales: "कुल सौदे",
    activeLogistics: "परिवहन रिकॉर्ड",
    activeStorage: "भंडारण रिकॉर्ड",
    helpTitle: "कोई दिक्कत है?",
    helpDesc: "चिंता मत कीजिए। Farmer Trade आपको step-by-step मदद करेगा।",
    helpBtn: "मदद लें",
    langSwitch: "English"
  }
};

function FarmerDashboard() {
  const navigate = useNavigate();
  const { unreadCount } = useSocket();
  const [user, setUser] = useState({});
  const [lang, setLang] = useState(localStorage.getItem("farmerLang") || "en");
  const [cropCount, setCropCount] = useState(0);
  const [offerCount, setOfferCount] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [logisticsCount, setLogisticsCount] = useState(0);
  const [storageCount, setStorageCount] = useState(0);


  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("farmerLang", lang);
  }, [lang]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await fetch("http://localhost:5000/api/crops/my", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setCropCount(data.crops.length);
          }

          const offersRes = await fetch("http://localhost:5000/api/offers/received", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const offersData = await offersRes.json();
          if (offersRes.ok && offersData.success && Array.isArray(offersData.offers)) {
            const pendingCount = offersData.offers.filter(o => o.status === "pending").length;
            setOfferCount(pendingCount);
          }

          const txRes = await fetch("http://localhost:5000/api/transactions/my", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const txData = await txRes.json();
          if (txRes.ok && txData.success && Array.isArray(txData.transactions)) {
            setTxCount(txData.transactions.length);
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

  const toggleLanguage = () => {
    setLang(lang === "en" ? "hi" : "en");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const t = content[lang];

  return (
    <div className="farmer-dashboard">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          🌾 Farmer<span>Trade</span>
          <div style={{ fontSize: '11px', color: '#88a090', marginTop: '2px', fontWeight: '500' }}>by Shinobi Sync</div>
        </div>

        <nav>
          <button className="dashboard-nav active">
            🏠 <span>{t.home}</span>
          </button>

          <Link to="/farmer/crops" className="dashboard-nav" style={{ textDecoration: 'none' }}>
            🌾 <span>{t.myCrops}</span>
          </Link>

          <Link to="/farmer/market-prices" className="dashboard-nav" style={{ textDecoration: 'none' }}>
            📊 <span>{t.marketPrices}</span>
          </Link>

          <Link to="/farmer/offers" className="dashboard-nav" style={{ textDecoration: 'none' }}>
            🤝 <span>{t.buyerOffers}</span>
          </Link>

          <Link to="/farmer/transactions" className="dashboard-nav" style={{ textDecoration: 'none' }}>
            📦 <span>{t.mySales}</span>
          </Link>

          <Link to="/farmer/logistics" className="dashboard-nav" style={{ textDecoration: 'none' }}>
            🚛 <span>{t.logistics}</span>
          </Link>

          <Link to="/farmer/storage" className="dashboard-nav" style={{ textDecoration: 'none' }}>
            🏢 <span>{t.storage}</span>
          </Link>

          <Link to="/chat" className="dashboard-nav" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              💬 <span>{lang === "hi" ? "संदेश / चैट" : "Messages & Chat"}</span>
            </div>
            {unreadCount > 0 && (
              <span style={{ background: '#e11d48', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 'bold' }}>
                {unreadCount}
              </span>
            )}
          </Link>

          <Link to="/farmer/profile" className="dashboard-nav" style={{ textDecoration: 'none' }}>
            👤 <span>{t.myProfile}</span>
          </Link>
        </nav>


        <div className="dashboard-bottom">
          <button className="dashboard-nav" onClick={toggleLanguage}>
            🌐 <span>{t.language}: {t.langSwitch}</span>
          </button>

          <button className="dashboard-nav">
            ❓ <span>{t.help}</span>
          </button>

          <button className="dashboard-nav" onClick={logout}>
            🚪 <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p>{t.greeting} 👋</p>
            <h1>{user.name ? `${user.name} ${t.farmerSuffix}` : `Farmer ${t.farmerSuffix}`}</h1>
            {user.location && user.location.village && (
              <p style={{ margin: "5px 0 0", color: "#666" }}>
                📍 {user.location.village}, {user.location.district}, {user.location.state}
              </p>
            )}
          </div>

          <div className="profile-circle">
            {user.name ? user.name.charAt(0).toUpperCase() : "F"}
          </div>
        </header>

        {/* BIG ACTIONS */}
        <section className="big-actions">
          <button className="big-action" onClick={() => navigate("/farmer/crops/add")}>
            <div className="big-action-icon">🌾</div>
            <div>
              <h3>{t.addCrop}</h3>
              <p>{t.addCropDesc}</p>
            </div>
            <strong>→</strong>
          </button>

          <button className="big-action" onClick={() => navigate("/farmer/market-prices")}>
            <div className="big-action-icon blue">📊</div>
            <div>
              <h3>{t.checkPrices}</h3>
              <p>{t.checkPricesDesc}</p>
            </div>
            <strong>→</strong>
          </button>

          <button className="big-action" onClick={() => navigate("/farmer/offers")}>
            <div className="big-action-icon orange">🤝</div>
            <div>
              <h3>{t.seeOffers}</h3>
              <p>{t.seeOffersDesc}</p>
            </div>
            <strong>→</strong>
          </button>
        </section>

        {/* STATS */}
        <section className="activity-section">
          <div className="section-heading-small">
            <span>{t.statsTitle}</span>
            <h2>{t.statsSubtitle}</h2>
          </div>

          <div className="activity-grid">
            <div className="activity-card" onClick={() => navigate("/farmer/crops")} style={{ cursor: 'pointer' }}>
              <span>Listed Crops</span>
              <strong>{cropCount}</strong>
              <small>View & Manage</small>
            </div>

            <div className="activity-card" onClick={() => navigate("/farmer/offers")} style={{ cursor: 'pointer' }}>
              <span>Pending Buyer Offers</span>
              <strong>{offerCount}</strong>
              <small>Review & Accept</small>
            </div>

            <div className="activity-card" onClick={() => navigate("/farmer/transactions")} style={{ cursor: 'pointer' }}>
              <span>{t.completedSales}</span>
              <strong>{txCount}</strong>
              <small>Net Realisation</small>
            </div>

            <div className="activity-card" onClick={() => navigate("/farmer/logistics")} style={{ cursor: 'pointer' }}>
              <span>{t.activeLogistics}</span>
              <strong>{logisticsCount}</strong>
              <small>Transport Status</small>
            </div>

            <div className="activity-card" onClick={() => navigate("/farmer/storage")} style={{ cursor: 'pointer' }}>
              <span>{t.activeStorage}</span>
              <strong>{storageCount}</strong>
              <small>Warehouse Storage</small>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default FarmerDashboard;