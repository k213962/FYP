import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface LookingForDriverProps {
  onDriverFound: () => void;
}

const LookingForDriver = ({ onDriverFound }: LookingForDriverProps) => {
  const slideAnim = useRef(new Animated.Value(300)).current; // Start off-screen (300px below)

  useEffect(() => {
    // Animate the panel to slide up
    Animated.timing(slideAnim, {
      toValue: 0, // Move to its final position
      duration: 500, // Animation duration in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View
      style={[
        styles.overlay,
        { transform: [{ translateY: slideAnim }] }, // Apply the slide animation
      ]}
    >
      <View style={styles.panel}>
        <Text style={styles.heading}>Searching for a driver...</Text>
        <Text style={styles.subHeading}>Please wait while we find a driver for you.</Text>
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
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff", // White text color
    textAlign: "center",
  },
  subHeading: {
    fontSize: 16,
    color: "#ccc", // Light gray text color
    textAlign: "center",
  },
});

export default LookingForDriver;
