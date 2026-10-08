import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const content = {
  en: {
    title: "My Crops",
    addBtn: "Add Crop",
    noCrops: "No crops added yet.",
    noCropsDesc: "Add your first crop to start finding buyers.",
    expected: "Expected:",
    status: "Status:",
    view: "View",
    edit: "Edit",
    available: "🟢 Available",
    sold: "🔵 Sold",
    inactive: "⚪ Inactive",
    errorMsg: "Failed to load crops"
  },
  hi: {
    title: "मेरी फसल",
    addBtn: "फसल जोड़ें",
    noCrops: "कोई फसल नहीं जोड़ी गई।",
    noCropsDesc: "खरीदार खोजने के लिए अपनी पहली फसल जोड़ें।",
    expected: "अपेक्षित:",
    status: "स्थिति:",
    view: "देखें",
    edit: "बदलें",
    available: "🟢 उपलब्ध",
    sold: "🔵 बिक गई",
    inactive: "⚪ निष्क्रिय",
    errorMsg: "फसल लोड करने में विफल"
  }
};

function FarmerCrops() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const lang = localStorage.getItem("farmerLang") || "en";
  const t = content[lang];

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const response = await fetch("http://localhost:5000/api/crops/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || t.errorMsg);
      }
      setCrops(data.crops);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    if (status === "sold") return t.sold;
    if (status === "inactive") return t.inactive;
    return t.available;
  };

  if (loading) return <div className="auth-page">Loading...</div>;

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "800px", padding: "40px 20px" }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link to="/farmer/dashboard" className="back-button" style={{ display: 'inline-block' }}>
            ← Back
          </Link>
          <button onClick={() => navigate("/farmer/crops/add")} className="auth-submit" style={{ width: 'auto', padding: '10px 20px', margin: 0 }}>
            + {t.addBtn}
          </button>
        </div>

        <div className="section-heading-small">
          <h2>{t.title}</h2>
        </div>

        {error && <div className="error-box">{error}</div>}

        {crops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', border: '1px solid #eee' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🌾</div>
            <h3>{t.noCrops}</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>{t.noCropsDesc}</p>
            <button onClick={() => navigate("/farmer/crops/add")} className="auth-submit" style={{ width: 'auto', padding: '10px 20px' }}>
              + {t.addBtn}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {crops.map(crop => (
              <div key={crop._id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #eee', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>🌾 {crop.cropName}</h3>
                  <strong style={{ fontSize: '18px' }}>{crop.quantity} {crop.unit}</strong>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div>
                    <div style={{ color: '#666', fontSize: '14px' }}>{t.expected}</div>
                    <div style={{ fontWeight: '600' }}>₹{crop.expectedPrice} / {crop.unit}</div>
                  </div>
                  
                  <div>
                    <div style={{ color: '#666', fontSize: '14px' }}>📍 Location</div>
                    <div style={{ fontWeight: '600' }}>{crop.district}, {crop.state}</div>
                  </div>
                  
                  <div>
                    <div style={{ color: '#666', fontSize: '14px' }}>{t.status}</div>
                    <div style={{ fontWeight: '600' }}>{renderStatus(crop.status)}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => navigate(`/farmer/crops/${crop._id}`)} style={{ flex: 1, padding: '10px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {t.view}
                  </button>
                  <button onClick={() => navigate(`/farmer/crops/${crop._id}/edit`)} style={{ flex: 1, padding: '10px', background: '#e3f2fd', border: '1px solid #bbdefb', color: '#1976d2', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {t.edit}
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

export default FarmerCrops;
