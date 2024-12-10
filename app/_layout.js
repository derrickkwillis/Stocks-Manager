import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      {/* Home screen */}
      <Stack.Screen name="index" options={{ title: "Stocks Manager" }} />

      {/* Dynamic symbol page */}
      <Stack.Screen
        name="[symbol]"
        options={({ route }) => ({
          title: route.params?.symbol ? route.params.symbol.toUpperCase() : "Stock",
        })}
      />
    </Stack>
  );
}
