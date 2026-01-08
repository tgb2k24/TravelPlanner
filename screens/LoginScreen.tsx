import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  User,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useContext, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { AuthContext } from '../AuthContext';
import { API_URL, GOOGLE_WEB_CLIENT_ID } from '../constants/config';
import { RootStackParamList } from '../navigation/StackNavigator';
import { useTheme } from '../ThemeContext';

/* ----------------------------------
   Types
----------------------------------- */
interface BackendLoginResponse {
  token: string;
}

type GoogleLoginResponse = User & {
  idToken?: string | null;
  data?: {
    idToken?: string | null;
  };
};

/* ----------------------------------
   Component
----------------------------------- */
const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setToken } = useContext(AuthContext);

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  /* ----------------------------------
     Google Sign-In Configuration
  ----------------------------------- */
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
    });
  }, []);

  /* ----------------------------------
     Google Login Helper
  ----------------------------------- */
  const googleLogin = async (): Promise<GoogleLoginResponse> => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResponse = await GoogleSignin.signIn();

    // Check if the user cancelled the sign-in
    if (!isSuccessResponse(signInResponse)) {
      throw new Error('Google sign-in was cancelled');
    }

    return signInResponse.data as GoogleLoginResponse;
  };

  /* ----------------------------------
     Google Login Handler
  ----------------------------------- */
  const handleGoogleLogin = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const response = await googleLogin();

      const extractedIdToken =
        response.idToken || response.data?.idToken;

      if (!extractedIdToken) {
        throw new Error('Google ID Token not found');
      }

      const backendResponse = await fetch(`${API_URL}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: extractedIdToken,
        }),
      }).catch((fetchError) => {
        console.error('Fetch error:', fetchError);
        throw new Error('Cannot connect to server. Please check if the backend is running and you are on the same Wi-Fi.');
      });

      console.log('Response status:', backendResponse.status);

      if (!backendResponse.ok) {
        try {
          const errorData = await backendResponse.json();
          throw new Error(errorData.message || `HTTP error! status: ${backendResponse.status}`);
        } catch (jsonError) {
          throw new Error(`Server error: ${backendResponse.status} ${backendResponse.statusText}`);
        }
      }

      const data: BackendLoginResponse = await backendResponse.json();
      const { token } = data;

      console.log('Login successful, saving token');
      await AsyncStorage.setItem('authToken', token);
      setToken(token);
    } catch (err: unknown) {
      console.log('Login Error:', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     Hook
  ----------------------------------- */
  const { colors } = useTheme();

  /* ----------------------------------
     UI
  ----------------------------------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ marginTop: 30, alignItems: 'center' }}>
        <Image
          style={{ width: 240, height: 80, resizeMode: 'contain' }}
          source={{ uri: 'https://wanderlog.com/assets/logoWithText.png' }}
        />
      </View>

      <View style={{ marginTop: 70 }}>
        {/* Facebook Button */}
        <View style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <AntDesign
            style={styles.leftIcon}
            name="facebook"
            size={24}
            color="blue"
          />
          <Text style={[styles.socialText, { color: colors.text }]}>Sign Up With Facebook</Text>
        </View>

        {/* Google Button */}
        <Pressable
          onPress={handleGoogleLogin}
          disabled={loading}
          style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <AntDesign
            style={styles.leftIcon}
            name="google"
            size={24}
            color="red"
          />
          <Text style={[styles.socialText, { color: colors.text }]}>
            {loading ? 'Signing In...' : 'Sign Up With Google'}
          </Text>
        </Pressable>

        {/* Email Button */}
        <Pressable
          onPress={() => navigation.navigate('EmailAuth')}
          style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <AntDesign
            style={styles.leftIcon}
            name="mail"
            size={24}
            color={colors.text}
          />
          <Text style={[styles.socialText, { color: colors.text }]}>Sign Up With Email</Text>
        </Pressable>

        {/* Error Message */}
        {error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>
            {error}
          </Text>
        ) : null}

        {/* Sign In */}
        <Pressable
          onPress={() => navigation.navigate('EmailAuth', { isSignUp: false })}
          style={{ marginTop: 12 }}>
          <Text style={{ textAlign: 'center', fontSize: 15, color: 'gray' }}>
            Already have an account? Sign In
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

/* ----------------------------------
   Styles
----------------------------------- */
const styles = StyleSheet.create({
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'center',
    borderColor: '#E0E0E0',
    margin: 12,
    borderWidth: 1,
    borderRadius: 25,
    marginTop: 20,
    position: 'relative',
  },
  leftIcon: {
    position: 'absolute',
    left: 10,
  },
  socialText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    color: 'black',
  },
});
