import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const content = {
  en: {
    title: "My Transactions",
    subtitle: "Track commercial transactions, cost breakdowns, and Net Realisation for your crops.",
    noTx: "No transactions created yet.",
    noTxDesc: "Transactions are created when you accept a buyer's offer and initiate a commercial deal.",
    buyer: "Buyer:",
    crop: "Crop:",
    quantity: "Quantity:",
    agreedPrice: "Agreed Price:",
    grossAmount: "Gross Sale Amount:",
    totalCosts: "Costs:",
    netRealisation: "NET REALISATION:",
    status: "Status:",
    date: "Date:",
    viewDetailsBtn: "View Details & Costs →",
    backBtn: "← Back to Dashboard",
    errorMsg: "Failed to load transactions",
    initiated: "🟡 Initiated",
    confirmed: "🔵 Confirmed",
    completed: "🟢 Completed",
    cancelled: "⚪ Cancelled"
  },
  hi: {
    title: "मेरे सौदे / लेनदेन",
    subtitle: "अपनी फसलों के व्यावसायिक लेनदेन, लागत कटौती और शुद्ध कमाई (Net Realisation) ट्रैक करें।",
    noTx: "अभी तक कोई लेनदेन नहीं बनाया गया है।",
    noTxDesc: "जब आप किसी खरीदार के ऑफर को स्वीकार करते हैं और सौदा बनाते हैं तो लेनदेन यहां दिखाई देंगे।",
    buyer: "खरीदार:",
    crop: "फसल:",
    quantity: "मात्रा:",
    agreedPrice: "तय कीमत:",
    grossAmount: "कुल बिक्री राशि:",
    totalCosts: "लागत / खर्चे:",
    netRealisation: "शुद्ध कमाई (Net Realisation):",
    status: "स्थिति:",
    date: "तारीख:",
    viewDetailsBtn: "विवरण और लागत देखें →",
    backBtn: "← डैशबोर्ड पर वापस जाएं",
    errorMsg: "लेनदेन लोड करने में विफल",
    initiated: "🟡 शुरू किया गया",
    confirmed: "🔵 की पुष्टि की गई",
    completed: "🟢 पूरा हुआ",
    cancelled: "⚪ रद्द किया गया"
  }
};

function FarmerTransactions() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("farmerLang") || "en");
  const t = content[lang];

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch("http://localhost:5000/api/transactions/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || t.errorMsg);
      }

      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    if (status === "completed") return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>{t.completed}</span>;
    if (status === "confirmed") return <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>{t.confirmed}</span>;
    if (status === "cancelled") return <span style={{ background: '#f5f5f5', color: '#616161', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>{t.cancelled}</span>;
    return <span style={{ background: '#fff3e0', color: '#e65100', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>{t.initiated}</span>;
  };

  if (loading) return <div className="auth-page">Loading transactions...</div>;

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "950px", padding: "30px 20px" }}>
        
        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link to="/farmer/dashboard" className="back-button" style={{ margin: 0 }}>
            {t.backBtn}
          </Link>
          <button 
            onClick={() => {
              const newLang = lang === "en" ? "hi" : "en";
              setLang(newLang);
              localStorage.setItem("farmerLang", newLang);
            }} 
            style={{ padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🌐 {lang === "en" ? "हिंदी" : "English"}
          </button>
        </div>

        <div className="section-heading-small" style={{ marginBottom: '25px' }}>
          <h1 style={{ fontSize: '28px', color: '#1c3821', margin: '0 0 5px' }}>📦 {t.title}</h1>
          <p style={{ color: '#666', margin: 0 }}>{t.subtitle}</p>
        </div>

        {error && <div className="error-box" style={{ marginBottom: '20px' }}>{error}</div>}

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '16px', border: '1px solid #e0e8de' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
            <h3>{t.noTx}</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>{t.noTxDesc}</p>
            <button onClick={() => navigate("/farmer/offers")} className="auth-submit" style={{ width: 'auto', padding: '10px 20px' }}>
              View Received Buyer Offers
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {transactions.map(tx => (
              <div key={tx._id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e0e8de', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '22px', color: '#1c3821' }}>
                      🌾 {tx.crop?.cropName || "Crop"}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                      {t.buyer} 👤 {tx.buyer?.name || "Buyer"} {tx.buyer?.businessName ? `(${tx.buyer.businessName})` : ''}
                    </div>
                  </div>
                  {renderStatus(tx.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>{t.quantity}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{tx.quantity} {tx.crop?.unit || "quintal"}</div>
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>{t.agreedPrice}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>₹{tx.agreedPrice} / {tx.crop?.unit || "quintal"}</div>
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>{t.grossAmount}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>₹{tx.grossAmount.toLocaleString()}</div>
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>{t.totalCosts}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d32f2f' }}>₹{tx.totalCosts.toLocaleString()}</div>
                  </div>
                </div>

                {/* PROMINENT NET REALISATION DISPLAY */}
                <div style={{ background: '#f1f8f1', border: '1px solid #c8e6c9', borderRadius: '12px', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {t.netRealisation}
                    </span>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#1b5e20', margin: '2px 0 0' }}>
                      ₹{tx.netRealisation.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/farmer/transactions/${tx._id}`)}
                    className="auth-submit"
                    style={{ width: 'auto', margin: 0, padding: '10px 20px', background: '#27ae60' }}
                  >
                    {t.viewDetailsBtn}
                  </button>
                </div>

                <div style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>
                  📅 {t.date} {new Date(tx.createdAt).toLocaleDateString()}
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default FarmerTransactions;
