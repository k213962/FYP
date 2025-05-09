import { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CaptainLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/captain/login`,
        { email, password }
      );

      if (response.status === 200) {
        const { token } = response.data;
        
        // Save token to AsyncStorage
        await AsyncStorage.setItem("token", token);
        
        Alert.alert("Success", "Login successful!");
        router.push("./CaptainHome");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Invalid credentials"
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
      </View>

      <Text style={styles.title}>Captain Login</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email or Phone No"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Join A Fleet?</Text>
        <TouchableOpacity onPress={() => router.push("./CaptainSignup")}>
          <Text style={styles.signupLink}> Register As A Captain</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
      <TouchableOpacity
        style={styles.userButton}
        onPress={() => router.push("./UserLogin")}
      >
        <Text style={styles.buttonText}>Sign In As User</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  logo: { width: 140, height: 140, resizeMode: "contain" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    backgroundColor: "#f8f8f8",
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "black",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  signupText: { fontSize: 16 },
  signupLink: { color: "blue", fontSize: 16, fontWeight: "bold" },
  spacer: { flex: 1 },
  userButton: {
    backgroundColor: "green",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
});
