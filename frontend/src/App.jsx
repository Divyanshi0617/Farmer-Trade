import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FarmerDashboard from "./pages/FarmerDashboard";
import FarmerProfile from "./pages/FarmerProfile";
import FarmerCrops from "./pages/FarmerCrops";
import AddCrop from "./pages/AddCrop";
import EditCrop from "./pages/EditCrop";
import CropDetails from "./pages/CropDetails";
import MarketPrices from "./pages/MarketPrices";
import BuyerDashboard from "./pages/BuyerDashboard";
import BuyerProfile from "./pages/BuyerProfile";
import BuyerMarketplace from "./pages/BuyerMarketplace";
import BuyerCropDetails from "./pages/BuyerCropDetails";
import BuyerOffers from "./pages/BuyerOffers";
import FarmerOffers from "./pages/FarmerOffers";
import FarmerTransactions from "./pages/FarmerTransactions";
import FarmerTransactionDetails from "./pages/FarmerTransactionDetails";
import FarmerLogistics from "./pages/FarmerLogistics";
import FarmerStorage from "./pages/FarmerStorage";
import BuyerDeals from "./pages/BuyerDeals";
import BuyerLogistics from "./pages/BuyerLogistics";
import BuyerStorage from "./pages/BuyerStorage";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatbotWidget from "./components/Chatbot/ChatbotWidget";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/farmer/dashboard"
          element={
            <ProtectedRoute role="farmer">
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/farmer/profile"
          element={
            <ProtectedRoute role="farmer">
              <FarmerProfile />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/farmer/crops"
          element={
            <ProtectedRoute role="farmer">
              <FarmerCrops />
            </ProtectedRoute>
          }
        />

        <Route path="/market-prices" element={<MarketPrices />} />

        <Route
          path="/farmer/market-prices"
          element={
            <ProtectedRoute role="farmer">
              <MarketPrices />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/market-prices"
          element={
            <ProtectedRoute role="buyer">
              <MarketPrices />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/offers"
          element={
            <ProtectedRoute role="farmer">
              <FarmerOffers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/transactions"
          element={
            <ProtectedRoute role="farmer">
              <FarmerTransactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/transactions/:id"
          element={
            <ProtectedRoute role="farmer">
              <FarmerTransactionDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/logistics"
          element={
            <ProtectedRoute role="farmer">
              <FarmerLogistics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/storage"
          element={
            <ProtectedRoute role="farmer">
              <FarmerStorage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/farmer/crops/add"
          element={
            <ProtectedRoute role="farmer">
              <AddCrop />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/crops/:id/edit"
          element={
            <ProtectedRoute role="farmer">
              <EditCrop />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/crops/:id"
          element={
            <ProtectedRoute role="farmer">
              <CropDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/dashboard"
          element={
            <ProtectedRoute role="buyer">
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/buyer/profile"
          element={
            <ProtectedRoute role="buyer">
              <BuyerProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/marketplace"
          element={
            <ProtectedRoute role="buyer">
              <BuyerMarketplace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/crops"
          element={
            <ProtectedRoute role="buyer">
              <BuyerMarketplace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/crops/:id"
          element={
            <ProtectedRoute role="buyer">
              <BuyerCropDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/offers"
          element={
            <ProtectedRoute role="buyer">
              <BuyerOffers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/deals"
          element={
            <ProtectedRoute role="buyer">
              <BuyerDeals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/transactions"
          element={
            <ProtectedRoute role="buyer">
              <BuyerDeals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/logistics"
          element={
            <ProtectedRoute role="buyer">
              <BuyerLogistics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/storage"
          element={
            <ProtectedRoute role="buyer">
              <BuyerStorage />
            </ProtectedRoute>
          }
        />

        {/* Real-Time Trader Chat Routes */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/chat"
          element={
            <ProtectedRoute role="farmer">
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/chat"
          element={
            <ProtectedRoute role="buyer">
              <Chat />
            </ProtectedRoute>
          }
        />

      </Routes>

      {/* Global AI Chatbot Widget (Gemini-Powered) */}
      <ChatbotWidget />
      </SocketProvider>
    </BrowserRouter>
  );
}


export default App;