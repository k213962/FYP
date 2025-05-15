import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import VehicleSelectionPanel from "./VehicleSelectionPanel";
import LookingForDriver from "./LookingForDriver";
import ConfirmRide from "./UserConfirmRide";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "expo-router";


const { width, height } = Dimensions.get("window");

const Home = () => {
  const { location } = useLocalSearchParams<{ location?: string }>();
  const [fixedRegion, setFixedRegion] = useState({
    latitude: 24.8607, // Default: Karachi
    longitude: 67.0011,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [vehicle, setVehicle] = useState<string | null>(null);
  const [isDriverFound, setDriverFound] = useState(false);
  const [isSearchingForDriver, setSearchingForDriver] = useState(false);
  const [isRideConfirmed, setRideConfirmed] = useState(false);
  const [rideResponse, setRideResponse] = useState<any>(null);
  const [username, setUsername] = useState<string>("");
  const [captainDetails, setCaptainDetails] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (location) {
      fetchLocationCoordinates(location as string);
    }
  }, [location]);

  useEffect(() => {
    const getUsernameFromToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.warn("No token found.");
          return;
        }

        console.log("Token validation check:", {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...',
          hasBearer: token.startsWith('Bearer ')
        });

        // Remove 'Bearer ' if it's included in the stored token
        const tokenToVerify = token.startsWith('Bearer ') ? token.slice(7) : token;

        const decoded: any = jwtDecode(tokenToVerify);
        console.log("Decoded token payload:", {
          id: decoded.id,
          email: decoded.email,
          exp: decoded.exp,
          timeUntilExpiry: decoded.exp ? new Date(decoded.exp * 1000).getTime() - Date.now() : 'N/A'
        });

        if (decoded && decoded.username) {
          setUsername(decoded.username);
        } else {
          console.warn("Username not found in token payload:", decoded);
        }
      } catch (err) {
        console.error("Token validation error:", err);
      }
    };

    getUsernameFromToken();
  }, []);

  const fetchLocationCoordinates = async (address: string) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        Alert.alert("Error", "Google API Key is missing.");
        return;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );

      if (response.data.status === "OK") {
        const { lat, lng } = response.data.results[0].geometry.location;
        setFixedRegion((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
      } else {
        Alert.alert("Error", "Unable to fetch location.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load location.");
    }
  };

  const createRide = async () => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
      console.log('Base URL:', baseUrl);

      if (!baseUrl) {
        Alert.alert("Error", "Base URL is not defined in the environment variables.");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      console.log('Token validation:', {
        exists: !!token,
        length: token?.length,
        hasBearer: token?.startsWith('Bearer ')
      });

      if (!token) {
        Alert.alert("Error", "Authorization token not found.");
        return;
      }

      // Ensure token doesn't already have 'Bearer '
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      if (!vehicle) {
        Alert.alert("Error", "Please select a vehicle type first.");
        return;
      }

      if (!location) {
        Alert.alert("Error", "Location is required.");
        return;
      }

      // Format the emergency location data
      const emergencyLocation = {
        type: 'Point',
        coordinates: [fixedRegion.longitude, fixedRegion.latitude],
        address: location
      };

      // Vehicle type is already in correct format from VehicleSelectionPanel
      const requestData = {
        emergencyLocation,
        serviceType: vehicle,
        emergencyType: "Emergency",
        description: `Emergency request at ${location}`
      };

      // Log the request details
      console.log('Creating emergency request:', {
        url: `${baseUrl}/rides/create`,
        data: requestData,
        authHeaderLength: authToken.length,
        authHeaderStart: authToken.substring(0, 20) + '...'
      });

      const response = await axios.post(
        `${baseUrl}/rides/create`,
        requestData,
        {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log("Ride created successfully:", response.data);
      setRideResponse(response.data);
      setSearchingForDriver(true);
    } catch (error: any) {
      console.error('Ride creation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Check for specific error types
      if (error.response?.status === 401) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again."
        );
        // You might want to redirect to login here
        return;
      }
      
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create emergency request. Please try again."
      );
    }
  };

  // Add polling for ride status updates
  useEffect(() => {
    if (isSearchingForDriver && rideResponse?.ride?._id) {
      console.log('Starting to poll for ride status updates');
      
      const pollRideStatus = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            console.error('No token found for polling');
            return;
          }

          const response = await axios.get(
            `${process.env.EXPO_PUBLIC_BASE_URL}/rides/${rideResponse.ride._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Full ride response:', {
            rideId: rideResponse.ride._id,
            status: response.data?.ride?.status,
            hasCaptain: !!response.data?.ride?.captain,
            captainDetails: response.data?.ride?.captain
          });

          if (response.data?.ride) {
            const ride = response.data.ride;
            
            // Check if ride has a captain assigned
            if (ride.captain && ride.status !== 'pending') {
              console.log('Captain assigned to ride:', {
                captainId: ride.captain._id,
                status: ride.status
              });
              
              setSearchingForDriver(false);
              setCaptainDetails(ride.captain);
              
              // Navigate to tracking screen with ride ID
              console.log('Navigating to tracking screen...');
              router.replace({
                pathname: "/Pages/UserRideTracking",
                params: { rideId: rideResponse.ride._id }
              });
              
              // Clear polling interval
              if (pollingInterval) {
                clearInterval(pollingInterval);
                setPollingInterval(null);
              }
              
              return;
            }

            switch (ride.status) {
              case 'pending':
                console.log('Ride still pending, continuing to search...');
                break;
              case 'no_drivers':
                console.log('No drivers available, showing alert...');
                setSearchingForDriver(false);
                Alert.alert(
                  'No Drivers Available',
                  'Sorry, no drivers are available at the moment. Please try again later.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
                break;
              case 'cancelled':
                console.log('Ride cancelled, showing alert...');
                setSearchingForDriver(false);
                Alert.alert(
                  'Ride Cancelled',
                  'Your ride request has been cancelled.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
                break;
              default:
                console.log('Unhandled ride status:', ride.status);
                break;
            }
          }
        } catch (error) {
          console.error('Error polling ride status:', error);
        }
      };

      // Poll every 3 seconds
      const interval = setInterval(pollRideStatus, 3000);
      setPollingInterval(interval);
      pollRideStatus(); // Poll immediately

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [isSearchingForDriver, rideResponse]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={fixedRegion}>
          <Marker
            coordinate={{ latitude: fixedRegion.latitude, longitude: fixedRegion.longitude }}
            title="Your Location"
          />
        </MapView>
      </View>

      {/* Step 2: Vehicle Selection */}
      {!vehicle && (
        <VehicleSelectionPanel
          onSelect={(selectedVehicle: string) => {
            console.log("Selected Vehicle Type:", selectedVehicle);
            setVehicle(selectedVehicle);
          }}
        />
      )}

      {/* Step 3: Confirm Ride */}
      {vehicle && !isRideConfirmed && (
        <ConfirmRide
          location={location || "Unknown Location"}
         
          vehicleType={vehicle || "Unknown Vehicle"}
          onConfirm={() => {
            setRideConfirmed(true);
            createRide();
          }}
        />
      )}

      {/* Step 4: Looking for Driver */}
      {isRideConfirmed && isSearchingForDriver && (
        <LookingForDriver
          onDriverFound={() => {
            setDriverFound(true);
            setSearchingForDriver(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  mapContainer: {
    flex: 3,
  },
  map: {
    width: width,
    height: "100%",
  },
});

export default Home;
