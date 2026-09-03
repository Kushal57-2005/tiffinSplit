import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { GoogleCallback } from "./pages/GoogleCallback";
import { Dashboard } from "./pages/Dashboard";
import { Friends } from "./pages/Friends";
import { FriendForm } from "./pages/FriendForm";
import { FriendDetail } from "./pages/FriendDetail";
import { MealEntries } from "./pages/MealEntries";
import { MealEntryForm } from "./pages/MealEntryForm";
import { Invoices } from "./pages/Invoices";
import { InvoiceGenerate } from "./pages/InvoiceGenerate";
import { InvoiceDetail } from "./pages/InvoiceDetail";
import { PublicInvoice } from "./pages/PublicInvoice";
import { Payments } from "./pages/Payments";
import { PaymentForm } from "./pages/PaymentForm";
import { Members } from "./pages/Members";
import { Settings } from "./pages/Settings";
import { Activity } from "./pages/Activity";
import { LoadingSpinner } from "./components/UI/LoadingSpinner";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { OfflineBanner } from "./components/OfflineBanner";

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication session..." />;
  }

  if (!token) {
    return <Navigate to="/landing" replace />;
  }

  return children;
}

function HomeRoute() {
  const { loading } = useAuth();
  if (loading) return <LoadingSpinner message="Loading TiffinSplit..." />;
  return <Landing />;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <OfflineBanner />
          <BrowserRouter>
            <Routes>
              {/* Public Landing & Auth Routes */}
              <Route path="/" element={<HomeRoute />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/api/auth/callback/google"
                element={<GoogleCallback />}
              />
              <Route
                path="/invoices/view/:invoiceId"
                element={<PublicInvoice />}
              />

              {/* Protected Workspace Routes (With Sidebar & Topbar Layout) */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="friends" element={<Friends />} />
                <Route path="friends/new" element={<FriendForm />} />
                <Route path="friends/:friendId/edit" element={<FriendForm />} />
                <Route path="friends/:friendId" element={<FriendDetail />} />
                <Route path="entries" element={<MealEntries />} />
                <Route path="entries/new" element={<MealEntryForm />} />
                <Route
                  path="entries/:entryId/edit"
                  element={<MealEntryForm />}
                />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/generate" element={<InvoiceGenerate />} />
                <Route path="invoices/:invoiceId" element={<InvoiceDetail />} />
                <Route path="payments" element={<Payments />} />
                <Route path="payments/new" element={<PaymentForm />} />
                <Route path="members" element={<Members />} />
                <Route path="settings" element={<Settings />} />
                <Route path="activity" element={<Activity />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <PWAInstallPrompt />
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
