import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DashboardScreen } from './src/presentation/screens/DashboardScreen';
import { SurveyFormScreen } from './src/presentation/screens/SurveyFormScreen';
import { ApplicationListScreen } from './src/presentation/screens/ApplicationListScreen';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { AuthProvider, useAuth } from './src/presentation/context/AuthContext';
import { NavigationProvider, useAppNavigator } from './src/presentation/context/NavigationContext';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/data/network/queryClient';

/**
 * Main App Component - Wraps all necessary providers.
 */
function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationProvider>
            <AppContent />
          </NavigationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * AppContent - Handles rendering based on NavigationContext.
 */
function AppContent() {
  const { surveyorId } = useAuth();
  const { currentScreen, params, navigate, goBack } = useAppNavigator();

  // Handle Hardware Back Button Globally
  useEffect(() => {
    const onBackPress = () => {
      // Return true to stop propagation, false to allow default (exit)
      const handled = goBack();
      return handled;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      } else if (typeof (BackHandler as any).removeEventListener === 'function') {
        (BackHandler as any).removeEventListener('hardwareBackPress', onBackPress);
      }
    };
  }, [goBack]);

  // Auth Guard
  if (!surveyorId) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {currentScreen === 'Dashboard' && (
        <DashboardScreen />
      )}

      {currentScreen === 'ApplicationList' && (
        <ApplicationListScreen />
      )}

      {currentScreen === 'SurveyForm' && (
        <SurveyFormScreen
          surveyId={params?.surveyId}
          onBack={() => navigate('Dashboard')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

export default App;
