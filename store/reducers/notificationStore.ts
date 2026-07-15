import { create } from "zustand";
import { notificationApi } from "@/_api_/apiCallManager";

export type ImsNotification = {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    link: string | null;
    created_at: string;
};

type NotificationStore = {
    notifications: ImsNotification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async () => {
        try {
            const data = await notificationApi.getNotifications();
            set({ notifications: data.notifications, unreadCount: data.unreadCount });
        } catch { /* ignore */ }
    },

    markRead: async (id: string) => {
        try {
            await notificationApi.markNotificationRead(id);
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, is_read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch { /* ignore */ }
    },

    markAllRead: async () => {
        try {
            await notificationApi.markAllNotificationsRead();
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
                unreadCount: 0,
            }));
        } catch { /* ignore */ }
    },
}));
