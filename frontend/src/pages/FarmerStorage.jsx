import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const content = {
  en: {
    title: "My Crop Storage",
    subtitle: "Track warehouse, cold storage, and farm storage deposits, quantities, and costs.",
    noRecords: "No storage records found.",
    noRecordsDesc: "Storage records are created from your completed or active transactions.",
    crop: "Crop",
    storageName: "Storage Facility",
    storageLocation: "Location",
    storageType: "Storage Type",
    quantity: "Stored Quantity",
    entryDate: "Entry Date",
    expectedExit: "Expected Exit Date",
    actualExit: "Actual Exit Date",
    storageCost: "Storage Cost",
    status: "Status",
    actions: "Actions",
    backBtn: "← Back to Transactions",
    updateStatus: "Update Status",
    saveBtn: "Save Status",
    cancelBtn: "Cancel",
    notes: "Notes",
    langSwitch: "हिंदी"
  },
  hi: {
    title: "मेरा फसल भंडारण (Storage)",
    subtitle: "गोदाम, कोल्ड स्टोरेज और खेत भंडारण जमा, मात्रा और लागत को ट्रैक करें।",
    noRecords: "कोई भंडारण रिकॉर्ड नहीं मिला।",
    noRecordsDesc: "भंडारण रिकॉर्ड आपके सौदों और लेनदेन से बनाए जाते हैं।",
    crop: "फसल",
    storageName: "भंडारण केंद्र / गोदाम",
    storageLocation: "स्थान",
    storageType: "भंडारण प्रकार",
    quantity: "जमा मात्रा",
    entryDate: "प्रवेश तिथि (Entry Date)",
    expectedExit: "संभावित निकासी तिथि",
    actualExit: "वास्तविक निकासी तिथि",
    storageCost: "भंडारण शुल्क / लागत",
    status: "स्थिति",
    actions: "कार्यवाही",
    backBtn: "← लेनदेन पर वापस जाएं",
    updateStatus: "स्थिति अपडेट करें",
    saveBtn: "सुरक्षित करें",
    cancelBtn: "रद्द करें",
    notes: "टिप्पणी",
    langSwitch: "English"
  }
};

const statusLabels = {
  en: {
    stored: "📦 Stored",
    partially_released: "🟡 Partially Released",
    released: "🟢 Released",
    cancelled: "⚪ Cancelled"
  },
  hi: {
    partially_released: "🟡 आंशिक रूप से निकाला गया",
    stored: "📦 जमा (Stored)",
    released: "🟢 जारी किया गया (Released)",
    cancelled: "⚪ रद्द"
  }
};

function FarmerStorage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("farmerLang") || "en");
  const t = content[lang];
  const sl = statusLabels[lang];

  const [storageList, setStorageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStorage();
  }, []);

  const fetchStorage = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/storage/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStorageList(data.storage || []);
      } else {
        setError(data.message || "Failed to load storage records");
      }
    } catch (err) {
      setError("Network error fetching storage records");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedRecord || !newStatus) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/storage/${selectedRecord._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRecord(null);
        fetchStorage();
      } else {
        alert(data.message || "Failed to update storage status");
      }
    } catch (err) {
      alert("Error updating storage status");
    } finally {
      setUpdating(false);
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === "en" ? "hi" : "en";
    setLang(nextLang);
    localStorage.setItem("farmerLang", nextLang);
  };

  const filteredList = storageList.filter(item => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0", color: "#2e7d32" }}>🏢 {t.title}</h1>
          <p style={{ margin: 0, color: "#666" }}>{t.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={toggleLanguage}
            style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid #ccc", background: "#f9f9f9", cursor: "pointer" }}
          >
            🌐 {t.langSwitch}
          </button>
          <button
            onClick={() => navigate("/farmer/transactions")}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #2e7d32", background: "#fff", color: "#2e7d32", cursor: "pointer" }}
          >
            {t.backBtn}
          </button>
        </div>
      </header>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["all", "stored", "partially_released", "released", "cancelled"].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid #ccc",
              background: statusFilter === st ? "#2e7d32" : "#f5f5f5",
              color: statusFilter === st ? "#fff" : "#333",
              cursor: "pointer",
              fontWeight: statusFilter === st ? "bold" : "normal"
            }}
          >
            {st === "all" ? (lang === "en" ? "All Statuses" : "सभी स्थितियां") : sl[st]}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading storage records...</div>
      ) : error ? (
        <div style={{ color: "red", padding: "20px", background: "#ffebee", borderRadius: "8px" }}>{error}</div>
      ) : filteredList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: "#fafafa", borderRadius: "8px" }}>
          <h3>{t.noRecords}</h3>
          <p style={{ color: "#666" }}>{t.noRecordsDesc}</p>
          <Link to="/farmer/transactions" style={{ color: "#2e7d32", fontWeight: "bold" }}>View My Transactions</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {filteredList.map(item => (
            <div
              key={item._id}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                padding: "20px",
                background: "#fff",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", color: "#1b5e20" }}>
                    🌾 {item.crop ? item.crop.cropName : "Crop"} ({item.quantity} {item.crop ? item.crop.unit : "kg"})
                  </h3>
                  <p style={{ margin: 0, color: "#555", fontSize: "0.95rem" }}>
                    🏢 <strong>{item.storageName}</strong> — 📍 {item.storageLocation}
                  </p>
                </div>
                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    background: "#e8f5e9",
                    color: "#2e7d32",
                    fontWeight: "bold",
                    fontSize: "0.9rem"
                  }}
                >
                  {sl[item.status] || item.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", background: "#fafafa", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
                <div>
                  <small style={{ color: "#777" }}>📦 {t.storageType}</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px", textTransform: "capitalize" }}>{item.storageType.replace("_", " ")}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>⚖️ {t.quantity}</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>{item.quantity} {item.crop ? item.crop.unit : "kg"}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>📅 {t.entryDate}</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>{new Date(item.entryDate).toLocaleDateString("en-IN")}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>💰 {t.storageCost}</small>
                  <div style={{ fontWeight: "bold", color: "#d32f2f", marginTop: "2px" }}>₹{item.storageCost.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {item.notes && (
                <div style={{ marginBottom: "15px", fontSize: "0.9rem", color: "#555", background: "#fffde7", padding: "10px", borderRadius: "6px" }}>
                  📝 <strong>{t.notes}:</strong> {item.notes}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px dashed #ddd" }}>
                <small style={{ color: "#888" }}>
                  Created: {new Date(item.createdAt).toLocaleDateString("en-IN")}
                </small>

                {item.status !== "released" && item.status !== "cancelled" && (
                  <button
                    onClick={() => {
                      setSelectedRecord(item);
                      setNewStatus(item.status);
                    }}
                    style={{
                      padding: "6px 14px",
                      background: "#2e7d32",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    ✏️ {t.updateStatus}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {selectedRecord && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "25px", borderRadius: "10px", maxWidth: "450px", width: "90%" }}>
            <h3 style={{ marginTop: 0, color: "#1b5e20" }}>Update Storage Status</h3>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>Select status transition for this stored crop batch.</p>

            <form onSubmit={handleStatusUpdate}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>New Status:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="stored">Stored</option>
                  <option value="partially_released">Partially Released</option>
                  <option value="released">Released</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{ padding: "8px 16px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  {updating ? "Saving..." : t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmerStorage;
