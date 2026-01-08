import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Modal, { BottomModal, ModalContent, ModalTitle, SlideAnimation } from 'react-native-modals';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Place from '../components/Place';
import { API_URL } from '../constants/config';
import { useTheme } from '../ThemeContext';

export type RootStackParamList = {
  Plan: { item: any; user: any }; // Match the name in StackNavigator
  Ai: { name: string };
  Map: { places: any[] };
  Create: undefined;
};

type TripPlanRouteProp = RouteProp<RootStackParamList, 'Plan'>;

const TripPlanScreen = () => {
  const route = useRoute<TripPlanRouteProp>();
  const navigation = useNavigation<any>();

  // State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [openShareModal, setOpenShareModal] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);

  const [option, setOption] = useState<string>('Overview');
  const [expenses, setExpenses] = useState<any[]>([]); // Should be IExpense[]
  const [placeDetails, setPlaceDetails] = useState<any[]>([]);
  const [itinerary, setItinerary] = useState<any[]>([]); // Should be IItinerary[]
  const [places, setPlaces] = useState<any[]>([]); // Should be IPlace[]

  const [price, setPrice] = useState<string | number>(0);
  const [budget, setBudget] = useState<string>('');

  const [isPaidByExpanded, setPaidByExpanded] = useState<boolean>(false);
  const [isSplitExpanded, setSplitExpanded] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [paidBy, setPaidBy] = useState<string>('');

  const [email, setEmail] = useState<string>('');
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);

  const [input, setInput] = useState<string>('');
  const inputRef = useRef<TextInput>(null);

  const [openingHours, setOpeningHours] = useState<any>('');
  const [name, setName] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [reviews, setReviews] = useState<any>('');
  const [photos, setPhotos] = useState<any>('');

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [modalView, setModalView] = useState<string>('original');
  const [items, setItems] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [recommendedPlaces, setRecommendedPlaces] = useState<any[]>([]);

  const tripId = route?.params?.item?._id;
  const senderName = route?.params?.item?.tripName;
  const tripName = route?.params?.item?.tripName;
  const photo = route?.params?.item?.background; // Using background as photo wasn't in type definition

  // Logic
  const formatDate = (date: any) => {
    if (!date || date === 'Invalid date') return '';
    // Try parsing with specific formats first
    let m = moment(date, ['YYYY-MM-DD', 'DD MMMM YYYY'], true);
    if (!m.isValid()) {
      m = moment(date); // Fallback to loose parsing
    }
    if (!m.isValid()) return date;
    return m.format('D MMM');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (input: string) => {
    setEmail(input);
    setIsValidEmail(validateEmail(input));
  };

  const openPlacesInMap = () => {
    const validPlaces = places.filter(
      (place) =>
        place.geometry &&
        place.geometry.location &&
        place.geometry.location.lat &&
        place.geometry.location.lng
    );

    if (validPlaces.length === 0) {
      Alert.alert('No places found', 'Add places to your itinerary to view them on the map.');
      return;
    }

    const destination = validPlaces[validPlaces.length - 1];
    const destLat = destination.geometry.location.lat;
    const destLng = destination.geometry.location.lng;
    const destinationQuery = `${destLat},${destLng}`;

    const waypoints = validPlaces.slice(0, validPlaces.length - 1);
    const waypointsQuery = waypoints
      .map((p) => `${p.geometry.location.lat},${p.geometry.location.lng}`)
      .join('|');

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}&waypoints=${waypointsQuery}`;

    Linking.openURL(url).catch((err) =>
      console.error('An error occurred', err)
    );
  };

  const handleSendInvite = async () => {
    if (isValidEmail) {
      try {
        const response = await fetch(
          `${API_URL}/sendInviteEmail`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              tripId,
              tripName,
              senderName,
            }),
          }
        );

        if (response.status === 200) {
          console.log('Invitation sent successfully');
          setOpenShareModal(false);
        } else {
          console.log('Failed to send invitation');
        }
      } catch (error) {
        console.error('Error sending invite email:', error);
      } finally {
        setEmail('');
      }
    } else {
      Alert.alert('Invalid Email', 'Please enter a valid email.');
    }
  };

  const togglePaidBy = () => setPaidByExpanded(!isPaidByExpanded);
  const toggleSplit = () => setSplitExpanded(!isSplitExpanded);

  useEffect(() => {
    if (inputRef.current) {
      // inputRef.current.focus(); // Autofocus might be annoying or cause issues if not carefully placed
    }
  }, []);

  const fetchPlaceDetails = async (placeId: string) => {
    const API_KEY = 'AIzaSyAaJ7VzIGk_y8dvrx2b4yya119jQVZJnNs';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data: any = await response.json();
      const details = data.result;

      if (!details) {
        console.log('No details found for placeId:', placeId);
        return;
      }

      const openingHours = details.opening_hours?.weekday_text || [];
      const phoneNumber = details.formatted_phone_number || '';
      const website = details.website || '';
      const reviews = details.reviews || [];
      const photos = details.photos || [];

      const geometry = details?.geometry;

      setOpeningHours(openingHours);
      setNumber(phoneNumber);
      setWebsite(website);
      setReviews(reviews);
      setPhotos(photos);

      try {
        const response = await fetch(
          `${API_URL}/trip/${tripId}/addPlace`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              placeId: placeId,
            }),
          }
        );
        const data: any = await response.json();

        console.log('Updated Trip:', data);

        if (response.status == 200) {
          setModalVisible(false);
        }
      } catch (error) {
        console.error('Error adding place to trip:', error);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const fetchPlacesToVisit = async () => {
    try {
      const response = await fetch(
        `${API_URL}/trip/${tripId}/placesToVisit`,
      );
      const placesToVisit = await response.json();
      setPlaces(placesToVisit);
    } catch (error) {
      console.error('Error fetching places to visit:', error);
      setPlaces([]);
    }
  };

  useEffect(() => {
    fetchPlacesToVisit();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlacesToVisit();
    }, [modalVisible]),
  );

  useEffect(() => {
    const fetchRecommendedPlaces = async () => {
      try {
        const queryParams = new URLSearchParams({
          query: `tourist attractions in ${tripName}`,
          key: 'AIzaSyAaJ7VzIGk_y8dvrx2b4yya119jQVZJnNs',
        }).toString();

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?${queryParams}`
        );
        const data: any = await response.json();
        if (data.status === 'OK') {
          setRecommendedPlaces(data.results.slice(0, 10));
        } else {
          console.error('Text Search API Error:', data.status, data.error_message);
        }
      } catch (error) {
        console.error('Error fetching recommended places:', error);
      }
    };

    if (tripName) {
      fetchRecommendedPlaces();
    }
  }, []);

  const fetchDetails = async (placeId: string) => {
    const API_KEY = 'AIzaSyAaJ7VzIGk_y8dvrx2b4yya119jQVZJnNs';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
    try {
      const response = await fetch(url);
      const data: any = await response.json();
      const details = data.result;
      return details;
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const fetchAllPlaceDetails = async () => {
    const detailsPromises = recommendedPlaces
      .slice(0, 10)
      .map((place) => fetchDetails(place.place_id));
    const fetchedDetails = await Promise.all(detailsPromises);
    const validDetails = fetchedDetails.filter((details) => details !== null);
    setPlaceDetails(validDetails);
  };

  useEffect(() => {
    if (recommendedPlaces.length > 0) {
      fetchAllPlaceDetails();
    }
  }, [recommendedPlaces]);

  const fetchItinerary = async () => {
    try {
      const response = await fetch(
        `${API_URL}/trip/${tripId}/itinerary`,
      );
      const itinerary = await response.json();
      setItinerary(itinerary);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
    }
  };

  useEffect(() => {
    fetchItinerary();
  }, [modalVisible]);

  const setOpenModal = (item: any) => {
    setSelectedDate(item?.date);
    setModalVisible(true);
  };

  const addPlaceToItinerary = async (place: any) => {
    const newActivity = {
      date: selectedDate,
      name: place.name,
      phoneNumber: place.phoneNumber,
      website: place.website,
      openingHours: place.openingHours,
      photos: place.photos,
      reviews: place.reviews,
      briefDescription: place.briefDescription,
      geometry: {
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        viewport: {
          northeast: {
            lat: place.geometry.viewport.northeast.lat,
            lng: place.geometry.viewport.northeast.lng,
          },
          southwest: {
            lat: place.geometry.viewport.southwest.lat,
            lng: place.geometry.viewport.southwest.lng,
          },
        },
      },
    };

    try {
      const response = await fetch(
        `${API_URL}/trips/${tripId}/itinerary/${selectedDate}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newActivity),
        }
      );
      console.log('Activity added successfully');
      setModalVisible(false);
    } catch (error) {
      console.error('Error adding place to itinerary:', error);
    }
  };

  const goToBlankView = () => setModalView('blank');
  const goToOriginalView = () => setModalView('original');

  const choosePlaces = (name: string) => {
    setItems((prevItems) => {
      if (prevItems.includes(name)) {
        return prevItems.filter((item) => item !== name);
      } else {
        return [...prevItems, name];
      }
    });
  };

  const selectCategory = (item: any) => {
    setCategory(item?.name);
    setImage(item?.image);
    setModalView('original');
  };

  const data = [
    { id: '0', name: 'Flights', image: 'https://t3.ftcdn.net/jpg/02/58/40/90/240_F_258409001_w0gCLGQ5pFdJEyNB8KiiNrijHCGSdUpQ.jpg' },
    { id: '2', name: 'Lodges', image: 'https://t3.ftcdn.net/jpg/02/21/73/46/240_F_221734695_OLItP2OWAkRqBLol8esvA4a9PuTV5pgK.jpg' },
    { id: '3', name: 'Car Rental', image: 'https://t3.ftcdn.net/jpg/01/92/21/40/240_F_192214085_QnQ58x0ZKRLSUEgarcjVHNWrnmH8uWTA.jpg' },
    { id: '4', name: 'Food', image: 'https://t3.ftcdn.net/jpg/00/81/02/86/240_F_81028652_e31aujidvR7NAtA8Cl4VxjDUJFUeAFte.jpg' },
    { id: '5', name: 'Activities', image: 'https://t4.ftcdn.net/jpg/02/64/91/73/240_F_264917306_HnNaVViUQshIGnOGm1LA2FuE4YhTdu1l.jpg' },
    { id: '6', name: 'Shopping', image: 'https://cdn-icons-png.flaticon.com/128/2838/2838694.png' },
    { id: '9', name: 'Tour', image: 'https://t3.ftcdn.net/jpg/08/37/58/92/240_F_837589252_QQfYmY2md3yunH4jRARAi6uNVf9yap53.jpg' },
    { id: '7', name: 'Petrol', image: 'https://media.istockphoto.com/id/925225820/vector/gas-station-icon.jpg?b=1&s=612x612&w=is&k=20&c=w6pmbKjeR0z637e5fKhlDWGOJP6dgrafypC6tUI6LxM=' },
    { id: '8', name: 'Other', image: 'https://t3.ftcdn.net/jpg/02/73/79/70/240_F_273797075_lqtsBJvUc9QsulXvIexCUHGLJWntTOL5.jpg' },
  ];

  const setTripBudget = async (budget: string | number) => {
    try {
      const response = await fetch(
        `${API_URL}/setBudget/${tripId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ budget }),
        }
      );
      const data: any = await response.json();
      setModalOpen(false);
      console.log('Budget updated successfully:', data);
    } catch (error) {
      console.error('Error setting budget:', error);
    }
  };

  const addExpenseToTrip = async () => {
    try {
      const expenseData = {
        category: category,
        price: price,
        splitBy: value,
        paidBy: paidBy,
      };
      const response = await fetch(
        `${API_URL}/addExpense/${tripId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseData),
        }
      );

      if (response.status === 200) {
        setModal(!modal);
      } else {
        console.error('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch(
        `${API_URL}/getExpenses/${tripId}`,
      );
      if (response.status === 200) {
        const data: any = await response.json();
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [modal]);

  const handleRemovePlace = async (place: any) => {
    try {
      const response = await fetch(`${API_URL}/trip/${tripId}/place`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeName: place.name }),
      });

      if (response.status === 200) {
        console.log('Place removed successfully');
        // Refresh list
        fetchPlacesToVisit();
      } else {
        console.error('Failed to remove place');
      }
    } catch (error) {
      console.error('Error removing place:', error);
    }
  };

  const { theme, colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView>

          <View>
            <Image
              style={{ width: '100%', height: 200, resizeMode: 'cover' }}
              source={{
                uri: 'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800',
              }}
            />
            <View
              style={{
                backgroundColor: colors.card,
                width: '90%',
                marginTop: -80,
                alignSelf: 'center',
                borderRadius: 20,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.3,
                shadowRadius: 6.65,
                elevation: 10,
                zIndex: 100,
              }}>
              <Text
                numberOfLines={1}
                style={{
                  textAlign: 'left',
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: colors.text,
                }}>
                Trip To {tripName || route?.params?.item?.tripName || 'your Destination'}
              </Text>
              <View style={{ marginTop: 10 }}>
                <View>
                  <Text style={{ fontWeight: '500', color: colors.text, fontSize: 14 }}>
                    {formatDate(route?.params?.item?.startDate) || 'Start Date'} -{' '}
                    {formatDate(route?.params?.item?.endDate) || 'End Date'}
                  </Text>
                  <Text style={{ color: theme === 'dark' ? '#ccc' : '#606060', marginTop: 4, fontSize: 13 }}>
                    {route?.params?.item?.startDay || ''} -{' '}
                    {route?.params?.item?.endDay || ''}
                  </Text>
                </View>

                <View style={{ marginTop: 10 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                    <Image
                      style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#E0E0E0' }}
                      source={{
                        uri: route?.params?.user?.photo || route?.params?.user?.user?.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                      }}
                    />

                    <Pressable
                      onPress={() => setOpenShareModal(!openShareModal)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 25,
                        alignSelf: 'flex-start',
                        backgroundColor: 'black',
                      }}>
                      <Text
                        style={{
                          textAlign: 'center',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: '600',
                        }}>
                        Share
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ height: 20 }} />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 25,
                justifyContent: 'space-around',
                backgroundColor: colors.card,
                padding: 12,
              }}>
              <Pressable onPress={() => setOption('Overview')}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: option == 'Overview' ? '#ed6509' : 'gray',
                  }}>
                  Overview
                </Text>
              </Pressable>
              <Pressable onPress={() => setOption('Itinerary')}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: option == 'Itinerary' ? '#ed6509' : 'gray',
                  }}>
                  Itinerary
                </Text>
              </Pressable>
              <Pressable onPress={() => setOption('Explore')}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: option == 'Explore' ? '#ed6509' : 'gray',
                  }}>
                  Explore
                </Text>
              </Pressable>
              <Pressable onPress={() => setOption('$')}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: option == '$' ? '#ed6509' : 'gray',
                  }}>
                  $
                </Text>
              </Pressable>
            </View>

            <View style={{}}>
              {option == 'Overview' && (
                <ScrollView
                  contentContainerStyle={{ marginBottom: 25 }}
                  style={{
                    marginTop: 15,
                    borderRadius: 10,
                  }}>
                  <View
                    style={{
                      backgroundColor: colors.card,
                      padding: 12,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}>
                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={25}
                          color={colors.text}
                        />
                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>
                          Notes
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name="dots-horizontal"
                        size={25}
                        color="gray"
                      />
                    </View>

                    <View style={{ marginTop: 10 }}>
                      <Text
                        style={{
                          fontWeight: '500',
                          fontStyle: 'italic',
                          color: theme === 'dark' ? '#ccc' : '#606060',
                        }}>
                        Write or paste general notes here, e.g. how to get
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: colors.card,
                      padding: 12,
                      marginVertical: 15,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}>
                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={25}
                          color={colors.text}
                        />
                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>
                          Places to Visit
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name="dots-horizontal"
                        size={25}
                        color="gray"
                      />
                    </View>

                    <View>
                      {places &&
                        places?.map((item, index) => (
                          <Place
                            key={index}
                            index={index}
                            item={item}
                            items={items}
                            setItems={setItems as any}
                            onRemove={handleRemovePlace}
                          />
                        ))}
                    </View>

                    <View
                      style={{
                        marginTop: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      <View></View>

                      <Pressable
                        onPress={() => setModalVisible(!modalVisible)}
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: theme === 'dark' ? '#333' : '#F0F0F0',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          flex: 1,
                        }}>
                        <MaterialIcons
                          name="location-pin"
                          size={25}
                          color="gray"
                        />

                        <TextInput
                          style={{ color: colors.text }}
                          placeholder="Add a place"
                          placeholderTextColor={theme === 'dark' ? '#aaa' : 'gray'}
                          editable={false}
                        />
                      </Pressable>

                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: theme === 'dark' ? '#333' : '#F0F0F0',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <MaterialIcons
                          name="attach-file"
                          size={22}
                          color={colors.text}
                        />
                      </View>

                      <Pressable
                        onPress={() => {
                          const query = encodeURIComponent(tripName || '');
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
                          Linking.openURL(url);
                        }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: theme === 'dark' ? '#333' : '#F0F0F0',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <MaterialCommunityIcons
                          name="map-check-outline"
                          size={22}
                          color={colors.text}
                        />
                      </Pressable>
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '500',
                        marginLeft: 10,
                        marginTop: 15,
                        color: colors.text,
                      }}>
                      Recommended Places
                    </Text>
                    <View style={{ marginHorizontal: 10, marginVertical: 15 }}>
                      {placeDetails && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}>
                          {placeDetails?.map((item, index) => {
                            const firstPhoto = item?.photos?.[0];
                            const imageUrl = firstPhoto
                              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${firstPhoto.photo_reference}&key=AIzaSyAaJ7VzIGk_y8dvrx2b4yya119jQVZJnNs`
                              : null;

                            return (
                              <Pressable
                                onPress={async () => {
                                  await fetchPlaceDetails(item.place_id);
                                  await fetchPlacesToVisit();
                                }}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  marginRight: 12,
                                  borderWidth: 1,
                                  borderColor: colors.border,
                                  borderRadius: 8,
                                  padding: 10,
                                  marginBottom: 10,
                                  height: 100,
                                  overflow: 'hidden',
                                }}
                                key={index}>
                                <View style={{ marginRight: 10 }}>
                                  {imageUrl ? (
                                    <Image
                                      source={{ uri: imageUrl }}
                                      style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 6,
                                      }}
                                      resizeMode="cover"
                                    />
                                  ) : (
                                    <Text style={{ color: colors.text }}>No Image Available</Text>
                                  )}
                                </View>
                                <Text
                                  style={{
                                    flex: 1,
                                    fontSize: 16,
                                    fontWeight: '500',
                                    color: colors.text,
                                    width: 150,
                                  }}
                                  numberOfLines={2}
                                  ellipsizeMode="tail"
                                >
                                  {item?.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      )}

                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: colors.card,
                      padding: 12,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}>
                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={25}
                          color={colors.text}
                        />
                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>
                          Add a Title
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name="dots-horizontal"
                        size={25}
                        color="gray"
                      />
                    </View>

                    <View
                      style={{
                        marginTop: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      <View
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          backgroundColor: theme === 'dark' ? '#333' : '#F0F0F0',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          flex: 1,
                        }}>
                        <MaterialIcons
                          name="location-pin"
                          size={25}
                          color="gray"
                        />

                        <TextInput
                          style={{ color: colors.text }}
                          placeholder="Add a place"
                          placeholderTextColor={theme === 'dark' ? '#aaa' : 'gray'}
                          editable={false}
                        />
                      </View>

                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: theme === 'dark' ? '#333' : '#F0F0F0',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <MaterialIcons
                          name="attach-file"
                          size={22}
                          color={colors.text}
                        />
                      </View>

                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: theme === 'dark' ? '#333' : '#F0F0F0',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <MaterialCommunityIcons
                          name="map-check-outline"
                          size={22}
                          color={colors.text}
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>

            <View style={{}}>
              {option == 'Itinerary' && (
                <ScrollView
                  style={{
                    marginTop: 15,
                    borderRadius: 10,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                    {route?.params?.item?.itinerary?.map((item: any, index: number) => (
                      <View
                        key={index}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          marginBottom: 7,
                          backgroundColor: 'orange',
                          marginLeft: 10,
                        }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '500',
                            textAlign: 'center',
                            color: 'white',
                          }}>
                          {formatDate(item.date)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={{}}>
                    {route?.params?.item?.itinerary?.map((item: any, index: number) => (
                      <View
                        key={index}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          marginBottom: 7,
                          backgroundColor: colors.card,
                          marginVertical: 10,

                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}>
                          <Text style={{ fontSize: 27, fontWeight: 'bold', color: colors.text }}>
                            {formatDate(item.date)}
                          </Text>
                          <Text
                            style={{
                              fontSize: 14,
                              color: theme === 'dark' ? '#ccc' : '#606060',
                              fontWeight: '500',
                            }}>
                            Add subheading
                          </Text>
                        </View>

                        <View>
                          {itinerary
                            ?.filter((place) => place.date === item?.date)
                            .map((filteredItem, filteredIndex) =>
                              filteredItem.activities.map(
                                (
                                  activity: any,
                                  activityIndex: number,
                                ) => (
                                  <Pressable
                                    key={activityIndex}
                                    style={{ marginTop: 12 }}>
                                    <View
                                      style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 10,
                                      }}>
                                      <View style={{ flex: 1 }}>
                                        <View
                                          style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 7,
                                          }}>
                                          <View
                                            style={{
                                              width: 30,
                                              height: 30,
                                              borderRadius: 15,
                                              backgroundColor: '#0066b2',
                                              justifyContent: 'center',
                                              alignItems: 'center',
                                            }}>
                                            <Text
                                              style={{
                                                color: 'white',
                                                fontWeight: '500',
                                              }}>
                                              {activityIndex + 1}
                                            </Text>
                                          </View>

                                          <Text
                                            style={{
                                              fontSize: 16,
                                              fontWeight: '500',
                                              color: colors.text,
                                            }}>
                                            {activity?.name}{' '}
                                          </Text>
                                        </View>
                                        <Text
                                          style={{
                                            color: 'gray',
                                            marginTop: 7,
                                            width: '80%',
                                          }}>
                                          {activity?.briefDescription}{' '}
                                        </Text>
                                      </View>

                                      <View>
                                        {activity.photos &&
                                          activity.photos[0] && (
                                            <Image
                                              source={{ uri: activity.photos[0] }}
                                              style={{
                                                width: 100,
                                                height: 100,
                                                borderRadius: 10,
                                              }}
                                              resizeMode="cover"
                                            />
                                          )}
                                      </View>
                                    </View>
                                  </Pressable>
                                ),
                              ),
                            )}
                        </View>

                        <View
                          style={{
                            marginTop: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                          }}>
                          <Pressable
                            onPress={() => setOpenModal(item)}
                            style={{
                              padding: 10,
                              borderRadius: 10,
                              backgroundColor: theme === 'dark' ? '#333' : '#F0F0F0',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 5,
                              flex: 1,
                            }}>
                            <MaterialIcons
                              name="location-pin"
                              size={25}
                              color="gray"
                            />

                            <TextInput
                              style={{ color: colors.text }}
                              placeholder="Add a place"
                              placeholderTextColor={theme === 'dark' ? '#aaa' : 'gray'}
                              editable={false}
                            />
                          </Pressable>

                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: theme === 'dark' ? '#333' : '#F0F0F0',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                            <MaterialIcons
                              name="attach-file"
                              size={22}
                              color={colors.text}
                            />
                          </View>

                          <Pressable
                            onPress={() => {
                              const query = encodeURIComponent(tripName || '');
                              const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
                              Linking.openURL(url);
                            }}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: theme === 'dark' ? '#333' : '#F0F0F0',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                            <MaterialCommunityIcons
                              name="map-check-outline"
                              size={22}
                              color={colors.text}
                            />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

            <View>
              {option == 'Explore' && (
                <ScrollView
                  style={{
                    marginTop: 15,
                    borderRadius: 10,
                    marginHorizontal: 12,
                  }}>
                  <View
                    style={{
                      padding: 10,
                      backgroundColor: '#E0E0E0',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <MaterialIcons name="search" size={22} color="gray" />

                    <Text style={{ color: 'black' }}>{tripName}</Text>
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'black' }}>
                        Categories
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                        See all
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 15,
                      }}>
                      <Pressable
                        onPress={() => navigation.navigate('Restaurants', { location: tripName })}
                        style={{
                          backgroundColor: '#E8E8E8',
                          padding: 12,
                          borderRadius: 7,
                          flex: 1,
                        }}>
                        <Text style={{ fontSize: 15, color: '#202020' }}>🍽️ Restaurants</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => navigation.navigate('Cafe', { location: tripName })}
                        style={{
                          backgroundColor: '#E8E8E8',
                          padding: 12,
                          borderRadius: 7,
                          flex: 1,
                        }}>
                        <Text style={{ fontSize: 15, color: '#202020' }}>☕️ Cafes</Text>
                      </Pressable>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 15,
                      }}>
                      <View
                        style={{
                          backgroundColor: '#E8E8E8',
                          padding: 12,
                          borderRadius: 7,
                          flex: 1,
                        }}>
                        <Text style={{ fontSize: 15, color: '#202020' }}>🤑 Cheap Rates</Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: '#E8E8E8',
                          padding: 12,
                          borderRadius: 7,
                          flex: 1,
                        }}>
                        <Text style={{ fontSize: 15, color: '#202020' }}>💌 Travel</Text>
                      </View>
                    </View>
                    <View
                      style={{
                        height: 1,
                        borderColor: '#E0E0E0',
                        borderWidth: 0.6,
                        marginVertical: 15,
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#202020' }}>
                      Video Guides
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      <View style={{ flex: 1 }}>
                        <Image
                          style={{ width: 160, height: 110, resizeMode: 'cover' }}
                          source={{
                            uri: 'https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Youtube2_colored_svg-512.png',
                          }}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Image
                          style={{ width: 160, height: 110, resizeMode: 'cover' }}
                          source={{
                            uri: 'https://cdn3.iconfinder.com/data/icons/apps-4/512/Tiktok-512.png',
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>

            <View>
              {option == '$' && (
                <ScrollView style={{}}>
                  <View>
                    <View style={{ padding: 10, backgroundColor: '#13274F' }}>
                      <Text
                        style={{
                          fontSize: 24,
                          color: 'white',
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}>
                        ₹
                        {budget ? budget : route?.params?.item?.budget}
                      </Text>

                      <Pressable onPress={() => setModalOpen(!modalOpen)}>
                        <Text
                          style={{
                            marginVertical: 13,
                            textAlign: 'center',
                            color: 'white',
                            fontSize: 15,
                          }}>
                          Set a budget
                        </Text>
                      </Pressable>

                      <View
                        style={{
                          marginLeft: 'auto',
                          marginRight: 'auto',
                          padding: 10,
                          borderRadius: 25,
                          borderColor: 'white',
                          borderWidth: 1,
                        }}>
                        <Text
                          style={{
                            textAlign: 'center',
                            color: 'white',
                            fontSize: 13,
                          }}>
                          Debt Summary
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View>
                    <View
                      style={{
                        padding: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#202020' }}>
                        Expenses
                      </Text>

                      <MaterialIcons
                        name="person-search"
                        size={25}
                        color="black"
                      />
                    </View>

                    {expenses?.length > 0 ? (
                      <View style={{ marginHorizontal: 12 }}>
                        {expenses?.map((item, index) => (
                          <Pressable key={index} style={{ marginTop: 10 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                              }}>
                              <View
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 15,
                                  backgroundColor: '#0066b2',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}>
                                <Text
                                  style={{ color: 'white', fontWeight: '500' }}>
                                  {index + 1}
                                </Text>
                              </View>

                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: '500',
                                  flex: 1,
                                  color: '#202020',
                                }}>
                                {item?.category}
                              </Text>

                              <Text style={{ fontSize: 15, color: '#606060' }}>
                                ₹{item?.price} ({item?.splitBy})
                              </Text>
                            </View>
                            <Text style={{ marginTop: 5, color: 'gray' }}>
                              Paid By - {item?.paidBy}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      <Text style={{ marginHorizontal: 12, color: 'gray' }}>
                        You haven't added any expenses yet!
                      </Text>
                    )}

                    <Pressable
                      onPress={() => setModal(!modal)}
                      style={{
                        padding: 12,
                        backgroundColor: '#FF5733',
                        borderRadius: 25,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        marginTop: 30,
                      }}>
                      <Text style={{ textAlign: 'center', color: 'white' }}>
                        Add Expense
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>

          <BottomModal

            swipeDirection={['up', 'down']}
            swipeThreshold={200}
            modalAnimation={
              new SlideAnimation({
                slideFrom: 'bottom',
              })
            }
            onHardwareBackPress={() => { setModalVisible(!modalVisible); return true; }}
            visible={modalVisible}
            onTouchOutside={() => setModalVisible(!modalVisible)}>
            <ModalContent
              style={{ width: '100%', height: 600, backgroundColor: '#F8F8F8' }}>
              <View>
                <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  Add a Place
                </Text>
                <View style={{ width: '100%' }}>

                  <GooglePlacesAutocomplete
                    styles={{
                      container: {
                        flex: 0,
                        borderRadius: 20,
                        borderColor: '#D0D0D0',
                        borderWidth: 1,
                        marginTop: 20,
                      },
                      textInput: {
                        height: 38,
                        color: '#5d5d5d',
                        fontSize: 16,
                        borderRadius: 24,
                      },
                      textInputContainer: {
                        borderRadius: 20,
                      },
                    }}
                    placeholder="Search"
                    fetchDetails={true}
                    onPress={(data, details = null) => {
                      console.log('Selected Place:', data);
                      setName(data?.description);
                      if (details) {
                        const placeId = details.place_id;
                        fetchPlaceDetails(placeId);
                      }
                    }}
                    query={{
                      key: 'AIzaSyAaJ7VzIGk_y8dvrx2b4yya119jQVZJnNs',
                      language: 'en',
                    }}
                  />
                </View>

                <View>
                  <Text
                    style={{ textAlign: 'center', color: 'gray', marginTop: 12 }}>
                    Places In your list
                  </Text>
                  {places &&
                    places?.map((item, index) => (
                      <Pressable
                        onPress={() => addPlaceToItinerary(item)}
                        key={index}
                        style={{ marginTop: 12 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 10,
                          }}>
                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 7,
                              }}>
                              <View
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 15,
                                  backgroundColor: 'blue',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}>
                                <Text
                                  style={{ color: 'white', fontWeight: '500' }}>
                                  {index + 1}
                                </Text>
                              </View>

                              <Text style={{ fontSize: 16, fontWeight: '500' }}>
                                {item?.name}
                              </Text>
                            </View>
                            <Text
                              style={{
                                color: 'gray',
                                marginTop: 7,
                                width: '80%',
                              }}>
                              {item?.briefDescription}
                            </Text>
                          </View>

                          <View>
                            <Image
                              source={{ uri: item.photos[0] }}
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: 10,
                              }}
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                      </Pressable>
                    ))}
                </View>
              </View>
            </ModalContent>
          </BottomModal>

          <BottomModal

            swipeDirection={['up', 'down']}
            swipeThreshold={200}
            modalAnimation={
              new SlideAnimation({
                slideFrom: 'bottom',
              })
            }
            onHardwareBackPress={() => { setModal(!modal); return true; }}
            visible={modal}
            onTouchOutside={() => setModal(!modal)}>
            <ModalContent
              style={{ width: '100%', height: 600, backgroundColor: '#F8F8F8' }}>
              {modalView === 'original' ? (
                <View>
                  <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    Add a Expense
                  </Text>

                  <View
                    style={{
                      marginVertical: 15,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <Text style={{ fontSize: 16, fontWeight: '500' }}>Rs</Text>
                    <TextInput
                      value={price.toString()}
                      onChangeText={setPrice}
                      style={{ color: 'gray', fontSize: 16 }}
                      placeholderTextColor="gray"
                      placeholder="0.00"
                    />
                  </View>

                  <Pressable
                    onPress={goToBlankView}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <Text style={{ fontSize: 16, fontWeight: '500' }}>
                      Event ({category})
                    </Text>
                    <Text style={{ color: 'gray', fontSize: 16 }}>
                      Select Item
                    </Text>
                  </Pressable>

                  <View
                    style={{
                      height: 2,
                      borderColor: '#E0E0E0',
                      borderWidth: 3,
                      marginVertical: 20,
                      borderRadius: 4,
                    }}
                  />

                  <Pressable
                    onPress={togglePaidBy}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <Text style={{ fontSize: 15, fontWeight: '500' }}>
                      Paid By: You ({route?.params?.user?.user?.name})
                    </Text>
                    <MaterialIcons
                      name={
                        isSplitExpanded
                          ? 'keyboard-arrow-down'
                          : 'keyboard-arrow-right'
                      }
                      size={25}
                      color="black"
                    />
                  </Pressable>

                  {isPaidByExpanded && (
                    <View style={{ marginTop: 10 }}>
                      {route?.params?.item?.travelers?.map((item: any, index: number) => (
                        <Pressable
                          onPress={() => setPaidBy(item?.name)}
                          key={index}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                          }}>
                          <Image
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                            source={{
                              uri: item?.photo,
                            }}
                          />
                          <Text style={{ fontSize: 16, fontWeight: '400' }}>
                            Paid By {item?.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <Pressable
                    onPress={toggleSplit}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 15,
                    }}>
                    <Text style={{ fontSize: 15, fontWeight: '500' }}>
                      Split: Don't split
                    </Text>
                    <MaterialIcons
                      name={
                        isSplitExpanded
                          ? 'keyboard-arrow-down'
                          : 'keyboard-arrow-right'
                      }
                      size={25}
                      color="black"
                    />
                  </Pressable>

                  {isSplitExpanded && (
                    <View
                      style={{ marginTop: 10, flexDirection: 'column', gap: 10 }}>
                      <Pressable onPress={() => setValue('Indiviudals')}>
                        <Text style={{ fontSize: 15, color: 'gray' }}>
                          Indiviudals
                        </Text>
                      </Pressable>

                      <Pressable onPress={() => setValue('Everyone')}>
                        <Text style={{ fontSize: 15, color: 'gray' }}>
                          Everyone
                        </Text>
                      </Pressable>

                      <Pressable onPress={() => setValue("Don't Split")}>
                        <Text style={{ fontSize: 15, color: 'gray' }}>
                          Don't Split
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginVertical: 14,
                    }}>
                    <Text style={{ fontSize: 15, fontWeight: '500' }}>
                      Date: Optional
                    </Text>
                    <MaterialIcons
                      name="keyboard-arrow-right"
                      size={25}
                      color="black"
                    />
                  </View>

                  <Pressable onPress={addExpenseToTrip}>
                    <Text>Save expense</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontWeight: '600',
                      marginTop: 10,
                    }}>
                    Expense Category
                  </Text>
                  <Pressable
                    onPress={goToOriginalView}
                    style={{
                      marginTop: 20,
                      alignSelf: 'center',
                      padding: 10,
                      backgroundColor: 'blue',
                      borderRadius: 5,
                    }}>
                    <Text style={{ color: 'white' }}>Go Back</Text>
                  </Pressable>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 60,
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      marginTop: 15,
                    }}>
                    {data?.map((item, index) => (
                      <Pressable
                        onPress={() => selectCategory(item)}
                        key={index}>
                        <View
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                          <Image
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 30,

                              resizeMode: 'center',
                            }}
                            source={{ uri: item?.image }}
                          />
                          <Text
                            style={{
                              textAlign: 'center',
                              marginTop: 10,
                              fontSize: 13,
                            }}>
                            {item?.name}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </ModalContent>
          </BottomModal>
        </ScrollView>
      </SafeAreaView>

      <Modal
        onTouchOutside={() => setModalOpen(!modalOpen)}
        onHardwareBackPress={() => { setModalOpen(!modalOpen); return true; }}
        swipeDirection={['up', 'down']}
        swipeThreshold={200}
        modalTitle={<ModalTitle title="Budget Info" />}
        modalAnimation={
          new SlideAnimation({
            slideFrom: 'bottom',
          })
        }
        visible={modalOpen}>
        <ModalContent style={{ width: 350, height: 'auto' }}>
          <View style={{}}>
            <View
              style={{
                marginTop: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text style={{ fontSize: 15, fontWeight: '500' }}>
                Enter budget
              </Text>

              <Feather name="edit-2" size={20} color="black" />
            </View>

            <View
              style={{
                marginTop: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <TextInput
                style={{
                  width: '95%',
                  marginTop: 10,
                  paddingBottom: 10,
                  borderColor: '#E0E0E0',
                  borderWidth: 1,
                  padding: 10,
                  borderRadius: 20,
                }}
                value={budget}
                onChangeText={setBudget}
                placeholder={'Enter the budget'}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                marginTop: 15,
                alignItems: 'center',
                gap: 20,
                justifyContent: 'center',
              }}>
              <Pressable
                onPress={() => setModalOpen(false)}
                style={{
                  padding: 10,
                  borderRadius: 25,
                  borderColor: '#E0E0E0',
                  borderWidth: 1,
                  width: 100,
                }}>
                <Text style={{ textAlign: 'center' }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => setTripBudget(budget)}
                style={{
                  padding: 10,
                  borderRadius: 25,
                  backgroundColor: '#720e9e',
                  width: 100,
                }}>
                <Text style={{ textAlign: 'center', color: 'white' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </ModalContent>
      </Modal>

      <BottomModal

        swipeDirection={['up', 'down']}
        swipeThreshold={200}
        modalAnimation={
          new SlideAnimation({
            slideFrom: 'bottom',
          })
        }
        onHardwareBackPress={() => { setOpenShareModal(!openShareModal); return true; }}
        visible={openShareModal}
        onTouchOutside={() => setOpenShareModal(!openShareModal)}>
        <ModalContent
          style={{ width: '100%', height: 300, backgroundColor: '#F8F8F8' }}>
          <View>
            <Text
              style={{ fontSize: 15, fontWeight: '500', textAlign: 'center' }}>
              Invite Tripmates
            </Text>
            <View
              style={{
                marginVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#E0E0E0',
                gap: 8,
                borderRadius: 7,
              }}>
              <Ionicons name="person-add-sharp" size={20} color="gray" />
              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholderTextColor={'gray'}
                placeholder="Invite by Email address"
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 20,
                justifyContent: 'center',
                alignSelf: 'center',
                marginTop: 12,
              }}>
              <View>
                <Pressable
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#E0E0E0',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <AntDesign name="link" size={23} color="gray" />
                </Pressable>
                <Text
                  style={{
                    fontSize: 13,
                    textAlign: 'center',
                    color: 'gray',
                    marginTop: 8,
                  }}>
                  Link
                </Text>
              </View>

              <View>
                <Pressable
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#E0E0E0',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <AntDesign name="message1" size={23} color="gray" />
                </Pressable>
                <Text
                  style={{
                    fontSize: 13,
                    textAlign: 'center',
                    color: 'gray',
                    marginTop: 10,
                  }}>
                  Text
                </Text>
              </View>

              <View>
                <Pressable
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#E0E0E0',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <AntDesign name="sharealt" size={23} color="gray" />
                </Pressable>
                <Text
                  style={{
                    fontSize: 13,
                    textAlign: 'center',
                    color: 'gray',
                    marginTop: 10,
                  }}>
                  Other
                </Text>
              </View>
            </View>

            {isValidEmail && (
              <Pressable
                style={{
                  backgroundColor: '#E97451',
                  marginTop: 16,
                  padding: 10,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={handleSendInvite}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                  Send 1 invite
                </Text>
              </Pressable>
            )}
          </View>
        </ModalContent>
      </BottomModal>

      <Pressable
        onPress={() =>
          navigation.navigate('Ai', {
            name: route?.params?.item?.tripName,
            tripId: route?.params?.item?._id,
          })
        }
        style={{
          width: 60,
          height: 60,
          borderRadius: 40,
          justifyContent: 'center',
          backgroundColor: '#662d91',
          marginLeft: 'auto',
          position: 'absolute',
          bottom: 110,
          right: 25,
          alignContent: 'center',
        }}>
        <FontAwesome6
          style={{ textAlign: 'center' }}
          name="wand-magic-sparkles"
          size={24}
          color="white"
        />
      </Pressable>

      <Pressable
        onPress={openPlacesInMap}
        style={{
          width: 60,
          height: 60,
          borderRadius: 40,
          justifyContent: 'center',
          backgroundColor: 'black',
          marginLeft: 'auto',
          position: 'absolute',
          bottom: 35,
          right: 25,
          alignContent: 'center',
        }}>
        <Feather
          style={{ textAlign: 'center' }}
          name="map"
          size={24}
          color="white"
        />
      </Pressable>
    </View>
  );
};

export default TripPlanScreen;

const styles = StyleSheet.create({});
