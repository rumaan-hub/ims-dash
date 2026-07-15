// app/components/Sidebar.tsx (Client Component)
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useSidebar } from "./SidebarProvider";
import { usePermissions } from "../../hooks/usePermissions";
import { useDashboard } from "../../hooks/useDashboard";
import { clearAuth, getToken } from "@/app/utils/auth";
import type { LedgerRow } from "@/store/reducers/ledgerStore";
import "./sidebar.css";

type SidebarNotification = {
  id: string;
  text: string;
  read: boolean;
  time: string;
  type: string;
};

export default function Sidebar() {
  const { hasPermission, loading } = usePermissions();

  // Use the sidebar context — isSplitView = expanded, toggleSidebar = hamburger action
  const { isSplitView, toggleSidebar } = useSidebar();

  // Define authentication-related variables directly in the component
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to true for demonstration
  const [user, setUser] = useState<{ name: string; initials: string; email: string }>({
    name: "",
    initials: "",
    email: ""
  });

  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // useSyncExternalStore gives the correct value on the FIRST render — no post-mount
  // correction. Server snapshot returns `true` (desktop) so SSR and the initial client
  // paint agree. Client snapshot reads window.innerWidth synchronously on hydration.
  // This eliminates the false → true shift that caused the sidebar width jump on load.
  const isDesktop = useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerWidth > 768, // client snapshot — read synchronously
    () => true                      // server snapshot — assume desktop for SSR
  );

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // New loading state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<SidebarNotification[]>([]);

  const {
    lowStockItems,
    nearExpiryCount,
    allTransactions,
    fetchDashboardData,
    loading: dashboardLoading
  } = useDashboard();

  const pathname = usePathname();
  const router = useRouter();

  // Only handles isLoaded — device detection is done by useSyncExternalStore above.
  // NOTE: The pathname-based reset that used to live here was removed — it was
  // the cause of the sidebar auto-closing on every route navigation.
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch real user data from auth endpoint
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ims/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data) {
          const fn = data.data.first_name || "";
          const ln = data.data.last_name || "";
          setUser({
            name: `${fn} ${ln}`.trim() || "User",
            initials: `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || "U",
            email: data.data.email || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Sync real notifications from dashboard data
  useEffect(() => {
    const realNotifications = [
      ...lowStockItems.map((item, index) => ({
        id: `low-stock-${index}`,
        text: `Low stock alert: ${item.name} (${item.stock} left)`,
        read: false,
        time: "Action required",
        type: 'alert'
      })),
    ];

    if (nearExpiryCount > 0) {
      realNotifications.push({
        id: 'near-expiry',
        text: `${nearExpiryCount} items are nearing expiry`,
        read: false,
        time: "Check ledger",
        type: 'alert'
      });
    }

    // Add last 5 transactions as "real" activity notifications
    const recentTransactions = allTransactions.slice(0, 5).map((tx: LedgerRow, index: number) => ({
      id: `tx-${index}`,
      text: `${tx.type}: ${tx.product || 'Unknown'} at ${tx.office || 'Main'}`,
      read: true,
      time: tx.date || "Yesterday",
      type: tx.type === 'Used' ? 'alert' : 'general'
    }));

    realNotifications.push(...recentTransactions);

    // TODO: split into a `useMemo` for derived items + a `Set<id>` of locally
    // dismissed/read marks. For now we sync derived items into state because
    // mark-as-read handlers below mutate the same `notifications` array.
    // Only set if we have real data, otherwise keep empty or show a placeholder
    if (realNotifications.length > 0) {
      setNotifications(realNotifications);
    } else if (!dashboardLoading) {
      setNotifications([
        { id: 'all-clear', text: "All systems normal. No alerts.", read: true, time: "Just now", type: 'general' }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allTransactions is intentionally excluded; only re-derive when stock alerts change to avoid noisy notification refresh on every transaction.
  }, [lowStockItems, nearExpiryCount, dashboardLoading]);

  // Handle link click (Close sidebar on mobile navigation)
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setOpen(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearAuth();
    setIsLoggedIn(false);
    setShowDropdown(false);
    setShowMobileProfile(false);
    router.push('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-profile')) {
        setShowDropdown(false);
        setShowMobileProfile(false);
      }
      if (!target.closest('.notification-bell') && !target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
  };

  // Mark a single notification as read
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;


  // Toggle sidebar — delegates entirely to the context which persists to localStorage
  const toggleSidebarDesktop = () => {
    if (isDesktop) {
      toggleSidebar();
    } else {
      setOpen(!open);
    }
  };

  // If not logged in, don't render the sidebar
  if (!isLoggedIn) {
    return null;
  }

  // Sidebar collapses when on desktop, not hovered, and not in expanded (split-view) mode
  const shouldCollapse = isDesktop && !isHovered && !isSplitView;

  return (
    <>

      {/* MOBILE HEADER */}
      <div className="mobile-header">
        <div
          className={`hamburger ${open ? 'active' : ''}`}
          onClick={() => setOpen(!open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Dentistry99</span>
        {isLoaded && (
          <div className={`notification-bell loaded`} onClick={() => setShowNotifications(!showNotifications)}>
            <svg className="bell-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#fbbf24" />
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
        )}
      </div>

      {/* MOBILE NOTIFICATION DROPDOWN - Only show on mobile */}
      {!isDesktop && showNotifications && (
        <div className="notification-dropdown show">
          <div className="notification-header">
            <span className="notification-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.slice(0, 4).map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-text">{notification.text}</div>
                  <div className="notification-time">{notification.time}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                No notifications
              </div>
            )}
          </div>
          <div 
            className="notification-footer" 
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(false);
              setIsModalOpen(true);
            }}
            style={{ cursor: 'pointer', padding: '15px', fontWeight: 'bold' }}
          >
            View all notifications
          </div>
        </div>
      )}

      {/* DESKTOP TOP HEADER */}
      <div className="top-header">
        <div className="header-left">
          <div className="header-logo">
            <span>Dentistry99</span>
          </div>
          <div
            className={`hamburger ${isSplitView ? 'active' : ''}`}
            onClick={toggleSidebarDesktop}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div className="header-right">
          {isLoaded && (
            <div className={`notification-bell loaded`} onClick={() => setShowNotifications(!showNotifications)}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
              {/* DESKTOP NOTIFICATION DROPDOWN - Only show on desktop */}
              {isDesktop && (
                <div className={`notification-dropdown ${showNotifications ? 'show' : ''}`}>
                  <div className="notification-header">
                    <span className="notification-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button className="mark-read-btn" onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 4).map(notification => (
                        <div
                          key={notification.id}
                          className={`notification-item ${!notification.read ? 'unread' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="notification-text">{notification.text}</div>
                          <div className="notification-time">{notification.time}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No notifications
                      </div>
                    )}
                  </div>
                  <div 
                    className="notification-footer" 
                    onClick={() => {
                      setShowNotifications(false);
                      setIsModalOpen(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    View all notifications
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="user-avatar">{user?.initials || 'U'}</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{user?.email || ''}</div>
            </div>
            <div className={`user-dropdown ${showDropdown ? 'show' : ''}`}>
              <div className="dropdown-item" onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                router.push('/profile');
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Show Profile</span>
              </div>
              <div className="dropdown-item" onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15C3 14.4696 3.21071 13.9609 3.58579 13.5858C3.96086 13.2107 4.46957 13 5 13M15 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V15C21 14.4696 20.7893 13.9609 20.4142 13.5858C20.0391 13.2107 19.5304 13 19 13M9 13V9C9 7.93913 9.42143 6.92172 10.1716 6.17157C10.9217 5.42143 11.9391 5 13 5C14.0609 5 15.0783 5.42143 15.8284 6.17157C16.5786 6.92172 17 7.93913 17 9V13M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Sign out</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY */}
      <div
        className={`sidebar-overlay ${open ? 'active' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* SIDEBAR COMPONENT */}
      <aside
        className={`sidebar-fixed ${open ? 'mobile-open' : ''} ${shouldCollapse ? 'sidebar-collapsed' : ''} ${isSplitView ? 'sidebar-split-view' : ''}`}
        onMouseEnter={() => isDesktop && setIsHovered(true)}
        onMouseLeave={() => isDesktop && setIsHovered(false)}
      >
        <nav>
          <Link
            href="/"
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="nav-link-icon">📊</span>
            <span className="nav-link-text">Dashboard</span>
          </Link>

          {!loading && hasPermission("inventory.view") && (
            <Link
              href="/inventory"
              className={`nav-link ${pathname === '/inventory' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-link-icon">📦</span>
              <span className="nav-link-text">Inventory</span>
            </Link>
          )}

          {!loading && hasPermission("ledger.view") && (
            <Link
              href="/ledger"
              className={`nav-link ${pathname === '/ledger' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-link-icon">📖</span>
              <span className="nav-link-text">Ledger</span>
            </Link>
          )}

          {!loading && hasPermission("staff.view") && (
            <Link
              href="/staff"
              className={`nav-link ${pathname === '/staff' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-link-icon">👥</span>
              <span className="nav-link-text">Staff</span>
            </Link>
          )}

          {!loading && hasPermission("office.manage") && (
            <Link
              href="/offices"
              className={`nav-link ${pathname === '/offices' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-link-icon">🏢</span>
              <span className="nav-link-text">Offices</span>
            </Link>
          )}

          {!loading && hasPermission("transfer.create") && (
            <Link
              href="/transfer"
              className={`nav-link ${pathname === '/transfer' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-link-icon">💸</span>
              <span className="nav-link-text">Transfer</span>
            </Link>
          )}

          {/* <Link 
            href="/proposals" 
            className={`nav-link ${pathname === '/proposals' ? 'active' : ''}`}
            onClick={handleLinkClick}
            >
            <span className="nav-link-icon">📝</span>
            <span className="nav-link-text">Proposals</span>
          </Link> */}

          <Link
            href="/tracking"
            className={`nav-link ${pathname === '/tracking' ? 'active' : ''}`}
            onClick={handleLinkClick}
          >

            <span className="nav-link-icon">🚚</span>
            <span className="nav-link-text">Order History & Tracking</span>
          </Link>

          {!loading && hasPermission("purchase.view") && (
            <Link
              href="/purchase"
              className={`nav-link ${pathname === '/purchase' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-link-icon">🛒</span>
              <span className="nav-link-text">Direct Purchase</span>
            </Link>
          )}

          <Link
            href="/suggestion"
            className={`nav-link ${pathname === '/suggestion' ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="nav-link-icon">💡</span>
            <span className="nav-link-text">Suggestion</span>
          </Link>

          <Link
            href="/profile"
            className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="nav-link-icon">👨</span>
            <span className="nav-link-text">Client Profile</span>
          </Link>

          {!loading && hasPermission("roles.view") && (
            <Link
              href="/roles"
              className={`nav-link ${pathname === '/roles' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="nav-link-icon">🔐</span>
              <span className="nav-link-text">Roles & Permissions</span>
            </Link>
          )}
        </nav>

        {/* Mobile User Profile Section */}
        <div className="mobile-user-profile">
          <div className="mobile-user-info" onClick={() => setShowMobileProfile(!showMobileProfile)}>
            <div className="user-avatar">{user?.initials || 'U'}</div>
            <div className="mobile-user-details">
              <div className="mobile-user-name">{user?.name || 'User'}</div>
              <div className="mobile-user-initials">{user?.email || ''}</div>
            </div>
          </div>
          {showMobileProfile && (
            <div className="mobile-user-dropdown">
              <div className="mobile-dropdown-item" onClick={() => {
                setShowMobileProfile(false);
                setOpen(false);
                router.push('/profile');
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Show Profile</span>
              </div>
              <div className="mobile-dropdown-item" onClick={handleLogout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15C3 14.4696 3.21071 13.9609 3.58579 13.5858C3.96086 13.2107 4.46957 13 5 13M15 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V15C21 14.4696 20.7893 13.9609 20.4142 13.5858C20.0391 13.2107 19.5304 13 19 13M9 13V9C9 7.93913 9.42143 6.92172 10.1716 6.17157C10.9217 5.42143 11.9391 5 13 5C14.0609 5 15.0783 5.42143 15.8284 6.17157C16.5786 6.92172 17 7.93913 17 9V13M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Sign out</span>
              </div>
            </div>
          )}
        </div>
      </aside >
      {/* NOTIFICATIONS MODAL (INLINE) */}
      {isModalOpen && (
        <div className="notifications-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="notifications-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">All Notifications</h2>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="modal-notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`modal-notification-card ${!notification.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className={`modal-icon-wrapper modal-icon-${notification.type || 'general'}`}>
                        {notification.type === 'appointment' ? "📅" :
                          notification.type === 'alert' ? "⚠️" :
                            notification.type === 'payment' ? "💰" :
                              notification.type === 'meeting' ? "👥" : "🔔"}
                      </div>
                      <div className="modal-notification-content">
                        <p className="modal-notification-message">{notification.text}</p>
                        <span className="modal-notification-time">{notification.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                    <p>No notifications found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {notifications.some(n => !n.read) && (
                <button className="mark-all-btn-modal" onClick={markAllAsRead}>
                  Mark all as read
                </button>
              )}
              <button
                className="mark-all-btn-modal"
                style={{ marginLeft: '10px', background: '#f1f5f9', color: '#475569' }}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>

          {/* <style jsx>{`
          
          `}</style> */}
        </div>
      )}
    </>
  );
}
