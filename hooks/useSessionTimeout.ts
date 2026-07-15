"use client";

import { useEffect, useRef } from "react";
import { clearAuth } from "@/app/utils/auth";

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

export function useSessionTimeout(enabled: boolean) {
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (!enabled) return;

        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                clearAuth();
                window.location.href = "/login";
            }, TIMEOUT_DURATION);
        };

        const events = [
            "mousedown", "mousemove", "keypress",
            "scroll", "touchstart", "click",
        ];

        events.forEach((event) =>
            window.addEventListener(event, resetTimer),
        );

        resetTimer();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach((event) =>
                window.removeEventListener(event, resetTimer),
            );
        };
    }, [enabled]);
}
