import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const me = await authAPI.getMe();
          setArtist(me);
        } catch {
          await AsyncStorage.removeItem('token');
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    await AsyncStorage.setItem('token', res.token);
    setArtist(res.artist);
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    await AsyncStorage.setItem('token', res.token);
    setArtist(res.artist);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setArtist(null);
  };

  const updateArtist = (data) => setArtist((prev) => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ artist, loading, login, register, logout, updateArtist }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
