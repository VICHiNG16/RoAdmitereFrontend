import "react-native-gesture-handler";

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico";
import { Stack, SplashScreen } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppStateProvider } from "../src/state/app-state";
import { theme } from "../src/theme/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded, fontsError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Pacifico_400Regular,
  });

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.background);
    StatusBar.setBarStyle("dark-content", true);
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor(theme.colors.sand, true);
      StatusBar.setTranslucent(false);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={theme.colors.sand}
            translucent={false}
          />
          <Stack
            screenOptions={{
              headerShown: false,
              freezeOnBlur: true,
              contentStyle: { backgroundColor: theme.colors.background },
              statusBarStyle: "dark",
              statusBarBackgroundColor: theme.colors.sand,
              statusBarTranslucent: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="modals/filter-universities"
              options={{ presentation: "transparentModal", animation: "fade", gestureEnabled: true }}
            />
            <Stack.Screen
              name="modals/filter-faculties"
              options={{ presentation: "transparentModal", animation: "fade", gestureEnabled: true }}
            />
            <Stack.Screen
              name="modals/filter-programs"
              options={{ presentation: "transparentModal", animation: "fade", gestureEnabled: true }}
            />
            <Stack.Screen
              name="modals/component-gallery"
              options={{ presentation: "transparentModal", animation: "fade", gestureEnabled: true }}
            />
            <Stack.Screen
              name="modals/university/[id]"
              options={{
                animation: "fade_from_bottom",
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
                animationDuration: 250,
              }}
            />
            <Stack.Screen
              name="modals/faculty/[id]"
              options={{
                animation: "fade_from_bottom",
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
                animationDuration: 250,
              }}
            />
            <Stack.Screen
              name="modals/program/[id]"
              options={{
                animation: "fade_from_bottom",
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
                animationDuration: 250,
              }}
            />
          </Stack>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

