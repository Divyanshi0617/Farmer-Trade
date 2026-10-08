import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function BuyerStorage() {
  const navigate = useNavigate();
  const [storageList, setStorageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError("Network error fetching storage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0", color: "#1976d2" }}>🏢 Deal Storage & Warehouse Records</h1>
          <p style={{ margin: 0, color: "#666" }}>Track warehouse and storage facility records for your crop deals.</p>
        </div>
        <button
          onClick={() => navigate("/buyer/deals")}
          style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #1976d2", background: "#fff", color: "#1976d2", cursor: "pointer" }}
        >
          ← Back to Deals
        </button>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading storage records...</div>
      ) : error ? (
        <div style={{ color: "red", padding: "20px", background: "#ffebee", borderRadius: "8px" }}>{error}</div>
      ) : storageList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: "#fafafa", borderRadius: "8px" }}>
          <h3>No storage records found.</h3>
          <p style={{ color: "#666" }}>Storage details will appear if your purchased crops are deposited in a warehouse.</p>
          <Link to="/buyer/deals" style={{ color: "#1976d2", fontWeight: "bold" }}>View My Deals</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {storageList.map(item => (
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
                    background: "#e3f2fd",
                    color: "#1976d2",
                    fontWeight: "bold",
                    fontSize: "0.9rem"
                  }}
                >
                  {item.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", background: "#f5f5f5", padding: "15px", borderRadius: "8px" }}>
                <div>
                  <small style={{ color: "#777" }}>📦 Facility Type</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px", textTransform: "capitalize" }}>{item.storageType.replace("_", " ")}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>⚖️ Quantity</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>{item.quantity} {item.crop ? item.crop.unit : "kg"}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>📅 Entry Date</small>
                  <div style={{ fontWeight: "bold", marginTop: "2px" }}>{new Date(item.entryDate).toLocaleDateString("en-IN")}</div>
                </div>
                <div>
                  <small style={{ color: "#777" }}>💰 Storage Cost</small>
                  <div style={{ fontWeight: "bold", color: "#1976d2", marginTop: "2px" }}>₹{item.storageCost.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuyerStorage;
