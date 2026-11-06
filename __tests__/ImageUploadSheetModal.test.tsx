import React from 'react';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ImageUploadSheetModal } from '../src/components/common/ImageUploadSheetModal';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

describe('ImageUploadSheetModal (Android Permissions & Photo Picker)', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'android';
    // Default: camera permission granted
    (PermissionsAndroid.check as jest.Mock).mockResolvedValue(true);
    (PermissionsAndroid.request as jest.Mock).mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
  });

  afterAll(() => {
    (Platform as any).OS = originalPlatform;
  });

  it('renders modal options for Camera and Gallery', async () => {
    const mockClose = jest.fn();
    const mockSelect = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ImageUploadSheetModal
          visible={true}
          onClose={mockClose}
          onSelectImage={mockSelect}
          hasImage={true}
          onRemoveImage={jest.fn()}
        />
      );
    });

    const root = renderer!.root;
    expect(root.findByProps({ accessibilityLabel: 'கேமரா மூலம் படம் எடுக்க' })).toBeDefined();
    expect(root.findByProps({ accessibilityLabel: 'கேலரியில் இருந்து தேர்வு செய்க' })).toBeDefined();
    expect(root.findByProps({ accessibilityLabel: 'புகைப்படத்தை நீக்குக' })).toBeDefined();
  });

  it('checks runtime camera permission and launches camera when granted', async () => {
    const mockClose = jest.fn();
    const mockSelect = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ImageUploadSheetModal
          visible={true}
          onClose={mockClose}
          onSelectImage={mockSelect}
        />
      );
    });

    const cameraButton = renderer!.root.findByProps({
      accessibilityLabel: 'கேமரா மூலம் படம் எடுக்க',
    });

    await ReactTestRenderer.act(async () => {
      await cameraButton.props.onPress();
    });

    expect(PermissionsAndroid.check).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.CAMERA);
    expect(launchCamera).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith('file://mock/camera_photo.jpg');
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('requests camera permission when not already granted and proceeds if user grants it', async () => {
    (PermissionsAndroid.check as jest.Mock).mockResolvedValue(false);
    (PermissionsAndroid.request as jest.Mock).mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

    const mockClose = jest.fn();
    const mockSelect = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ImageUploadSheetModal
          visible={true}
          onClose={mockClose}
          onSelectImage={mockSelect}
        />
      );
    });

    const cameraButton = renderer!.root.findByProps({
      accessibilityLabel: 'கேமரா மூலம் படம் எடுக்க',
    });

    await ReactTestRenderer.act(async () => {
      await cameraButton.props.onPress();
    });

    expect(PermissionsAndroid.check).toHaveBeenCalled();
    expect(PermissionsAndroid.request).toHaveBeenCalledWith(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      expect.objectContaining({
        title: expect.any(String),
        message: expect.any(String),
      })
    );
    expect(launchCamera).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith('file://mock/camera_photo.jpg');
  });

  it('handles permission denial without launching camera', async () => {
    (PermissionsAndroid.check as jest.Mock).mockResolvedValue(false);
    (PermissionsAndroid.request as jest.Mock).mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);

    const alertSpy = jest.spyOn(Alert, 'alert');
    const mockClose = jest.fn();
    const mockSelect = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ImageUploadSheetModal
          visible={true}
          onClose={mockClose}
          onSelectImage={mockSelect}
        />
      );
    });

    const cameraButton = renderer!.root.findByProps({
      accessibilityLabel: 'கேமரா மூலம் படம் எடுக்க',
    });

    await ReactTestRenderer.act(async () => {
      await cameraButton.props.onPress();
    });

    expect(launchCamera).not.toHaveBeenCalled();
    expect(mockSelect).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('மறுக்கப்பட்டது'),
      expect.stringContaining('கேமரா அனுமதி தேவை'),
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });

  it('handles permanently denied permission (never_ask_again) with option to open App Settings', async () => {
    (PermissionsAndroid.check as jest.Mock).mockResolvedValue(false);
    (PermissionsAndroid.request as jest.Mock).mockResolvedValue(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);

    const alertSpy = jest.spyOn(Alert, 'alert');
    const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined as any);
    const mockClose = jest.fn();
    const mockSelect = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ImageUploadSheetModal
          visible={true}
          onClose={mockClose}
          onSelectImage={mockSelect}
        />
      );
    });

    const cameraButton = renderer!.root.findByProps({
      accessibilityLabel: 'கேமரா மூலம் படம் எடுக்க',
    });

    await ReactTestRenderer.act(async () => {
      await cameraButton.props.onPress();
    });

    expect(launchCamera).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('முடக்கப்பட்டுள்ளது'),
      expect.stringContaining('App Settings'),
      expect.any(Array)
    );

    // Test clicking "Open Settings" in the alert
    const alertButtons = alertSpy.mock.calls[0][2];
    const settingsButton = alertButtons?.find(b => b.text?.includes('அமைப்புகளைத் திறக்க') || b.text?.includes('Settings'));
    expect(settingsButton).toBeDefined();

    await ReactTestRenderer.act(async () => {
      settingsButton?.onPress?.();
    });

    expect(openSettingsSpy).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
    openSettingsSpy.mockRestore();
  });

  it('uses Android Photo Picker without requesting unnecessary storage permissions', async () => {
    const mockClose = jest.fn();
    const mockSelect = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ImageUploadSheetModal
          visible={true}
          onClose={mockClose}
          onSelectImage={mockSelect}
        />
      );
    });

    const galleryButton = renderer!.root.findByProps({
      accessibilityLabel: 'கேலரியில் இருந்து தேர்வு செய்க',
    });

    await ReactTestRenderer.act(async () => {
      await galleryButton.props.onPress();
    });

    // Verify storage permissions are NOT requested
    expect(PermissionsAndroid.request).not.toHaveBeenCalled();
    expect(launchImageLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaType: 'photo',
        selectionLimit: 1,
      })
    );
    expect(mockSelect).toHaveBeenCalledWith('file://mock/gallery_photo.jpg');
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('handles camera_unavailable error code gracefully', async () => {
    (launchCamera as jest.Mock).mockResolvedValueOnce({
      errorCode: 'camera_unavailable',
      errorMessage: 'No camera on device',
    });

    const alertSpy = jest.spyOn(Alert, 'alert');
    const mockClose = jest.fn();
    const mockSelect = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ImageUploadSheetModal
          visible={true}
          onClose={mockClose}
          onSelectImage={mockSelect}
        />
      );
    });

    const cameraButton = renderer!.root.findByProps({
      accessibilityLabel: 'கேமரா மூலம் படம் எடுக்க',
    });

    await ReactTestRenderer.act(async () => {
      await cameraButton.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('கேமரா வசதி இல்லை')
    );
    expect(mockSelect).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('handles library errorCode gracefully without crash', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
      errorCode: 'others',
      errorMessage: 'Failed to access storage',
    });

    const alertSpy = jest.spyOn(Alert, 'alert');
    const mockClose = jest.fn();
    const mockSelect = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ImageUploadSheetModal
          visible={true}
          onClose={mockClose}
          onSelectImage={mockSelect}
        />
      );
    });

    const galleryButton = renderer!.root.findByProps({
      accessibilityLabel: 'கேலரியில் இருந்து தேர்வு செய்க',
    });

    await ReactTestRenderer.act(async () => {
      await galleryButton.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.anything(),
      'Failed to access storage'
    );
    alertSpy.mockRestore();
  });

  it('calls onRemoveImage when remove button is pressed', async () => {
    const mockRemove = jest.fn();
    const mockClose = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ImageUploadSheetModal
          visible={true}
          onClose={mockClose}
          onSelectImage={jest.fn()}
          onRemoveImage={mockRemove}
          hasImage={true}
        />
      );
    });

    const removeButton = renderer!.root.findByProps({
      accessibilityLabel: 'புகைப்படத்தை நீக்குக',
    });

    await ReactTestRenderer.act(async () => {
      removeButton.props.onPress();
    });

    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
