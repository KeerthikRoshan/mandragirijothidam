/**
 * Root Navigation Reference for Mandhiragiri Jothidam
 * Enables navigation from background handlers, notification taps, and non-component services.
 */

import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName],
): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  } else {
    console.warn('[navigationRef] Navigation requested before container was ready:', name, params);
  }
}
