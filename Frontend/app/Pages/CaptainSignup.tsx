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
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import axios, { AxiosError } from "axios";
import { UserDataContext } from "../context/userContext";

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
  const router = useRouter();

  const validateForm = () => {
    // Name validation
    if (firstName.length < 2) return "First name must be at least 2 characters!";
    if (lastName.length < 2) return "Last name must be at least 2 characters!";

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format!";

    // Password validation
    if (password.length < 6) return "Password must be at least 6 characters!";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter!";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter!";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number!";

    // CNIC validation
    if (!/^[0-9]{13}$/.test(cnic)) return "CNIC must be exactly 13 digits!";

    // Mobile validation
    if (!/^[0-9]{10,15}$/.test(mobile)) return "Mobile number must be 10-15 digits!";
    if (!mobile.startsWith('03')) return "Mobile number must start with '03'!";

    // Driver License validation
    if (driverLicense.length < 5) return "Driver license must be at least 5 characters!";

    // Vehicle Plate No validation
    if (vehiclePlateNo.length < 5) return "Vehicle plate number must be at least 5 characters!";

    // Vehicle Type validation
    if (!vehicleType) return "Please select a vehicle type!";

    return null;
  };

  const handleSignup = async () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      Alert.alert("Error", errorMessage);
      return;
    }

    try {
      console.log("Sending signup request to:", `${process.env.EXPO_PUBLIC_BASE_URL}/captain/register`);
      console.log("Request Payload:", {
        fullname: { firstname: firstName, lastname: lastName },
        email,
        password,
        cnic,
        mobile,
        driverLicense,
        vehiclePlateNo,
        vehicleType,
      });

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/captain/register`,
        {
          fullname: { firstname: firstName, lastname: lastName },
          email,
          password,
          cnic,
          mobile,
          driverLicense,
          vehiclePlateNo,
          vehicleType,
        }
      );

      console.log("Response:", response.data);

      if (response.status === 201) {
        const { user, token } = response.data;
        setUser({ ...user, token });
        Alert.alert("Success", "Captain account created successfully.");
        resetForm();
        router.replace("./Home");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("Error Response:", axiosError.response?.data || axiosError.message);
      Alert.alert("Registration Failed", axiosError.response?.data?.message || "An unexpected error occurred.");
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
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} />
      <Text style={styles.label}>Full Name</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          maxLength={30}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          maxLength={30}
        />
      </View>

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="email@example.com"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="Enter Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>CNIC</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="Enter CNIC (without dashes)"
        keyboardType="numeric"
        value={cnic}
        onChangeText={setCnic}
        maxLength={13}
      />

      <Text style={styles.label}>Mobile Number</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="03XXXXXXXXX"
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        maxLength={11}
      />

      <Text style={styles.label}>Driver License</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="Enter Driver License"
        value={driverLicense}
        onChangeText={setDriverLicense}
        maxLength={20}
      />

      <Text style={styles.label}>Vehicle Plate No</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="Enter Vehicle Plate No"
        value={vehiclePlateNo}
        onChangeText={setVehiclePlateNo}
        maxLength={20}
      />

      <Text style={styles.label}>Vehicle Type</Text>
      <Picker
        selectedValue={vehicleType}
        style={styles.picker}
        onValueChange={(itemValue) => setVehicleType(itemValue)}
      >
        <Picker.Item label="Select Vehicle Type" value="" />
        <Picker.Item label="Ambulance" value="Ambulance" />
        <Picker.Item label="Police" value="Police" />
        <Picker.Item label="Fire Brigade" value="Fire Brigade" />
      </Picker>

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text style={styles.linkText} onPress={() => router.push("./UserLogin")}>
          Login here
        </Text>
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  logo: { width: 150, height: 150, alignSelf: "center", marginBottom: 20 },
  label: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  inputFull: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  footerText: { textAlign: "center", marginTop: 10 },
  linkText: { color: "blue", fontWeight: "bold" },
});

export default CaptainSignup;