import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../ThemeContext';

/* ---------- Types ---------- */

interface PlaceItem {
  name: string;
  briefDescription?: string;
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  photos: string[];
  formatted_address?: string;
  types?: string[];
}

interface PlaceProps {
  item: PlaceItem;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  index: number;
  onRemove?: (place: PlaceItem) => void;
}

/* ---------- Component ---------- */

const Place: React.FC<PlaceProps> = ({ item, items, setItems, index, onRemove }) => {
  const { theme, colors } = useTheme();

  const choosePlaces = (name: string) => {
    setItems(prevItems =>
      prevItems.includes(name)
        ? prevItems.filter(item => item !== name)
        : [...prevItems, name],
    );
  };

  return (
    <Pressable
      onPress={() => choosePlaces(item.name)}
      style={{ marginTop: 12 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#0066b2',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '500' }}>
                {index + 1}
              </Text>
            </View>

            <Text
              numberOfLines={2}
              style={{ fontSize: 16, fontWeight: '500', width: '82%', color: colors.text }}
            >
              {item.name}
            </Text>
          </View>

          {item.briefDescription && (
            <Text
              numberOfLines={3}
              style={{ color: theme === 'dark' ? '#aaa' : 'gray', marginTop: 7, width: '80%' }}
            >
              {item.briefDescription}
            </Text>
          )}
        </View>

        {item.photos?.[0] && (
          <Image
            source={{ uri: item.photos[0] }}
            style={{ width: 100, height: 100, borderRadius: 10 }}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Expanded Details */}
      {items.includes(item.name) && (
        <View>
          {item.phoneNumber && (
            <View style={styles.row}>
              <AntDesign name="phone" size={23} color="#2a52be" />
              <Text style={styles.linkText}>{item.phoneNumber}</Text>
            </View>
          )}

          {item.openingHours?.[0] && (
            <View style={styles.row}>
              <Ionicons name="time-outline" size={23} color="#2a52be" />
              <Text style={styles.linkText}>
                Open {item.openingHours[0].split(': ')[1]}
              </Text>
            </View>
          )}

          {item.website && (
            <View style={styles.row}>
              <Ionicons name="earth" size={23} color="#2a52be" />
              <Text style={styles.linkText}>{item.website}</Text>
            </View>
          )}

          {item.formatted_address && (
            <View style={styles.row}>
              <Entypo name="location" size={23} color="#2a52be" />
              <Text style={[styles.linkText, { width: '95%' }]}>
                {item.formatted_address}
              </Text>
            </View>
          )}

          {item.types && (
            <View style={styles.typeContainer}>
              {item.types.map((type, idx) => (
                <View key={idx} style={styles.typeBadge}>
                  <Text style={styles.typeText}>{type}</Text>
                </View>
              ))}
            </View>
          )}

          {onRemove && (
            <Pressable
              onPress={() => onRemove(item)}
              style={{
                marginTop: 15,
                marginHorizontal: 8,
                backgroundColor: '#FFE5E5',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <AntDesign name="delete" size={20} color="#FF4444" />
              <Text style={{ color: '#FF4444', fontWeight: 'bold' }}>
                Remove Place
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
};

export default Place;

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  row: {
    marginHorizontal: 8,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B61D1',
  },
  typeContainer: {
    marginHorizontal: 8,
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 23,
    backgroundColor: '#4B61D1',
  },
  typeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
});
