import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";

const { height } = Dimensions.get("window");

const CaptainRiding = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <Image
        style={styles.heroImage}
        source={{
          uri: 'https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif',
        }}
      />

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
  heroImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover", // this removes black bars and zooms in to fill
  position: "absolute",
  top: 0,
  left: 0,
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
  },logoutBtn: {
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
    color: "red", // make the KM text red
    marginBottom: 10,
    textAlign: "center",
  },
 completeBtn: {
  backgroundColor: "red",
  paddingVertical: 12,
  paddingHorizontal: 30,
  borderRadius: 12,
  width: "100%", // full width button
  justifyContent: "center", // centers the text vertically
  alignItems: "center", // centers the text horizontally
},
completeBtnText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16,
},
});
