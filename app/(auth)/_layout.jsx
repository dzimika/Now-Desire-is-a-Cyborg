import { Stack } from "expo-router"

const StackLayout = () => {
    return (
        <Stack>
            <Stack.Screen name="login" options={{headerShown: false}} />
            <Stack.Screen name="create-account" options={{headerShown: false}} />
        </Stack>
    );
};

export default StackLayout;