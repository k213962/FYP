import React, { useContext, useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserDataContext } from "../context/userContext";
import axios from "axios";

const UserProtectWrapper = ({ children }) => {
  const router = useRouter();
  const { user, setUser } = useContext(UserDataContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          console.warn("No token found! Redirecting to login...");
          router.replace("/Pages/UserLogin");
          return;
        }

        const response = await axios.get(`${process.env.EXPO_PUBLIC_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          setUser(response.data);
          console.log("User authenticated successfully:", response.data);
        } else {
          console.warn("Invalid token, logging out...");
          await AsyncStorage.removeItem("token");
          router.replace("/Pages/UserLogin");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        await AsyncStorage.removeItem("token");
        router.replace("/Pages/UserLogin");
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="black" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

export default UserProtectWrapper;
