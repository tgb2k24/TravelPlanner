import React from 'react';
import { BackHandler } from 'react-native';
import { ModalPortal } from 'react-native-modals';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { AuthProvider } from './AuthContext';
import StackNavigator from './navigation/StackNavigator';

// Polyfill for deprecated BackHandler.removeEventListener (fixes react-native-modals crash)
if (typeof (BackHandler as any).removeEventListener !== 'function') {
  const handlers = new Map();
  const originalAdd = BackHandler.addEventListener;

  // @ts-ignore
  BackHandler.addEventListener = (eventName: string, handler: any) => {
    const subscription = originalAdd(eventName as "hardwareBackPress", handler);
    if (!handlers.has(eventName)) {
      handlers.set(eventName, new Map());
    }
    handlers.get(eventName).set(handler, subscription);
    return subscription;
  };

  // @ts-ignore
  BackHandler.removeEventListener = (eventName: string, handler: any) => {
    if (handlers.has(eventName)) {
      const subscription = handlers.get(eventName).get(handler);
      if (subscription) {
        subscription.remove();
        handlers.get(eventName).delete(handler);
      }
    }
  };
}

// Ensure AntDesign font is loaded to avoid missing glyph warnings
AntDesign.loadFont();

import { useFonts } from 'expo-font';

// ...

const App: React.FC = () => {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay': require('./assets/fonts/PlayfairDisplay-VariableFont_wght.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <StackNavigator />
      <ModalPortal />
    </AuthProvider>
  );
};

export default App;
