import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Community from "./pages/Community";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import Explore from "./pages/Explore";

// Component for protected routes
function ProtectedRoute({ children }) {
  const username = localStorage.getItem("username");
  return username ? children : <Navigate to="/auth" replace />;
}

function UsernameWrapper({ Component }) {
  const { username } = useParams();
  return <Component username={username} />;
}

function App() {
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  useEffect(() => {
    if (username) {
      localStorage.setItem("username", username);
    } else {
      localStorage.removeItem("username");
    }
  }, [username]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white pb-16">
        <Routes>
          {/* Authentication Page */}
          {/* <Route path="/auth" element={username ? <Navigate to={`/${username}/dashboard`} replace /> : <AuthPage setUsername={setUsername} />} /> */}
          <Route path="/auth" element={ username ? <Navigate to={`/${username}/dashboard`} replace /> : <AuthPage setUsername={setUsername} />
} />

          {/* Protected Routes with Username */}
          <Route path="/:username" element={<ProtectedRoute><UsernameWrapper Component={Home} /></ProtectedRoute>} />
          <Route path="/:username/explore/" element={<ProtectedRoute><UsernameWrapper Component={Explore} /></ProtectedRoute>} />
          <Route path="/:username/dashboard" element={<ProtectedRoute><UsernameWrapper Component={Dashboard} /></ProtectedRoute>} />
          <Route path="/:username/community/:id" element={<ProtectedRoute><UsernameWrapper Component={Community} /></ProtectedRoute>} />

          {/* Fallback Route - Redirect to Username-Based Routes */}
          <Route path="*" element={username ? <Navigate to={`/${username}/dashboard`} replace /> : <Navigate to="/auth" replace />} />
        </Routes>

        {/* Navbar appears only when logged in */}
        {username && <Navbar />}
      </div>
    </BrowserRouter>
  );
}

export default App;
