import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function BuyerDeals() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDeal, setActiveDeal] = useState(null);

  useEffect(() => {
    fetchMyDeals();
  }, []);

  const fetchMyDeals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch("http://localhost:5000/api/transactions/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load deals");
      }

      setDeals(data.transactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    if (status === "completed") return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>🟢 Completed</span>;
    if (status === "confirmed") return <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>🔵 Confirmed</span>;
    if (status === "cancelled") return <span style={{ background: '#f5f5f5', color: '#616161', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>⚪ Cancelled</span>;
    return <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>🟡 Initiated</span>;
  };

  if (loading) return <div className="auth-page">Loading deals...</div>;

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "900px", padding: "30px 20px" }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link to="/buyer/dashboard" className="back-button" style={{ margin: 0 }}>
            ← Back to Dashboard
          </Link>
          <button onClick={() => navigate("/buyer/marketplace")} className="auth-submit" style={{ width: 'auto', padding: '8px 18px', margin: 0 }}>
            🔎 Find More Crops
          </button>
        </div>

        <div className="section-heading-small" style={{ marginBottom: '25px' }}>
          <h1 style={{ fontSize: '28px', color: '#1c3821', margin: '0 0 5px' }}>🤝 My Commercial Deals</h1>
          <p style={{ color: '#666', margin: 0 }}>Track confirmed transactions and deals with farmers.</p>
        </div>

        {error && <div className="error-box" style={{ marginBottom: '20px' }}>{error}</div>}

        {deals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '16px', border: '1px solid #e0e8de' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🤝</div>
            <h3>No commercial deals created yet</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>Deals are created when a farmer accepts your offer and initiates a commercial transaction.</p>
            <button onClick={() => navigate("/buyer/marketplace")} className="auth-submit" style={{ width: 'auto', padding: '10px 20px' }}>
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {deals.map(deal => (
              <div key={deal._id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e0e8de', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#1c3821' }}>
                    🌾 {deal.crop?.cropName || "Crop"}
                  </h3>
                  {renderStatus(deal.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>Farmer</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>👤 {deal.farmer?.name || "Farmer"}</div>
                    {deal.farmer?.location && <div style={{ fontSize: '12px', color: '#666' }}>📍 {deal.farmer.location.district}, {deal.farmer.location.state}</div>}
                    {deal.farmer?.phone && <div style={{ fontSize: '12px', color: '#666' }}>📞 {deal.farmer.phone}</div>}
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>Purchased Quantity</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{deal.quantity} {deal.crop?.unit || "quintal"}</div>
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>Agreed Price</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>₹{deal.agreedPrice} / {deal.crop?.unit || "quintal"}</div>
                  </div>

                  <div>
                    <div style={{ color: '#777', fontSize: '13px' }}>Gross Deal Amount</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>
                      ₹{deal.grossAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '12px', fontSize: '12px', color: '#888' }}>
                  <div>📅 Created: {new Date(deal.createdAt).toLocaleDateString()}</div>
                  <button
                    onClick={() => setActiveDeal(activeDeal?._id === deal._id ? null : deal)}
                    style={{ border: 'none', background: 'none', color: '#1976d2', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {activeDeal?._id === deal._id ? "Close Details" : "View Details"}
                  </button>
                </div>

                {/* EXPANDABLE DETAIL DRAWER */}
                {activeDeal?._id === deal._id && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc', fontSize: '13px', background: '#fafafa', padding: '15px', borderRadius: '10px' }}>
                    <div><strong>Transaction ID:</strong> {deal._id}</div>
                    <div><strong>Gross Sale Amount:</strong> ₹{deal.grossAmount.toLocaleString()}</div>
                    <div><strong>Costs (Handled by Farmer):</strong> ₹{deal.totalCosts.toLocaleString()}</div>
                    <div><strong>Farmer Net Realisation:</strong> ₹{deal.netRealisation.toLocaleString()}</div>
                    <div><strong>Status:</strong> {deal.status.toUpperCase()}</div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default BuyerDeals;
