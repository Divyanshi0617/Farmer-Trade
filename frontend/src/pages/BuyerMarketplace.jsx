import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function BuyerMarketplace() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [searchCrop, setSearchCrop] = useState("");
  const [searchState, setSearchState] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async (crop = searchCrop, state = searchState, dist = searchDistrict, price = maxPrice, kw = searchKeyword) => {
    setLoading(true);
    setError("");
    try {
      let query = [];
      if (crop.trim()) query.push(`crop=${encodeURIComponent(crop.trim())}`);
      if (state.trim()) query.push(`state=${encodeURIComponent(state.trim())}`);
      if (dist.trim()) query.push(`district=${encodeURIComponent(dist.trim())}`);
      if (price) query.push(`maxPrice=${encodeURIComponent(price)}`);
      if (kw.trim()) query.push(`search=${encodeURIComponent(kw.trim())}`);

      const queryString = query.length > 0 ? `?${query.join("&")}` : "";
      const res = await fetch(`http://localhost:5000/api/marketplace/crops${queryString}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load crops");
      }

      setCrops(data.crops || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCrops(searchCrop, searchState, searchDistrict, maxPrice, searchKeyword);
  };

  const handleReset = () => {
    setSearchCrop("");
    setSearchState("");
    setSearchDistrict("");
    setMaxPrice("");
    setSearchKeyword("");
    fetchCrops("", "", "", "", "");
  };

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "950px", padding: "30px 20px" }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link to="/buyer/dashboard" className="back-button" style={{ margin: 0 }}>
            ← Back to Dashboard
          </Link>
          <button onClick={() => navigate("/buyer/offers")} style={{ padding: '8px 16px', background: '#e3f2fd', color: '#1976d2', border: '1px solid #bbdefb', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            📨 My Sent Offers
          </button>
        </div>

        <div className="section-heading-small" style={{ marginBottom: '25px' }}>
          <h1 style={{ fontSize: '28px', color: '#1c3821', margin: '0 0 5px' }}>🔎 Find Crops</h1>
          <p style={{ color: '#666', margin: 0 }}>Browse available farmer crops and send direct purchase offers.</p>
        </div>

        {/* SEARCH & FILTER FORM */}
        <form onSubmit={handleSearch} style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e0e8de', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px', color: '#19351e', fontSize: '18px' }}>Filter Marketplace</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>Crop Name</label>
              <input
                type="text"
                placeholder="e.g. Wheat, Rice"
                value={searchCrop}
                onChange={(e) => setSearchCrop(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>State</label>
              <input
                type="text"
                placeholder="e.g. Punjab, Haryana"
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>District</label>
              <input
                type="text"
                placeholder="e.g. Ludhiana, Karnal"
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>Max Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 2600"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
              />
            </div>

          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="auth-submit" style={{ flex: 2, margin: 0, padding: '12px' }}>
              🔍 Search Crops
            </button>
            <button type="button" onClick={handleReset} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>
              🔄 Reset
            </button>
          </div>
        </form>

        {error && <div className="error-box" style={{ marginBottom: '20px' }}>{error}</div>}

        {/* CROP CARDS LIST */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>Loading available crops...</div>
        ) : crops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '16px', border: '1px solid #e0e8de' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🌾</div>
            <h3>No crops available matching your criteria</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>Try resetting your filters to view all available farmer crop listings.</p>
            <button onClick={handleReset} className="auth-submit" style={{ width: 'auto', padding: '10px 20px' }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {crops.map(c => (
              <div key={c._id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e0e8de', padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '22px', color: '#1c3821' }}>🌾 {c.cropName}</h3>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      🟢 Available
                    </span>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                      {c.quantity} {c.unit}
                    </div>
                    <div style={{ color: '#27ae60', fontSize: '16px', fontWeight: 'bold' }}>
                      Expected: ₹{c.expectedPrice} / {c.unit}
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                    <div>📍 Location: {c.district}, {c.state}</div>
                    {c.farmer?.name && <div>👤 Farmer: {c.farmer.name}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigate(`/chat?recipientId=${c.farmer?._id || c.farmer}&cropId=${c._id}`)}
                    className="auth-submit"
                    style={{ flex: '0 0 auto', margin: 0, padding: '10px 14px', background: '#2563eb', fontSize: '14px' }}
                    title="Direct Chat with Farmer"
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => navigate(`/buyer/crops/${c._id}`)}
                    className="auth-submit"
                    style={{ flex: 1, margin: 0, padding: '10px', background: '#327d3b', fontSize: '14px' }}
                  >
                    View & Offer →
                  </button>
                </div>


              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default BuyerMarketplace;
