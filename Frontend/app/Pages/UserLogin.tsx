import React, { useState, useContext } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { UserDataContext } from "../context/userContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUser } = useContext(UserDataContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/user/login`,
        { email, password }
      );

      if (response.status === 200) {
        const { token, user } = response.data;

        // Save user data to context
        setUser(user); // Set the user in the context
        console.log("User data set in context:", user); // Log the user object

        // Save token to AsyncStorage
        await AsyncStorage.setItem("token", token);

        Alert.alert("Success", "Login successful!");
        router.replace("./NavOptions");
      }
    } catch (error) {
      console.error("Error during login:", error.response?.data?.message || error.message);
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
      </View>

      <Text style={styles.title}>User Login</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Enter Email"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Enter Password"
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>New Here?</Text>
        <TouchableOpacity onPress={() => router.push("./UserSignup")}>
          <Text style={styles.signupLink}> Create New Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.captainButton}
        onPress={() => router.push("./CaptainLogin")}
      >
        <Text style={styles.buttonText}>Sign In As Captain</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
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
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
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
  captainButton: {
    backgroundColor: "green",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
});

export default UserLogin;
