import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ClientsScreen from '../screens/clients/ClientsScreen';
import ClientDetailScreen from '../screens/clients/ClientDetailScreen';
import AddClientScreen from '../screens/clients/AddClientScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import AddAppointmentScreen from '../screens/appointments/AddAppointmentScreen';
import AppointmentDetailScreen from '../screens/appointments/AppointmentDetailScreen';
import ServicesScreen from '../screens/services/ServicesScreen';
import PortfolioScreen from '../screens/portfolio/PortfolioScreen';
import AddPortfolioScreen from '../screens/portfolio/AddPortfolioScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import QRCodeScreen from '../screens/profile/QRCodeScreen';
import PaymentsScreen from '../screens/payments/PaymentsScreen';
import AIAssistantScreen from '../screens/ai/AIAssistantScreen';
import ReviewsScreen from '../screens/reviews/ReviewsScreen';
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import CustomerBookScreen from '../screens/customer/CustomerBookScreen';
import CustomerFeedbackScreen from '../screens/customer/CustomerFeedbackScreen';
import ArtistListScreen from '../screens/customer/ArtistListScreen';
import ArtistProfileScreen from '../screens/customer/ArtistProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'home' : 'home-outline',
            Clients: focused ? 'people' : 'people-outline',
            Appointments: focused ? 'calendar' : 'calendar-outline',
            Portfolio: focused ? 'images' : 'images-outline',
            Reviews: focused ? 'star' : 'star-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { artist, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {role === 'admin' ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
            <Stack.Screen name="AddClient" component={AddClientScreen} />
            <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} />
            <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
            <Stack.Screen name="Services" component={ServicesScreen} />
            <Stack.Screen name="AddPortfolio" component={AddPortfolioScreen} />
            <Stack.Screen name="Payments" component={PaymentsScreen} />
            <Stack.Screen name="QRCode" component={QRCodeScreen} />
            <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
          </>
        ) : role === 'customer' ? (
          <>
            <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
            <Stack.Screen name="ArtistList" component={ArtistListScreen} />
            <Stack.Screen name="ArtistProfile" component={ArtistProfileScreen} />
            <Stack.Screen name="CustomerBook" component={CustomerBookScreen} />
            <Stack.Screen name="CustomerFeedback" component={CustomerFeedbackScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
