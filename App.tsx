import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapsScreen'; // 👈 asegúrate de importar el mapa

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }} // 👈 sin barra superior
        />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{ title: 'Mapa' }} // puedes ocultar o cambiar el título
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
