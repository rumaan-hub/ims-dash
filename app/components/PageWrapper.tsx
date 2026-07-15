"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * PageWrapper
 * -----------
 * Purpose: Handles the "soft refresh" by using the current pathname as a key.
 *
 * When the route changes, the key changes, forcing React to remount the children.
 * This re-triggers all useEffects, re-injects localized CSS, and ensures the
 * UI state and layout are reinitialized correctly without a hard browser reload.
 *
 * NOTE: The isMounted guard was intentionally removed — it caused a null → content
 * flash on every page load (first paint returned null, second paint showed content).
 * Children are now rendered immediately on the first paint.
 */
export default function PageWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div key={pathname} className="page-transition-wrapper" style={{ width: '100%' }}>
            {children}
        </div>
    );
}
