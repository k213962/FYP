import React from "react";
import { View, Text, StyleSheet } from "react-native";

const WaitingForDriver = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your driver is on the way!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    elevation: 5,
    alignItems: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
});

export default WaitingForDriver;
