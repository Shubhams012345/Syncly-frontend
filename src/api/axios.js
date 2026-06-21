import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});

let accessTokenRef = { current: null };
let setAccessTokenRef = null;

export const registerAuthHandlers = (getToken, setToken) => {
  accessTokenRef = getToken;
  setAccessTokenRef = setToken;
};

api.interceptors.request.use((config) => {
  if (accessTokenRef.current) {
    config.headers.Authorization = `Bearer ${accessTokenRef.current}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    
    // 🔥 FIX: Agar refresh token request khud 401 de rahi hai, toh direct reject karo, loop mat banao
    if (originalRequest.url === "/auth/genrate-token") {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Safe endpoint call using clean axios config to prevent recursion
        const res = await axios.post("http://localhost:8000/api/auth/genrate-token", {}, { withCredentials: true });
        
        accessTokenRef.current = res.data.accessToken;
        if (setAccessTokenRef) setAccessTokenRef(res.data.accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        // Refresh token fail matlab session end, user ko clean up karna padega
        if (setAccessTokenRef) setAccessTokenRef(null);
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default api;