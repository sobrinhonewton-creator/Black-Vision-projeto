import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import ProtectedRoute from "./admin/ProtectedRoute";
import { ToastProvider } from "./components/ui/Toast";
import useAuthStore from "./store/authStore";
import useContentStore from "./store/contentStore";
import { trackPageView } from "./services/tracking";

import './styles/blackvision.css'
import './styles/pricing.css'

import Header       from './components/Header.jsx'
import Footer       from './components/Footer.jsx'
import WhatsAppFloat from './components/WhatsAppFloat.jsx'

import Hero          from './sections/Hero.jsx'
import Solutions     from './sections/Solutions.jsx'
import Process       from './sections/Process.jsx'
import About         from './sections/About.jsx'
import PricingSection from './sections/PricingSection.jsx'
import Testimonials  from './sections/Testimonials.jsx'
import Contact       from './sections/Contact.jsx'

import useCursorSpotlight from './hooks/useCursorSpotlight.js'
import useScrollReveal from './hooks/useScrollReveal.js'

import Login     from "./admin/Login";
import Dashboard from "./admin/Dashboard";

import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import NotFound from "./pages/NotFound.jsx";

// Checkout lazy-loaded — não impacta bundle do site
const CheckoutPage    = lazy(() => import("./pages/checkout/CheckoutPage.jsx"));
const CheckoutSuccess = lazy(() =>
  import("./pages/checkout/CheckoutResult.jsx").then(m => ({ default: m.CheckoutSuccess }))
);
const CheckoutFailure = lazy(() =>
  import("./pages/checkout/CheckoutResult.jsx").then(m => ({ default: m.CheckoutFailure }))
);

function LoadingSpinner() {
  return (
    <div style={{ minHeight:"100svh", display:"flex", alignItems:"center", justifyContent:"center", background:"#080808" }}>
      <div style={{ width:32, height:32, border:"3px solid rgba(201,168,76,.2)", borderTopColor:"#c9a84c", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

export default function App() {
  const { restoreSession } = useAuthStore();
  const { fetchContent } = useContentStore();

  useEffect(() => {
    restoreSession();
    fetchContent();
    trackPageView();
  }, []);

  useCursorSpotlight()
  useScrollReveal()

  return (
    <ToastProvider>
      <Router>
      <Routes>

        {/* ── SITE NORMAL ── */}
        <Route path="/" element={
          <>
            <div className="bg-grid" aria-hidden="true" />
            <Header />
            <Hero />
            <Solutions />
            <Process />
            <About />
            <PricingSection />
            <Testimonials />
            <Contact />
            <Footer />
            <WhatsAppFloat />
          </>
        } />

        {/* ── CHECKOUT ── */}
        <Route path="/checkout" element={
          <Suspense fallback={<LoadingSpinner />}>
            <CheckoutPage />
          </Suspense>
        } />
        <Route path="/checkout/success" element={
          <Suspense fallback={<LoadingSpinner />}>
            <CheckoutSuccess />
          </Suspense>
        } />
        <Route path="/checkout/failure" element={
          <Suspense fallback={<LoadingSpinner />}>
            <CheckoutFailure />
          </Suspense>
        } />

        {/* ── ADMIN ── */}
        <Route path="/admin" element={<Login />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ── EXTRAS ── */}
        <Route path="/termos" element={<Terms />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
    </ToastProvider>
  );
}
