import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const content = {
  en: {
    title: "Buyer Offers",
    subtitle: "View and manage purchase offers received from registered buyers.",
    noOffers: "No buyer offers received yet.",
    noOffersDesc: "Offers will appear here when buyers express interest in your listed crops.",
    buyer: "Buyer:",
    crop: "Crop:",
    offeredQty: "Offered Quantity:",
    offeredPrice: "Offered Price:",
    message: "Message:",
    date: "Received Date:",
    status: "Status:",
    acceptBtn: "Accept Offer",
    rejectBtn: "Reject Offer",
    createTxBtn: "📦 Create Transaction",
    viewTxBtn: "📦 View Transaction",
    acceptConfirm: "Accept this buyer's offer?",
    rejectConfirm: "Reject this buyer's offer?",
    createTxConfirm: "Create a transaction for this accepted offer?",
    acceptSuccess: "Offer accepted successfully.",
    rejectSuccess: "Offer rejected.",
    pending: "⏳ Pending",
    accepted: "✅ Accepted",
    rejected: "❌ Rejected",
    cancelled: "⚪ Cancelled",
    backBtn: "← Back to Dashboard",
    errorMsg: "Failed to load offers"
  },
  hi: {
    title: "खरीदारों के ऑफर",
    subtitle: "पंजीकृत खरीदारों से मिले खरीद ऑफर देखें और प्रबंधित करें।",
    noOffers: "अभी तक कोई खरीदार ऑफर नहीं मिला है।",
    noOffersDesc: "जब खरीदार आपकी सूचीबद्ध फसलों में रुचि दिखाएंगे, तो ऑफर यहां दिखाई देंगे।",
    buyer: "खरीदार:",
    crop: "फसल:",
    offeredQty: "ऑफर मात्रा:",
    offeredPrice: "ऑफर कीमत:",
    message: "संदेश:",
    date: "प्राप्ति तिथि:",
    status: "स्थिति:",
    acceptBtn: "स्वीकार करें",
    rejectBtn: "अस्वीकार करें",
    createTxBtn: "📦 सौदा / लेनदेन बनाएं",
    viewTxBtn: "📦 सौदा देखें",
    acceptConfirm: "क्या आप इस खरीदार के ऑफर को स्वीकार करना चाहते हैं?",
    rejectConfirm: "क्या आप इस खरीदार के ऑफर को अस्वीकार करना चाहते हैं?",
    createTxConfirm: "क्या आप इस स्वीकृत ऑफर के लिए सौदा / लेनदेन बनाना चाहते हैं?",
    acceptSuccess: "ऑफर सफलतापूर्वक स्वीकार कर लिया गया।",
    rejectSuccess: "ऑफर अस्वीकार कर दिया गया।",
    pending: "⏳ लंबित",
    accepted: "✅ स्वीकार किया गया",
    rejected: "❌ अस्वीकार किया गया",
    cancelled: "⚪ रद्द किया गया",
    backBtn: "← डैशबोर्ड पर वापस जाएं",
    errorMsg: "ऑफर लोड करने में विफल"
  }
};

function FarmerOffers() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("farmerLang") || "en");
  const t = content[lang];

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    fetchReceivedOffers();
  }, []);

  const fetchReceivedOffers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch("http://localhost:5000/api/offers/received", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || t.errorMsg);
      }

      setOffers(data.offers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId) => {
    if (!window.confirm(t.acceptConfirm)) return;

    setActionId(offerId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch(`http://localhost:5000/api/offers/${offerId}/accept`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to accept offer");
      }

      alert(t.acceptSuccess);
      fetchReceivedOffers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (offerId) => {
    if (!window.confirm(t.rejectConfirm)) return;

    setActionId(offerId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch(`http://localhost:5000/api/offers/${offerId}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reject offer");
      }

      alert(t.rejectSuccess);
      fetchReceivedOffers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleCreateTransaction = async (offerId) => {
    if (!window.confirm(t.createTxConfirm)) return;

    setActionId(offerId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch(`http://localhost:5000/api/transactions/from-offer/${offerId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.transactionId) {
          navigate(`/farmer/transactions/${data.transactionId}`);
          return;
        }
        throw new Error(data.message || "Failed to create transaction");
      }

      navigate(`/farmer/transactions/${data.transaction._id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const renderStatus = (status) => {
    if (status === "accepted") return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>{t.accepted}</span>;
    if (status === "rejected") return <span style={{ background: '#ffebee', color: '#c62828', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>{t.rejected}</span>;
    if (status === "cancelled") return <span style={{ background: '#f5f5f5', color: '#616161', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>{t.cancelled}</span>;
    return <span style={{ background: '#fff3e0', color: '#e65100', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>{t.pending}</span>;
  };

  if (loading) return <div className="auth-page">Loading offers...</div>;

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "900px", padding: "30px 20px" }}>
        
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
          <h1 style={{ fontSize: '28px', color: '#1c3821', margin: '0 0 5px' }}>🤝 {t.title}</h1>
          <p style={{ color: '#666', margin: 0 }}>{t.subtitle}</p>
        </div>

        {error && <div className="error-box" style={{ marginBottom: '20px' }}>{error}</div>}

        {offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '16px', border: '1px solid #e0e8de' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🤝</div>
            <h3>{t.noOffers}</h3>
            <p style={{ color: '#666' }}>{t.noOffersDesc}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {offers.map(offer => (
              <div key={offer._id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e0e8de', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '22px', color: '#1c3821' }}>
                    🤝 Buyer Offer
                  </h3>
                  {renderStatus(offer.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>{t.buyer}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1c3821' }}>
                      👤 {offer.buyer?.name || "Buyer"}
                    </div>
                    {offer.buyer?.businessName && <div style={{ fontSize: '12px', color: '#666' }}>🏬 {offer.buyer.businessName} ({offer.buyer.businessType || 'Trader'})</div>}
                    {offer.buyer?.phone && <div style={{ fontSize: '12px', color: '#666' }}>📞 {offer.buyer.phone}</div>}
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>{t.crop}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>🌾 {offer.crop?.cropName || "Crop"}</div>
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>{t.offeredQty}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{offer.quantity} {offer.crop?.unit || "quintal"}</div>
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>{t.offeredPrice}</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#27ae60' }}>
                      ₹{offer.offeredPrice} / {offer.crop?.unit || "quintal"}
                    </div>
                  </div>
                </div>

                {offer.message && (
                  <div style={{ padding: '12px 16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee', marginBottom: '15px', fontSize: '14px' }}>
                    <strong>{t.message}</strong> "{offer.message}"
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    📅 {t.date} {new Date(offer.createdAt).toLocaleDateString()}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => navigate(`/chat?recipientId=${offer.buyer?._id || offer.buyer}&cropId=${offer.crop?._id || offer.crop}&offerId=${offer._id}`)}
                      style={{ padding: '10px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      💬 Chat with Buyer
                    </button>

                    {offer.status === "pending" && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleReject(offer._id)}
                          disabled={actionId === offer._id}
                          style={{ padding: '10px 20px', background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                        >
                          {t.rejectBtn}
                        </button>
                        <button
                          onClick={() => handleAccept(offer._id)}
                          disabled={actionId === offer._id}
                          style={{ padding: '10px 24px', background: '#27ae60', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                        >
                          {t.acceptBtn}
                        </button>
                      </div>
                    )}

                    {offer.status === "accepted" && (
                      <button
                        onClick={() => handleCreateTransaction(offer._id)}
                        disabled={actionId === offer._id}
                        style={{ padding: '10px 24px', background: '#1976d2', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                      >
                        {t.createTxBtn}
                      </button>
                    )}
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default FarmerOffers;
