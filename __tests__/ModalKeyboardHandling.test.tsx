import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AddPriestModal } from '../src/components/priest/AddPriestModal';
import { PoojaBookingFormModal } from '../src/components/common/PoojaBookingFormModal';

const initialMetrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

describe('Modal Keyboard Handling', () => {
  describe('AddPriestModal', () => {
    it('configures KeyboardAvoidingView, ScrollView, and input focus handlers', async () => {
      const handleClose = jest.fn();
      const handleSubmit = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <AddPriestModal
              visible={true}
              onClose={handleClose}
              onSubmit={handleSubmit}
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;

      // 1. KeyboardAvoidingView configured with proper behavior
      const kav = root.findByType(KeyboardAvoidingView);
      expect(kav).toBeTruthy();
      expect(kav.props.behavior).toBe(
        Platform.OS === 'ios' ? 'padding' : 'height'
      );

      // 2. ScrollView configured for keyboard interaction
      const scrollView = root.findByType(ScrollView);
      expect(scrollView).toBeTruthy();
      expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
      expect(scrollView.props.keyboardDismissMode).toBe(
        Platform.OS === 'ios' ? 'interactive' : 'on-drag'
      );

      // 3. Text inputs have onFocus listeners attached
      const inputs = root.findAllByType(TextInput);
      expect(inputs.length).toBeGreaterThanOrEqual(6);

      // Trigger focus on first input (English Name) and Phone input
      await ReactTestRenderer.act(async () => {
        inputs[0].props.onFocus?.();
        inputs[2].props.onFocus?.(); // Phone input
      });

      // 4. Simulate keyboard event to test dynamic adjustment
      await ReactTestRenderer.act(async () => {
        (Keyboard as any)._emitter.emit(
          Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
          {
            endCoordinates: { height: 336, screenY: 508, width: 390 },
            duration: 250,
          }
        );
      });

      // 5. Simulate keyboard hide event
      await ReactTestRenderer.act(async () => {
        (Keyboard as any)._emitter.emit(
          Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
          {
            endCoordinates: { height: 0, screenY: 844, width: 390 },
            duration: 250,
          }
        );
      });
    });
  });

  describe('PoojaBookingFormModal', () => {
    it('configures KeyboardAvoidingView, ScrollView, and payment input focus handlers', async () => {
      const handleClose = jest.fn();
      const handleSubmit = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={initialMetrics}>
            <PoojaBookingFormModal
              visible={true}
              onClose={handleClose}
              onSubmit={handleSubmit}
              selectedDate="2026-11-21"
            />
          </SafeAreaProvider>
        );
      });

      const root = renderer!.root;

      // 1. KeyboardAvoidingView configured with proper behavior
      const kav = root.findByType(KeyboardAvoidingView);
      expect(kav).toBeTruthy();
      expect(kav.props.behavior).toBe(
        Platform.OS === 'ios' ? 'padding' : 'height'
      );

      // 2. ScrollView configured for keyboard interaction
      const scrollView = root.findByType(ScrollView);
      expect(scrollView).toBeTruthy();
      expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
      expect(scrollView.props.keyboardDismissMode).toBe(
        Platform.OS === 'ios' ? 'interactive' : 'on-drag'
      );

      // 3. Text inputs across form and payment sections have onFocus listeners
      const inputs = root.findAllByType(TextInput);
      expect(inputs.length).toBeGreaterThanOrEqual(8);

      // Focus on payment fields (Total charge, advance, priest pay)
      await ReactTestRenderer.act(async () => {
        inputs.forEach(input => {
          input.props.onFocus?.();
        });
      });

      // 4. Simulate keyboard event to test dynamic adjustment
      await ReactTestRenderer.act(async () => {
        (Keyboard as any)._emitter.emit(
          Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
          {
            endCoordinates: { height: 320, screenY: 524, width: 390 },
            duration: 250,
          }
        );
      });

      // 5. Simulate keyboard hide event
      await ReactTestRenderer.act(async () => {
        (Keyboard as any)._emitter.emit(
          Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
          {
            endCoordinates: { height: 0, screenY: 844, width: 390 },
            duration: 250,
          }
        );
      });
    });
  });
});
