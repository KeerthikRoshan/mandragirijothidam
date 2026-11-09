/**
 * BlinkingLiveDot Component
 * Renders a continuously pulsing/blinking green dot indicator for LIVE events.
 *
 * Implements:
 * - Smooth opacity transition using React Native Animated.
 * - Stops cleanly when unmounted or when event ceases to be live.
 * - Uses native driver for 60fps performance without JS thread blocking.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface BlinkingLiveDotProps {
  size?: number;
  color?: string;
  glowColor?: string;
}

export const BlinkingLiveDot: React.FC<BlinkingLiveDotProps> = ({
  size = 6,
  color = '#16A34A',
  glowColor = '#86EFAC',
}) => {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.25,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacityAnim]);

  return (
    <View style={[styles.container, { width: size + 4, height: size + 4 }]}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  dot: {
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
});
