import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  Animated,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const BOTTOM_SHEET_HEIGHT = Dimensions.get('window').height * 0.4;

interface CaptainLocation {
  type: string;
  coordinates: [number, number];
}

interface Captain {
  _id: string;
  fullname: string;
  phone: string;
  vehicleType: string;
  vehicleNoPlate: string;
  location: CaptainLocation;
  rating: number;
}

interface EmergencyLocation {
  type: string;
  coordinates: [number, number];
  address: string;
}

const UserRideTracking = () => {
  const { rideId } = useLocalSearchParams();
  const [captain, setCaptain] = useState<Captain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [showDirections, setShowDirections] = useState(false);
  const bottomSheetAnim = React.useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const [emergencyLocation, setEmergencyLocation] = useState<EmergencyLocation | null>(null);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_BASE_URL}/rides/${rideId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.ride) {
          const { captain, emergencyLocation } = response.data.ride;
          setCaptain(captain);
          setEmergencyLocation(emergencyLocation);
          console.log('Emergency Location:', emergencyLocation);
        }
      } catch (err) {
        setError('Failed to fetch ride details');
        console.error('Error fetching ride:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId]);

  // Poll for captain's location updates
  useEffect(() => {
    if (!captain?._id || !rideId) return;

    const pollCaptainLocation = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_BASE_URL}/rides/${rideId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data?.ride?.captain?.location) {
          console.log('Updated captain location:', response.data.ride.captain.location);
          setCaptain(prev => prev ? {
            ...prev,
            location: response.data.ride.captain.location
          } : null);

          // Update route if coordinates exist
          if (response.data.ride.route) {
            setRouteCoordinates(response.data.ride.route.map((coord: [number, number]) => ({
              latitude: coord[1],
              longitude: coord[0]
            })));
          }

          // Update ETA and distance if available
          if (response.data.ride.estimatedTime) {
            setEstimatedTime(response.data.ride.estimatedTime);
          }
          if (response.data.ride.distance) {
            setDistance(response.data.ride.distance);
          }
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Location polling cancelled');
        } else {
          console.error('Error polling ride details:', error);
        }
      }
    };

    const interval = setInterval(pollCaptainLocation, 5000);
    pollCaptainLocation(); // Poll immediately

    return () => {
      clearInterval(interval);
    };
  }, [captain?._id, rideId]);

  const handleCallCaptain = () => {
    if (captain?.phone) {
      Linking.openURL(`tel:${captain.phone}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (error || !captain) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Captain not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: captain.location.coordinates[1],
          longitude: captain.location.coordinates[0],
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Captain's Marker */}
        {captain.location && (
          <Marker
            coordinate={{
              latitude: captain.location.coordinates[1],
              longitude: captain.location.coordinates[0],
            }}
            title={captain.fullname}
            description={captain.vehicleType}
          >
            <MaterialIcons name="local-taxi" size={30} color="#000" />
          </Marker>
        )}

        {/* Emergency Location Marker */}
        {emergencyLocation && (
          <Marker
            coordinate={{
              latitude: emergencyLocation.coordinates[1],
              longitude: emergencyLocation.coordinates[0],
            }}
            title="Emergency Location"
            description={emergencyLocation.address}
          >
            <MaterialIcons name="emergency" size={30} color="#FF0000" />
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={3}
            strokeColor="#000"
          />
        )}
      </MapView>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: bottomSheetAnim }],
          },
        ]}
      >
        <View style={styles.bottomSheetContent}>
          <Text style={styles.captainName}>{captain.fullname}</Text>
          <Text style={styles.vehicleInfo}>
            {captain.vehicleType} - {captain.vehicleNoPlate}
          </Text>
          
          <TouchableOpacity style={styles.callButton} onPress={handleCallCaptain}>
            <MaterialIcons name="phone" size={24} color="#fff" />
            <Text style={styles.callButtonText}>Call Captain</Text>
          </TouchableOpacity>

          {estimatedTime && distance && (
            <View style={styles.etaContainer}>
              <Text style={styles.etaText}>
                ETA: {estimatedTime} ({distance})
              </Text>
            </View>
          )}

          {emergencyLocation && (
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>
                Emergency Location: {emergencyLocation.address}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheetContent: {
    alignItems: 'center',
  },
  captainName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 15,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  etaContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  etaText: {
    fontSize: 16,
    textAlign: 'center',
  },
  addressContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    width: '100%',
  },
  addressText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
  },
});

export default UserRideTracking; 