import { View, Text, StyleSheet, Button, Pressable, Image, Alert } from 'react-native';
import { Link, useRouter, useNavigation } from "expo-router";

const Tab1Index = () => { //homepage with two tabs
  const navigation = useNavigation();
  return (
  <View style={styles.container}>
    <>
      <Pressable onPress={() => {
          Alert.alert(
            //title
            'GAME WINDOW',
            //body
            'Do you want to play the game ?',
            [
              { text: 'Yes', onPress: () => navigation.navigate("(scanner)", { screen: "index" }) },
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
        >
        <Image
          resizeMode="contain"
          source={require('../../../assets/images/circle.png')}
          style={{ width: 300, height: 100, backgroundColor: 'transparent' }}
        />
      </Pressable>
    </>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  textbutton: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Tab1Index;