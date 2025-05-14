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

// interface for emergency data passed to the popup
interface EmergencyData {
  rideId: string;
  timeoutSeconds: number;
  emergencyLocation: {
    address?: string;
    latitude: number;
    longitude: number;
  };
  emergencyType: string;
  description: string;
  distanceInKm: number;
  estimatedArrivalTime: string;
  userName?: string;
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
      console.log(`[STATUS] Token found: ${token.substring(0, 10)}...`);

      // First, check current status in DB
      try {
        console.log(`[STATUS] Checking current status in DB before update...`);
        const checkResponse = await axios.get(`${baseUrl}/captain/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`[STATUS] Current status in DB: ${checkResponse.data.status}`);
      } catch (checkErr) {
        console.error('[STATUS] Error checking current status:', checkErr);
      }

      console.log(`[STATUS] Now sending update request to ${baseUrl}/captain/status`);
      console.log(`[STATUS] Request body:`, { status: newStatus });
      console.log(`[STATUS] Request headers:`, {
        'Authorization': `Bearer ${token.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      });

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

      console.log(`[STATUS] Update response status: ${response.status}`);
      console.log(`[STATUS] Update response data:`, response.data);

      if (response.status === 200) {
        console.log(`[STATUS] Successfully updated status to ${newStatus} in database`);
        
        // Verify the update by checking the status again
        try {
          console.log(`[STATUS] Verifying the update...`);
          const verifyResponse = await axios.get(`${baseUrl}/captain/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`[STATUS] Updated status in DB:`, verifyResponse.data.status);
          
          if (verifyResponse.data.status === newStatus) {
            console.log(`[STATUS] Verification PASSED: DB status (${verifyResponse.data.status}) matches UI status (${newStatus})`);
          } else {
            console.error(`[STATUS] Verification FAILED: DB status (${verifyResponse.data.status}) does not match UI status (${newStatus})`);
          }
        } catch (verifyErr) {
          console.error('[STATUS] Error verifying status update:', verifyErr);
        }
        
        return true;
      } else {
        console.error(`[STATUS] Failed to update status. Server response:`, response.data);
        return false;
      }
    } catch (error) {
      console.error('[STATUS] Error updating status:', error);
      if (axios.isAxiosError(error)) {
        console.error('[STATUS] Error details:', error.response?.data);
      }
      return false;
    }
  };

  // Toggle captain status function
  const toggleStatus = async () => {
    const newStatus = status === 'Online' ? 'Offline' : 'Online';
    console.log(`[STATUS] User toggled status button from ${status} to ${newStatus}`);
    
    // Update status in local state first for immediate UI feedback
    setStatus(newStatus);
    
    // The useEffect will take care of updating the database
  };

  // Function to handle ride requests
  const handleRideRequest = (data: any) => {
    console.log('[REQUEST] Processing ride request:', data);

    // Validate the incoming data
    if (!data || !data.rideId || !data.emergencyLocation || 
        !data.emergencyType || !data.description) {
      console.error('[REQUEST] Invalid ride request data:', data);
      return;
    }

    // Don't show if already displaying a popup
    if (showRidePopup) {
      console.log('[REQUEST] Already showing a ride popup, not showing another');
      return;
    }

    // Format and store the emergency data
    const formattedData: EmergencyData = {
      rideId: data.rideId,
      timeoutSeconds: data.timeoutSeconds || 15,
      emergencyLocation: data.emergencyLocation,
      emergencyType: data.emergencyType,
      description: data.description,
      distanceInKm: data.distanceInKm || 0,
      estimatedArrivalTime: data.estimatedArrivalTime || '~10 mins',
      userName: data.userName || 'Anonymous',
      createdAt: data.createdAt || new Date().toISOString()
    };

    // Set the emergency data and show popup
    setEmergencyData(formattedData);
    console.log('[REQUEST] Setting showRidePopup to true for ride:', formattedData.rideId);
    setShowRidePopup(true);
    
    // Play a sound alert
    try {
      // Sound code would go here
      console.log('[REQUEST] Would play alert sound here if implemented');
    } catch (error) {
      console.error('[REQUEST] Error playing alert sound:', error);
    }
  };
  
  // Poll for available ride requests
  const pollForRideRequests = async () => {
    if (status !== 'Online' || showRidePopup) {
      return; // Don't poll if offline or already showing a popup
    }
    
    try {
      console.log('[POLL] Checking for available ride requests...');
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('[POLL] No authentication token found');
        return;
      }
      
      const response = await axios.get(`${baseUrl}/notifications/poll`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const { notifications } = response.data;
      
      if (notifications && notifications.length > 0) {
        console.log(`[POLL] Received ${notifications.length} notifications`);
        
        // Process only the first notification (latest/closest)
        const notification = notifications[0];
        
        if (notification.type === 'ride_request') {
          console.log('[POLL] Processing ride request notification:', notification);
          handleRideRequest(notification);
        }
      } else {
        console.log('[POLL] No new notifications');
      }
    } catch (error) {
      console.error('[POLL] Error polling for notifications:', error);
    }
  };
  
  // Start polling when status changes to Online
  useEffect(() => {
    if (status === 'Online') {
      console.log('[POLL] Starting notification polling because status is Online');
      setIsPolling(true);
      
      // Poll immediately and then every 5 seconds
      pollForRideRequests();
      pollingIntervalRef.current = setInterval(pollForRideRequests, 5000);
    } else {
      console.log('[POLL] Stopping notification polling because status is Offline');
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
    };
  }, [status, showRidePopup]);

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
        // Request location permissions
        const { status: locationPermissionStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (locationPermissionStatus !== Location.PermissionStatus.GRANTED) {
          console.error('[LOCATION] Permission to access location was denied');
          return;
        }
        
        // Start watching position
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // minimum distance (meters) between updates
            timeInterval: 5000    // minimum time (ms) between updates
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            console.log(`[LOCATION] New location: ${latitude}, ${longitude}`);
            
            // Update local state
            setCurrentLocation({
              latitude,
              longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
            });
            
            // Send location to server if captain is online
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
    
    // Clean up on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  
  // Function to update location on server
  const updateLocationOnServer = async (latitude: number, longitude: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('[LOCATION] No authentication token found');
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
      
      console.log('[LOCATION] Location updated on server');
    } catch (error) {
      console.error('[LOCATION] Error updating location on server:', error);
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
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000, // Make sure it appears above everything else
          },
        ]}
      >
        {emergencyData && (
          <View style={styles.popupWrapper} onLayout={() => console.log('[POPUP] Popup view rendered')}>
            <RidePopup onClose={() => {
              console.log('[POPUP] Closing popup');
              setShowRidePopup(false);
              setEmergencyData(null);
            }} emergencyData={emergencyData} />
          </View>
        )}
      </Animated.View>

      <StatusBar style="dark" />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 70,
    width: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
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
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  popupContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'flex-end',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontWeight: 'bold',
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
