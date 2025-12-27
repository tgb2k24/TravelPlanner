import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { LatLng, Marker } from 'react-native-maps';
import Entypo from 'react-native-vector-icons/Entypo';

/* ----------------------------------
   Types
----------------------------------- */

interface Place {
  name: string;
  briefDescription?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: string[];
}

interface MapRouteParams {
  places: Place[];
}

/* ----------------------------------
   Component
----------------------------------- */

type MapScreenRouteProp = RouteProp<{ Map: MapRouteParams }, 'Map'>;

const MapScreen: React.FC = () => {
  const route = useRoute<MapScreenRouteProp>();

  const places: Place[] = route.params?.places || [];
  const firstPlace = places[0];

  const mapView = useRef<MapView | null>(null);

  const [selectedMarker, setSelectedMarker] = useState<Place | null>(null);

  const coordinates: LatLng[] = places.map((place) => ({
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
  }));

  /* ----------------------------------
     Fit map to all markers
  ----------------------------------- */
  useEffect(() => {
    if (places.length > 0 && mapView.current) {
      mapView.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [places]);

  if (!firstPlace) {
    return (
      <SafeAreaView>
        <Text>No places to display</Text>
      </SafeAreaView>
    );
  }

  /* ----------------------------------
     UI
  ----------------------------------- */

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MapView
        loadingEnabled
        ref={mapView}
        initialRegion={{
          latitude: firstPlace.geometry.location.lat,
          longitude: firstPlace.geometry.location.lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        style={styles.map}
      >
        {places.map((item, index) => (
          <Marker
            key={index}
            onPress={() => setSelectedMarker(item)}
            coordinate={{
              latitude: item.geometry.location.lat,
              longitude: item.geometry.location.lng,
            }}
            title={item.name}
            description={item.briefDescription}
          />
        ))}

        {/* Marker Detail Card */}
        <View
          style={[
            styles.detailContainer,
            { backgroundColor: selectedMarker ? 'white' : 'transparent' },
          ]}
        >
          {selectedMarker && (
            <View style={styles.detailCard}>
              {/* Header */}
              <View style={styles.detailHeader}>
                <View style={styles.indexCircle}>
                  <Text style={styles.indexText}>1</Text>
                </View>

                <Text numberOfLines={2} style={styles.placeName}>
                  {selectedMarker.name}
                </Text>

                <Entypo
                  onPress={() => setSelectedMarker(null)}
                  name="cross"
                  size={25}
                  color="gray"
                />
              </View>

              {/* Description */}
              {selectedMarker.briefDescription && (
                <Text numberOfLines={3} style={styles.description}>
                  {selectedMarker.briefDescription}
                </Text>
              )}

              {/* Image */}
              {selectedMarker.photos?.[0] && (
                <Image
                  source={{ uri: selectedMarker.photos[0] }}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
            </View>
          )}
        </View>
      </MapView>
    </SafeAreaView>
  );
};

export default MapScreen;

/* ----------------------------------
   Styles
----------------------------------- */

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
    marginTop: 20,
    borderRadius: 5,
  },
  detailContainer: {
    padding: 10,
    borderRadius: 7,
    marginTop: 'auto',
    marginBottom: 30,
    marginHorizontal: 13,
  },
  detailCard: {
    padding: 5,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    elevation: 5,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  indexCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0066b2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  indexText: {
    color: 'white',
    fontWeight: '500',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  description: {
    color: 'gray',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
});
