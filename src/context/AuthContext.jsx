import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // App load hote hi token check
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.post("/auth/genrate-token");
        setAccessToken(res.data.accessToken);
        if (res.data.user) setUser(res.data.user);
      } catch (err) {
        console.log("No active session");
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // 🔥 FIX 1: Login with Try-Catch
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Invalid email or password",
      };
    }
  };

  // 🔥 FIX 2: Signup with Try-Catch
  const signup = async (name, email, password) => {
    try {
      const res = await api.post("/auth/signup", { name, email, password });
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Signup failed",
      };
    }
  };

  // 🔥 FIX 3: Verify OTP with Try-Catch
  const verifyOtp = async (email, otp) => {
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Invalid or expired OTP",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, setAccessToken, loading, login, signup, verifyOtp, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);