"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    HomeIcon,
    UsersIcon,
    DocumentDuplicateIcon,
    Cog6ToothIcon,
} from "@heroicons/react/24/outline";

interface Props {
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
    desktopExpanded?: boolean;
    desktopPinned?: boolean;
    onHoverEnter?: () => void;
    onHoverLeave?: () => void;
}

export default function SuperAdminSidebar({ mobileOpen, onCloseMobile, desktopExpanded, desktopPinned, onHoverEnter, onHoverLeave }: Props) {
    const pathname = usePathname();

    const navItems = [
        { name: "Analytics", href: "/system-admin/home", icon: <HomeIcon className="w-5 h-5" /> },
        { name: "Users & Demos", href: "/system-admin/users", icon: <UsersIcon className="w-5 h-5" /> },
        { name: "Plans", href: "/system-admin/plans", icon: <DocumentDuplicateIcon className="w-5 h-5" /> },
        { name: "Settings", href: "/system-admin/settings", icon: <Cog6ToothIcon className="w-5 h-5" /> },
    ];

    const handleNavClick = () => {
        onCloseMobile?.();
    };

    return (
        <>
            <style>{`
                /* ── Mobile (default): off-screen overlay below header ── */
                .sa-sidebar {
                    position: fixed;
                    top: 60px; left: 0; bottom: 0;
                    width: 260px;
                    z-index: 100;
                    background-color: #ffffff; color: #374151;
                    display: flex; flex-direction: column;
                    border-right: 1px solid #e5e7eb;
                    overflow: hidden;
                    transform: translateX(-100%);
                    transition: transform 0.3s ease, width 0.3s ease;
                }
                .sa-sidebar.mobile-open {
                    transform: translateX(0);
                }
                .sa-sidebar .sa-nav-label { display: inline; }
                .sa-sidebar .sa-nav-link { justify-content: flex-start; }
                .sa-sidebar .sa-nav-item { position: relative; }
                .sa-sidebar .sa-tooltip { display: none; }

                /* ── Tablet (768+): 70px icons, always visible ── */
                @media (min-width: 768px) {
                    .sa-sidebar {
                        width: 70px;
                        transform: none;
                        transition: width 0.3s ease;
                    }
                    .sa-sidebar .sa-nav-label { display: none; }
                    .sa-sidebar .sa-nav-link { justify-content: center; }
                    .sa-sidebar .sa-nav-item:hover .sa-tooltip {
                        display: block; position: absolute;
                        left: 100%; top: 50%; transform: translateY(-50%);
                        background: #111827; color: #fff;
                        padding: 4px 10px; border-radius: 6px;
                        font-size: 12px; white-space: nowrap;
                        margin-left: 8px; z-index: 50;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        pointer-events: none;
                    }
                }

                /* ── Tablet overlay: hamburger expands (768–1023) ── */
                @media (min-width: 768px) and (max-width: 1023.98px) {
                    .sa-sidebar.mobile-open {
                        width: 260px;
                    }
                    .sa-sidebar.mobile-open .sa-nav-label { display: inline !important; }
                    .sa-sidebar.mobile-open .sa-nav-link { justify-content: flex-start !important; }
                    .sa-sidebar.mobile-open .sa-tooltip { display: none !important; }
                }

                /* ── Desktop (1024+): hover overlay + click pin ── */
                @media (min-width: 1024px) {
                    .sa-sidebar {
                        width: 70px;
                        transition: width 0.3s ease, box-shadow 0.3s ease;
                    }
                    .sa-sidebar .sa-nav-label { display: none; }
                    .sa-sidebar .sa-nav-link { justify-content: center; }
                    .sa-sidebar .sa-nav-item:hover .sa-tooltip {
                        display: block; position: absolute;
                        left: 100%; top: 50%; transform: translateY(-50%);
                        background: #111827; color: #fff;
                        padding: 4px 10px; border-radius: 6px;
                        font-size: 12px; white-space: nowrap;
                        margin-left: 8px; z-index: 50;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        pointer-events: none;
                    }

                    /* Hover expand: overlay, no content shift */
                    .sa-sidebar.hover-expanded {
                        width: 250px;
                        box-shadow: 4px 0 24px rgba(0,0,0,0.08);
                    }
                    .sa-sidebar.hover-expanded .sa-nav-label { display: inline; }
                    .sa-sidebar.hover-expanded .sa-nav-link { justify-content: flex-start; }
                    .sa-sidebar.hover-expanded .sa-tooltip { display: none !important; }

                    /* Pinned: in flow, content shifts */
                    .sa-sidebar.pinned {
                        width: 250px;
                        box-shadow: none;
                    }
                    .sa-sidebar.pinned .sa-nav-label { display: inline; }
                    .sa-sidebar.pinned .sa-nav-link { justify-content: flex-start; }
                    .sa-sidebar.pinned .sa-tooltip { display: none !important; }
                }
            `}</style>

            <div
                className={`sa-sidebar ${mobileOpen ? 'mobile-open' : ''} ${desktopPinned ? 'pinned' : desktopExpanded ? 'hover-expanded' : ''}`}
                onMouseEnter={onHoverEnter}
                onMouseLeave={onHoverLeave}
            >
                <nav style={{ flex: 1, paddingTop: '10px' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.name} className="sa-nav-item" style={{ padding: '4px 12px' }}>
                                    <Link
                                        href={item.href}
                                        onClick={handleNavClick}
                                        className="sa-nav-link"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            color: isActive ? '#fff' : '#374151',
                                            backgroundColor: isActive ? '#2563eb' : 'transparent',
                                            textDecoration: 'none',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; } }}
                                        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#374151'; } }}
                                    >
                                        <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                                        <span className="sa-nav-label" style={{ marginLeft: '12px', fontSize: '14px', fontWeight: isActive ? 500 : 400, whiteSpace: 'nowrap' }}>{item.name}</span>
                                    </Link>
                                    <span className="sa-tooltip">{item.name}</span>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </>
    );
}
