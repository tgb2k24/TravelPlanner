import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import 'core-js/stable/atob';
import { jwtDecode } from 'jwt-decode';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { AuthContext } from '../AuthContext';
import { API_URL } from '../constants/config';
import { RootStackParamList } from '../navigation/StackNavigator';
import { useTheme } from '../ThemeContext';

/* ----------------------------------
   Types & Interfaces
----------------------------------- */

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface DecodedToken {
  userId: string;
}

interface Trip {
  _id: string;
  tripName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  background: string;
}

interface User {
  _id: string;
  name?: string;
  email?: string;
}

/* ----------------------------------
   Component
----------------------------------- */

const HomeScreen: React.FC = () => {
  const currentYear: number = moment().year();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const isFocused = useIsFocused();

  const { userId, setUserId, setToken } = useContext(AuthContext);

  /* ----------------------------------
     Decode JWT & Get UserId
  ----------------------------------- */
  useEffect(() => {
    const fetchUser = async (): Promise<void> => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserId(decoded.userId);
      }
    };
    fetchUser();
  }, []);

  /* ----------------------------------
     Fetch User Data
  ----------------------------------- */
  useEffect(() => {
    if (userId && isFocused) {
      fetchUserData();
      fetchTrips();
    }
  }, [userId, isFocused]);

  useEffect(() => {
    const checkLastCreated = async (): Promise<void> => {
      try {
        const raw = await AsyncStorage.getItem('lastCreatedTrip');
        if (raw) {
          const newTrip: Trip = JSON.parse(raw);
          setTrips((prev) => [newTrip, ...prev]);
          await AsyncStorage.removeItem('lastCreatedTrip');
        }
      } catch (err) {
        console.warn('Error reading lastCreatedTrip', err);
      }
    };

    if (isFocused) checkLastCreated();
  }, [isFocused]);

  const fetchUserData = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${API_URL}/user/${userId}`
      );
      const data: User = await response.json();
      setUser(data);
    } catch (error) {
      console.log('Error fetching user:', error);
    }
  };

  const fetchTrips = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${API_URL}/trips/${userId}`
      );
      const data: Trip[] = await response.json();
      setTrips(data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     Logout
  ----------------------------------- */
  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authToken');
      setToken('');
    } catch (error) {
      console.log('Error', error);
    }
  };

  /* ----------------------------------
     UI
  ----------------------------------- */

  const deleteTrip = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/trips/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTrips((prevTrips) => prevTrips.filter((trip) => trip._id !== id));
      } else {
        console.error('Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const handleLongPress = (id: string) => {
    setSelectedTripId(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (selectedTripId) {
      deleteTrip(selectedTripId);
      setDeleteModalVisible(false);
      setSelectedTripId(null);
    }
  };

  /* ----------------------------------
     Hook
  ----------------------------------- */
  const { theme, colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={[styles.modalView, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalText, { color: colors.text }]}>Delete Trip</Text>
              <Text style={[styles.modalDescription, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
                Are you sure you want to delete this trip?
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setDeleteModalVisible(false)}>
                  <Text style={styles.textStyle}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonDelete]}
                  onPress={confirmDelete}>
                  <Text style={styles.textStyle}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons onPress={logout} name="person" size={30} color="orange" />
            <View style={styles.headerIcons}>
              <Pressable onPress={() => navigation.navigate('Create')}>
                <AntDesign name="plus" size={30} color="orange" />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Settings')}>
                <AntDesign name="setting" size={30} color="orange" />
              </Pressable>
            </View>
          </View>

          {/* Title */}
          <View style={{ padding: 10 }}>
            <Text style={[styles.title, { color: colors.text }]}>My Trips</Text>
            <Text style={styles.year}>{currentYear}</Text>
          </View>

          {/* Trips */}
          <View style={{ padding: 15 }}>
            {trips.map((item) => (
              <Pressable
                key={item._id}
                style={{ marginTop: 15 }}
                onLongPress={() => handleLongPress(item._id)}
                onPress={() =>
                  navigation.navigate('Plan', { item, user })
                }>
                <ImageBackground
                  imageStyle={{ borderRadius: 10 }}
                  style={{ width: '100%', height: 220 }}
                  source={{ uri: item.background }}>
                  <View style={styles.tripHeader}>
                    <Text style={styles.tripText}>
                      {item.startDate} - {item.endDate}
                    </Text>
                    <Text style={styles.tripText}>
                      {moment(item.createdAt).format('MMMM Do')}
                    </Text>
                  </View>
                  <Text style={styles.tripName}>{item.tripName}</Text>
                </ImageBackground>
              </Pressable>
            ))}
          </View>

          {/* CTA */}
          <View style={styles.cta}>
            <Text style={[styles.ctaTitle, { color: colors.text }]}>Organize your next trip</Text>
            <Text style={styles.ctaDesc}>
              Create your next trip and plan the activities of your itinerary
            </Text>

            <Pressable
              onPress={() => navigation.navigate('Create')}
              style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Create a Trip</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;

/* ----------------------------------
   Styles
----------------------------------- */

const styles = StyleSheet.create({
  header: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  year: {
    marginTop: 6,
    fontSize: 19,
    color: 'orange',
    fontWeight: '600',
  },
  tripHeader: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripText: {
    fontSize: 17,
    color: 'white',
    fontWeight: 'bold',
  },
  tripName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 15,
  },
  cta: {
    marginTop: 1,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  ctaDesc: {
    marginTop: 15,
    color: 'gray',
    width: 250,
    textAlign: 'center',
    fontSize: 16,
  },
  ctaButton: {
    marginTop: 25,
    backgroundColor: '#383838',
    padding: 14,
    width: 200,
    borderRadius: 25,
  },
  ctaButtonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  modalDescription: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    minWidth: 100,
  },
  buttonCancel: {
    backgroundColor: 'gray',
  },
  buttonDelete: {
    backgroundColor: 'red',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
