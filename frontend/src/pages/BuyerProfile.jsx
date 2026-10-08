import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function BuyerProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    state: "",
    district: "",
    businessName: "",
    businessType: "",
    address: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Session expired");
      }
      setUser(data.user);
      setForm({
        name: data.user.name || "",
        phone: data.user.phone || "",
        state: data.user.location?.state || "",
        district: data.user.location?.district || "",
        businessName: data.user.businessName || "",
        businessType: data.user.businessType || "",
        address: data.user.address || "",
      });
    } catch (err) {
      setError("Your session has expired. Please login again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setTimeout(() => navigate("/login"), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }
      setSuccessMsg("Profile updated successfully.");
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="auth-page">Loading...</div>;

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "600px", padding: "40px 20px" }}>
        
        <Link to="/buyer/dashboard" className="back-button" style={{ display: 'inline-block', marginBottom: '20px' }}>
          ← Back to Dashboard
        </Link>

        <div className="section-heading-small">
          <h2>My Profile</h2>
          <p>Edit your personal and business details below.</p>
        </div>

        {error && <div className="error-box">{error}</div>}
        {successMsg && <div style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{successMsg}</div>}

        <form onSubmit={handleUpdate} className="auth-box" style={{ width: '100%', padding: '30px' }}>
          <label>Full Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required />

          <label>Mobile Number</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
          
          <label>Email Address</label>
          <input type="email" value={user?.email || ""} disabled style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} />

          <label>Role</label>
          <input type="text" value={user?.role || ""} disabled style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', textTransform: 'capitalize' }} />

          <div className="two-inputs">
            <div>
              <label>State</label>
              <input type="text" name="state" value={form.state} onChange={handleChange} />
            </div>
            <div>
              <label>District</label>
              <input type="text" name="district" value={form.district} onChange={handleChange} />
            </div>
          </div>

          <label>Business Name</label>
          <input type="text" name="businessName" value={form.businessName} onChange={handleChange} />

          <label>Business Type</label>
          <input type="text" name="businessType" value={form.businessType} onChange={handleChange} />

          <label>Full Address</label>
          <input type="text" name="address" value={form.address} onChange={handleChange} />

          <button type="submit" className="auth-submit" disabled={saving}>
            {saving ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default BuyerProfile;
