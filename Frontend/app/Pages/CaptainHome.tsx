import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import CaptainInfoCard from '../../Components/captainInfoCard';
import RidePopup from '../../Components/RidePopup';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;

const Home = () => {
  const router = useRouter();
  const [status, setStatus] = useState('Online');
  const [showRidePopup, setShowRidePopup] = useState(true);
  const [emergencyData, setEmergencyData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  const popupAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  // Function to update location on backend
  const updateLocationOnBackend = async (latitude: number, longitude: number) => {
    try {
      // Get the token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Only update location if captain is online
      if (status !== 'Online') {
        console.log('Skipping location update - Captain is offline');
        return;
      }

      console.log('Updating location for online captain:', {
        latitude,
        longitude,
        status
      });

      const locationData = {
        location: {
          type: 'Point',
          coordinates: [latitude,longitude]
        }
      };

      const response = await axios.post(`${baseUrl}/captain/location`, 
        locationData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        console.log('Location updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating location:', error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
    }
  };

  useEffect(() => {
    // Verify token and status on component mount
    const verifyTokenAndStatus = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found in AsyncStorage');
        router.replace('./CaptainLogin');
        return;
      }
      console.log('Token found in AsyncStorage');

      try {
        // Get current captain status
        const response = await axios.get(`${baseUrl}/captain/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Current captain status:', response.data);
        if (response.data.status) {
          setStatus(response.data.status);
        }
      } catch (error: any) {
        console.error('Error fetching captain status:', error.message);
        if (error.response) {
          console.error('Error response data:', error.response.data);
        }
      }
    };
    verifyTokenAndStatus();
  }, []);

  useEffect(() => {
    Animated.timing(popupAnim, {
      toValue: showRidePopup ? 0 : Dimensions.get('window').height,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [showRidePopup]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      console.log('Location permission granted, getting current position...');
      let location = await Location.getCurrentPositionAsync({});
      console.log('Initial location received:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      
      setCurrentLocation(newLocation);
    })();
  }, []);

  // New useEffect to handle location updates based on status
  useEffect(() => {
    if (status === 'Online') {
      // Start location tracking when online
      const startLocationTracking = async () => {
        console.log('Starting location tracking - Captain is online');
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (newLocation) => {
            const updatedLocation = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };
            setCurrentLocation(updatedLocation);
            // Update location on backend when location changes
            updateLocationOnBackend(newLocation.coords.latitude, newLocation.coords.longitude);
          }
        );
        setLocationSubscription(subscription);
      };
      startLocationTracking();
    } else {
      // Stop location tracking when offline
      if (locationSubscription) {
        console.log('Stopping location tracking - Captain is offline');
        locationSubscription.remove();
        setLocationSubscription(null);
      }
    }

    // Cleanup subscription on component unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [status]);

  const toggleStatus = async () => {
    const newStatus = status === 'Online' ? 'Offline' : 'Online';
    console.log('Current status:', status);
    console.log('Attempting to change to:', newStatus);
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // First verify current status
      const verifyResponse = await axios.get(`${baseUrl}/captain/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Current status from server:', verifyResponse.data);

      // Update status
      console.log(`Updating status to ${newStatus}...`);
      const response = await axios.patch(`${baseUrl}/captain/status`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Status update response:', response.data);

      // Verify the update was successful
      const verifyUpdateResponse = await axios.get(`${baseUrl}/captain/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (verifyUpdateResponse.data.status === newStatus) {
        setStatus(newStatus);
        console.log(`Successfully updated and verified status to ${newStatus}`);
      } else {
        console.error('Status verification failed. Server status:', verifyUpdateResponse.data.status);
        throw new Error('Status update verification failed');
      }
    } catch (error: any) {
      console.error('Error updating status:', error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      // Show error to user
      Alert.alert(
        'Status Update Failed',
        'Failed to update status. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Add status verification on component mount
  useEffect(() => {
    const verifyStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await axios.get(`${baseUrl}/captain/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.status) {
          console.log('Initial status from server:', response.data.status);
          setStatus(response.data.status);
        }
      } catch (error: any) {
        console.error('Error verifying initial status:', error.message);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
      }
    };

    verifyStatus();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          style={styles.logo}
          source={{
            uri: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png',
          }}
        />
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.push('./CaptainLogin')}
        >
          <Image
            source={require('../../assets/images/logoutcaptain.png')}
            style={styles.logoutImage}
          />
        </TouchableOpacity>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={currentLocation}
          showsUserLocation={true}
          showsMyLocationButton={true}
        />
      </View>

      {/* Info Card */}
      <CaptainInfoCard status={status} toggleStatus={toggleStatus} />

      {/* Ride Popup */}
      <Animated.View
        style={[
          {
            transform: [{ translateY: popupAnim }],
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
        ]}
      >
        <RidePopup onClose={() => setShowRidePopup(false)} emergencyData={emergencyData} />
      </Animated.View>
    </View>
  );
};

export default Home;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width,
  },
  logo: {
    width: 64,
    height: 20,
    resizeMode: 'contain',
  },
  logoutBtn: {
    height: 40,
    width: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  logoutImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  mapContainer: {
    flex: 3,
    marginTop: 80,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
