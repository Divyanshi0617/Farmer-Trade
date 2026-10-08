import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

const content = {
  en: {
    title: "Edit Crop",
    desc: "Update your crop details below.",
    cropName: "Crop Name",
    cropType: "Crop Type (Optional)",
    quantity: "Quantity",
    unit: "Unit",
    expectedPrice: "Expected Price (per unit)",
    harvestDate: "Harvest Date (Optional)",
    state: "State",
    district: "District",
    village: "Village / Area (Optional)",
    description: "Description (Optional)",
    status: "Status",
    saveBtn: "Save Crop",
    cancelBtn: "Cancel",
    saving: "Saving...",
    success: "Crop updated successfully.",
    errorForm: "Please fill all required fields correctly.",
    fetchError: "Failed to load crop"
  },
  hi: {
    title: "फसल बदलें",
    desc: "नीचे अपनी फसल का विवरण अपडेट करें।",
    cropName: "फसल का नाम",
    cropType: "फसल का प्रकार (वैकल्पिक)",
    quantity: "मात्रा",
    unit: "इकाई",
    expectedPrice: "अपेक्षित कीमत (प्रति इकाई)",
    harvestDate: "कटाई की तारीख (वैकल्पिक)",
    state: "राज्य",
    district: "ज़िला",
    village: "गाँव / क्षेत्र (वैकल्पिक)",
    description: "विवरण (वैकल्पिक)",
    status: "स्थिति",
    saveBtn: "फसल सेव करें",
    cancelBtn: "रद्द करें",
    saving: "सेव हो रहा है...",
    success: "फसल सफलतापूर्वक अपडेट हो गई।",
    errorForm: "कृपया सभी आवश्यक फ़ील्ड सही से भरें।",
    fetchError: "फसल लोड करने में विफल"
  }
};

function EditCrop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const lang = localStorage.getItem("farmerLang") || "en";
  const t = content[lang];

  const [form, setForm] = useState({
    cropName: "",
    cropType: "",
    quantity: "",
    unit: "",
    expectedPrice: "",
    harvestDate: "",
    state: "",
    district: "",
    village: "",
    description: "",
    status: "available"
  });

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
      
      const c = data.crop;
      setForm({
        cropName: c.cropName || "",
        cropType: c.cropType || "",
        quantity: c.quantity || "",
        unit: c.unit || "",
        expectedPrice: c.expectedPrice || "",
        harvestDate: c.harvestDate ? c.harvestDate.substring(0, 10) : "",
        state: c.state || "",
        district: c.district || "",
        village: c.village || "",
        description: c.description || "",
        status: c.status || "available"
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const response = await fetch(`http://localhost:5000/api/crops/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            ...form,
            quantity: Number(form.quantity),
            expectedPrice: Number(form.expectedPrice)
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || t.errorForm);
      }

      alert(t.success);
      navigate("/farmer/crops");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="auth-page">Loading...</div>;

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "600px", padding: "40px 20px" }}>
        
        <Link to="/farmer/crops" className="back-button" style={{ display: 'inline-block', marginBottom: '20px' }}>
          ← Back
        </Link>

        <div className="section-heading-small">
          <h2>{t.title}</h2>
          <p>{t.desc}</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSave} className="auth-box" style={{ width: '100%', padding: '30px' }}>
          
          <label>{t.cropName} *</label>
          <input type="text" name="cropName" value={form.cropName} onChange={handleChange} required />

          <label>{t.cropType}</label>
          <input type="text" name="cropType" value={form.cropType} onChange={handleChange} />

          <div className="two-inputs">
            <div>
              <label>{t.quantity} *</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} min="0.1" step="any" required />
            </div>
            <div>
              <label>{t.unit} *</label>
              <input type="text" name="unit" value={form.unit} onChange={handleChange} required />
            </div>
          </div>

          <label>{t.expectedPrice} *</label>
          <input type="number" name="expectedPrice" value={form.expectedPrice} onChange={handleChange} min="0" step="any" required />

          <label>{t.status} *</label>
          <select name="status" value={form.status} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px' }} required>
            <option value="available">Available (उपलब्ध)</option>
            <option value="sold">Sold (बिक गई)</option>
            <option value="inactive">Inactive (निष्क्रिय)</option>
          </select>

          <label>{t.harvestDate}</label>
          <input type="date" name="harvestDate" value={form.harvestDate} onChange={handleChange} />

          <div className="two-inputs">
            <div>
              <label>{t.state} *</label>
              <input type="text" name="state" value={form.state} onChange={handleChange} required />
            </div>
            <div>
              <label>{t.district} *</label>
              <input type="text" name="district" value={form.district} onChange={handleChange} required />
            </div>
          </div>

          <label>{t.village}</label>
          <input type="text" name="village" value={form.village} onChange={handleChange} />

          <label>{t.description}</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="3" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', fontFamily: 'inherit' }}></textarea>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button type="button" onClick={() => navigate("/farmer/crops")} style={{ flex: 1, padding: '12px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {t.cancelBtn}
            </button>
            <button type="submit" className="auth-submit" disabled={saving} style={{ flex: 1, margin: 0 }}>
              {saving ? t.saving : t.saveBtn}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}

export default EditCrop;
