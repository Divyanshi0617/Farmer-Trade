import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const content = {
  en: {
    title: "Market Prices",
    subtitle: "Check current market (mandi) prices across different locations to plan your sales.",
    checkHeader: "Check Market Prices",
    sampleNotice: "ℹ️ Note: Displaying controlled sample market data (Agmarknet simulation). Real-time government mandi API integration ready.",
    selectCrop: "Select Crop",
    selectState: "Select State",
    selectDistrict: "Select District",
    selectMarket: "Market Name (Optional)",
    allCrops: "-- All Crops --",
    allStates: "-- All States --",
    allDistricts: "-- All Districts --",
    searchBtn: "Search Prices",
    resetBtn: "Reset Filters",
    myCropsBanner: "Your Listed Crops:",
    checkPriceFor: "Check Prices for",
    summaryTitle: "PRICE SUMMARY",
    basedOnDisplayed: "Based on displayed market records",
    marketsFound: "Markets Found",
    lowestModal: "Lowest Modal Price",
    highestModal: "Highest Modal Price",
    avgModal: "Average Modal Price",
    sortBy: "Sort By:",
    sortHighest: "Highest Modal Price",
    sortLowest: "Lowest Modal Price",
    sortName: "Market Name (A-Z)",
    minPrice: "Min Price",
    modalPrice: "Modal Price",
    maxPrice: "Max Price",
    updatedDate: "Updated",
    unit: "Unit",
    location: "Location",
    source: "Source",
    viewDetails: "View Details",
    closeDetails: "Close Details",
    highestDisclaimer: "Highest listed modal price in the displayed results.",
    noPricesFound: "No market prices found for your selected crop and location.",
    noPricesDesc: "Try clearing your filters or selecting a different crop or state.",
    errorMsg: "Unable to load market prices. Please try again.",
    priceTrendTitle: "PRICE TREND",
    priceTrendSub: "Historical price movement for selected crop",
    noTrendData: "Price trend will appear when historical market data is available.",
    comparisonTableTitle: "MARKET PRICE COMPARISON",
    mandiName: "Mandi / Market",
    backBtn: "← Back to Dashboard"
  },
  hi: {
    title: "बाजार भाव",
    subtitle: "अपनी फसल की सही कीमत जानने के लिए अलग-अलग मंडियों के भाव देखें।",
    checkHeader: "बाजार भाव देखें",
    sampleNotice: "ℹ️ नोट: यह सैंपल बाजार डेटा (Agmarknet सिमुलेशन) है। लाइव सरकारी मंडी एपीआई एकीकरण के लिए तैयार।",
    selectCrop: "फसल चुनें",
    selectState: "राज्य चुनें",
    selectDistrict: "जिला चुनें",
    selectMarket: "मंडी का नाम (वैकल्पिक)",
    allCrops: "-- सभी फसलें --",
    allStates: "-- सभी राज्य --",
    allDistricts: "-- सभी जिले --",
    searchBtn: "भाव देखें",
    resetBtn: "फ़िल्टर हटाएं",
    myCropsBanner: "आपकी फसलें:",
    checkPriceFor: "भाव देखें:",
    summaryTitle: "कीमत का सारांश",
    basedOnDisplayed: "दिखाए गए मंडी रिकॉर्ड पर आधारित",
    marketsFound: "मंडियां मिलीं",
    lowestModal: "न्यूनतम मॉडल भाव",
    highestModal: "अधिकतम मॉडल भाव",
    avgModal: "औसत मॉडल भाव",
    sortBy: "क्रमानुसार चुनें:",
    sortHighest: "सबसे अधिक मॉडल भाव",
    sortLowest: "सबसे कम मॉडल भाव",
    sortName: "मंडी नाम (A-Z)",
    minPrice: "न्यूनतम भाव",
    modalPrice: "मॉडल भाव (सामान्य)",
    maxPrice: "अधिकतम भाव",
    updatedDate: "अपडेट तिथि",
    unit: "इकाई",
    location: "स्थान",
    source: "स्रोत",
    viewDetails: "विवरण देखें",
    closeDetails: "विवरण बंद करें",
    highestDisclaimer: "दिखाए गए परिणामों में उच्चतम सूचीबद्ध मॉडल भाव।",
    noPricesFound: "चुनी गई फसल और स्थान के लिए बाजार भाव नहीं मिला।",
    noPricesDesc: "कृपया अपने फ़िल्टर बदलें या कोई अन्य फसल चुनें।",
    errorMsg: "बाजार भाव लोड करने में असमर्थ। कृपया पुनः प्रयास करें।",
    priceTrendTitle: "मूल्य रुझान (Price Trend)",
    priceTrendSub: "चुनी गई फसल का ऐतिहासिक मूल्य रुझान",
    noTrendData: "जब ऐतिहासिक बाजार डेटा उपलब्ध होगा तब मूल्य रुझान दिखाई देगा।",
    comparisonTableTitle: "मंडी भाव तुलना",
    mandiName: "मंडी का नाम",
    backBtn: "← डैशबोर्ड पर वापस जाएं"
  }
};

function MarketPrices() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("farmerLang") || "en");
  const t = content[lang];

  // Search filter states
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [searchMarket, setSearchMarket] = useState("");
  const [sortBy, setSortBy] = useState("highest");

  // Data states
  const [marketPrices, setMarketPrices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ crops: [], states: [], districts: [] });
  const [farmerCrops, setFarmerCrops] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDetailId, setActiveDetailId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState("");

  const handleSyncGovernment = async () => {
    setIsSyncing(true);
    setSyncFeedback("");
    try {
      const res = await fetch("http://localhost:5000/api/market-prices/sync-government", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback(
          lang === "hi"
            ? `✅ लाइव मंडी भाव सफलतापूर्वक अपडेट हुए! (${data.source || "APMC लाइव मंडी फीड"})`
            : `✅ Live Mandi prices synced successfully! (${data.source || "Live APMC Mandi Feed"})`
        );
        fetchMarketPrices(selectedCrop, selectedState, selectedDistrict, searchMarket, sortBy);
      } else {
        setSyncFeedback("⚠️ " + (data.message || data.error));
      }
    } catch (err) {
      setSyncFeedback("❌ Failed to reach market price sync service.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchFarmerCrops();
    fetchMarketPrices();
  }, []);

  const fetchFarmerCrops = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/crops/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.crops)) {
        const uniqueNames = [...new Set(data.crops.map(c => c.cropName))];
        setFarmerCrops(uniqueNames);
      }
    } catch (e) {}
  };

  const fetchMarketPrices = async (cropFilter = selectedCrop, stateFilter = selectedState, distFilter = selectedDistrict, mktFilter = searchMarket, sortVal = sortBy) => {
    setLoading(true);
    setError("");
    try {
      let query = [];
      if (cropFilter) query.push(`crop=${encodeURIComponent(cropFilter)}`);
      if (stateFilter) query.push(`state=${encodeURIComponent(stateFilter)}`);
      if (distFilter) query.push(`district=${encodeURIComponent(distFilter)}`);
      if (mktFilter) query.push(`market=${encodeURIComponent(mktFilter)}`);
      if (sortVal) query.push(`sort=${encodeURIComponent(sortVal)}`);

      const queryString = query.length > 0 ? `?${query.join("&")}` : "";
      const res = await fetch(`http://localhost:5000/api/market-prices${queryString}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || t.errorMsg);
      }

      setMarketPrices(data.marketPrices || []);
      setSummary(data.summary || null);

      if (data.filterOptions) {
        setFilterOptions(prev => ({
          crops: data.filterOptions.crops || prev.crops,
          states: data.filterOptions.states || prev.states,
          districts: data.filterOptions.districts || prev.districts
        }));
      }

      // If a specific crop is selected, fetch price history for trend
      if (cropFilter) {
        fetchPriceHistory(cropFilter);
      } else {
        setHistoryData([]);
      }

    } catch (err) {
      setError(err.message || t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (cropName) => {
    try {
      const res = await fetch(`http://localhost:5000/api/market-prices/history/${encodeURIComponent(cropName)}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.history)) {
        setHistoryData(data.history);
      } else {
        setHistoryData([]);
      }
    } catch (e) {
      setHistoryData([]);
    }
  };

  const handleStateChange = (newState) => {
    setSelectedState(newState);
    setSelectedDistrict("");
    fetchMarketPrices(selectedCrop, newState, "", searchMarket, sortBy);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMarketPrices(selectedCrop, selectedState, selectedDistrict, searchMarket, sortBy);
  };

  const handleReset = () => {
    setSelectedCrop("");
    setSelectedState("");
    setSelectedDistrict("");
    setSearchMarket("");
    setSortBy("highest");
    fetchMarketPrices("", "", "", "", "highest");
  };

  const handleQuickCropClick = (cropName) => {
    setSelectedCrop(cropName);
    fetchMarketPrices(cropName, selectedState, selectedDistrict, searchMarket, sortBy);
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSortBy(val);
    fetchMarketPrices(selectedCrop, selectedState, selectedDistrict, searchMarket, val);
  };

  return (
    <div className="farmer-dashboard">
      <main className="dashboard-content" style={{ margin: "0 auto", maxWidth: "950px", padding: "30px 20px" }}>
        
        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <Link 
            to={(() => {
              try {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                if (user.role === "buyer") return "/buyer/dashboard";
                if (user.role === "farmer") return "/farmer/dashboard";
              } catch (e) {}
              return "/";
            })()} 
            className="back-button" 
            style={{ margin: 0 }}
          >
            {t.backBtn}
          </Link>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleSyncGovernment}
              disabled={isSyncing}
              style={{
                padding: '8px 16px',
                background: isSyncing ? '#a5d6a7' : '#2e7d32',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(46, 125, 50, 0.25)',
                fontSize: '13px'
              }}
              title="Fetch fresh real-time APMC Mandi prices"
              id="btn-sync-live-mandi"
            >
              {isSyncing ? "⏳ Syncing Mandi..." : "🔄 Sync Live Mandi Prices"}
            </button>

            <button 
              onClick={() => {
                const newLang = lang === "en" ? "hi" : "en";
                setLang(newLang);
                localStorage.setItem("farmerLang", newLang);
              }} 
              style={{ padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              🌐 {lang === "en" ? "हिंदी" : "English"}
            </button>
          </div>
        </div>

        {/* PAGE TITLE */}
        <div className="section-heading-small" style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '28px', color: '#19351e', margin: '0 0 5px' }}>📊 {t.title}</h1>
          <p style={{ color: '#666', margin: 0 }}>{t.subtitle}</p>
        </div>

        {/* SYNC FEEDBACK ALERT */}
        {syncFeedback && (
          <div style={{
            background: syncFeedback.startsWith("✅") ? "#e8f5e9" : "#fff3e0",
            color: syncFeedback.startsWith("✅") ? "#1b5e20" : "#e65100",
            border: `1px solid ${syncFeedback.startsWith("✅") ? "#a5d6a7" : "#ffe082"}`,
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>{syncFeedback}</span>
            <button 
              onClick={() => setSyncFeedback("")}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'inherit' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* NOTICE ABOUT GOVERNMENT / APMC LIVE DATA */}
        <div style={{ background: '#eaf4eb', border: '1px solid #c8e6c9', color: '#2e7d32', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '25px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            {marketPrices.some(mp => mp.source && (mp.source.includes("Government") || mp.source.includes("Live") || mp.source.includes("APMC")))
              ? "🏛️ Real & Live APMC Mandi Prices Active (Agmarknet & Daily Market Arrivals Across India)"
              : "ℹ️ Note: Displaying controlled market data. Click 'Sync Live Mandi Prices' to refresh."
            }
          </div>
          <div style={{ fontSize: '11px', color: '#1b5e20', background: 'rgba(255,255,255,0.8)', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
            🟢 Live Mandi Feed Active
          </div>
        </div>


        {/* FARMER'S OWN CROPS QUICK BADGES */}
        {farmerCrops.length > 0 && (
          <div style={{ background: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e0e8de', marginBottom: '25px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', marginRight: '10px' }}>
              {t.myCropsBanner}
            </span>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
              {farmerCrops.map(crop => (
                <button
                  key={crop}
                  onClick={() => handleQuickCropClick(crop)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: selectedCrop === crop ? '2px solid #2e7d32' : '1px solid #c8e6c9',
                    background: selectedCrop === crop ? '#2e7d32' : '#f1f8f1',
                    color: selectedCrop === crop ? 'white' : '#2e7d32',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🌾 {t.checkPriceFor} {crop}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH & FILTER CONTROLS */}
        <form onSubmit={handleSearchSubmit} style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e0e8de', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px', color: '#19351e', fontSize: '18px' }}>🔍 {t.checkHeader}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            
            {/* CROP DROPDOWN */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>
                {t.selectCrop}
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', background: '#fafafa', fontSize: '14px', fontFamily: 'inherit' }}
              >
                <option value="">{t.allCrops}</option>
                {filterOptions.crops.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* STATE DROPDOWN */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>
                {t.selectState}
              </label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', background: '#fafafa', fontSize: '14px', fontFamily: 'inherit' }}
              >
                <option value="">{t.allStates}</option>
                {filterOptions.states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* DISTRICT DROPDOWN */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>
                {t.selectDistrict}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', background: '#fafafa', fontSize: '14px', fontFamily: 'inherit' }}
              >
                <option value="">{t.allDistricts}</option>
                {filterOptions.districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* MARKET SEARCH */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold', color: '#444' }}>
                {t.selectMarket}
              </label>
              <input
                type="text"
                placeholder="e.g. Ludhiana Mandi"
                value={searchMarket}
                onChange={(e) => setSearchMarket(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', background: '#fafafa', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </div>

          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="auth-submit"
              style={{ flex: 2, margin: 0, padding: '14px', fontSize: '16px', background: '#2e7d32' }}
            >
              🔍 {t.searchBtn}
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{ flex: 1, padding: '14px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}
            >
              🔄 {t.resetBtn}
            </button>
          </div>
        </form>

        {/* ERROR STATE */}
        {error && (
          <div className="error-box" style={{ marginBottom: '25px', padding: '15px' }}>
            {error}
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', fontSize: '18px', color: '#666' }}>
            🔄 Loading market prices...
          </div>
        ) : marketPrices.length === 0 ? (
          /* EMPTY STATE */
          <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e0e8de' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌾</div>
            <h3 style={{ margin: '0 0 10px', color: '#333' }}>{t.noPricesFound}</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>{t.noPricesDesc}</p>
            <button onClick={handleReset} className="auth-submit" style={{ width: 'auto', padding: '10px 25px' }}>
              🔄 {t.resetBtn}
            </button>
          </div>
        ) : (
          <>
            {/* SUMMARY METRICS BANNER */}
            {summary && (
              <div style={{ background: '#f8faf7', border: '1px solid #d4e3d3', borderRadius: '16px', padding: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#19351e', fontSize: '16px' }}>📊 {t.summaryTitle}</h3>
                    <small style={{ color: '#777' }}>{t.basedOnDisplayed}</small>
                  </div>
                  <div style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                    {t.marketsFound}: {summary.marketsFound}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                  <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e0e8de', textAlign: 'center' }}>
                    <small style={{ color: '#666', display: 'block' }}>{t.lowestModal}</small>
                    <strong style={{ fontSize: '22px', color: '#d32f2f' }}>₹{summary.lowestModalPrice.toLocaleString()}</strong>
                  </div>

                  <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #2e7d32', textAlign: 'center', boxShadow: '0 2px 8px rgba(46,125,50,0.1)' }}>
                    <small style={{ color: '#666', display: 'block' }}>{t.highestModal}</small>
                    <strong style={{ fontSize: '24px', color: '#2e7d32' }}>₹{summary.highestModalPrice.toLocaleString()}</strong>
                  </div>

                  <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e0e8de', textAlign: 'center' }}>
                    <small style={{ color: '#666', display: 'block' }}>{t.avgModal}</small>
                    <strong style={{ fontSize: '22px', color: '#1976d2' }}>₹{summary.averageModalPrice.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* SORTING CONTROLS & DISCLAIMER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                💡 {t.highestDisclaimer}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>{t.sortBy}</label>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', fontSize: '13px' }}
                >
                  <option value="highest">{t.sortHighest}</option>
                  <option value="lowest">{t.sortLowest}</option>
                  <option value="market">{t.sortName}</option>
                </select>
              </div>
            </div>

            {/* MARKET PRICE CARDS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {marketPrices.map((mp, index) => (
                <div
                  key={mp._id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: index === 0 && sortBy === 'highest' ? '2px solid #2e7d32' : '1px solid #e0e8de',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  {index === 0 && sortBy === 'highest' && (
                    <div style={{ position: 'absolute', top: '-12px', right: '15px', background: '#2e7d32', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '10px' }}>
                      🌟 Highest Modal
                    </div>
                  )}

                  <div style={{ borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '20px', color: '#19351e' }}>🌾 {mp.cropName}</h3>
                      {mp.cropType && <span style={{ fontSize: '12px', color: '#777', background: '#f5f5f5', padding: '2px 8px', borderRadius: '4px' }}>{mp.cropType}</span>}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginTop: '6px' }}>
                      {mp.marketName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                      📍 {mp.district}, {mp.state} {mp.marketLocation ? `(${mp.marketLocation})` : ''}
                    </div>
                  </div>

                  {/* PROMINENT MODAL PRICE */}
                  <div style={{ background: '#f1f8f1', padding: '12px 15px', borderRadius: '10px', border: '1px solid #c8e6c9', textAlign: 'center', marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {t.modalPrice}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#1b5e20', margin: '2px 0' }}>
                      ₹{mp.modalPrice.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#555' }}>/ {mp.unit}</span>
                    </div>
                  </div>

                  {/* MIN & MAX PRICES */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '15px' }}>
                    <div style={{ background: '#fafafa', padding: '8px 10px', borderRadius: '8px', border: '1px solid #eee' }}>
                      <div style={{ color: '#777', fontSize: '11px' }}>{t.minPrice}</div>
                      <div style={{ fontWeight: 'bold', color: '#555' }}>₹{mp.minPrice.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#fafafa', padding: '8px 10px', borderRadius: '8px', border: '1px solid #eee' }}>
                      <div style={{ color: '#777', fontSize: '11px' }}>{t.maxPrice}</div>
                      <div style={{ fontWeight: 'bold', color: '#555' }}>₹{mp.maxPrice.toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#888', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                    <div>📅 {t.updatedDate}: {new Date(mp.priceDate).toLocaleDateString()}</div>
                    <button
                      onClick={() => setActiveDetailId(activeDetailId === mp._id ? null : mp._id)}
                      style={{ border: 'none', background: 'none', color: '#1976d2', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {activeDetailId === mp._id ? t.closeDetails : t.viewDetails}
                    </button>
                  </div>

                  {/* EXPANDABLE DETAIL DRAWER */}
                  {activeDetailId === mp._id && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc', fontSize: '13px', color: '#444' }}>
                      <div><strong>{t.mandiName}:</strong> {mp.marketName}</div>
                      <div><strong>{t.location}:</strong> {mp.marketLocation || `${mp.district}, ${mp.state}`}</div>
                      {mp.variety && <div><strong>Variety:</strong> {mp.variety}</div>}
                      <div><strong>{t.unit}:</strong> {mp.unit}</div>
                      <div><strong>{t.source}:</strong> {mp.source}</div>
                      {mp.lastSyncedAt && <div><strong>Last Synced:</strong> {new Date(mp.lastSyncedAt).toLocaleString()}</div>}
                    </div>
                  )}


                </div>
              ))}
            </div>

            {/* COMPARISON TABLE */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e0e8de', padding: '25px', marginBottom: '40px', overflowX: 'auto' }}>
              <h3 style={{ margin: '0 0 15px', color: '#19351e', fontSize: '18px' }}>📋 {t.comparisonTableTitle}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f5f8f4', borderBottom: '2px solid #e0e8de' }}>
                    <th style={{ padding: '12px 15px' }}>Crop</th>
                    <th style={{ padding: '12px 15px' }}>{t.mandiName}</th>
                    <th style={{ padding: '12px 15px' }}>Location</th>
                    <th style={{ padding: '12px 15px' }}>{t.minPrice}</th>
                    <th style={{ padding: '12px 15px' }}>{t.modalPrice}</th>
                    <th style={{ padding: '12px 15px' }}>{t.maxPrice}</th>
                    <th style={{ padding: '12px 15px' }}>{t.updatedDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {marketPrices.map(mp => (
                    <tr key={`table-${mp._id}`} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>🌾 {mp.cropName}</td>
                      <td style={{ padding: '12px 15px' }}>{mp.marketName}</td>
                      <td style={{ padding: '12px 15px', color: '#666' }}>{mp.district}, {mp.state}</td>
                      <td style={{ padding: '12px 15px' }}>₹{mp.minPrice.toLocaleString()}</td>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#2e7d32' }}>₹{mp.modalPrice.toLocaleString()}</td>
                      <td style={{ padding: '12px 15px' }}>₹{mp.maxPrice.toLocaleString()}</td>
                      <td style={{ padding: '12px 15px', color: '#777', fontSize: '13px' }}>{new Date(mp.priceDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PRICE TREND SECTION */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e0e8de', padding: '25px' }}>
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 5px', color: '#19351e', fontSize: '18px' }}>📈 {t.priceTrendTitle}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{t.priceTrendSub}</p>
              </div>

              {historyData.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }}>
                    {historyData.map((h, i) => (
                      <div key={h._id || i} style={{ minWidth: '140px', background: '#fafafa', border: '1px solid #eee', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#777', marginBottom: '5px' }}>
                          {new Date(h.priceDate).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
                          ₹{h.modalPrice}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          {h.marketName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '25px', textAlign: 'center', background: '#fafafa', borderRadius: '10px', border: '1px dashed #ccc', color: '#666', fontSize: '14px' }}>
                  ℹ️ {t.noTrendData}
                </div>
              )}
            </div>

          </>
        )}

      </main>
    </div>
  );
}

export default MarketPrices;
