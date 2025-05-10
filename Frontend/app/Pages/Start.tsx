import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Start() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} />
      <Image source={require("../../assets/hero-image.png")} style={styles.heroImage} />

      <View style={styles.bottomContainer}>
        <Text style={styles.title}>
          Get Started With <Text style={styles.brand}>EmergiVoice</Text>
        </Text>

        {/* Navigate to UserLogin */}
        <TouchableOpacity style={styles.button} onPress={() => router.push("./UserLogin")}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  logo: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 100,
    height: 40,
    resizeMode: "contain",
  },
  heroImage: {
    flex: 1.5,
    width: "100%",
    resizeMode: "cover",
  },
  bottomContainer: {
    backgroundColor: "#fff",
    paddingVertical: 30,
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "500",
    color: "#333",
  },
  brand: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ff3b30",
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 15,
    paddingHorizontal: 120,
    borderRadius: 8,
    marginTop: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
