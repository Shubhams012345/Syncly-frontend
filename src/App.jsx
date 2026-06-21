import { useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { registerAuthHandlers } from "./api/axios";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";
import ChatPage from "./pages/ChatPage";

function App() {
  const { accessToken, setAccessToken, user, loading } = useAuth();
  const tokenRef = useRef(accessToken);

  useEffect(() => {
    tokenRef.current = accessToken;
    // Context ke token handlers ko axios core interceptor se register karo
    if (setAccessToken) {
      registerAuthHandlers(tokenRef, setAccessToken);
    }
  }, [accessToken, setAccessToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/chat" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/verify-otp" />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;