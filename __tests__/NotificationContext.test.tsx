import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, Button } from 'react-native';
import { NotificationProvider, useNotification } from '../src/context/NotificationContext';
import { useAuth } from '../src/context/AuthContext';
import { notificationApiService } from '../src/services/notificationApiService';

// Mock useAuth
jest.mock('../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('NotificationContext (Phase 3)', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const TestConsumer: React.FC<{
    onContext?: (ctx: ReturnType<typeof useNotification>) => void;
  }> = ({ onContext }) => {
    const ctx = useNotification();
    if (onContext) {
      onContext(ctx);
    }
    return (
      <>
        <Text testID="unread-count">{ctx.unreadCount}</Text>
        <Button
          title="MarkRead"
          testID="btn-mark-read"
          onPress={() => ctx.markAsRead(10)}
        />
        <Button
          title="MarkAll"
          testID="btn-mark-all"
          onPress={() => ctx.markAllAsRead()}
        />
      </>
    );
  };

  it('fetches unread count on authenticated bootstrap', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: 'Admin' },
    });

    jest.spyOn(notificationApiService, 'getUnreadCount').mockResolvedValue(5);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
    });

    expect(notificationApiService.getUnreadCount).toHaveBeenCalledTimes(1);
    const countNode = renderer!.root.findByProps({ testID: 'unread-count' });
    expect(countNode.props.children).toBe(5);
  });

  it('resets unreadCount to 0 when user logs out', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: 'Admin' },
    });

    jest.spyOn(notificationApiService, 'getUnreadCount').mockResolvedValue(4);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
    });

    const countNode = renderer!.root.findByProps({ testID: 'unread-count' });
    expect(countNode.props.children).toBe(4);

    // Simulate logout
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
    });

    expect(countNode.props.children).toBe(0);
  });

  it('wipes state and refetches for new account on account switching', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: 'Admin User' },
    });

    const getUnreadSpy = jest
      .spyOn(notificationApiService, 'getUnreadCount')
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(8);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
    });

    const countNode = renderer!.root.findByProps({ testID: 'unread-count' });
    expect(countNode.props.children).toBe(3);

    // Switch to another staff account (user.id: 2)
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 2, name: 'Priest Ramesh' },
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
    });

    expect(getUnreadSpy).toHaveBeenCalledTimes(2);
    expect(countNode.props.children).toBe(8);
  });

  it('optimistically decrements unreadCount on markAsRead', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: 'Admin' },
    });

    jest.spyOn(notificationApiService, 'getUnreadCount').mockResolvedValue(3);
    const markReadSpy = jest
      .spyOn(notificationApiService, 'markAsRead')
      .mockResolvedValue({ id: 10, readAt: '2026-11-11T12:00:00Z' });

    let contextRef: ReturnType<typeof useNotification> | undefined;

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NotificationProvider>
          <TestConsumer onContext={ctx => (contextRef = ctx)} />
        </NotificationProvider>
      );
    });

    const countNode = renderer!.root.findByProps({ testID: 'unread-count' });
    expect(countNode.props.children).toBe(3);

    await ReactTestRenderer.act(async () => {
      await contextRef!.markAsRead(10);
    });

    expect(markReadSpy).toHaveBeenCalledWith(10);
    expect(countNode.props.children).toBe(2);
  });

  it('rolls back unreadCount when markAsRead API fails', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: 'Admin' },
    });

    jest.spyOn(notificationApiService, 'getUnreadCount').mockResolvedValue(5);
    jest
      .spyOn(notificationApiService, 'markAsRead')
      .mockRejectedValueOnce(new Error('Network error'));

    let contextRef: ReturnType<typeof useNotification> | undefined;

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NotificationProvider>
          <TestConsumer onContext={ctx => (contextRef = ctx)} />
        </NotificationProvider>
      );
    });

    const countNode = renderer!.root.findByProps({ testID: 'unread-count' });
    expect(countNode.props.children).toBe(5);

    await ReactTestRenderer.act(async () => {
      try {
        await contextRef!.markAsRead(10);
      } catch (_e) {
        // Expected rejection
      }
    });

    // Should have rolled back to 5
    expect(countNode.props.children).toBe(5);
  });

  it('deduplicates rapid concurrent markAsRead calls for the same notification ID', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: 'Admin' },
    });

    jest.spyOn(notificationApiService, 'getUnreadCount').mockResolvedValue(4);

    let resolveApi: (val: any) => void;
    const pendingPromise = new Promise(resolve => {
      resolveApi = resolve;
    });

    const markReadSpy = jest
      .spyOn(notificationApiService, 'markAsRead')
      .mockReturnValue(pendingPromise as any);

    let contextRef: ReturnType<typeof useNotification> | undefined;

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NotificationProvider>
          <TestConsumer onContext={ctx => (contextRef = ctx)} />
        </NotificationProvider>
      );
    });

    // Call markAsRead concurrently twice for notification ID 10
    let call1: Promise<boolean>;
    let call2: Promise<boolean>;

    await ReactTestRenderer.act(async () => {
      call1 = contextRef!.markAsRead(10);
      call2 = contextRef!.markAsRead(10);
    });

    // Resolve the API call
    await ReactTestRenderer.act(async () => {
      resolveApi!({ id: 10, readAt: '2026-11-11T00:00:00Z' });
      await call1!;
      await call2!;
    });

    // Only 1 API call should have occurred!
    expect(markReadSpy).toHaveBeenCalledTimes(1);

    // Count should have decremented only once (from 4 to 3)
    const countNode = renderer!.root.findByProps({ testID: 'unread-count' });
    expect(countNode.props.children).toBe(3);
  });

  it('optimistically zeroes unreadCount on markAllAsRead and rolls back on failure', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: 'Admin' },
    });

    jest.spyOn(notificationApiService, 'getUnreadCount').mockResolvedValue(7);
    const markAllSpy = jest
      .spyOn(notificationApiService, 'markAllAsRead')
      .mockResolvedValueOnce(7);

    let contextRef: ReturnType<typeof useNotification> | undefined;

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NotificationProvider>
          <TestConsumer onContext={ctx => (contextRef = ctx)} />
        </NotificationProvider>
      );
    });

    const countNode = renderer!.root.findByProps({ testID: 'unread-count' });
    expect(countNode.props.children).toBe(7);

    await ReactTestRenderer.act(async () => {
      await contextRef!.markAllAsRead();
    });

    expect(markAllSpy).toHaveBeenCalledTimes(1);
    expect(countNode.props.children).toBe(0);

    // Test failure rollback
    jest.spyOn(notificationApiService, 'getUnreadCount').mockResolvedValue(3);
    await ReactTestRenderer.act(async () => {
      await contextRef!.fetchUnreadCount();
    });
    expect(countNode.props.children).toBe(3);

    jest
      .spyOn(notificationApiService, 'markAllAsRead')
      .mockRejectedValueOnce(new Error('Server error'));

    await ReactTestRenderer.act(async () => {
      try {
        await contextRef!.markAllAsRead();
      } catch (_e) {
        // Expected
      }
    });

    // Should rollback to 3
    expect(countNode.props.children).toBe(3);
  });
});
