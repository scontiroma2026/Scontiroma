import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Discounts from "@/pages/Discounts";
import DiscountDetail from "@/pages/DiscountDetail";
import Subscribe from "@/pages/Subscribe";
import ClientDashboard from "@/pages/ClientDashboard";
import MerchantDashboard from "@/pages/MerchantDashboard";
import MerchantDiscount from "@/pages/MerchantDiscount";
import MerchantScan from "@/pages/MerchantScan";
import PreviewGallery from "@/pages/PreviewGallery";
import PreviewA from "@/pages/previews/PreviewA";
import PreviewB from "@/pages/previews/PreviewB";
import PreviewC from "@/pages/previews/PreviewC";
import PreviewD from "@/pages/previews/PreviewD";
import "@/App.css";

function App() {
  return (
    <div className="App bg-cream min-h-screen">
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/discounts/:id" element={<DiscountDetail />} />
            <Route path="/subscribe" element={<ProtectedRoute role="client"><Subscribe /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>} />
            <Route path="/merchant/dashboard" element={<ProtectedRoute role="merchant"><MerchantDashboard /></ProtectedRoute>} />
            <Route path="/merchant/discount" element={<ProtectedRoute role="merchant"><MerchantDiscount /></ProtectedRoute>} />
            <Route path="/merchant/scan" element={<ProtectedRoute role="merchant"><MerchantScan /></ProtectedRoute>} />
            <Route path="/preview" element={<PreviewGallery />} />
            <Route path="/preview/a" element={<PreviewA />} />
            <Route path="/preview/b" element={<PreviewB />} />
            <Route path="/preview/c" element={<PreviewC />} />
            <Route path="/preview/d" element={<PreviewD />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
