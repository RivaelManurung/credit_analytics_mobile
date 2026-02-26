/**
 * CA Mobile Survey
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import DashboardScreen from './app/src/screens/DashboardScreen';
import SurveyScreen from './app/src/screens/SurveyScreen';
import SurveySelesaiScreen from './app/src/screens/SurveySelesaiScreen';
import DrawerContent from './app/src/components/DrawerContent';
import { Colors } from './app/src/theme/colors';
import { RootDrawerParamList, RootStackParamList } from './app/src/types';

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/** Stack Navigator: Dashboard → Survey → SurveySelesai */
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Survey" component={SurveyScreen} />
      <Stack.Screen name="SurveySelesai" component={SurveySelesaiScreen} />
    </Stack.Navigator>
  );
}

/** Root: Drawer wraps the Stack */
function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Drawer.Navigator
            drawerContent={(props) => <DrawerContent {...props} />}
            screenOptions={{
              headerShown: false,
              drawerStyle: {
                width: 280,
                backgroundColor: Colors.white,
              },
              drawerType: 'slide',
              overlayColor: 'rgba(0,0,0,0.4)',
            }}>
            <Drawer.Screen name="Main" component={MainStack} />
          </Drawer.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
