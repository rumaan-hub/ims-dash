"use client";

import { useState, useEffect } from "react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

export default function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
    // Lazy init reads localStorage during the first render — runs only on the
    // client because this is a "use client" component, so no SSR mismatch.
    const [enabled, setEnabled] = useState(() => {
        if (typeof window === "undefined") return true;
        const saved = window.localStorage.getItem("session_timeout");
        return saved !== null ? saved === "true" : true;
    });

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === "session_timeout") {
                setEnabled(e.newValue === "true");
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    useSessionTimeout(enabled);

    return <>{children}</>;
}
