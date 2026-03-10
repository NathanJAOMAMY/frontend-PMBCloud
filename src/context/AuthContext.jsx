import React, { useContext, createContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

// Création du context
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('userInfo'); // Récupère les données utilisateur
    if (savedUser) {
      setUserInfo(JSON.parse(savedUser)); // Charge les données persistées dans le contexte
    }
  }, []);

  const login = (userDb) => {
    setUserInfo(userDb)
    localStorage.setItem('userInfo', JSON.stringify(userDb));
  }

  const logout = () => {
    setUserInfo(null)
    localStorage.removeItem('userInfo'); // Supprime les données persistées
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; // Supprime le cookie
  }

  return (
    <AuthContext.Provider value={{ userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}