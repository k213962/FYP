import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";

const VEHICLES = ["Police", "Fire", "Ambulance"];

const VehicleSelectionPanel = ({ onSelect }: { onSelect: (vehicle: string) => void }) => {
  const slideAnim = useRef(new Animated.Value(300)).current; // Start off-screen (300px below)

  useEffect(() => {
    // Animate the panel to slide up
    Animated.timing(slideAnim, {
      toValue: 0, // Move to its final position
      duration: 500, // Animation duration in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  }, [slideAnim]);

  const handleVehicleSelect = (vehicle: string) => {
    // Convert to lowercase for backend compatibility
    const serviceType = vehicle.toLowerCase();
    onSelect(serviceType);
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        { transform: [{ translateY: slideAnim }] }, // Apply the slide animation
      ]}
    >
      <View style={styles.panel}>
        <Text style={styles.title}>Select Emergency Service</Text>
        <View style={styles.vehicleList}>
          {VEHICLES.map((vehicle) => (
            <TouchableOpacity
              key={vehicle}
              style={styles.button}
              onPress={() => handleVehicleSelect(vehicle)}
            >
              <Text style={styles.buttonText}>{vehicle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black background
    justifyContent: "flex-end", // Align the panel to the bottom
  },
  panel: {
    width: "100%", // Full width of the screen
    backgroundColor: "#1e1e1e", // Dark gray background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 10, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff", // White text color
    textAlign: "center",
  },
  vehicleList: {
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#ff5722", // Orange button color
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "90%", // Button width is 90% of the panel
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff", // White text color
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default VehicleSelectionPanel;
