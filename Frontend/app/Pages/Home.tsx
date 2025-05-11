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

        const decoded: any = jwtDecode(token);
        if (decoded && decoded.username) {
          setUsername(decoded.username);
        } else {
          console.warn("Username not found in token.");
        }
      } catch (err) {
        console.error("Failed to decode token:", err);
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
      if (!baseUrl) {
        Alert.alert("Error", "Base URL is not defined in the environment variables.");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Authorization token not found.");
        return;
      }

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
        coordinates: [fixedRegion.longitude, fixedRegion.latitude]
      };

      // Calculate estimated arrival time (15 minutes from now)
      const estimatedArrivalTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Convert vehicle type to match backend enum
      let serviceType = vehicle.toLowerCase();
      if (serviceType === 'fire brigade') {
        serviceType = 'fire';
      }

      // Log the request data for debugging
      console.log('Creating ride with data:', {
        emergencyLocation,
        serviceType,
        emergencyType: "Emergency",
        description: `Emergency request at ${location}`,
        estimatedArrivalTime
      });

      const response = await axios.post(
        `${baseUrl}/rides/create`,
        {
          emergencyLocation,
          serviceType,
          emergencyType: "Emergency",
          description: `Emergency request at ${location}`,
          estimatedArrivalTime
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Ride created successfully:", response.data);
      setRideResponse(response.data);
      setSearchingForDriver(true);
    } catch (error: any) {
      console.error("Error creating ride:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || "Failed to create ride. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

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
