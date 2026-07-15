"use client";

import React, { useState, useEffect } from "react";
import SuperAdminSidebar from "../../components/super-admin/SuperAdminSidebar";
import SuperAdminHeader from "../../components/super-admin/SuperAdminHeader";
import SystemAdminGuard from "../../components/SystemAdminGuard";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // Lazy init is safe: `pinned` is only consumed inside the `mounted` branch
    // below, so SSR sees the default `false` and the post-mount render uses
    // the persisted value with no hydration mismatch.
    const [pinned, setPinned] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem('sidebar_pinned') === 'true';
    });
    const [hovered, setHovered] = useState(false);

    // The classic post-mount flag — by definition this MUST be set in an
    // effect so the server renders the pre-hydration placeholder.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const togglePin = () => {
        setPinned(prev => {
            localStorage.setItem('sidebar_pinned', String(!prev));
            return !prev;
        });
    };

    const handleMenuToggle = () => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            togglePin();
        } else {
            setMobileMenuOpen(prev => !prev);
        }
    };

    // Sidebar visually expanded if pinned OR hovered
    const sidebarExpanded = pinned || hovered;

    return (
        <SystemAdminGuard>
            <style>{`
                .sa-layout {
                    background-color: #f1f5f9;
                    min-height: 100vh;
                }

                /* ── Sidebar backdrop ── */
                .sa-sidebar-backdrop {
                    position: fixed;
                    top: 60px; left: 0; right: 0; bottom: 0;
                    z-index: 99;
                    background: rgba(0,0,0,0.5);
                    opacity: 0; transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                .sa-sidebar-backdrop.open {
                    opacity: 1; pointer-events: auto;
                }

                /* ── Content area ── */
                .sa-content {
                    margin-top: 60px;
                    padding: 16px;
                    min-height: calc(100vh - 60px);
                    overflow-y: auto;
                    transition: margin-left 0.3s ease;
                }

                /* ── Tablet+ ── */
                @media (min-width: 768px) {
                    .sa-content {
                        margin-left: 70px;
                        padding: 20px;
                    }
                }

                /* ── Desktop ── */
                @media (min-width: 1024px) {
                    .sa-sidebar-backdrop { display: none !important; }
                    .sa-content {
                        margin-left: 70px;
                        padding: 24px;
                    }
                    .sa-content.sidebar-pinned {
                        margin-left: 250px;
                    }
                }
            `}</style>

            {!mounted ? (
                <div className="sa-layout" suppressHydrationWarning>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', zIndex: 200 }} />
                    <main className="sa-content" />
                </div>
            ) : (
                <div className="sa-layout">
                    <SuperAdminHeader
                        onMenuToggle={handleMenuToggle}
                        pinned={pinned}
                    />

                    <div
                        className={`sa-sidebar-backdrop ${mobileMenuOpen ? 'open' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    <SuperAdminSidebar
                        mobileOpen={mobileMenuOpen}
                        onCloseMobile={() => setMobileMenuOpen(false)}
                        desktopExpanded={sidebarExpanded}
                        desktopPinned={pinned}
                        onHoverEnter={() => setHovered(true)}
                        onHoverLeave={() => setHovered(false)}
                    />

                    <main className={`sa-content ${pinned ? 'sidebar-pinned' : ''}`}>
                        {children}
                    </main>
                </div>
            )}
        </SystemAdminGuard>
    );
}
