import { useEffect } from "react";
import { useRouter } from "expo-router";
import axios from "axios";
import { View, Text, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function CaptainLogout() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      const token = await AsyncStorage.getItem("captain-token");

      if (!token) {
        router.replace("./CaptainLogin");
        return;
      }

      try {
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_BASE_URL}/captain/login`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          await AsyncStorage.removeItem("captain-token");
          router.replace("./CaptainLogin");
        }
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };

    logout();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="black" />
      <Text>Logging out...</Text>
    </View>
  );
}
