import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Platform,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { ENV } from '../config/env';
import { Linking } from 'react-native';

const baseUrl = process.env.EXPO_PUBLIC_BASE_URL || 'http://localhost:3000';
const BOTTOM_SHEET_HEIGHT = Dimensions.get('window').height * 0.4;

interface Ride {
  _id: string;
  emergencyLocation: {
    coordinates: [number, number];
    address: string;
  };
  emergencyType: string;
  description: string;
  status: string;
  user: {
    firstname: string;
    lastname: string;
    phone: string;
    mobile: string;
    email: string;
  };
}

interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
}

const CaptainRiding = () => {
  const router = useRouter();
  const { rideId } = useLocalSearchParams();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const mapRef = useRef<MapView>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [showDirections, setShowDirections] = useState(false);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const bottomSheetAnim = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;

  // Fetch ride details
  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${baseUrl}/rides/${rideId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Get the ride data and format user name
        const rideData = response.data.ride;
        if (rideData.user && rideData.user.email) {
          rideData.user.firstname = rideData.user.firstname || rideData.user.email.split('@')[0];
        }
        
        setRide(rideData);
      } catch (err) {
        setError('Failed to fetch ride details');
        console.error('Error fetching ride:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId]);

  // Function to toggle directions view
  const toggleDirections = () => {
    const toValue = showDirections ? BOTTOM_SHEET_HEIGHT : 0;
    Animated.spring(bottomSheetAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 8
    }).start();
    setShowDirections(!showDirections);
  };

  // Function to fetch route from OSRM with step-by-step instructions
  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`
      );

      if (response.data.routes && response.data.routes[0]) {
        const route = response.data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0]
        }));

        setRouteCoordinates(coordinates);
        setDistance(`${(route.distance / 1000).toFixed(1)} km`);
        setEstimatedTime(`${Math.ceil(route.duration / 60)} min`);

        // Process navigation steps
        const steps = route.legs[0].steps.map((step: any) => ({
          instruction: step.maneuver.instruction || step.name,
          distance: `${(step.distance / 1000).toFixed(1)} km`,
          duration: `${Math.ceil(step.duration / 60)} min`
        }));
        setNavigationSteps(steps);
      }
    } catch (err) {
      console.error('Error fetching route:', err);
    }
  };

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
            
            // Update server with new location
            updateLocationOnServer(latitude, longitude);
            
            // Update route if we have both points
            if (ride?.emergencyLocation?.coordinates) {
              fetchRoute(
                latitude,
                longitude,
                ride.emergencyLocation.coordinates[1],
                ride.emergencyLocation.coordinates[0]
              );
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
  }, [ride]);

  // Update location on server
  const updateLocationOnServer = async (latitude: number, longitude: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      // First check if captain is online
      const statusResponse = await axios.get(`${baseUrl}/captain/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statusResponse.data.status !== 'Online') {
        // Update status to Online first
        await axios.patch(
          `${baseUrl}/captain/status`,
          { status: 'Online' },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Then update location
      await axios.post(
        `${baseUrl}/captain/location`,
        {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude] // GeoJSON format: [longitude, latitude]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      // Silently handle errors to avoid console spam
      return;
    }
  };

  const handlePhonePress = () => {
    if (ride?.user?.phone) {
      Linking.openURL(`tel:${ride.user.phone}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (error || !ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Ride not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={currentLocation}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Emergency Location Marker */}
          <Marker
            coordinate={{
              latitude: ride.emergencyLocation.coordinates[1],
              longitude: ride.emergencyLocation.coordinates[0],
            }}
            title="Emergency Location"
            description={ride.emergencyLocation.address}
          >
            <MaterialIcons name="emergency" size={30} color="red" />
          </Marker>

          {/* Route Line */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={3}
              strokeColor="#007AFF"
            />
          )}
        </MapView>

        {/* Navigation Info Overlay */}
        <View style={styles.navigationInfo}>
          <TouchableOpacity 
            style={styles.directionsButton}
            onPress={toggleDirections}
          >
            <Ionicons 
              name={showDirections ? "chevron-down" : "list"} 
              size={24} 
              color="#007AFF" 
            />
            <Text style={styles.directionsButtonText}>
              {showDirections ? "Hide Steps" : "Show Steps"}
            </Text>
          </TouchableOpacity>
          <View style={styles.navigationStats}>
            <Text style={styles.navigationText}>
              Distance: {distance}
            </Text>
            <Text style={styles.navigationText}>
              ETA: {estimatedTime}
            </Text>
          </View>
        </View>

        {/* Directions Bottom Sheet */}
        <Animated.View 
          style={[
            styles.directionsContainer,
            {
              transform: [{ translateY: bottomSheetAnim }]
            }
          ]}
        >
          <View style={styles.directionsHeader}>
            <Text style={styles.directionsTitle}>Navigation Steps</Text>
          </View>
          <ScrollView style={styles.stepsList}>
            {navigationSteps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                  <Text style={styles.stepDetails}>
                    {step.distance} • {step.duration}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Ride Details */}
      <View style={[
        styles.detailsContainer,
        showDirections && styles.detailsContainerHidden
      ]}>
        <Text style={styles.detailText}>Emergency Type: {ride.emergencyType}</Text>
        <Text style={styles.detailText}>Status: {ride.status}</Text>
        <Text style={styles.detailText}>Location: {ride.emergencyLocation.address}</Text>
        {ride.description && (
          <Text style={styles.detailText}>Description: {ride.description}</Text>
        )}
        
        {/* User Info */}
        {ride.user && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.sectionTitle}>User Information</Text>
            <Text style={styles.detailText}>
              Name: {ride.user.firstname} {ride.user.lastname || ''}
            </Text>
            <TouchableOpacity onPress={handlePhonePress}>
              <Text style={styles.phoneText}>
                Phone: {ride.user.mobile || ride.user.phone || 'Not provided'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.detailText}>
              Email: {ride.user.email || 'Not provided'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  navigationInfo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  directionsButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '600',
  },
  navigationStats: {
    flexDirection: 'row',
    marginTop: 8,
  },
  navigationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    maxHeight: '40%',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#dc2626',
    marginTop: 20,
  },
  userInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  phoneText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  directionsContainer: {
    position: 'absolute',
    bottom: -BOTTOM_SHEET_HEIGHT,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
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
  },
  directionsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  directionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepsList: {
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  stepDetails: {
    fontSize: 14,
    color: '#666',
  },
  detailsContainerHidden: {
    display: 'none',
  },
});

export default CaptainRiding;
