"use client";

import { useEffect } from "react";

export default function TokenFromUrl() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (token) {
            localStorage.setItem("accessToken", token);
            // Clean token from URL without reload
            params.delete("token");
            const clean = params.toString();
            const newUrl = window.location.pathname + (clean ? `?${clean}` : "");
            window.history.replaceState({}, "", newUrl);
        }
    }, []);

    return null;
}
