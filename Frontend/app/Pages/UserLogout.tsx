import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const UserLogout = () => {
  const router = useRouter();

  useEffect(() => {
    const logoutUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.warn("No token found, redirecting to login...");
          router.replace("/Pages/UserLogin");
          return;
        }

        const response = await axios.post(`${process.env.EXPO_PUBLIC_BASE_URL}/users/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          await AsyncStorage.removeItem("token");
          console.log("Logout successful");
          router.replace("/Pages/UserLogin");
        } else {
          console.warn("Logout failed, staying on the page...");
        }
      } catch (error) {
        console.error("Error during logout:", error);
      }
    };

    logoutUser();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="black" />
      <Text>Logging out...</Text>
    </View>
  );
};

export default UserLogout;
