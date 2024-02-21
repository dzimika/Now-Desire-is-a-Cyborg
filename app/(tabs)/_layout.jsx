import { Tabs, Link } from "expo-router";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, Pressable, useColorScheme } from "react-native";
import Colors from '../../constants/Colors';

function TabBarIcon(props) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

const TabsLayout = () => {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
      }}
    >
      <Tabs.Screen
                name="home"
                options={{
                  title: "home",
                  tabBarIcon: ({ color }) => <TabBarIcon name="lemon-o" color={color} />,
                  headerRight: () => (
                    <Link href="/new-entry-modal" asChild>
                      <Pressable>
                        {({ pressed }) => (
                          <FontAwesome
                            name="info-circle"
                            size={25}
                            color={Colors[colorScheme ?? 'light'].text}
                            style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                          />
                        )}
                      </Pressable>
                    </Link>
                  ),
                }}
            />
      <Tabs.Screen
                name="saved"
                options={{
                  title: "liked",
                  tabBarIcon: ({ color }) => <TabBarIcon name="heart-o" color={color} />,
                }}
            />
    </Tabs>
  );
};

export default TabsLayout;