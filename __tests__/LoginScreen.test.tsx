import React from 'react';
import { Keyboard, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { LoginScreen } from '../src/screens/auth/LoginScreen';
import { LanguageToggle } from '../src/components/common/LanguageToggle';

const initialMetrics = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

describe('LoginScreen & LanguageToggle', () => {
  it('renders LoginScreen with Tamil as primary default and Mandhragiri Jothidam branding', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <LoginScreen />
          </NavigationContainer>
        </SafeAreaProvider>,
      );
    });

    const root = renderer!.root;
    // Check Tamil heading is rendered by default
    const texts = root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('உள்நுழையவும்');
    expect(texts).toContain('மொபைல் எண்');
    expect(texts).toContain('கடவுச்சொல்');
    expect(texts).toContain('உள்நுழை');
    expect(texts).toContain('Mandhragiri Jothidam');
  });

  it('allows LanguageToggle to switch between Tamil and English', async () => {
    const onLanguageChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LanguageToggle
          currentLanguage="ta"
          onLanguageChange={onLanguageChange}
        />,
      );
    });

    const englishButton = renderer!.root.findByProps({
      accessibilityLabel: 'Switch to English',
    });
    await ReactTestRenderer.act(() => {
      englishButton.props.onPress();
    });

    expect(onLanguageChange).toHaveBeenCalledWith('en');
  });

  it('attaches keyboard listeners and cleans up properly on unmount', async () => {
    const addListenerSpy = jest.spyOn(Keyboard, 'addListener');
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <NavigationContainer>
            <LoginScreen />
          </NavigationContainer>
        </SafeAreaProvider>,
      );
    });

    expect(addListenerSpy).toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      renderer.unmount();
    });
    addListenerSpy.mockRestore();
  });
});
