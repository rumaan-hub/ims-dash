// app/components/SidebarProvider.tsx
"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";

const STORAGE_KEY = "sidebar_expanded";

interface SidebarContextValue {
  isSplitView: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isSplitView: false,
  toggleSidebar: () => { },
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // ── Hydration-safe initialisation ────────────────────────────────────────
  // Both server and client start with `false` so their output agrees
  // (no hydration mismatch). The blocking <script> in layout.tsx already
  // stamped `sidebar-initially-expanded` on <html>, so the CSS renders
  // the correct margin BEFORE React loads. After hydration the useEffect
  // below reads localStorage and sets the real value — with no visible shift
  // because the CSS already shows the correct state.
  const [isSplitView, setIsSplitView] = useState<boolean>(false);

  const toggleSidebar = useCallback(() => {
    setIsSplitView((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable (private mode, etc.) — silently continue
      }
      return next;
    });
  }, []);

  // Runs once after hydration. Reads the persisted state and updates React
  // to match. No visual shift occurs because the blocking script's CSS class
  // (`sidebar-initially-expanded`) already set the correct margin-left.
  // Note: setState-in-effect is intentional here — lazy useState init would
  // create a hydration mismatch (server has no localStorage), so we MUST
  // start with `false` on both server + client and reconcile after mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) === "true";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setIsSplitView(true);
    } catch {
      // localStorage unavailable — keep the default (false)
    }
  }, []);

  return (
    <SidebarContext.Provider value={{ isSplitView, toggleSidebar }}>
      <div className={`main-content-container${isSplitView ? " with-sidebar" : ""}`}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}