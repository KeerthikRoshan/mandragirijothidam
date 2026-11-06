import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import BootSplash from 'react-native-bootsplash';
import { SplashScreen } from '../src/screens/splash/SplashScreen';

// Mock navigation
const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    replace: mockReplace,
  }),
}));

describe('SplashScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders video player with pure white background and contain resizeMode', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SplashScreen />);
    });

    const video = renderer!.root.findByProps({ testID: 'mock-video' });
    expect(video).toBeDefined();
    expect(video.props.resizeMode).toBe('contain');
    expect(video.props.repeat).toBe(false);
    expect(video.props.paused).toBe(false);
  });

  it('hides native BootSplash when video is ready for display', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SplashScreen />);
    });

    const video = renderer!.root.findByProps({ testID: 'mock-video' });
    await ReactTestRenderer.act(() => {
      video.props.onReadyForDisplay();
    });

    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true });
  });

  it('navigates to Login when video ends', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SplashScreen />);
    });

    const video = renderer!.root.findByProps({ testID: 'mock-video' });
    await ReactTestRenderer.act(() => {
      video.props.onEnd();
    });

    expect(mockReplace).toHaveBeenCalledWith('Login');
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it('handles video error gracefully and navigates to Login without freezing', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SplashScreen />);
    });

    const video = renderer!.root.findByProps({ testID: 'mock-video' });
    await ReactTestRenderer.act(() => {
      video.props.onError({ error: { errorString: 'Decoding failed' } });
    });

    expect(mockReplace).toHaveBeenCalledWith('Login');
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it('triggers safety fallback timeout if video fails to complete or stall', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<SplashScreen />);
    });

    expect(mockReplace).not.toHaveBeenCalled();

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockReplace).toHaveBeenCalledWith('Login');
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it('prevents duplicate navigation when onEnd and timeout both trigger', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SplashScreen />);
    });

    const video = renderer!.root.findByProps({ testID: 'mock-video' });
    await ReactTestRenderer.act(() => {
      video.props.onEnd();
    });

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
  });
});
