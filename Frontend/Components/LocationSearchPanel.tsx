import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";

interface LocationSearchPanelProps {
  onSelect: (location: string) => void;
}

const LocationSearchPanel: React.FC<LocationSearchPanelProps> = ({ onSelect }) => {
  const [query, setQuery] = useState<string>(""); // Input field value
  const [suggestions, setSuggestions] = useState<string[]>([]); // Suggestions list

  const fetchSuggestions = async (text: string) => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_BASE_URL}/maps/get-suggestions`, {
        params: { address: text },
      });
      setSuggestions(response.data); // Assuming the backend returns an array of suggestions
    } catch (error: any) {
      console.error("Error fetching suggestions:", error.response?.data?.message || error.message);
      Alert.alert("Error", "Failed to fetch suggestions. Please try again.");
    }
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      fetchSuggestions(text); // Fetch suggestions when input length is greater than 2
    } else {
      setSuggestions([]); // Clear suggestions if input is too short
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion); // Set the input field to the selected suggestion
    setSuggestions([]); // Clear suggestions
    onSelect(suggestion); // Pass the selected location to the parent component
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your location"
        value={query}
        onChangeText={handleInputChange}
      />
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSuggestionClick(item)}>
              <Text style={styles.suggestion}>{item}</Text>
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    zIndex: 999, // Ensures the suggestion panel renders above other components
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 5,
    backgroundColor: "#fff",
  },
  suggestionsList: {
    maxHeight: 150,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    fontSize: 16,
  },
});

export default LocationSearchPanel;