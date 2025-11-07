import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import MapsScreen from './src/screens/MapsScreen';
import RegisterScreen from './src/screens/RegisterScreen';

type RootStackParamList = {
  login: undefined;
  maps: undefined;
  register: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="maps" screenOptions={{ headerShown: false }}>
        {/* ✅ Correcto: cada pantalla se declara con Stack.Screen */}
        <Stack.Screen name="login" component={LoginScreen} />
        <Stack.Screen name="maps" component={MapsScreen} />
        <Stack.Screen name="register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
