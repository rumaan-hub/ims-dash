"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, Bars3Icon, MagnifyingGlassIcon, UserPlusIcon, ArrowPathIcon, CurrencyDollarIcon, BoltIcon, CalendarIcon, UserCircleIcon, ArrowRightOnRectangleIcon, CheckCircleIcon, XCircleIcon, NoSymbolIcon } from "@heroicons/react/24/outline";
import { useNotifications } from "@/hooks/useNotifications";
import { clearAuth, getToken } from "@/app/utils/auth";

const ICON_MAP: Record<string, { icon: typeof UserPlusIcon; color: string; bg: string }> = {
    NEW_REGISTRATION: { icon: UserPlusIcon, color: '#2563eb', bg: '#dbeafe' },
    RESTORE_REQUEST: { icon: ArrowPathIcon, color: '#f59e0b', bg: '#fef3c7' },
    PAYMENT_RECEIVED: { icon: CurrencyDollarIcon, color: '#22c55e', bg: '#dcfce7' },
    PENDING_ACTIVATION: { icon: BoltIcon, color: '#eab308', bg: '#fef9c3' },
    DEMO_SCHEDULED: { icon: CalendarIcon, color: '#8b5cf6', bg: '#ede9fe' },
    DEMO_SUCCESSFUL: { icon: CheckCircleIcon, color: '#059669', bg: '#d1fae5' },
    DEMO_FAILED: { icon: XCircleIcon, color: '#dc2626', bg: '#fee2e2' },
    DEMO_CANCELLED: { icon: NoSymbolIcon, color: '#6b7280', bg: '#f3f4f6' },
    DEMO_RESCHEDULED: { icon: ArrowPathIcon, color: '#7c3aed', bg: '#ede9fe' },
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

interface Props {
    onMenuToggle?: () => void;
    pinned?: boolean;
}

export default function SuperAdminHeader({ onMenuToggle, pinned }: Props) {
    const router = useRouter();
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [headerSearch, setHeaderSearch] = useState("");
    const [adminInfo, setAdminInfo] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Fetch admin info
    useEffect(() => {
        const token = getToken();
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3003'}/ims/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.ok ? res.json() : null)
            .then(json => { const u = json?.data || json; if (u?.email) setAdminInfo({ first_name: u.first_name, last_name: u.last_name, email: u.email }); })
            .catch(() => {});
    }, []);

    const adminName = adminInfo ? `${adminInfo.first_name || ''} ${adminInfo.last_name || ''}`.trim() || 'Super Admin' : 'Super Admin';
    const adminEmail = adminInfo?.email || 'System Control';
    const adminInitials = adminInfo ? `${(adminInfo.first_name || 'S')[0]}${(adminInfo.last_name || 'A')[0]}`.toUpperCase() : 'SA';

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        clearAuth();
        window.location.href = "/login";
    };

    const handleNotifClick = (id: string, link: string | null, isRead: boolean) => {
        if (!isRead) markRead(id);
        if (link) router.push(link);
        setOpen(false);
    };

    return (
        <>
            <style>{`
                .sa-header {
                    position: fixed; top: 0; left: 0; right: 0;
                    height: 60px; z-index: 200;
                    background-color: #fff;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex; align-items: center;
                    padding: 0 16px;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .sa-header-left {
                    display: flex; align-items: center; gap: 12px; flex-shrink: 0;
                }
                .sa-header-search { display: none; }
                .sa-header-profile-text { display: none; }
                .sa-header-right { display: flex; align-items: center; gap: 12px; }
                .sa-notif-dropdown {
                    position: absolute; top: 100%; right: -16px; margin-top: 8px;
                    width: calc(100vw - 32px); max-width: 380px;
                    background: #fff; border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.12);
                    border: 1px solid #e5e7eb; z-index: 200; overflow: hidden;
                }

                @media (min-width: 768px) {
                    .sa-header { padding: 0 24px; }
                    .sa-header-search { display: flex; align-items: center; }
                    .sa-header-profile-text { display: flex; }
                    .sa-header-right { gap: 20px; }
                    .sa-notif-dropdown { right: 0; width: 380px; }
                }
                @keyframes sa-profileFadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <header className="sa-header">
                {/* Left: Brand + Hamburger */}
                <div className="sa-header-left">
                    <span style={{ fontWeight: 700, fontSize: '18px', color: '#111827', whiteSpace: 'nowrap' }}>
                        IMS <span style={{ color: '#2563eb' }}>Admin</span>
                    </span>
                    <button
                        onClick={onMenuToggle}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: pinned ? '#2563eb' : '#374151',
                            transition: 'color 0.2s ease',
                        }}
                    >
                        <Bars3Icon className="w-5 h-5" />
                    </button>
                </div>

                {/* Search — hidden on mobile */}
                <div className="sa-header-search">
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        background: '#f9fafb', borderRadius: '8px',
                        padding: '6px 12px', width: '300px', maxWidth: '100%',
                        border: '1px solid #e5e7eb',
                    }}>
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search clients, demos..."
                            value={headerSearch}
                            onChange={(e) => setHeaderSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && headerSearch.trim()) {
                                    router.push(`/system-admin/users?search=${encodeURIComponent(headerSearch.trim())}`);
                                    setHeaderSearch('');
                                }
                            }}
                            style={{
                                border: 'none', background: 'transparent',
                                outline: 'none', marginLeft: '8px',
                                fontSize: '14px', width: '100%',
                            }}
                        />
                    </div>
                </div>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                <div className="sa-header-right">
                    {/* Bell + Dropdown */}
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setOpen(!open)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '4px' }}
                        >
                            <BellIcon className="w-6 h-6 text-gray-500" />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: 0, right: 0,
                                    minWidth: '18px', height: '18px', lineHeight: '18px',
                                    background: '#ef4444', borderRadius: '9px',
                                    color: '#fff', fontSize: '10px', fontWeight: 700,
                                    textAlign: 'center', padding: '0 4px',
                                }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {open && (
                            <div className="sa-notif-dropdown">
                                {/* Header */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
                                }}>
                                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Notifications</span>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllRead()}
                                            style={{
                                                border: 'none', background: 'none', cursor: 'pointer',
                                                fontSize: '12px', color: '#2563eb', fontWeight: 500,
                                            }}
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                {/* List */}
                                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const cfg = ICON_MAP[n.type] || ICON_MAP.NEW_REGISTRATION;
                                            const Icon = cfg.icon;
                                            return (
                                                <div
                                                    key={n.id}
                                                    onClick={() => handleNotifClick(n.id, n.link, n.is_read)}
                                                    style={{
                                                        display: 'flex', gap: '12px', padding: '12px 16px',
                                                        cursor: 'pointer', borderBottom: '1px solid #f9fafb',
                                                        background: n.is_read ? '#fff' : '#f0f7ff',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = n.is_read ? '#fff' : '#f0f7ff')}
                                                >
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '8px',
                                                        background: cfg.bg, display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    }}>
                                                        <Icon style={{ width: '18px', height: '18px', color: cfg.color }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: '13px', color: '#111827',
                                                            fontWeight: n.is_read ? 400 : 600,
                                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                        }}>
                                                            {n.title}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '12px', color: '#6b7280', marginTop: '2px',
                                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                        }}>
                                                            {n.message}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                                            {timeAgo(n.created_at)}
                                                        </div>
                                                    </div>
                                                    {!n.is_read && (
                                                        <div style={{
                                                            width: '8px', height: '8px', borderRadius: '50%',
                                                            background: '#2563eb', flexShrink: 0, marginTop: '6px',
                                                        }} />
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div ref={profileRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            }}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: '#2563eb', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 'bold', fontSize: '14px', flexShrink: 0,
                            }}>{adminInitials}</div>
                            <div className="sa-header-profile-text" style={{ flexDirection: 'column', textAlign: 'left' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{adminName}</span>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>{adminEmail}</span>
                            </div>
                        </button>

                        {profileOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                minWidth: '180px', background: '#fff', borderRadius: '8px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
                                zIndex: 200, overflow: 'hidden',
                                animation: 'sa-profileFadeIn 0.15s ease',
                            }}>
                                {/* Name header */}
                                <div style={{
                                    padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{adminName}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{adminEmail}</div>
                                </div>
                                {/* Profile link */}
                                <button
                                    onClick={() => { router.push('/system-admin/settings'); setProfileOpen(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        width: '100%', padding: '10px 16px', border: 'none',
                                        background: 'none', cursor: 'pointer', color: '#374151',
                                        fontSize: '14px', textAlign: 'left', transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                >
                                    <UserCircleIcon style={{ width: '18px', height: '18px' }} />
                                    Profile
                                </button>
                                {/* Sign Out */}
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        width: '100%', padding: '10px 16px', border: 'none',
                                        background: 'none', cursor: 'pointer', color: '#ef4444',
                                        fontSize: '14px', textAlign: 'left', transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                >
                                    <ArrowRightOnRectangleIcon style={{ width: '18px', height: '18px' }} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
