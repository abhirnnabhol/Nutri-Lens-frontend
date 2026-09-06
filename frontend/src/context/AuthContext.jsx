import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("nutrilens_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() =>
    localStorage.getItem("nutrilens_token"),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiClient
        .get("/auth/me")
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem("nutrilens_user", JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem("nutrilens_token");
          localStorage.removeItem("nutrilens_user");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await apiClient.post("/auth/login", { email, password });
    if (res.token) {
      localStorage.setItem("nutrilens_token", res.token);
      localStorage.setItem("nutrilens_user", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res.user;
  };

  const register = async (email, password, fullName) => {
    const res = await apiClient.post("/auth/register", {
      email,
      password,
      fullName,
    });
    if (res.token) {
      localStorage.setItem("nutrilens_token", res.token);
      localStorage.setItem("nutrilens_user", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res.user;
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("nutrilens_token");
      localStorage.removeItem("nutrilens_user");
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      if (res.user) {
        setUser(res.user);
        localStorage.setItem("nutrilens_user", JSON.stringify(res.user));
        return res.user;
      }
    } catch {
      // Silently fail if unauthenticated
    }
    return null;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("nutrilens_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
