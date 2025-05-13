import React, { useState, useContext } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { UserDataContext } from "../context/userContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useContext(UserDataContext);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert("Validation Error", "Please enter both email and password");
        return;
      }

      setIsLoading(true);
      const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
      if (!baseUrl) {
        Alert.alert("Configuration Error", "Base URL is not defined");
        return;
      }

      console.log('Login attempt details:', {
        email,
        passwordLength: password.length,
        baseUrl
      });

      const response = await axios.post(
        `${baseUrl}/user/login`,
        {
          email,
          password
        }
      );

      console.log('Login response:', {
        status: response.status,
        hasToken: !!response.data.token,
        hasUserData: !!response.data.userData,
        message: response.data.message
      });

      if (response.status === 200 && response.data.token) {
        // Save token
        await AsyncStorage.setItem("token", response.data.token);
        console.log('Token saved successfully');
        
        // Save user data if available
        if (response.data.userData) {
          await AsyncStorage.setItem("userData", JSON.stringify(response.data.userData));
          setUser(response.data.userData);
          console.log('User data saved successfully');
        }

        // Navigate to NavOptions
        router.replace("/Pages/NavOptions");
      } else {
        console.log('Invalid response:', response.data);
        Alert.alert("Authentication Error", "Invalid response from server");
      }
    } catch (error: any) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        data: error.response?.data
      });
      const errorMessage = error.response?.data?.message || "Invalid credentials";
      Alert.alert("Authentication Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!email) {
        Alert.alert("Validation Error", "Please enter your email address");
        return;
      }

      setIsLoading(true);
      const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
      if (!baseUrl) {
        Alert.alert("Configuration Error", "Base URL is not defined");
        return;
      }

      const response = await axios.post(
        `${baseUrl}/user/forgot-password`,
        { email }
      );

      if (response.status === 200) {
        Alert.alert(
          "Password Reset",
          "Password reset instructions have been sent to your email",
          [
            {
              text: "OK",
              style: "default"
            }
          ]
        );
      }
    } catch (error: any) {
      console.error("Forgot password error:", error.response?.data || error.message);
      Alert.alert(
        "Password Reset Failed",
        error.response?.data?.message || "Failed to process forgot password request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
          </View>

          <Text style={styles.title}>User Login</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  style={[styles.input, styles.passwordInput]}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#666"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => router.push('./ResetPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => router.push('./UserSignup')}
            >
              <Text style={styles.signupButtonText}>
                Don't have an account? Sign up
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captainButton}
              onPress={() => router.push("./CaptainLogin")}
              disabled={isLoading}
            >
              <Text style={styles.captainButtonText}>Sign In As Captain</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 500,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 14,
  },
  signupButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
    marginBottom: 15,
  },
  signupButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  captainButton: {
    backgroundColor: "#34C759",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  captainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPasswordButton: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserLogin;
