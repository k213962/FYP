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
import axios from "axios";
import { UserDataContext } from "../context/userContext";

const CaptainSignup = () => {
  const { setUser } = useContext(UserDataContext);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cnic, setCnic] = useState("");
  const [mobile, setMobile] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [vehiclePlateNo, setVehiclePlateNo] = useState("");
  const [vehicleType, setVehicleType] = useState(""); // Default empty for placeholder
  const router = useRouter();

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password || !cnic || !mobile || !driverLicense || !vehiclePlateNo || !vehicleType) {
      Alert.alert("Error", "All fields are required.");
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
      console.error("Error Response:", error.response?.data || error.message);
      Alert.alert("Registration Failed", error.response?.data?.message || "An unexpected error occurred.");
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
    setVehicleType(""); // Reset to default empty
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
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="email@example.com"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
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
      />

      <Text style={styles.label}>Mobile Number</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="03XXXXXXXXX"
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
      />

      <Text style={styles.label}>Driver License</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="Enter Driver License"
        value={driverLicense}
        onChangeText={setDriverLicense}
      />

      <Text style={styles.label}>Vehicle Plate No</Text>
      <TextInput
        style={styles.inputFull}
        placeholder="Enter Vehicle Plate No"
        value={vehiclePlateNo}
        onChangeText={setVehiclePlateNo}
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