import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ConfirmRideProps {
  location: string;
  vehicleType: string;
  onConfirm: () => void;
}

const ConfirmRide = ({ location, vehicleType, onConfirm }: ConfirmRideProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Confirm your emergency details</Text>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={20} color="#444" />
          <View style={styles.infoText}>
            <Text style={styles.mainText}>{location}</Text>
            <Text style={styles.subText}>Emergency Location</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <MaterialIcons name="directions-car" size={20} color="#444" />
          <View style={styles.infoText}>
            <Text style={styles.mainText}>{vehicleType}</Text>
            <Text style={styles.subText}>Vehicle Type</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onConfirm}>
        <Text style={styles.buttonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 10,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#222",
  },
  card: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  infoText: {
    marginLeft: 12,
  },
  mainText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  subText: {
    fontSize: 13,
    color: "#777",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ConfirmRide;
