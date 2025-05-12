import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import axios, { AxiosError } from "axios";
import { UserDataContext } from "../context/userContext";
import { Ionicons } from '@expo/vector-icons';

interface UserData {
  token: string;
  [key: string]: any;
}

interface UserContextType {
  setUser: (user: UserData) => void;
}

interface ErrorResponse {
  message: string;
}

const CaptainSignup = () => {
  const { setUser } = useContext(UserDataContext) as UserContextType;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cnic, setCnic] = useState("");
  const [mobile, setMobile] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [vehiclePlateNo, setVehiclePlateNo] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    // Name validation
    if (!firstName.trim()) return "First name is required!";
    if (firstName.length < 2) return "First name must be at least 2 characters!";
    if (!/^[A-Za-z\s]+$/.test(firstName)) return "First name can only contain letters and spaces!";

    if (!lastName.trim()) return "Last name is required!";
    if (lastName.length < 2) return "Last name must be at least 2 characters!";
    if (!/^[A-Za-z\s]+$/.test(lastName)) return "Last name can only contain letters and spaces!";

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

    // CNIC validation
    if (!cnic.trim()) return "CNIC is required!";
    if (!/^\d{13}$/.test(cnic)) return "CNIC must be exactly 13 digits!";

    // Mobile validation
    if (!mobile.trim()) return "Mobile number is required!";
    if (!/^03[0-9]{9}$/.test(mobile)) return "Mobile number must start with 03 and be 11 digits!";

    // Driver License validation
    if (!driverLicense.trim()) return "Driver license is required!";
    if (driverLicense.length < 5) return "Driver license must be at least 5 characters!";
    if (!/^[A-Za-z0-9-]+$/.test(driverLicense)) return "Driver license can only contain letters, numbers, and hyphens!";

    // Vehicle Plate validation
    if (!vehiclePlateNo.trim()) return "Vehicle plate number is required!";
    if (!/^[A-Z]{3}-[0-9]{3,4}$/.test(vehiclePlateNo)) 
      return "Vehicle plate must be in format ABC-123 or ABC-1234!";

    // Vehicle Type validation
    if (!vehicleType) return "Please select a vehicle type!";
    if (!['ambulance', 'fire-brigade', 'police'].includes(vehicleType.toLowerCase())) 
      return "Please select a valid vehicle type!";

    return null;
  };

  const handleSignup = async () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      Alert.alert("Validation Error", errorMessage);
      return;
    }
  
    try {
      setIsLoading(true);
      const formattedMobile = mobile.startsWith('03') ? mobile : `03${mobile}`;

      const signupData = {
        fullname: { firstname: firstName, lastname: lastName },
        email,
        password,
        cnic,
        mobile: formattedMobile,
        driverLicense,
        vehiclePlateNo,
        vehicleType,
      };

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/captain/register`,
        signupData
      );
  
      if (response.status === 201) {
        Alert.alert(
          "Success", 
          "Captain account created successfully. Please login to continue.",
          [
            {
              text: "OK",
              onPress: () => {
                resetForm();
                router.replace("./CaptainLogin");
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Signup failed:", error);
      const axiosError = error as AxiosError<ErrorResponse>;
      
      if (axiosError.response?.data?.message) {
        const errorMessages = Array.isArray(axiosError.response.data.message) 
          ? axiosError.response.data.message 
          : [axiosError.response.data.message];

        const formattedErrors = errorMessages.map(msg => {
          return msg.charAt(0).toUpperCase() + msg.slice(1) + (msg.endsWith('.') ? '' : '.');
        });

        Alert.alert(
          "Registration Failed",
          formattedErrors.join('\n\n'),
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Registration Failed",
          "An unexpected error occurred. Please try again.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setCnic("");
    setMobile("");
    setDriverLicense("");
    setVehiclePlateNo("");
    setVehicleType("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.contentContainer}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} />
          <Text style={styles.title}>Captain Registration</Text>
          <Text style={styles.subtitle}>Create your emergency service account</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  maxLength={30}
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  maxLength={30}
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
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
              <Text style={styles.label}>CNIC</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter CNIC (without dashes)"
                keyboardType="numeric"
                value={cnic}
                onChangeText={setCnic}
                maxLength={13}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="03XXXXXXXXX"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
                maxLength={11}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Driver License</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Driver License"
                value={driverLicense}
                onChangeText={setDriverLicense}
                maxLength={20}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Plate No</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Vehicle Plate No"
                value={vehiclePlateNo}
                onChangeText={setVehiclePlateNo}
                maxLength={20}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={vehicleType}
                  style={styles.picker}
                  onValueChange={(itemValue) => setVehicleType(itemValue)}
                >
                  <Picker.Item label="Select Vehicle Type" value="" />
                  <Picker.Item label="Ambulance" value="ambulance" />
                  <Picker.Item label="Police" value="police" />
                  <Picker.Item label="Fire Brigade" value="fire-brigade" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                Already have an account?{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => router.push("./CaptainLogin")}
                >
                  Login here
                </Text>
              </Text>
            </View>
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
  container: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
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
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  inputHalf: {
    flex: 1,
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
  pickerContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
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
  footerContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  linkText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});

export default CaptainSignup;