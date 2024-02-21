import { Redirect, Stack, useRouter } from "expo-router";
import { Button, Pressable, Text, TouchableOpacity, View, StyleSheet, Alert } from "react-native";
import { AuthStore, appSignOut } from "../store";

export default function Modal() { //settings modal with logout button

  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={styles.text}>
        {AuthStore.getRawState().user?.email}
      </Text>
      <Text style={styles.text}>
        {AuthStore.getRawState().user?.displayName}
      </Text>
      <Button
        onPress={async () => {
          const resp = await appSignOut();
          if (!resp?.error) {
            router.replace("/(auth)/login");
          } else {
            console.log(resp.error);
            Alert.alert("Logout Error", resp.error?.message);
          }
        }}
        title="LOGOUT"
      />

      <Pressable
        onPress={() => {
          Alert.alert(
            //title
            'Hello',
            //body
            'I am two option alert. Do you want to cancel me ?',
            [
              { text: 'Yes', onPress: () => console.log('Yes Pressed') },
              {
                text: 'No',
                onPress: () => console.log('No Pressed'),
                style: 'cancel',
              },
            ],
            { cancelable: false }
            //clicking out side of alert will not cancel
          );
        }
        }
        style={({ pressed }) => [
          { backgroundColor: pressed ? "#920" : "#818" },
          {
            borderColor: "#920",
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
          },
        ]}
      >
        <Text
          style={styles.textbutton}
        >
          Button
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textbutton: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    fontWeight: 'regular',
  },
});