import React from 'react';
import { AppRegistry } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ConverterScreen from './src/screens/ConverterScreen';

function App() {
  return (
    <>
      <StatusBar style="light" />
      <ConverterScreen />
    </>
  );
}

AppRegistry.registerComponent('main', () => App);

export default App;
