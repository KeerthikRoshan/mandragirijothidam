/**
 * Mandhragiri Jothidam (மந்திரகிரி ஜோதிடம்)
 * Application Entry Point
 *
 * Configured with:
 * - Hardware-backed Persistent Authentication Provider
 * - Global Bottom Toast Notification System
 * - Centralized Localization (ta/en)
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { AuthProvider } from './src/context/AuthContext';
import { AppToast } from './src/components/common/AppToast';
import { RootNavigator } from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <RootNavigator />
        <AppToast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
