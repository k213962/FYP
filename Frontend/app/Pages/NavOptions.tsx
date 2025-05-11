import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import axios from "axios";

// Define type for options
type OptionType = typeof options[number];

const options = [
  {
    id: "1",
    title: "Call Emergency",
    image: require("../../assets/report-emergency.png"),
    screen: "/Pages/Home",
  },
  {
    id: "2",
    title: "Chatbot Assistance",
    image: require("../../assets/request-assistance.png"),
    screen: "/Pages/ChatBotScreen",
  },
] as const;

const NavOptions = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log("Checking token:", token);
        setIsAuthenticated(!!token);
        if (!token) {
          console.log("No token found, redirecting to login");
          router.replace("/Pages/UserLogin");
        }
      } catch (error) {
        console.error("Authentication Error:", error);
        setIsAuthenticated(false);
        router.replace("/Pages/UserLogin");
      }
    };
    checkLoginStatus();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) {
        Alert.alert("Error", "Google API Key is missing.");
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      const response = await axios.get(url);

      if (response.data.status === "OK") {
        setCurrentLocation(
          response.data.results[0]?.formatted_address || "Current Location"
        );
      } else {
        Alert.alert("Error", "Unable to fetch address.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch location.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (text: string) => {
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/map/get-suggestions`,
        { params: { address: text } }
      );

      const formattedSuggestions = response.data.map((item: any) => ({
        mainText: item.structured_formatting.main_text,
        secondaryText: item.structured_formatting.secondary_text,
        placeId: item.place_id,
      }));

      setSuggestions(formattedSuggestions);
    } catch (error: any) {
      console.error(
        "Error fetching suggestions:",
        error.response?.data?.message || error.message
      );
      Alert.alert("Error", "Failed to fetch suggestions. Please try again.");
    }
  };

  const handleInputChange = (text: string) => {
    setCurrentLocation(text);
    fetchSuggestions(text);
  };

  const handleSuggestionClick = (suggestion: any) => {
    setCurrentLocation(suggestion.mainText);
    setSuggestions([]);
  };

  const handleNavigation = (item: OptionType) => {
    if (!currentLocation.trim()) {
      Alert.alert("Error", "Please enter your location.");
      return;
    }
    router.push({
      pathname: item.screen,
      params: { location: currentLocation },
    });
  };

  if (isAuthenticated === null) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} />
      <Text style={styles.header}>Enter Your Location</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your location"
          value={currentLocation}
          onChangeText={handleInputChange}
        />
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialIcons name="my-location" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSuggestionClick(item)}>
              <Text style={styles.suggestionMain}>{item.mainText}</Text>
              {item.secondaryText && (
                <Text style={styles.suggestionSecondary}>
                  {item.secondaryText}
                </Text>
              )}
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
        />
      )}

      <View style={styles.optionsContainer}>
        {options.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleNavigation(item)}
            style={styles.optionCard}
          >
            <Image source={item.image} style={styles.optionImage} />
            <Text style={styles.optionText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 14,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  locationButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    marginLeft: 10,
  },
  suggestionsList: {
    maxHeight: 300,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 5,
    width: "100%",
  },
  suggestionMain: {
    padding: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  suggestionSecondary: {
    paddingLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  optionCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 20,
    width: "45%",
    alignItems: "center",
  },
  optionImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  optionText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },
});

export default NavOptions;
