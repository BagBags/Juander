// src/contexts/UserContext.jsx
import React, { createContext, useState } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(
    JSON.parse(localStorage.getItem("admin")) || null
  );

  return (
    <UserContext.Provider value={{ currentAdmin, setCurrentAdmin }}>
      {children}
    </UserContext.Provider>
  );
};
