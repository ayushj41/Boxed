import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Community from "./pages/Community";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import { useAuth, useUser } from "@clerk/clerk-react";

// Component for protected routes
function ProtectedRoute({ children }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? children : <Navigate to="/auth" replace />;
}

function UsernameWrapper({ Component }) {
  const { username } = useParams();
  return <Component username={username} />;
}

function App() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const username = user?.username || "";

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white pb-16">
        <Routes>
          {/* Authentication Page */}
          <Route path="/auth" element={isSignedIn ? <Navigate to={`/dashboard`} replace /> : <AuthPage />} />

          {/* Protected Routes with Username */}
          <Route path="/" element={<ProtectedRoute><UsernameWrapper Component={Home} /></ProtectedRoute>} />
          <Route path="/explore/" element={<ProtectedRoute><UsernameWrapper Component={Explore} /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><UsernameWrapper Component={Dashboard} /></ProtectedRoute>} />
          <Route path="/community/:id" element={<ProtectedRoute><UsernameWrapper Component={Community} /></ProtectedRoute>} />

          {/* Fallback Route - Redirect to Username-Based Routes */}
          <Route path="*" element={isSignedIn ? <Navigate to={`/dashboard`} replace /> : <Navigate to="/auth" replace />} />
        </Routes>

        {/* Navbar appears only when logged in */}
        {isSignedIn && <Navbar />}
      </div>
    </BrowserRouter>
  );
}

export default App;
