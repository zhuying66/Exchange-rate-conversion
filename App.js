import React from 'react';
import { AppRegistry } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from './src/i18n/LanguageContext';
import ConverterScreen from './src/screens/ConverterScreen';

function App() {
  return (
    <LanguageProvider>
      <StatusBar style="dark" />
      <ConverterScreen />
    </LanguageProvider>
  );
}

AppRegistry.registerComponent('main', () => App);

export default App;
