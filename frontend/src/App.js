import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import LegalFooter from "@/components/LegalFooter";
import CookieBanner from "@/components/CookieBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import CookiePolicy from "@/pages/legal/CookiePolicy";
import Termini from "@/pages/legal/Termini";
import Recesso from "@/pages/legal/Recesso";
import Support from "@/pages/Support";
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
import AdminDashboard from "@/pages/AdminDashboard";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import MapView from "@/pages/MapView";
import SetupSecurity from "@/pages/SetupSecurity";
import ForgotPassword from "@/pages/ForgotPassword";
import ForgotPin from "@/pages/ForgotPin";
import ResetPassword from "@/pages/ResetPassword";
import QRVerify from "@/pages/QRVerify";
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
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/setup-security" element={<ProtectedRoute><SetupSecurity /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forgot-pin" element={<ForgotPin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/qr/:token" element={<QRVerify />} />
            <Route path="/qr" element={<QRVerify />} />
            <Route path="/preview" element={<PreviewGallery />} />
            <Route path="/preview/a" element={<PreviewA />} />
            <Route path="/preview/b" element={<PreviewB />} />
            <Route path="/preview/c" element={<PreviewC />} />
            <Route path="/preview/d" element={<PreviewD />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/termini" element={<Termini />} />
            <Route path="/recesso" element={<Recesso />} />
            <Route path="/support" element={<Support />} />
          </Routes>
          <LegalFooter />
          <CookieBanner />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
