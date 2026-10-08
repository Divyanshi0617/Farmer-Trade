import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const content = {
  en: {
    title: "My Logistics & Transport",
    subtitle: "Track vehicle assignment, pickup/delivery schedules, and transport costs for your crops.",
    noRecords: "No logistics records found.",
    noRecordsDesc: "Logistics records are created from your accepted transactions.",
    crop: "Crop",
    buyer: "Buyer",
    pickupLocation: "Pickup Location",
    deliveryLocation: "Delivery Location",
    transportType: "Transport Type",
    vehicleNumber: "Vehicle Number",
    driverName: "Driver Name",
    driverPhone: "Driver Phone",
    transportCost: "Transport Cost",
    estimatedPickup: "Estimated Pickup",
    estimatedDelivery: "Estimated Delivery",
    actualPickup: "Actual Pickup",
    actualDelivery: "Actual Delivery",
    status: "Status",
    actions: "Actions",
    backBtn: "← Back to Transactions",
    dashboardBtn: "Dashboard",
    updateStatus: "Update Status",
    saveBtn: "Save Status",
    cancelBtn: "Cancel",
    notes: "Notes",
    langSwitch: "हिंदी"
  },
  hi: {
    title: "मेरा परिवहन / लॉजिस्टिक्स",
    subtitle: "अपनी फसलों के लिए वाहन आवंटन, पिकअप/डिलीवरी समय और परिवहन लागत ट्रैक करें।",
    noRecords: "कोई लॉजिस्टिक्स रिकॉर्ड नहीं मिला।",
    noRecordsDesc: "लॉजिस्टिक्स रिकॉर्ड आपके स्वीकृत लेनदेन से बनाए जाते हैं।",
    crop: "फसल",
    buyer: "खरीदार",
    pickupLocation: "पिकअप स्थान",
    deliveryLocation: "डिलीवरी स्थान",
    transportType: "वाहन प्रकार",
    vehicleNumber: "गाड़ी नंबर",
    driverName: "ड्राइवर का नाम",
    driverPhone: "ड्राइवर फोन",
    transportCost: "परिवहन भाड़ा / लागत",
    estimatedPickup: "अनुमानित पिकअप",
    estimatedDelivery: "अनुमानित डिलीवरी",
    actualPickup: "वास्तविक पिकअप",
    actualDelivery: "वास्तविक डिलीवरी",
    status: "स्थिति",
    actions: "कार्यवाही",
    backBtn: "← लेनदेन पर वापस जाएं",
    dashboardBtn: "डैशबोर्ड",
    updateStatus: "स्थिति अपडेट करें",
    saveBtn: "स्थिति सुरक्षित करें",
    cancelBtn: "रद्द करें",
    notes: "टिप्पणी",
    langSwitch: "English"
  }
};

const statusLabels = {
  en: {
    requested: "🟡 Requested",
    assigned: "🔵 Assigned",
    pickup_scheduled: "🟣 Pickup Scheduled",
    picked_up: "🟠 Picked Up",
    in_transit: "🚛 In Transit",
    delivered: "🟢 Delivered",
    cancelled: "⚪ Cancelled"
  },
  hi: {
    requested: "🟡 अनुरोधित",
    assigned: "🔵 आवंटित",
    pickup_scheduled: "🟣 पिकअप निर्धारित",
    picked_up: "🟠 उठा लिया गया",
    in_transit: "🚛 रास्ते में (In Transit)",
    delivered: "🟢 पहुंचा दिया गया (Delivered)",
    cancelled: "⚪ रद्द"
  }
};

function FarmerLogistics() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("farmerLang") || "en");
  const t = content[lang];
  const sl = statusLabels[lang];

  const [logisticsList, setLogisticsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLogistics();
  }, []);

  const fetchLogistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/logistics/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogisticsList(data.logistics || []);
      } else {
        setError(data.message || "Failed to load logistics");
      }
    } catch (err) {
      setError("Network error fetching logistics");
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
      const res = await fetch(`http://localhost:5000/api/logistics/${selectedRecord._id}/status`, {
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
        fetchLogistics();
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === "en" ? "hi" : "en";
    setLang(nextLang);
    localStorage.setItem("farmerLang", nextLang);
  };

  const filteredList = logisticsList.filter(item => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* HEADER */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0", color: "#2e7d32" }}>🚛 {t.title}</h1>
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
        {["all", "requested", "assigned", "pickup_scheduled", "picked_up", "in_transit", "delivered", "cancelled"].map(st => (
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
        <div style={{ textAlign: "center", padding: "40px" }}>Loading logistics records...</div>
      ) : error ? (
        <div style={{ color: "red", padding: "20px", background: "#ffebee", borderRadius: "8px" }}>{error}</div>
      ) : filteredList.length === 0 ? (
        <div style={{ textCenter: "center", padding: "40px", background: "#fafafa", borderRadius: "8px" }}>
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
                    🌾 {item.crop ? item.crop.cropName : "Crop"} ({item.crop ? `${item.crop.quantity} ${item.crop.unit}` : ""})
                  </h3>
                  <p style={{ margin: 0, color: "#555", fontSize: "0.95rem" }}>
                    <strong>{t.buyer}:</strong> {item.buyer ? item.buyer.name : "N/A"} ({item.buyer ? item.buyer.phone : ""})
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

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px", background: "#fafafa", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
                <div>
                  <small style={{ color: "#777" }}>📍 {t.pickupLocation}</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>{item.pickupLocation}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>🏁 {t.deliveryLocation}</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>{item.deliveryLocation}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>🚛 {t.transportType}</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px", textTransform: "capitalize" }}>{item.transportType}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>💰 {t.transportCost}</small>
                  <div style={{ fontWeight: "bold", color: "#d32f2f", marginTop: "2px" }}>₹{item.transportCost.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {(item.vehicleNumber || item.driverName || item.driverPhone) && (
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "15px", fontSize: "0.9rem", color: "#444" }}>
                  {item.vehicleNumber && <div>🚘 <strong>{t.vehicleNumber}:</strong> {item.vehicleNumber}</div>}
                  {item.driverName && <div>👨‍✈️ <strong>{t.driverName}:</strong> {item.driverName}</div>}
                  {item.driverPhone && <div>📞 <strong>{t.driverPhone}:</strong> {item.driverPhone}</div>}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px dashed #ddd" }}>
                <small style={{ color: "#888" }}>
                  Created: {new Date(item.createdAt).toLocaleDateString("en-IN")}
                </small>

                {item.status !== "delivered" && item.status !== "cancelled" && (
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
            <h3 style={{ marginTop: 0, color: "#1b5e20" }}>Update Logistics Status</h3>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>Select next valid status transition for this shipment.</p>

            <form onSubmit={handleStatusUpdate}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>New Status:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="requested">Requested</option>
                  <option value="assigned">Assigned</option>
                  <option value="pickup_scheduled">Pickup Scheduled</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
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

export default FarmerLogistics;
