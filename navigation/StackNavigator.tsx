import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import AiAgent from '../screens/AgenticAI/AiAgent';
import AiScreen from '../screens/AiScreen';
import CafeScreen from '../screens/Cafe';
import ChooseImage from '../screens/ChooseImage';
import CreateTrip from '../screens/CreateTrip';
import DefineActivity from '../screens/DefineActivity';
import EmailAuthScreen from '../screens/EmailAuthScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MapScreen from '../screens/MapScreen';
import NewActivity from '../screens/NewActivity';
import RegisterScreen from '../screens/RegisterScreen';
import RestaurantsScreen from '../screens/Restaurants';
import SettingsScreen from '../screens/Settings';
import TripPlanScreen from '../screens/TripPlanScreen';
import TripScreen from '../screens/TripScreen';

import { AuthContext } from '../AuthContext';

/* ----------------------------------
   Navigation Param List
----------------------------------- */
export type RootStackParamList = {
  Login: undefined;
  Trip: { item: any } | undefined;
  Register: undefined;
  Home: undefined;
  Plan: { item: any; user: any } | undefined;
  Create: { image?: string } | undefined;
  Choose: undefined;
  Activity: undefined;
  Define: undefined;
  Map: undefined;
  Ai: { name: string; tripId?: string } | undefined;
  AiAgent: undefined;
  EmailAuth: { isSignUp?: boolean } | undefined;
  Restaurants: { location: string } | undefined;
  Cafe: { location: string } | undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
};

const StackNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const { token } = useContext(AuthContext);

  /* ----------------------------------
     Check Stored Token
  ----------------------------------- */
  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  /* ----------------------------------
     Auth Stack
  ----------------------------------- */
  const AuthStack = (): React.ReactElement => (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
    </Stack.Navigator>
  );

  /* ----------------------------------
     Main App Stack
  ----------------------------------- */
  const MainStack = (): React.ReactElement => (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Plan" component={TripPlanScreen} />
      <Stack.Screen name="Create" component={CreateTrip} />
      <Stack.Screen name="Choose" component={ChooseImage} />
      <Stack.Screen name="Trip" component={TripScreen} />
      <Stack.Screen name="Activity" component={NewActivity} />
      <Stack.Screen name="Define" component={DefineActivity} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Ai" component={AiScreen} />
      <Stack.Screen name="AiAgent" component={AiAgent} />
      <Stack.Screen name="Restaurants" component={RestaurantsScreen} />
      <Stack.Screen name="Cafe" component={CafeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );

  return (
    <NavigationContainer>
      {token ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default StackNavigator;

const styles = StyleSheet.create({});
