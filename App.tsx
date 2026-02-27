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

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'survey'>(
    'dashboard',
  );
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);

  const navigateToSurvey = (surveyId: string) => {
    setActiveSurveyId(surveyId);
    setCurrentScreen('survey');
  };

  const navigateBack = () => {
    setCurrentScreen('dashboard');
    setActiveSurveyId(null);
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'dashboard' ? (
        <DashboardScreen onStartSurvey={navigateToSurvey} />
      ) : (
        <SurveyFormScreen surveyId={activeSurveyId!} onBack={navigateBack} />
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
