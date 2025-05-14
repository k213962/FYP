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
  AppState,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import CaptainInfoCard from '../../Components/captainInfoCard';
import RidePopup from '../../Components/RidePopup';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';

const baseUrl = process.env.EXPO_PUBLIC_BASE_URL || 'http://localhost:3000';

// Add a check for baseUrl near the top
console.log('[ENV] Using base URL:', baseUrl);
if (!baseUrl || baseUrl === 'http://localhost:3000') {
  console.warn('[ENV] Warning: Using localhost as base URL. This may not work on real devices.');
}

interface EmergencyData {
  rideId: string;
  timeoutSeconds: number;
  emergencyLocation: {
    coordinates: [number, number];
    address?: string;
  };
  emergencyType: string;
  description: string;
  distanceInKm: number;
  estimatedArrivalTime: string;
  userName?: string;
  userPhone?: string;
  user?: {
    firstname?: string;
    lastname?: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
}

const Home = () => {
  const router = useRouter();
  const [status, setStatus] = useState('Offline');
  const [showRidePopup, setShowRidePopup] = useState(false);
  const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null);
  const appState = useRef(AppState.currentState);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const rideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const popupAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  // Add a useRef for tracking first render
  const isFirstRender = useRef(true);

  // Function to update status in database
  const updateDriverStatusInDB = async (newStatus: string) => {
    try {
      console.log(`[STATUS] Beginning status update to ${newStatus}...`);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('[STATUS] No authentication token found');
        return false;
      }

      const response = await axios.patch(
        `${baseUrl}/captain/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        console.log(`[STATUS] Successfully updated status to ${newStatus} in database`);
        return true;
      } else {
        console.error(`[STATUS] Failed to update status. Server response:`, response.data);
        return false;
      }
    } catch (error) {
      console.error('[STATUS] Error updating status:', error);
      return false;
    }
  };

  // Toggle captain status function
  const toggleStatus = async () => {
    const newStatus = status === 'Online' ? 'Offline' : 'Online';
    console.log(`[STATUS] User toggled status button from ${status} to ${newStatus}`);
    setStatus(newStatus);
  };

  // Function to handle ride requests
  const handleRideRequest = (data: any) => {
    console.log('[REQUEST] Processing ride request:', data);

    // Don't show if already displaying a popup
    if (showRidePopup) {
      console.log('[REQUEST] Already showing a ride popup, not showing another');
      return;
    }
      
    // Basic validation - only check essential fields
    if (!data || !data.rideId || !data.emergencyLocation?.coordinates) {
      console.error('[REQUEST] Missing required fields in ride request:', data);
      return;
    }

    // Stop polling while showing the request
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Format and store the emergency data
    const formattedData: EmergencyData = {
      rideId: data.rideId,
      timeoutSeconds: data.timeoutSeconds || 15,
      emergencyLocation: {
        coordinates: data.emergencyLocation.coordinates,
        address: data.emergencyLocation.address
      },
      emergencyType: data.emergencyType || 'Not specified',
      description: data.description || '',
      distanceInKm: typeof data.distance === 'string' ? 
        parseInt(data.distance.split('-')[0]) : 0,
      estimatedArrivalTime: data.estimatedArrivalTime || '~10 mins',
      userName: data.userName?.trim() || 'Anonymous',
      userPhone: data.userPhone || null,
      user: data.user || null,
      createdAt: data.timestamp || new Date().toISOString()
    };

    // Set the emergency data and show popup
    setEmergencyData(formattedData);
    console.log('[REQUEST] Setting showRidePopup to true for ride:', formattedData.rideId);
    setShowRidePopup(true);
    
    // Start the timer for this request
    startRideResponseTimer(formattedData.timeoutSeconds);
  };
  
  // Poll for available ride requests
  const pollForRideRequests = async () => {
    if (status !== 'Online') {
      console.log('[POLL] Captain is offline, skipping poll');
      return;
    }

    if (showRidePopup) {
      console.log('[POLL] Already showing ride popup, skipping poll');
      return;
    }
    
    try {
      console.log('[POLL] Checking for available ride requests...');
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('[POLL] No authentication token found');
        return;
      }

      const response = await axios.get(`${baseUrl}/rides/check-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const { rideRequest } = response.data;
      
      if (rideRequest) {
        console.log('[POLL] Received ride request:', JSON.stringify(rideRequest));
        handleRideRequest(rideRequest);
      }
    } catch (error) {
      console.error('[POLL] Error polling for ride requests:', error);
    }
  };
  
  // Handle accepting or declining a ride
  const handleRideResponse = async (response: 'accept' | 'decline') => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token || !emergencyData) {
        console.error('[RESPONSE] No token or ride request');
        return;
      }
      
      if (response === 'accept') {
        // Accept the ride and update captain status
        const acceptResponse = await axios.post(
          `${baseUrl}/rides/${emergencyData.rideId}/accept`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (acceptResponse.status === 200) {
          console.log('[RESPONSE] Ride accepted successfully');
          // Update local status to busy
          setStatus('Busy');
          // Stop polling for new requests
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // Navigate to the riding screen
          router.push(`/Pages/CaptainRiding?rideId=${emergencyData.rideId}`);
        }
      } else {
        // If declined, resume polling if status is still Online
        if (status === 'Online') {
          console.log('[RESPONSE] Resuming polling after decline');
          setIsPolling(true);
          pollForRideRequests();
          pollingIntervalRef.current = setInterval(pollForRideRequests, 5000);
        }
      }
      
      // Clear the popup in any case
      setShowRidePopup(false);
      setEmergencyData(null);
      
    } catch (error) {
      console.error('[RESPONSE] Error responding to ride:', error);
      Alert.alert('Error', 'Failed to respond to ride request. Please try again.');
      setShowRidePopup(false);
      setEmergencyData(null);
      
      // Resume polling on error if status is Online
      if (status === 'Online') {
        console.log('[RESPONSE] Resuming polling after error');
        setIsPolling(true);
        pollForRideRequests();
        pollingIntervalRef.current = setInterval(pollForRideRequests, 5000);
      }
    }
  };

  // Start a timer for the ride response
  const startRideResponseTimer = (seconds: number) => {
    setRemainingTime(seconds);
    
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        const newTime = prevTime - 1;
        
        if (newTime <= 0) {
          clearInterval(timer);
          // Auto-decline when timer runs out
          handleRideResponse('decline');
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
    
    // Store timer reference for cleanup
    rideTimerRef.current = timer;
  };

  // Start polling when status changes to Online
  useEffect(() => {
    if (status === 'Online') {
      console.log('[POLL] Starting ride request polling because status is Online');
      setIsPolling(true);
      
      // Poll immediately and then every 5 seconds
      pollForRideRequests();
      pollingIntervalRef.current = setInterval(pollForRideRequests, 5000);
    } else {
      console.log('[POLL] Stopping ride request polling because status is not Online');
      setIsPolling(false);
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
    
    // Clean up interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      if (rideTimerRef.current) {
        clearInterval(rideTimerRef.current);
        rideTimerRef.current = null;
      }
    };
  }, [status]);

  // Add a useEffect that watches status changes and updates the database
  useEffect(() => {
    // Skip the initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // This will synchronize UI status with database when it changes
    console.log(`[STATUS] Status changed to ${status}, synchronizing with database`);
    updateDriverStatusInDB(status);
  }, [status]);

  // Set up location tracking
  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        const { status: locationPermissionStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (locationPermissionStatus !== Location.PermissionStatus.GRANTED) {
          console.error('[LOCATION] Permission to access location was denied');
          return;
        }
        
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            
            setCurrentLocation({
              latitude,
              longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
            });
            
            if (status === 'Online') {
              updateLocationOnServer(latitude, longitude);
            }
          }
        );
        
        setLocationSubscription(subscription);
      } catch (error) {
        console.error('[LOCATION] Error starting location tracking:', error);
      }
    };
    
    startLocationTracking();
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Add useEffect to animate the popup when showRidePopup changes
  useEffect(() => {
    if (showRidePopup) {
      Animated.spring(popupAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8
      }).start();
    } else {
      Animated.spring(popupAnim, {
        toValue: Dimensions.get('window').height,
        useNativeDriver: true,
        tension: 65,
        friction: 8
      }).start();
      
      setTimeout(() => {
        setEmergencyData(null);
      }, 300);
    }
  }, [showRidePopup]);

  // Function to update location on server
  const updateLocationOnServer = async (latitude: number, longitude: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      await axios.put(
        `${baseUrl}/captain/location`,
        { location: { latitude, longitude } },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error updating location on server:', error);
    }
  };

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
        
        {/* Polling indicator */}
        {isPolling && (
          <View style={styles.pollingIndicator}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.pollingText}>Listening for requests</Text>
          </View>
        )}
      </View>

      {/* Info Card */}
      <CaptainInfoCard status={status} toggleStatus={toggleStatus} />

      {/* Ride Popup */}
      <Animated.View
        style={[
          styles.popupContainer,
          {
            transform: [{ translateY: popupAnim }],
          },
        ]}
      >
        {showRidePopup && emergencyData && (
          <View style={styles.popupWrapper}>
            <RidePopup 
              onClose={() => {
                handleRideResponse('decline');
              }} 
              emergencyData={emergencyData}
              remainingTime={remainingTime}
              onAccept={() => handleRideResponse('accept')}
            />
          </View>
        )}
      </Animated.View>

      <StatusBar style="dark" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  header: {
    height: 60,
    width: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    zIndex: 1,
  },
  logo: {
    width: 50,
    height: 50,
    marginLeft: 10,
  },
  logoutBtn: {
    padding: 5,
  },
  logoutImage: {
    width: 30,
    height: 30,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  popupContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 1000,
    maxHeight: '65%',
  },
  popupWrapper: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    paddingBottom: 20,
  },
  pollingIndicator: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollingText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
  }
});

export default Home;
