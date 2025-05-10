import { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, Image 
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { firstname, lastname, email, password, confirmPassword, cnic, mobile } = formData;

    if (firstname.length < 2) return "First name must be at least 2 characters!";
    if (lastname.length < 2) return "Last name must be at least 2 characters!";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format!";
    if (password.length < 6) return "Password must be at least 6 characters!";
    if (password !== confirmPassword) return "Passwords do not match!";
    if (!/^[0-9]{13}$/.test(cnic)) return "CNIC must be exactly 13 digits!";
    if (!/^[0-9]{10,15}$/.test(mobile)) return "Mobile number must be 10-15 digits!";

    return null;
  };

  const handleSignup = async () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      Alert.alert("Error", errorMessage);
      return;
    }

    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_BASE_URL}/user/register`, {
        fullname: { firstname: formData.firstname, lastname: formData.lastname },
        email: formData.email,
        password: formData.password,
        cnic: formData.cnic,
        mobile: formData.mobile,
      });

      console.log("API URL:", `${process.env.EXPO_PUBLIC_BASE_URL}/user/register`);

      if (response.status === 201) {
        Alert.alert("Success", "Account created successfully!");
        router.push("./UserLogin");
      }
    } catch (error :any) {
      Alert.alert("Signup Failed", error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
        <Text style={styles.title}>User Signup</Text>

        <TextInput
          value={formData.firstname}
          onChangeText={(val) => handleInputChange("firstname", val)}
          placeholder="First Name"
          style={styles.input}
        />

        <TextInput
          value={formData.lastname}
          onChangeText={(val) => handleInputChange("lastname", val)}
          placeholder="Last Name"
          style={styles.input}
        />

        <TextInput
          value={formData.email}
          onChangeText={(val) => handleInputChange("email", val)}
          placeholder="Email"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={formData.password}
          onChangeText={(val) => handleInputChange("password", val)}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          value={formData.confirmPassword}
          onChangeText={(val) => handleInputChange("confirmPassword", val)}
          placeholder="Confirm Password"
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          value={formData.cnic}
          onChangeText={(val) => handleInputChange("cnic", val)}
          placeholder="CNIC (13 digits)"
          keyboardType="numeric"
          maxLength={13}
          style={styles.input}
        />

        <TextInput
          value={formData.mobile}
          onChangeText={(val) => handleInputChange("mobile", val)}
          placeholder="Mobile Number"
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("./UserLogin")}>
            <Text style={styles.loginLink}> Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff" },
  container: { width: "100%", alignItems: "center" },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { width: "100%", padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 10, fontSize: 16 },
  button: { backgroundColor: "black", padding: 15, borderRadius: 8, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  loginContainer: { flexDirection: "row", marginTop: 20 },
  loginLink: { color: "blue", marginLeft: 5 },
});
