import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function BuyerLogistics() {
  const navigate = useNavigate();
  const [logisticsList, setLogisticsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0", color: "#1976d2" }}>🚛 My Logistics & Shipments</h1>
          <p style={{ margin: 0, color: "#666" }}>Track transport status and delivery of your purchased crop deals.</p>
        </div>
        <button
          onClick={() => navigate("/buyer/deals")}
          style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #1976d2", background: "#fff", color: "#1976d2", cursor: "pointer" }}
        >
          ← Back to Deals
        </button>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading shipment records...</div>
      ) : error ? (
        <div style={{ color: "red", padding: "20px", background: "#ffebee", borderRadius: "8px" }}>{error}</div>
      ) : logisticsList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: "#fafafa", borderRadius: "8px" }}>
          <h3>No logistics records found.</h3>
          <p style={{ color: "#666" }}>Logistics details appear once transport is scheduled for your deals.</p>
          <Link to="/buyer/deals" style={{ color: "#1976d2", fontWeight: "bold" }}>View My Deals</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {logisticsList.map(item => (
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
                  <h3 style={{ margin: "0 0 5px 0", color: "#0d47a1" }}>
                    🌾 {item.crop ? item.crop.cropName : "Crop"} ({item.crop ? `${item.crop.quantity} ${item.crop.unit}` : ""})
                  </h3>
                  <p style={{ margin: 0, color: "#555", fontSize: "0.95rem" }}>
                    <strong>Farmer:</strong> {item.farmer ? item.farmer.name : "N/A"} ({item.farmer ? item.farmer.phone : ""})
                  </p>
                </div>
                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    background: "#e3f2fd",
                    color: "#1976d2",
                    fontWeight: "bold",
                    fontSize: "0.9rem"
                  }}
                >
                  {item.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px", background: "#f5f5f5", padding: "15px", borderRadius: "8px" }}>
                <div>
                  <small style={{ color: "#777" }}>📍 Pickup Location</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>{item.pickupLocation}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>🏁 Delivery Location</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>{item.deliveryLocation}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>🚛 Transport Type</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px", textTransform: "capitalize" }}>{item.transportType}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>💰 Transport Cost</small>
                  <div style={{ fontWeight: "bold", color: "#1976d2", marginTop: "2px" }}>₹{item.transportCost.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {(item.vehicleNumber || item.driverName || item.driverPhone) && (
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "15px", fontSize: "0.9rem", color: "#444" }}>
                  {item.vehicleNumber && <div>🚘 <strong>Vehicle:</strong> {item.vehicleNumber}</div>}
                  {item.driverName && <div>👨‍✈️ <strong>Driver:</strong> {item.driverName}</div>}
                  {item.driverPhone && <div>📞 <strong>Phone:</strong> {item.driverPhone}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuyerLogistics;
