import { Stack } from "expo-router";
import UserContext from "./context/userContext"; 

export default function Layout() {
  return (
    <UserContext>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Pages/Start" />
        <Stack.Screen name="Pages/UserLogin" />
        <Stack.Screen name="Pages/UserSignup" />
        <Stack.Screen name="Pages/CaptainLogin" />
        <Stack.Screen name="Pages/CaptainSignup" />
        <Stack.Screen name="Pages/NavOptions" />
        <Stack.Screen name="Pages/Home" />
        <Stack.Screen name="Pages/ChatBotScreen" />
        <Stack.Screen name="Pages/UserLogout" />
        <Stack.Screen name="Pages/CaptainHome" />
        <Stack.Screen name="Pages/CaptainRiding" />
      </Stack>
    </UserContext>
  );
}
