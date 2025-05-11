import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function UserSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    cnic: "",
    mobile: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { firstname, lastname, email, password, confirmPassword, cnic, mobile } = formData;

    // Name validation
    if (!firstname.trim()) return "First name is required!";
    if (firstname.length < 2) return "First name must be at least 2 characters!";
    if (!/^[A-Za-z\s]+$/.test(firstname)) return "First name can only contain letters and spaces!";

    if (!lastname.trim()) return "Last name is required!";
    if (lastname.length < 2) return "Last name must be at least 2 characters!";
    if (!/^[A-Za-z\s]+$/.test(lastname)) return "Last name can only contain letters and spaces!";

    // Email validation
    if (!email.trim()) return "Email is required!";
    if (!/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com)$/.test(email)) 
      return "Please enter a valid Gmail or Hotmail address!";

    // Password validation
    if (!password) return "Password is required!";
    if (password.length < 8) return "Password must be at least 8 characters!";
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter!";
    if (!/(?=.*[0-9])/.test(password)) return "Password must contain at least one number!";
    if (!/(?=.*[!@#$%^&*])/.test(password)) return "Password must contain at least one special character (!@#$%^&*)!";
    if (password !== confirmPassword) return "Passwords do not match!";

    // CNIC validation
    if (!cnic.trim()) return "CNIC is required!";
    if (!/^\d{13}$/.test(cnic)) return "CNIC must be exactly 13 digits!";

    // Mobile validation
    if (!mobile.trim()) return "Mobile number is required!";
    if (!/^03[0-9]{9}$/.test(mobile)) return "Mobile number must start with 03 and be 11 digits!";

    return null;
  };

  const handleSignup = async () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      Alert.alert("Validation Error", errorMessage);
      return;
    }

    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BASE_URL}/user/register`, {
        fullname: {
          firstname: formData.firstname,
          lastname: formData.lastname,
        },
        email: formData.email,
        password: formData.password,
        cnic: formData.cnic,
        mobile: formData.mobile,
      });

      if (response.status === 201) {
        Alert.alert(
          "Registration Successful",
          "Your account has been created successfully!",
          [
            {
              text: "Proceed to Login",
              onPress: () => router.push("./UserLogin"),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Registration Failed",
        error.response?.data?.message || "An error occurred during registration. Please try again."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Please fill in your details to register</Text>

          <View style={styles.formContainer}>
            <View style={styles.nameContainer}>
              <View style={styles.nameInputContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  value={formData.firstname}
                  onChangeText={(val) => handleInputChange("firstname", val)}
                  placeholder="Enter first name"
                  style={styles.input}
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.nameInputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  value={formData.lastname}
                  onChangeText={(val) => handleInputChange("lastname", val)}
                  placeholder="Enter last name"
                  style={styles.input}
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={formData.email}
                onChangeText={(val) => handleInputChange("email", val)}
                placeholder="Enter Gmail or Hotmail"
                keyboardType="email-address"
                style={styles.input}
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={formData.password}
                  onChangeText={(val) => handleInputChange("password", val)}
                  placeholder="Enter password"
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.passwordInput]}
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={formData.confirmPassword}
                  onChangeText={(val) => handleInputChange("confirmPassword", val)}
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  style={[styles.input, styles.passwordInput]}
                  placeholderTextColor="#666"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CNIC Number</Text>
              <TextInput
                value={formData.cnic}
                onChangeText={(val) => handleInputChange("cnic", val)}
                placeholder="Enter 13-digit CNIC"
                keyboardType="numeric"
                maxLength={13}
                style={styles.input}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                value={formData.mobile}
                onChangeText={(val) => handleInputChange("mobile", val)}
                placeholder="Enter mobile number (03XXXXXXXXX)"
                keyboardType="phone-pad"
                style={styles.input}
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignup}>
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push("./UserLogin")}>
                <Text style={styles.loginLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
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
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  nameInputContainer: {
    flex: 1,
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
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    paddingBottom: 20,
  },
  loginText: {
    fontSize: 16,
    color: "#666",
  },
  loginLink: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
