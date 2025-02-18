import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function Layout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        },
        headerTintColor: colorScheme === "dark" ? "#fff" : "#000",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Shared Folder",
        }}
      />
      <Stack.Screen
        name="pdf"
        options={({
          route,
        }: {
          route: { params?: { fileName?: string } };
        }) => ({
          title: route.params?.fileName || "PDF Viewer",
          headerBackTitle: "Back",
        })}
      />
    </Stack>
  );
}
