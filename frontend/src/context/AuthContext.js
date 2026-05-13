import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { authAPI } from '../services/api';
import { registerForPushNotifications } from '../services/pushNotifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const me = await authAPI.getMe();
          setArtist(me);
          registerForPushNotifications(); // re-register token on each app open
        } catch {
          await AsyncStorage.removeItem('token');
        }
      }
      setLoading(false);
    })();

    // Listen for notifications received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    await AsyncStorage.setItem('token', res.token);
    setArtist(res.artist);
    registerForPushNotifications();
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    await AsyncStorage.setItem('token', res.token);
    setArtist(res.artist);
    registerForPushNotifications();
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
