import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import moment from 'moment';
import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BottomModal, ModalContent, SlideAnimation } from 'react-native-modals';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useTheme } from '../ThemeContext';

/* ----------------------------------
   Navigation Types
----------------------------------- */
type RootStackParamList = {
  Trip: {
    item: any;
  };
  Define: {
    name: string;
    itinerary: any[];
  };
};

type TripRouteProp = RouteProp<RootStackParamList, 'Trip'>;

const TripScreen: React.FC = () => {
  const route = useRoute<TripRouteProp>();
  const navigation = useNavigation<any>();

  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const formatDate = (date?: string): string => {
    if (date) {
      return moment(date).format('DD MMMM YYYY');
    }
    return '';
  };

  const itinerary = route?.params?.item?.itinerary;

  const data: {
    id: string;
    name: string;
    image: string;
  }[] = [
      { id: '1', name: 'Lodging', image: 'https://cdn-icons-png.flaticon.com/128/15592/15592598.png' },
      { id: '2', name: 'Restaurant', image: 'https://cdn-icons-png.flaticon.com/128/7595/7595720.png' },
      { id: '3', name: 'Tour', image: 'https://cdn-icons-png.flaticon.com/128/5472/5472888.png' },
      { id: '4', name: 'Location', image: 'https://cdn-icons-png.flaticon.com/128/3124/3124939.png' },
      { id: '5', name: 'Museum', image: 'https://cdn-icons-png.flaticon.com/128/4441/4441743.png' },
      { id: '6', name: 'Coffee', image: 'https://cdn-icons-png.flaticon.com/128/2498/2498749.png' },
      { id: '7', name: 'Party', image: 'https://cdn-icons-png.flaticon.com/128/4633/4633973.png' },
      { id: '8', name: 'Concert', image: 'https://cdn-icons-png.flaticon.com/128/3293/3293810.png' },
      { id: '9', name: 'Fitness', image: 'https://cdn-icons-png.flaticon.com/128/3084/3084146.png' },
      { id: '10', name: 'Shopping', image: 'https://cdn-icons-png.flaticon.com/128/6815/6815081.png' },
      { id: '11', name: 'Kids', image: 'https://cdn-icons-png.flaticon.com/128/2444/2444705.png' },
      { id: '12', name: 'Theatre', image: 'https://cdn-icons-png.flaticon.com/128/9921/9921891.png' },
    ];

  /* ----------------------------------
     Hook
  ----------------------------------- */
  const { theme, colors } = useTheme();

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ImageBackground
          style={{ width: '100%', height: '100%' }}
          source={{ uri: route?.params?.item?.background }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View
              style={{
                padding: 13,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Pressable onPress={() => navigation.goBack()}>
                <AntDesign name="arrow-left" size={25} color="white" />
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AntDesign name="share-alt" size={25} color="white" />
                <AntDesign name="setting" size={25} color="white" />
              </View>
            </View>

            <View style={{ marginHorizontal: 13 }}>
              <Text style={{ fontSize: 16, color: 'white', fontWeight: '600' }}>
                1 Week ago
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: 'bold',
                  color: 'white',
                  marginTop: 7,
                }}>
                {route?.params?.item?.tripName}
              </Text>
            </View>

            <Pressable
              onPress={() => setModalVisible(true)}
              style={{
                marginHorizontal: 13,
                backgroundColor: '#c1c9d6',
                marginVertical: 10,
                borderRadius: 20,
                padding: 15,
                width: 120,
              }}>
              <AntDesign name="plus-circle" size={30} color="#202020" />
              <Text style={{ fontSize: 15, color: '#404040', marginTop: 30 }}>
                New Activity
              </Text>
            </Pressable>
          </SafeAreaView>
        </ImageBackground>
      </View>

      {/* MODAL */}

      <BottomModal
        visible={modalVisible}

        onTouchOutside={() => setModalVisible(false)}
        swipeDirection={['up', 'down']}
        swipeThreshold={200}
        modalAnimation={new SlideAnimation({ slideFrom: 'bottom' })}>
        <ModalContent
          style={{ width: '100%', height: 600, backgroundColor: colors.card }}>
          <Text style={{ textAlign: 'center', color: colors.text }}>Choose an Activity</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {data.map(item => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('Activity', {
                    name: item.name,
                    tripId: route?.params?.item?._id,
                  });
                }}
                style={{
                  width: 95,
                  height: 95,
                  borderRadius: 6,
                  backgroundColor: theme === 'dark' ? '#333' : 'white',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: 10,
                }}>
                <Image
                  style={{ width: 40, height: 40 }}
                  source={{ uri: item.image }}
                />
                <Text style={{ fontSize: 12, marginTop: 12, color: colors.text }}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => {
              setModalVisible(false);
              navigation.navigate('Home');
            }}
            style={{
              marginTop: 20,
              padding: 10,
              backgroundColor: '#007AFF',
              borderRadius: 6,
              alignItems: 'center',
            }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Done / Home</Text>
          </Pressable>
        </ModalContent>
      </BottomModal>
    </>
  );
};

export default TripScreen;

const styles = StyleSheet.create({});
