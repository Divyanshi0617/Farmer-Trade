import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function BuyerOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchMyOffers();
  }, []);

  const fetchMyOffers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch("http://localhost:5000/api/offers/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load offers");
      }

      setOffers(data.offers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to cancel this pending offer?")) return;

    setCancellingId(offerId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch(`http://localhost:5000/api/offers/${offerId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cancel offer");
      }

      alert("Offer cancelled successfully.");
      fetchMyOffers();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "accepted") return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>✅ Accepted</span>;
    if (status === "rejected") return <span style={{ background: '#ffebee', color: '#c62828', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>❌ Rejected</span>;
    if (status === "cancelled") return <span style={{ background: '#f5f5f5', color: '#616161', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>⚪ Cancelled</span>;
    return <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>⏳ Pending</span>;
  };

  if (loading) return <div className="auth-page">Loading offers...</div>;

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "900px", padding: "30px 20px" }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link to="/buyer/dashboard" className="back-button" style={{ margin: 0 }}>
            ← Back to Dashboard
          </Link>
          <button onClick={() => navigate("/buyer/marketplace")} className="auth-submit" style={{ width: 'auto', padding: '8px 18px', margin: 0 }}>
            + Find More Crops
          </button>
        </div>

        <div className="section-heading-small" style={{ marginBottom: '25px' }}>
          <h1 style={{ fontSize: '28px', color: '#1c3821', margin: '0 0 5px' }}>📨 My Sent Offers</h1>
          <p style={{ color: '#666', margin: 0 }}>Track status of offers sent to farmers.</p>
        </div>

        {error && <div className="error-box" style={{ marginBottom: '20px' }}>{error}</div>}

        {offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '16px', border: '1px solid #e0e8de' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📨</div>
            <h3>No offers sent yet</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>Browse the marketplace to find available crops and make offers to farmers.</p>
            <button onClick={() => navigate("/buyer/marketplace")} className="auth-submit" style={{ width: 'auto', padding: '10px 20px' }}>
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {offers.map(offer => (
              <div key={offer._id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e0e8de', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#1c3821' }}>
                    🌾 {offer.crop?.cropName || "Crop"}
                  </h3>
                  {getStatusBadge(offer.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>Offered Quantity</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{offer.quantity} {offer.crop?.unit || "quintal"}</div>
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>Offered Price</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>₹{offer.offeredPrice} / {offer.crop?.unit || "quintal"}</div>
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>Farmer</div>
                    <div style={{ fontSize: '15px', fontWeight: '500' }}>👤 {offer.farmer?.name || "Farmer"}</div>
                    {offer.farmer?.location && <div style={{ fontSize: '12px', color: '#666' }}>📍 {offer.farmer.location.district}, {offer.farmer.location.state}</div>}
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>Offer Date</div>
                    <div style={{ fontSize: '14px' }}>{new Date(offer.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {offer.message && (
                  <div style={{ padding: '10px 14px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee', marginBottom: '15px', fontSize: '14px' }}>
                    <strong>Message:</strong> {offer.message}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                  <button
                    onClick={() => navigate(`/chat?recipientId=${offer.farmer?._id || offer.farmer}&cropId=${offer.crop?._id || offer.crop}&offerId=${offer._id}`)}
                    style={{ padding: '8px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    💬 Chat with Farmer
                  </button>

                  {offer.status === "pending" && (
                    <button
                      onClick={() => handleCancelOffer(offer._id)}
                      disabled={cancellingId === offer._id}
                      style={{ padding: '8px 18px', background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      {cancellingId === offer._id ? "Cancelling..." : "Cancel Offer"}
                    </button>
                  )}
                </div>


              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default BuyerOffers;
