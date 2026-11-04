import React, { createContext, useContext, useState, useEffect } from "react";
import { getSession, setSession, clearSession, HospitalAPI } from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);    // session data from API login

  useEffect(() => {
    let hospitalSession = null;
    try {
      hospitalSession = JSON.parse(localStorage.getItem("hospital") || "null");
    } catch {
      hospitalSession = null;
    }

    const s = getSession() || hospitalSession;
    if (s) setUser(s);
  }, []);

  const login = async (data) => {
    const hospitalRes = await HospitalAPI.getById(data.hospitalId);
    const sessionData = {
      ...data,
      hospitalInfo: hospitalRes.data,
    };

    setSession(sessionData);
    localStorage.setItem("hospital", JSON.stringify(sessionData));
    setUser(sessionData);
  };

  const logout = () => {
    clearSession();
    localStorage.removeItem("hospital");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
