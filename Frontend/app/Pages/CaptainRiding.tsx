import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const { height } = Dimensions.get("window");

const CaptainRiding = () => {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={currentLocation}
          showsUserLocation={true}
          showsMyLocationButton={true}
        />
      </View>

      {/* Uber Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.push('./CaptainHome')}
        >
          <Image
            source={require('../../assets/images/logoutcaptain.png')}
            style={styles.logoutImage}
          />
        </TouchableOpacity>
      </View>

      {/* Emergency Bottom Panel */}
      <View style={styles.bottomPanel}>
        <Text style={styles.kmText}>4 KM away</Text>
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={() => alert("Ride Completed")}
        >
          <Text style={styles.completeBtnText}>Complete Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CaptainRiding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 70,
    height: 30,
    resizeMode: "contain",
  },
  menuBtn: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 20,
  },
  logoutBtn: {
    height: 40,
    width: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  logoutImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  kmText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  completeBtn: {
    backgroundColor: "red",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  completeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
