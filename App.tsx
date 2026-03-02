/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { DashboardScreen } from './src/presentation/screens/DashboardScreen';
import { SurveyFormScreen } from './src/presentation/screens/SurveyFormScreen';
import { SurveyCategoryScreen } from './src/presentation/screens/SurveyCategoryScreen';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { AuthProvider, useAuth } from './src/presentation/context/AuthContext';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { surveyorId } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'survey'>('dashboard');
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);

  const navigateToSurvey = (surveyId: string) => {
    setActiveSurveyId(surveyId);
    setCurrentScreen('survey');
  };

  const navigateBackToDashboard = () => {
    setCurrentScreen('dashboard');
    setActiveSurveyId(null);
  };

  if (!surveyorId) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      {currentScreen === 'dashboard' ? (
        <DashboardScreen onStartSurvey={navigateToSurvey} />
      ) : (
        <SurveyFormScreen
          surveyId={activeSurveyId!}
          onBack={navigateBackToDashboard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
