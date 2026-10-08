import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

const content = {
  en: {
    title: "Crop Details",
    cropName: "Crop Name",
    cropType: "Crop Type",
    quantity: "Quantity",
    expectedPrice: "Expected Price",
    harvestDate: "Harvest Date",
    location: "Location",
    description: "Description",
    status: "Status",
    created: "Listed On",
    editBtn: "Edit Crop",
    deleteBtn: "Delete Crop",
    confirmDelete: "Are you sure you want to delete this crop?",
    deleting: "Deleting...",
    deleteSuccess: "Crop deleted successfully.",
    fetchError: "Failed to load crop"
  },
  hi: {
    title: "फसल का विवरण",
    cropName: "फसल का नाम",
    cropType: "फसल का प्रकार",
    quantity: "मात्रा",
    expectedPrice: "अपेक्षित कीमत",
    harvestDate: "कटाई की तारीख",
    location: "स्थान",
    description: "विवरण",
    status: "स्थिति",
    created: "सूचीबद्ध किया गया",
    editBtn: "फसल बदलें",
    deleteBtn: "फसल हटाएं",
    confirmDelete: "क्या आप वाकई इस फसल को हटाना चाहते हैं?",
    deleting: "हटाया जा रहा है...",
    deleteSuccess: "फसल सफलतापूर्वक हटा दी गई।",
    fetchError: "फसल लोड करने में विफल"
  }
};

function CropDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const lang = localStorage.getItem("farmerLang") || "en";
  const t = content[lang];

  useEffect(() => {
    fetchCrop();
  }, [id]);

  const fetchCrop = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const response = await fetch(`http://localhost:5000/api/crops/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || t.fetchError);
      }
      
      setCrop(data.crop);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t.confirmDelete)) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const response = await fetch(`http://localhost:5000/api/crops/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete crop");
      }
      
      alert(t.deleteSuccess);
      navigate("/farmer/crops");
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="auth-page">Loading...</div>;

  if (error || !crop) return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "600px", padding: "40px 20px" }}>
        <Link to="/farmer/crops" className="back-button">← Back</Link>
        <div className="error-box" style={{ marginTop: '20px' }}>{error || "Crop not found"}</div>
      </main>
    </div>
  );

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "800px", padding: "40px 20px" }}>
        
        <Link to="/farmer/crops" className="back-button" style={{ display: 'inline-block', marginBottom: '20px' }}>
          ← Back
        </Link>

        <div className="section-heading-small">
          <h2>{t.title}</h2>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #eee', padding: '30px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>🌾 {crop.cropName}</h1>
            <div style={{ padding: '8px 16px', borderRadius: '20px', background: crop.status === 'available' ? '#e8f5e9' : '#f5f5f5', color: crop.status === 'available' ? '#2e7d32' : '#616161', fontWeight: 'bold' }}>
              {crop.status.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '25px', marginBottom: '30px' }}>
            
            <div>
              <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>{t.quantity}</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{crop.quantity} {crop.unit}</div>
            </div>

            <div>
              <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>{t.expectedPrice}</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#27ae60' }}>₹{crop.expectedPrice} / {crop.unit}</div>
            </div>

            <div>
              <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>{t.location}</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {crop.village ? `${crop.village}, ` : ''}{crop.district}, {crop.state}
              </div>
            </div>
            
            {crop.cropType && (
              <div>
                <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>{t.cropType}</div>
                <div style={{ fontSize: '16px' }}>{crop.cropType}</div>
              </div>
            )}
            
            {crop.harvestDate && (
              <div>
                <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>{t.harvestDate}</div>
                <div style={{ fontSize: '16px' }}>{new Date(crop.harvestDate).toLocaleDateString()}</div>
              </div>
            )}

            <div>
              <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>{t.created}</div>
              <div style={{ fontSize: '16px' }}>{new Date(crop.createdAt).toLocaleDateString()}</div>
            </div>

          </div>

          {crop.description && (
            <div style={{ marginBottom: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>{t.description}</div>
              <div style={{ fontSize: '16px', lineHeight: '1.5' }}>{crop.description}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button onClick={() => navigate(`/farmer/crops/${crop._id}/edit`)} className="auth-submit" style={{ flex: 1, margin: 0 }}>
              {t.editBtn}
            </button>
            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '12px', background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {deleting ? t.deleting : t.deleteBtn}
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}

export default CropDetails;
