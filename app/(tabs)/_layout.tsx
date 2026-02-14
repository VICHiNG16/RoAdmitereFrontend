import { Tabs } from "expo-router";

import { BottomNav } from "../../src/components/BottomNav";

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        tabBarStyle: { backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 },
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorează",
          tabBarLabel: "Explorează",
          tabBarAccessibilityLabel: "Explorează",
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorite",
          tabBarLabel: "Favorite",
          tabBarAccessibilityLabel: "Favorite",
        }}
      />
    </Tabs>
  );
}
