import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { authAPI, customerAuthAPI } from '../services/api';
import { registerForPushNotifications } from '../services/pushNotifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [artist, setArtist] = useState(null);      // admin user
  const [customer, setCustomer] = useState(null);  // customer user
  const [role, setRole] = useState(null);          // 'admin' | 'customer' | null
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    (async () => {
      const [adminToken, customerToken] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('customerToken'),
      ]);
      if (adminToken) {
        try {
          const me = await authAPI.getMe();
          setArtist(me);
          setRole('admin');
          registerForPushNotifications();
        } catch {
          await AsyncStorage.removeItem('token');
        }
      } else if (customerToken) {
        try {
          const me = await customerAuthAPI.getMe();
          setCustomer(me);
          setRole('customer');
        } catch {
          await AsyncStorage.removeItem('customerToken');
        }
      }
      setLoading(false);
    })();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {});
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Admin login
  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    await AsyncStorage.setItem('token', res.token);
    setArtist(res.artist);
    setRole('admin');
    registerForPushNotifications();
  };

  // Admin register
  const register = async (data) => {
    const res = await authAPI.register(data);
    await AsyncStorage.setItem('token', res.token);
    setArtist(res.artist);
    setRole('admin');
    registerForPushNotifications();
  };

  // Customer login
  const customerLogin = async (email, password) => {
    const res = await customerAuthAPI.login({ email, password });
    await AsyncStorage.setItem('customerToken', res.token);
    setCustomer(res.customer);
    setRole('customer');
  };

  // Customer register
  const customerRegister = async (data) => {
    const res = await customerAuthAPI.register(data);
    await AsyncStorage.setItem('customerToken', res.token);
    setCustomer(res.customer);
    setRole('customer');
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem('token'),
      AsyncStorage.removeItem('customerToken'),
    ]);
    setArtist(null);
    setCustomer(null);
    setRole(null);
  };

  const updateArtist = (data) => setArtist((prev) => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ artist, customer, role, loading, login, register, customerLogin, customerRegister, logout, updateArtist }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
