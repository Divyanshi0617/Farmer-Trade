import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

function BuyerCropDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Offer form state
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerQuantity, setOfferQuantity] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [offerError, setOfferError] = useState("");

  useEffect(() => {
    fetchCropDetails();
  }, [id]);

  const fetchCropDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/marketplace/crops/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Crop not found");
      }
      setCrop(data.crop);
      setOfferQuantity(data.crop.quantity);
      setOfferedPrice(data.crop.expectedPrice);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeOfferSubmit = async (e) => {
    e.preventDefault();
    setOfferError("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch("http://localhost:5000/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cropId: id,
          quantity: Number(offerQuantity),
          offeredPrice: Number(offeredPrice),
          message: offerMessage
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit offer");
      }

      alert("Offer submitted successfully!");
      navigate("/buyer/offers");
    } catch (err) {
      setOfferError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="auth-page">Loading crop details...</div>;

  if (error || !crop) return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "600px", padding: "40px 20px" }}>
        <Link to="/buyer/marketplace" className="back-button">← Back to Marketplace</Link>
        <div className="error-box" style={{ marginTop: '20px' }}>{error || "Crop not found"}</div>
      </main>
    </div>
  );

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "800px", padding: "30px 20px" }}>
        
        <Link to="/buyer/marketplace" className="back-button" style={{ display: 'inline-block', marginBottom: '20px' }}>
          ← Back to Marketplace
        </Link>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e0e8de', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#1c3821' }}>🌾 {crop.cropName}</h1>
              {crop.cropType && <span style={{ color: '#666', fontSize: '14px' }}>Type: {crop.cropType}</span>}
            </div>
            <div style={{ padding: '8px 16px', borderRadius: '20px', background: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }}>
              {crop.status.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div>
              <div style={{ color: '#777', fontSize: '13px' }}>Available Quantity</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{crop.quantity} {crop.unit}</div>
            </div>

            <div>
              <div style={{ color: '#777', fontSize: '13px' }}>Expected Price</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>₹{crop.expectedPrice} / {crop.unit}</div>
            </div>

            <div>
              <div style={{ color: '#777', fontSize: '13px' }}>Location</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {crop.village ? `${crop.village}, ` : ''}{crop.district}, {crop.state}
              </div>
            </div>

            <div>
              <div style={{ color: '#777', fontSize: '13px' }}>Listed By Farmer</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1c3821' }}>
                👤 {crop.farmer?.name || "Farmer"}
              </div>
            </div>

            {crop.harvestDate && (
              <div>
                <div style={{ color: '#777', fontSize: '13px' }}>Harvest Date</div>
                <div style={{ fontSize: '16px' }}>{new Date(crop.harvestDate).toLocaleDateString()}</div>
              </div>
            )}
          </div>

          {crop.description && (
            <div style={{ marginBottom: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #eee' }}>
              <div style={{ color: '#777', fontSize: '13px', marginBottom: '5px' }}>Farmer Description</div>
              <div style={{ fontSize: '15px', lineHeight: '1.5' }}>{crop.description}</div>
            </div>
          )}

          {/* MAKE OFFER & CHAT ACTIONS */}
          {!showOfferForm ? (
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                onClick={() => navigate(`/chat?recipientId=${crop.farmer?._id || crop.farmer}&cropId=${crop._id}`)}
                className="auth-submit"
                style={{ flex: 1, margin: 0, padding: '15px', fontSize: '16px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                💬 Chat with Farmer
              </button>
              <button
                onClick={() => setShowOfferForm(true)}
                className="auth-submit"
                style={{ flex: 1, margin: 0, padding: '15px', fontSize: '16px', background: '#27ae60' }}
              >
                🤝 Make an Offer
              </button>
            </div>
          ) : (

            <form onSubmit={handleMakeOfferSubmit} style={{ background: '#f1f8f1', border: '1px solid #c8e6c9', borderRadius: '12px', padding: '25px', marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 15px', color: '#1c3821' }}>Send Offer to {crop.farmer?.name || "Farmer"}</h3>

              {offerError && <div className="error-box" style={{ marginBottom: '15px' }}>{offerError}</div>}

              <div className="two-inputs">
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                    Offered Quantity ({crop.unit}) *
                  </label>
                  <input
                    type="number"
                    value={offerQuantity}
                    onChange={(e) => setOfferQuantity(e.target.value)}
                    max={crop.quantity}
                    min="0.1"
                    step="any"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                  <small style={{ color: '#666' }}>Max: {crop.quantity} {crop.unit}</small>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                    Offered Price (₹ / {crop.unit}) *
                  </label>
                  <input
                    type="number"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    min="0"
                    step="any"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                  Message to Farmer (Optional)
                </label>
                <textarea
                  rows="3"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="e.g. Ready for prompt pickup at Ludhiana mandi."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'inherit' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowOfferForm(false)}
                  style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="auth-submit"
                  style={{ flex: 2, margin: 0, padding: '12px', background: '#27ae60' }}
                >
                  {submitting ? "Submitting Offer..." : "Submit Offer"}
                </button>
              </div>

            </form>
          )}

        </div>

      </main>
    </div>
  );
}

export default BuyerCropDetails;
