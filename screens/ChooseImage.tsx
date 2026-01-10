import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/StackNavigator';



type ChooseImageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Choose'
>;

interface ImageItem {
  id: string;
  image: string;
}



const ChooseImage: React.FC = () => {
  const images: ImageItem[] = [
    {
      id: '0',
      image:
        'https://images.unsplash.com/photo-1464852045489-bccb7d17fe39?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: '1',
      image:
        'https://images.unsplash.com/photo-1716417511759-dd9c0f353ef9?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: '2',
      image:
        'https://images.unsplash.com/photo-1536928994169-e339332d0b4e?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: '3',
      image:
        'https://images.unsplash.com/photo-1689753363735-1f7427933d0d?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: '4',
      image:
        'https://images.unsplash.com/photo-1577172249844-716749254893?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: '5',
      image:
        'https://images.unsplash.com/photo-1503756234508-e32369269deb?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: '6',
      image:
        'https://images.unsplash.com/photo-1715940404541-8de003993435?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: '7',
      image:
        'https://images.unsplash.com/photo-1489945796694-07eba0228bc7?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: '8',
      image:
        'https://images.unsplash.com/photo-1715144536829-50ee7e56596d?w=800&auto=format&fit=crop&q=60',
    },
  ];

  const navigation = useNavigation<ChooseImageNavigationProp>();

  const handleSelectImage = (image: string): void => {
    navigation.navigate('Create', { image });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#484848' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View>
          <Text style={styles.title}>Choose Image</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={[styles.grid, { justifyContent: 'center' }]}>
            {images.map((item) => (
              <RenderImageItem
                key={item.id}
                item={item}
                handleSelectImage={handleSelectImage}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const RenderImageItem = ({
  item,
  handleSelectImage,
}: {
  item: ImageItem;
  handleSelectImage: (img: string) => void;
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const numColumns = isLandscape ? 5 : 3;
  const margin = 10;
  const itemTotalMargin = margin * 2;
  // Calculate width: entire screen width divided by columns, minus the margins for each item
  const imageWidth = width / numColumns - itemTotalMargin;
  const imageHeight = imageWidth * 1.35; // Maintain aspect ratio

  return (
    <Pressable
      onPress={() => handleSelectImage(item.image)}
      style={{ margin }}
    >
      <Image
        style={[styles.image, { width: imageWidth, height: imageHeight }]}
        source={{ uri: item.image }}
      />
    </Pressable>
  );
};

export default ChooseImage;

/* ----------------------------------
   Styles
----------------------------------- */

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginTop: 15,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start', // varied from center to avoid odd gaps if last row isn't full
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 15,
  },
});
