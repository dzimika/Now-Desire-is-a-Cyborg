import { useRootNavigationState } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import { AuthStore, initStore } from "../store";
import React, { useState } from 'react';
import { Text, View } from "react-native";

const Index = () => { //checks if the user is logged in to navigate to login or home page

  const segments = useSegments();
  const router = useRouter();

  const navigationState = useRootNavigationState();

  const { initialized, isLoggedIn } = AuthStore.useState();

  React.useEffect(() => {
    if (!navigationState?.key || !initialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (
      !isLoggedIn &&
      !inAuthGroup
    ) {
      router.replace("/login");
    } else if (isLoggedIn) {
      router.replace("/(tabs)/home");
    }
  }, [segments, navigationState?.key, initialized]);

  return <View>{!navigationState?.key ? <Text>LOADING...</Text> : <></>}</View>;
};
export default Index;