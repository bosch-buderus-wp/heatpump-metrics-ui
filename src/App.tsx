import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import "./i18n";
import { Layout } from "./components/common/layout";
import Monthly from "./pages/Monthly";
import Yearly from "./pages/Yearly";
import Daily from "./pages/Daily";
import Systems from "./pages/Systems";
import Login from "./pages/Login";
import MyAccount from "./pages/MyAccount";
import AuthCallback from "./pages/AuthCallback";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

import Home from "./pages/Home";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/yearly" element={<Yearly />} />
        <Route path="/monthly" element={<Monthly />} />
        <Route path="/daily" element={<Daily />} />
        <Route path="/systems" element={<Systems />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        {/* Redirect old dashboard route to new my-account route */}
        <Route path="/dashboard" element={<Navigate to="/my-account" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
