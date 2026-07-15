"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/store/reducers/notificationStore";

export const useNotifications = () => {
    const { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead } =
        useNotificationStore();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
        // initial-load + polling only — fetchNotifications from zustand store is a stable reference
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { notifications, unreadCount, loading, markRead, markAllRead };
};
