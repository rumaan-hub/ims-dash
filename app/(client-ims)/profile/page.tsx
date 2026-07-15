// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import './page.css';
import { useProfilePage } from '@/hooks/useProfile';
import type { PaymentHistoryEntry } from '@/store/reducers/profileStore';
import { useStaffStore } from '@/store/reducers/staffStore';
import { useSystemActivity } from "@/hooks/useSystemActivity";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Toaster } from 'react-hot-toast';

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCardInput from './components/StripeCardInput';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3003';

let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
    if (!stripePromise) {
        stripePromise = fetch(`${API_BASE}/ims-checkout/config`)
            .then(res => res.json())
            .then(data => loadStripe(data.publishableKey))
            .catch(() => null);
    }
    return stripePromise;
};

// ─── Module-scope SVG icon components ─────────────────────────────────────
// Hoisted out of the page component so React Compiler treats them as stable
// (a component defined inside another component would lose identity per render).

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    <path fillRule="evenodd" d="M8 9c-3.866 0-6 2.239-6 4 0 .667.333 1 1 1h10c.667 0 1-.333 1-1 0-1.761-2.134-4-6-4zm5 3.996c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
  </svg>
);

const IdCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M14.5 1a.5.5 0 0 0-.5-.5H2a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5V1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
    <path d="M4.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-7zM4 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
    <path d="M5 6.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
  </svg>
);

const ShippingFastIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.5 2a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5H11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8.5z" />
    <path d="M1 4a2 2 0 0 1 2-2h5.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a2 2 0 0 1-2-2V4z" />
    <path d="M10 7h1a2 2 0 0 1 2 2v5.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5H12a1 1 0 0 0 1-1V7z" />
    <path d="M4 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z" />
    <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 0 2H3a1 1 0 0 1-1-1zm9-1a1 1 0 0 0 0 2h1a1 1 0 1 0 0-2h-1z" />
  </svg>
);

const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 6.61 3.279 8.414a.48.48 0 0 1-.348.78c-.361-.208-.688-.452-.981-.724C3.247 13.066 2.543 12.45 2.06 11.66c-.695-1.088-1.236-2.321-1.395-3.862a.48.48 0 0 0-.695-.414c-.852.374-1.735.648-2.69.834a.48.48 0 0 0-.33.79c.693.36 1.344.76 1.933 1.198 1.445.975 2.527 2.155 3.098 3.817a.48.48 0 0 0 .918-.004c.632-1.662 1.653-2.842 3.098-3.817.589-.438 1.24-.838 1.933-1.198a.48.48 0 0 0-.33-.79c-.955-.186-1.838-.46-2.69-.834a.48.48 0 0 0-.695.414c-.159 1.541-.7 2.774-1.395 3.862-.483.79-1.187 1.406-2.059 1.886-.293.272-.62.516-.981.724a.48.48 0 0 1-.348-.78c2.553-1.804 3.833-4.257 3.279-8.414a.48.48 0 0 0-.328-.39 61.44 61.44 0 0 0-2.837-.856.48.48 0 0 0-.468.627c.47.832.788 1.68.943 2.536a.48.48 0 0 0 .535.406c1.98-.34 3.724-.977 5.084-1.915a.48.48 0 0 0 .574-.78C10.597 6.453 9.84 5.767 9.37 4.936a.48.48 0 0 0-.468-.627z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm-7.5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm-3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    <path fillRule="evenodd" d="M16 14c0 1-1 1-1 1H7.022a.274.274 0 0 1-.014-.002l-.008-.002c.002-.263.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72zM5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816A5.88 5.88 0 0 0 5.706 9.033 7.35 7.35 0 0 0 5 9zm-.08 1A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275z" />
  </svg>
);

const ShieldAltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 6.61 3.279 8.414a.48.48 0 0 1-.348.78c-.361-.208-.688-.452-.981-.724C3.247 13.066 2.543 12.45 2.06 11.66c-.695-1.088-1.236-2.321-1.395-3.862a.48.48 0 0 0-.695-.414c-.852.374-1.735.648-2.69.834a.48.48 0 0 0-.33.79c.693.36 1.344.76 1.933 1.198 1.445.975 2.527 2.155 3.098 3.817a.48.48 0 0 0 .918-.004c.632-1.662 1.653-2.842 3.098-3.817.589-.438 1.24-.838 1.933-1.198a.48.48 0 0 0-.33-.79c-.955-.186-1.838-.46-2.69-.834a.48.48 0 0 0-.695.414c-.159 1.541-.7 2.774-1.395 3.862-.483.79-1.187 1.406-2.059 1.886-.293.272-.62.516-.981.724a.48.48 0 0 1-.348-.78c2.553-1.804 3.833-4.257 3.279-8.414a.48.48 0 0 0-.328-.39 61.44 61.44 0 0 0-2.837-.856.48.48 0 0 0-.468.627c.47.832.788 1.68.943 2.536a.48.48 0 0 0 .535.406c1.98-.34 3.724-.977 5.084-1.915a.48.48 0 0 0 .574-.78C10.597 6.453 9.84 5.767 9.37 4.936a.48.48 0 0 0-.468-.627z" />
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10.5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5h.793l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
  </svg>
);

const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M0 8a4 4 0 1 1 7.465 2H14a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.468-.325A4 4 0 1 1 0 8zm4-3a3 3 0 1 0 2.712 4.285A.5.5 0 0 1 7.385 10H4.5a.5.5 0 0 1-.5-.5V8a.5.5 0 0 1 .5-.5h2.885a3 3 0 0 0 1.115-1.715z" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.515 1.019A7 7 0 0 0 8 2V3a6 6 0 1 1 .515 9.981L8 13a8 8 0 1 0 .515-11.981z" />
    <path d="M7.794 1.019a8 8 0 1 0 3.412 15.362l-.693-.693A7 7 0 1 1 8.515 1.019l.693.693A7.973 7.973 0 0 0 7.794 1.019z" />
    <path d="M6.5 4.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1H7V4.5z" />
  </svg>
);

const DesktopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M2.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-11zm1 1h10v10h-10V3z" />
    <path d="M14.5 16a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 16v-1h13v1zm-13-1v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1h-12z" />
  </svg>
);

const ClipboardListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M5 1.5A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5v1A1.5 1.5 0 0 1 9.5 4h-3A1.5 1.5 0 0 1 5 2.5v-1zm-2 0h1v1A2.5 2.5 0 0 0 6.5 5h3A2.5 2.5 0 0 0 12 2.5v-1h1a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3.5a2 2 0 0 1 2-2z" />
    <path d="M4.5 10.5A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
  </svg>
);

interface Transaction {
  id: string;
  date: string;
  staffId: number;
  status: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

const PROFILE_TABS = [
  'personal-info',
  'license-details',
  'shipping-info',
  'billing-payment',
  'subscription',
  'staff-tracking',
  'security-settings'
];

export default function ClientProfileManagement() {
  // ── Profile hook (client data from backend) ──────────────────────────────
  const {
    client,
    loading: profileLoading,
    activeTab,
    setActiveTab,
    personalForm,
    handlePersonalFormChange,
    savePersonalInfo,
    // License
    licenses,
    showLicenseModal,
    licenseForm, setLicenseForm,
    openAddLicense, openEditLicense, closeLicenseModal,
    saveLicense, removeLicense,
    // Shipping
    shippings,
    showShippingModal,
    shippingForm, setShippingForm,
    openAddShipping, openEditShipping, closeShippingModal,
    saveShipping, removeShipping,
    // Billing
    billings,
    showBillingModal,
    billingForm, setBillingForm,
    openAddBilling, openEditBilling, closeBillingModal,
    saveBilling, removeBilling,
    // Subscription
    mySubscription, mySubscriptionLoading,
    paymentHistory, paymentHistoryLoading,
    // Security / Login History
    loginHistory, loginHistoryLoading, changePassword, forgotPassword,
  } = useProfilePage();

  // ── Staff hook (staff list from Staff page's store) ──────────────────────
  const { staff: staffData, loading: staffLoading, fetchStaff } = useStaffStore();

  const { trackPageOpen } = useSystemActivity();

  useEffect(() => {
    trackPageOpen("Client Profile");
  }, [trackPageOpen]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- initial-load only; fetchStaff is a stable store fetcher
  useEffect(() => { fetchStaff(); }, []);
  const [transactionData] = useState<Transaction[]>([
    {
      id: 'TRX-2025-001',
      date: 'Dec 15, 2025',
      staffId: 1,
      status: 'Completed'
    },
    {
      id: 'TRX-2025-002',
      date: 'Dec 14, 2025',
      staffId: 2,
      status: 'In Progress'
    },
    {
      id: 'TRX-2025-003',
      date: 'Dec 13, 2025',
      staffId: 3,
      status: 'Pending'
    }
  ]);

  const [notification, setNotification] = useState<Notification>({
    message: '',
    type: 'success',
    show: false
  });

  const [modals, setModals] = useState({
    billingAddress: false,
    paymentMethod: false,
    changePassword: false,
    upgradePlan: false,
    downgradePlan: false,
    cancelSubscription: false
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('session_timeout');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  useSessionTimeout(sessionTimeoutEnabled);

  const [formData, setFormData] = useState({
    // Change Password Form
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const openSubModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeSubModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  const scrollToActiveTab = () => {
    setTimeout(() => {
      // Scroll window to slightly above tabs
      const tabsSection = document.getElementById('profile-tabs-section');
      if (tabsSection) {
        const y = tabsSection.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }

      // Scroll horizontal navigation to keep button in focus
      const tabNav = document.getElementById('profile-tab-navigation');
      if (tabNav) {
        const activeBtn = tabNav.querySelector('.tab-button.active');
        if (activeBtn) {
          activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }, 50);
  };

  const handlePrevTab = () => {
    const currentIndex = PROFILE_TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(PROFILE_TABS[currentIndex - 1]);
      scrollToActiveTab();
    }
  };

  const handleNextTab = () => {
    const currentIndex = PROFILE_TABS.indexOf(activeTab);
    if (currentIndex < PROFILE_TABS.length - 1) {
      setActiveTab(PROFILE_TABS[currentIndex + 1]);
      scrollToActiveTab();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showNotification('New password must be at least 8 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match!', 'error');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      closeSubModal('changePassword');
      showNotification('Password changed successfully!', 'success');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      showNotification(message, 'error');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName?.charAt(0) ?? '') + (lastName?.charAt(0) ?? '');
  };

  const getStaffName = (staffId: number) => {
    const s = staffData.find(st => Number(st.staff_id) === staffId);
    return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      {/* Notification */}
      <div className={`notification ${notification.show ? 'show' : ''} ${notification.type}`}>
        {notification.message}
      </div>

      {/* Page Container - Added this wrapper to center the content and limit width */}
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Client Profile Management</h1>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs" id="profile-tabs-section">
          <div className="tab-navigation" id="profile-tab-navigation">
            <button
              className={`tab-button ${activeTab === 'personal-info' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal-info')}
            >
              <UserIcon /> Personal Information
            </button>
            <button
              className={`tab-button ${activeTab === 'license-details' ? 'active' : ''}`}
              onClick={() => setActiveTab('license-details')}
            >
              <IdCardIcon /> License Details
            </button>
            <button
              className={`tab-button ${activeTab === 'shipping-info' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping-info')}
            >
              <ShippingFastIcon /> Shipping Information
            </button>
            <button
              className={`tab-button ${activeTab === 'billing-payment' ? 'active' : ''}`}
              onClick={() => setActiveTab('billing-payment')}
            >
              <CreditCardIcon /> Billing & Payment
            </button>
            <button
              className={`tab-button ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
            >
              <CrownIcon /> Subscription
            </button>
            <button
              className={`tab-button ${activeTab === 'staff-tracking' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff-tracking')}
            >
              <UsersIcon /> Staff Tracking
            </button>
            <button
              className={`tab-button ${activeTab === 'security-settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('security-settings')}
            >
              <ShieldAltIcon /> Security Settings
            </button>
          </div>

          <div className={`tab-content ${activeTab === 'personal-info' ? 'active' : ''}`}>
            {profileLoading ? (
              <div className="section-card" style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                Loading client data…
              </div>
            ) : !client ? (
              <div className="section-card" style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                No client record found in the database.
              </div>
            ) : (
              <div className="section-card">
                <h3 className="section-title">
                  <UserIcon /> Personal Information
                </h3>

                {/* Avatar strip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: '14px 20px', background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                    {getInitials(client.first_name, client.last_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {client.first_name} {client.last_name}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {client.company_name}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 13, wordBreak: 'break-all', overflowWrap: 'break-word', whiteSpace: 'normal', lineHeight: 1.3 }}>
                      {client.email}
                    </div>
                  </div>
                </div>


                <form onSubmit={(e) => { e.preventDefault(); savePersonalInfo(); }}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Company Name *</label>
                        <input type="text" className="form-control" name="company_name" value={personalForm.company_name} onChange={handlePersonalFormChange} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Contact Number</label>
                        <input type="text" className="form-control" name="contact_number" value={personalForm.contact_number} onChange={handlePersonalFormChange} />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input type="text" className="form-control" name="first_name" value={personalForm.first_name} onChange={handlePersonalFormChange} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Last Name *</label>
                        <input type="text" className="form-control" name="last_name" value={personalForm.last_name} onChange={handlePersonalFormChange} required />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input type="email" className="form-control" name="email" value={personalForm.email} onChange={handlePersonalFormChange} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Permanent Address</label>
                        <input type="text" className="form-control" name="permanent_address" value={personalForm.permanent_address} onChange={handlePersonalFormChange} />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input type="text" className="form-control" name="city" value={personalForm.city} onChange={handlePersonalFormChange} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input type="text" className="form-control" name="state" value={personalForm.state} onChange={handlePersonalFormChange} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Zip Code</label>
                        <input type="text" className="form-control" name="zip_code" value={personalForm.zip_code} onChange={handlePersonalFormChange} />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                    <SaveIcon /> {profileLoading ? 'Saving…' : 'Save Personal Information'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ── License Details Tab ─────────────────────────────── */}
          <div className={`tab-content ${activeTab === 'license-details' ? 'active' : ''}`}>
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title" style={{ margin: 0 }}><IdCardIcon /> License Details</h3>
                <button className="btn btn-primary btn-sm" onClick={openAddLicense}>
                  <PlusIcon /> Add License
                </button>
              </div>

              {licenses.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No licenses on record. Click &ldquo;Add License&rdquo; to get started.</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>License #</th>
                        <th>State</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenses.map((lic) => (
                        <tr key={lic.license_id}>
                          <td>{lic.license_type}</td>
                          <td>{lic.license_number}</td>
                          <td>{lic.state}</td>
                          <td>{lic.expiry_date ? new Date(lic.expiry_date).toLocaleDateString() : '—'}</td>
                          <td><span className={`status-badge ${lic.status === 'Active' ? 'status-active' : 'status-pending'}`}>{lic.status}</span></td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditLicense(lic)}><EditIcon /></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeLicense(lic.license_id)}><TrashIcon /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Shipping Information Tab ────────────────────────── */}
          <div className={`tab-content ${activeTab === 'shipping-info' ? 'active' : ''}`}>
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title" style={{ margin: 0 }}><ShippingFastIcon /> Shipping Addresses</h3>
                <button className="btn btn-primary btn-sm" onClick={openAddShipping}>
                  <PlusIcon /> Add Shipping Address
                </button>
              </div>

              {shippings.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No shipping addresses saved. Click &ldquo;Add Shipping Address&rdquo; to begin.</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Office Name</th>
                        <th>Address</th>
                        <th>City</th>
                        <th>State</th>
                        <th>ZIP</th>
                        <th>Phone</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shippings.map((s) => (
                        <tr key={s.shipping_id}>
                          <td>{s.office_name}</td>
                          <td>{s.address}</td>
                          <td>{s.city}</td>
                          <td>{s.state}</td>
                          <td>{s.zip_code}</td>
                          <td>{s.phone || '—'}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditShipping(s)}><EditIcon /></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeShipping(s.shipping_id)}><TrashIcon /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Billing & Payment Tab ───────────────────────────── */}
          <div className={`tab-content ${activeTab === 'billing-payment' ? 'active' : ''}`}>
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title" style={{ margin: 0 }}><CreditCardIcon /> Billing Records</h3>
                <button className="btn btn-primary btn-sm" onClick={openAddBilling}>
                  <PlusIcon /> Add Billing Record
                </button>
              </div>

              {billings.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No billing records found. Click &ldquo;Add Billing Record&rdquo; to start.</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Billing Address</th>
                        <th>Card</th>
                        <th>Card Number</th>
                        <th>Expiry</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billings.map((b) => (
                        <tr key={b.billing_id}>
                          <td>{b.billing_address}</td>
                          <td>{b.card_brand || '—'}</td>
                          <td style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                            {b.masked_card || '**** **** **** ????'}
                          </td>
                          <td>{b.expiry_month && b.expiry_year ? `${String(b.expiry_month).padStart(2, '0')}/${b.expiry_year}` : '—'}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditBilling(b)}><EditIcon /></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeBilling(b.billing_id)}><TrashIcon /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Management Tab */}
          <div className={`tab-content ${activeTab === 'subscription' ? 'active' : ''}`}>
            {mySubscriptionLoading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : !mySubscription ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 48 }}>No active subscription found.</div>
            ) : (
              <div className="subscription-card">
                <div className="subscription-header">
                  <div className="subscription-title">{mySubscription.plan_name}</div>
                  <div className="subscription-price">
                    ${mySubscription.final_amount.toFixed(2)}/{mySubscription.billing_cycle.toLowerCase() === 'annual' ? 'year' : 'month'}
                  </div>
                </div>
                <div className="subscription-details">
                  <div className="subscription-detail">
                    <span>Billing Cycle:</span>
                    <span>{mySubscription.billing_cycle.charAt(0).toUpperCase() + mySubscription.billing_cycle.slice(1)}</span>
                  </div>
                  {mySubscription.discount_percentage > 0 && (
                    <div className="subscription-detail">
                      <span>Discount:</span>
                      <span>{mySubscription.discount_percentage}%</span>
                    </div>
                  )}
                  <div className="subscription-detail">
                    <span>Status:</span>
                    <span className={`status-badge ${mySubscription.active ? 'status-active' : 'status-inactive'}`}>
                      {mySubscription.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="subscription-detail">
                    <span>Payment Status:</span>
                    <span>{mySubscription.payment_status}</span>
                  </div>
                  <div className="subscription-detail">
                    <span>Start Date:</span>
                    <span>{new Date(mySubscription.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="subscription-detail">
                    <span>{mySubscription.payment_status === 'COMPLIMENTARY' ? 'Expires On:' : 'Next Billing Date:'}</span>
                    <span>{mySubscription.next_billing_date ? new Date(mySubscription.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="section-card">
              <h3 className="section-title">
                <HistoryIcon /> Payment History
              </h3>

              {paymentHistoryLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : !paymentHistory || paymentHistory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No payment history found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Billing</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((ph: PaymentHistoryEntry, idx: number) => (
                        <tr key={idx}>
                          <td>
                            {ph.plan_name}
                            {ph.active && (
                              <span style={{
                                marginLeft: 8, background: '#d1fae5', color: '#059669',
                                padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                              }}>Current</span>
                            )}
                          </td>
                          <td>{ph.billing_cycle.charAt(0).toUpperCase() + ph.billing_cycle.slice(1)}</td>
                          <td>${ph.final_amount.toFixed(2)}</td>
                          <td>
                            <span className={`status-badge ${
                              ph.payment_status === 'COMPLETED' ? 'status-active' :
                              ph.payment_status === 'PENDING' ? 'status-pending' :
                              ph.payment_status === 'FAILED' ? 'status-failed' :
                              ph.payment_status === 'COMPLIMENTARY' ? 'status-complimentary' : ''
                            }`} style={{
                              ...(ph.payment_status === 'COMPLETED' ? { background: '#d1fae5', color: '#059669' } :
                                  ph.payment_status === 'PENDING' ? { background: '#fef3c7', color: '#d97706' } :
                                  ph.payment_status === 'FAILED' ? { background: '#fee2e2', color: '#dc2626' } :
                                  ph.payment_status === 'COMPLIMENTARY' ? { background: '#ede9fe', color: '#7c3aed' } : {}),
                              padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                            }}>
                              {ph.payment_status}
                            </span>
                          </td>
                          <td>{new Date(ph.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Staff Tracking Tab */}
          <div className={`tab-content ${activeTab === 'staff-tracking' ? 'active' : ''}`}>
            <div className="section-card">
              <h3 className="section-title mb-4">
                <UsersIcon /> Staff Tracking
              </h3>
              <p className="text-muted mb-4">Staff members managed from the Staff page are shown here.</p>

              {staffLoading ? (
                <div className="text-muted" style={{ padding: '20px 0', textAlign: 'center' }}>
                  Loading staff...
                </div>
              ) : staffData.length === 0 ? (
                <div className="text-muted" style={{ padding: '20px 0', textAlign: 'center' }}>
                  No staff members found. Add staff from the Staff page.
                </div>
              ) : (
                <div className="row">
                  {staffData.map(staff => (
                    <div key={staff.staff_id} className="col-md-6 mb-3">
                      <div className="staff-card">
                        <div className="staff-avatar">
                          {getInitials(staff.first_name, staff.last_name)}
                        </div>
                        <div className="staff-details">
                          <div className="staff-name">{staff.first_name} {staff.last_name}</div>
                          <div className="staff-role">{staff.designation}</div>
                          <div className="text-muted small">{staff.email}</div>
                          {staff.phone && <div className="text-muted small">{staff.phone}</div>}
                          {staff.office && (
                            <div className="text-muted small">{staff.office.office_name}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-card">
              <h3 className="section-title">
                <ClipboardListIcon /> Staff Transaction Assignments
              </h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Date</th>
                      <th>Assigned Staff</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionData.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{transaction.date}</td>
                        <td>{getStaffName(transaction.staffId)}</td>
                        <td>
                          <span className={`status-badge ${transaction.status === 'Completed' ? 'status-active' : 'status-pending'}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary">
                            <EyeIcon /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Security Settings Tab */}
          <div className={`tab-content ${activeTab === 'security-settings' ? 'active' : ''}`}>
            <div className="section-card">
              <h3 className="section-title">
                <ShieldAltIcon /> Security Settings
              </h3>

              <div className="security-option">
                <div className="security-info">
                  <h5>Change Password</h5>
                  <p>Update your account password regularly to maintain security</p>
                </div>
                <button className="btn btn-outline-primary" onClick={() => openSubModal('changePassword')}>
                  <KeyIcon /> Change Password
                </button>
              </div>

              <div className="security-option">
                <div className="security-info">
                  <h5>Forgot Password</h5>
                  <p>Reset your password via email verification</p>
                </div>
                <button className="btn btn-outline-primary" onClick={async () => {
                  if (!client?.email) { showNotification('No email found', 'error'); return; }
                  try {
                    await forgotPassword(client.email);
                    showNotification('Password reset link has been sent to your email.', 'success');
                  } catch {
                    showNotification('Failed to send reset email.', 'error');
                  }
                }}>
                  <KeyIcon /> Reset Password
                </button>
              </div>

              <div className="security-option">
                <div className="security-info">
                  <h5>Two-Factor Authentication</h5>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => {
                      setTwoFactorEnabled(e.target.checked);
                      showNotification(
                        e.target.checked
                          ? 'Two-factor authentication enabled. Please check your email for setup instructions.'
                          : 'Two-factor authentication disabled.',
                        e.target.checked ? 'success' : 'info'
                      );
                    }}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="security-option">
                <div className="security-info">
                  <h5>Email Notifications</h5>
                  <p>Receive security alerts via email</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={emailNotificationsEnabled}
                    onChange={(e) => {
                      setEmailNotificationsEnabled(e.target.checked);
                      showNotification(
                        e.target.checked ? 'Email notifications enabled.' : 'Email notifications disabled.',
                        e.target.checked ? 'success' : 'info'
                      );
                    }}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="security-option">
                <div className="security-info">
                  <h5>Session Timeout</h5>
                  <p>Automatically log out after 30 minutes of inactivity</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={sessionTimeoutEnabled}
                    onChange={(e) => {
                      setSessionTimeoutEnabled(e.target.checked);
                      localStorage.setItem('session_timeout', String(e.target.checked));
                      showNotification(
                        e.target.checked ? 'Session timeout enabled (30 minutes).' : 'Session timeout disabled.',
                        e.target.checked ? 'success' : 'info'
                      );
                    }}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="section-card">
              <h3 className="section-title">
                <HistoryIcon /> Login History
              </h3>
              <div className="login-history">
                {loginHistoryLoading ? (
                  <div className="text-muted" style={{ padding: '16px' }}>Loading login history...</div>
                ) : loginHistory.length === 0 ? (
                  <div className="text-muted" style={{ padding: '16px' }}>No login history found</div>
                ) : (
                  loginHistory.map((entry) => (
                    <div className="login-history-item" key={entry.id}>
                      <div className="login-device">
                        <DesktopIcon />
                        <div>
                          <div>{entry.browser ? entry.browser.substring(0, 60) : entry.device || 'Unknown'}</div>
                          <div className="text-muted small">IP: {entry.ip_address || 'Unknown'}</div>
                        </div>
                      </div>
                      <div className="login-time">
                        {new Date(entry.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: 'numeric', minute: '2-digit', hour12: true,
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Navigation Buttons for Tabs */}
          <div className="tab-navigation-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px 30px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <button
              className="btn btn-outline-secondary"
              onClick={handlePrevTab}
              disabled={PROFILE_TABS.indexOf(activeTab) === 0}
              style={{ opacity: PROFILE_TABS.indexOf(activeTab) === 0 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNextTab}
              disabled={PROFILE_TABS.indexOf(activeTab) === PROFILE_TABS.length - 1}
              style={{ opacity: PROFILE_TABS.indexOf(activeTab) === PROFILE_TABS.length - 1 ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Billing Address Modal */}
      <div className={`modal ${modals.billingAddress ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Edit Billing Address</h4>
            <button className="modal-close" onClick={() => closeSubModal('billingAddress')}>&times;</button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input type="text" className="form-control" defaultValue="123 Main Street, Suite 100" required />
              </div>
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input type="text" className="form-control" defaultValue="New York" required />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input type="text" className="form-control" defaultValue="NY" required />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label className="form-label">ZIP Code</label>
                    <input type="text" className="form-control" defaultValue="10001" required />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input type="text" className="form-control" defaultValue="United States" required />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => closeSubModal('billingAddress')}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={() => { closeSubModal('billingAddress'); showNotification('Billing address updated successfully!', 'success'); }}>Save Changes</button>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      <div className={`modal ${modals.paymentMethod ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Add Payment Method</h4>
            <button className="modal-close" onClick={() => closeSubModal('paymentMethod')}>&times;</button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-group">
                <label className="form-label">Card Type</label>
                <select className="form-select" defaultValue="" required>
                  <option value="">Select Card Type</option>
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="discover">Discover</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cardholder Name</label>
                <input type="text" className="form-control" placeholder="John Smith" required />
              </div>
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input type="text" className="form-control" placeholder="1234 5678 9012 3456" required />
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input type="text" className="form-control" placeholder="MM/YY" required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input type="text" className="form-control" placeholder="123" required />
                  </div>
                </div>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="default-payment" />
                <label className="form-check-label" htmlFor="default-payment">
                  Set as default payment method
                </label>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => closeSubModal('paymentMethod')}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={() => { closeSubModal('paymentMethod'); showNotification('Payment method added successfully!', 'success'); }}>Save Payment Method</button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <div className={`modal ${modals.changePassword ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Change Password</h4>
            <button className="modal-close" onClick={() => closeSubModal('changePassword')}>&times;</button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control" name="currentPassword" value={formData.currentPassword} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" name="newPassword" value={formData.newPassword} onChange={handleInputChange} required />
                <div className="form-text">Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-control" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => closeSubModal('changePassword')}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleChangePassword}>Change Password</button>
          </div>
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      <div className={`modal ${modals.upgradePlan ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Upgrade Your Plan</h4>
            <button className="modal-close" onClick={() => closeSubModal('upgradePlan')}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <h5>Current Plan: Professional</h5>
              <p className="text-muted">$99/month</p>
            </div>
            <div className="mb-4">
              <h5>Available Upgrades:</h5>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6>Enterprise Plan</h6>
                      <p className="text-muted mb-0">$199/month</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { closeSubModal('upgradePlan'); showNotification('Plan upgraded to Enterprise successfully!', 'success'); }}>Select</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => closeSubModal('upgradePlan')}>Cancel</button>
          </div>
        </div>
      </div>

      {/* Downgrade Plan Modal */}
      <div className={`modal ${modals.downgradePlan ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Downgrade Your Plan</h4>
            <button className="modal-close" onClick={() => closeSubModal('downgradePlan')}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <h5>Current Plan: Professional</h5>
              <p className="text-muted">$99/month</p>
            </div>
            <div className="mb-4">
              <h5>Available Downgrades:</h5>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6>Basic Plan</h6>
                      <p className="text-muted mb-0">$49/month</p>
                    </div>
                    <button className="btn btn-warning" onClick={() => { closeSubModal('downgradePlan'); showNotification('Plan downgraded to Basic successfully!', 'info'); }}>Select</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => closeSubModal('downgradePlan')}>Cancel</button>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      <div className={`modal ${modals.cancelSubscription ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Cancel Subscription</h4>
            <button className="modal-close" onClick={() => closeSubModal('cancelSubscription')}>&times;</button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to cancel your subscription? You will continue to have access until end of your current billing period (Jan 15, 2026).</p>
            <div className="form-group">
              <label className="form-label">Reason for cancellation (optional)</label>
              <textarea className="form-control" rows={3} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => closeSubModal('cancelSubscription')}>Keep Subscription</button>
            <button type="button" className="btn btn-danger" onClick={() => { closeSubModal('cancelSubscription'); showNotification('Subscription cancelled. You will have access until Jan 15, 2026.', 'info'); }}>Cancel Subscription</button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          LICENSE Modal (Add / Edit)
      ═══════════════════════════════════════════════════════════ */}
      <div className={`modal ${showLicenseModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">{licenseForm.license_id ? 'Edit License' : 'Add License'}</h4>
            <button className="modal-close" onClick={closeLicenseModal}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">License Type *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dental Practice License"
                    value={licenseForm.license_type}
                    onChange={(e) => setLicenseForm((p) => ({ ...p, license_type: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">License Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. DL-2025-NY-12345"
                    value={licenseForm.license_number}
                    onChange={(e) => setLicenseForm((p) => ({ ...p, license_number: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NY"
                    value={licenseForm.state}
                    onChange={(e) => setLicenseForm((p) => ({ ...p, state: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={licenseForm.expiry_date}
                    onChange={(e) => setLicenseForm((p) => ({ ...p, expiry_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={licenseForm.status}
                    onChange={(e) => setLicenseForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeLicenseModal}>Cancel</button>
            <button className="btn btn-primary" onClick={saveLicense}>
              <SaveIcon /> {licenseForm.license_id ? 'Update License' : 'Save License'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SHIPPING Modal (Add / Edit)
      ═══════════════════════════════════════════════════════════ */}
      <div className={`modal ${showShippingModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">{shippingForm.shipping_id ? 'Edit Shipping Address' : 'Add Shipping Address'}</h4>
            <button className="modal-close" onClick={closeShippingModal}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Office Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Main Clinic"
                value={shippingForm.office_name}
                onChange={(e) => setShippingForm((p) => ({ ...p, office_name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Street Address *</label>
              <input
                type="text"
                className="form-control"
                placeholder="123 Main Street, Suite 100"
                value={shippingForm.address}
                onChange={(e) => setShippingForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="New York"
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm((p) => ({ ...p, city: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="NY"
                    value={shippingForm.state}
                    onChange={(e) => setShippingForm((p) => ({ ...p, state: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">ZIP Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="10001"
                    value={shippingForm.zip_code}
                    onChange={(e) => setShippingForm((p) => ({ ...p, zip_code: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+1 (555) 000-0000"
                    value={shippingForm.phone ?? ''}
                    onChange={(e) => setShippingForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Extension</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ext. 101"
                    value={shippingForm.extension ?? ''}
                    onChange={(e) => setShippingForm((p) => ({ ...p, extension: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeShippingModal}>Cancel</button>
            <button className="btn btn-primary" onClick={saveShipping}>
              <SaveIcon /> {shippingForm.shipping_id ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BILLING Modal (Add / Edit)
      ═══════════════════════════════════════════════════════════ */}
      <div className={`modal ${showBillingModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">{billingForm.billing_id ? 'Edit Billing Record' : 'Add Billing Record'}</h4>
            <button className="modal-close" onClick={closeBillingModal}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Billing Address *</label>
              <input
                type="text"
                className="form-control"
                placeholder="123 Main Street, Suite 100, New York, NY 10001"
                value={billingForm.billing_address}
                onChange={(e) => setBillingForm((p) => ({ ...p, billing_address: e.target.value }))}
              />
            </div>
            <hr style={{ margin: '16px 0', opacity: 0.2 }} />

            {billingForm.billing_id ? (
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>
                  <CreditCardIcon /> Saved Payment Method
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#1e293b' }}>
                    {billingForm.masked_card || billingForm.card_brand}
                  </span>
                  <span style={{ fontSize: 14, color: '#64748b' }}>
                    Expires {String(billingForm.expiry_month ?? '').padStart(2, '0')}/{billingForm.expiry_year}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                  To change your card, please delete this record and add a new one.
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Credit or Debit Card *</label>
                <Elements stripe={getStripe()}>
                  <StripeCardInput
                    onSuccess={(pmId, card) => {
                      setBillingForm(p => ({
                        ...p,
                        stripe_payment_method_id: pmId,
                        card_brand: card.brand,
                        last4: card.last4,
                        expiry_month: card.expMonth,
                        expiry_year: card.expYear
                      }));
                      // The actual save will happen when they click "Save Billing"
                      // to ensure address is also captured.
                      // But StripeCardInput has its own button? 
                      // Actually, let's make it work together.
                    }}
                  />
                </Elements>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                  Powered by Stripe. Your card data is encrypted and secure.
                </p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeBillingModal}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={saveBilling}
              disabled={!billingForm.billing_address || (!billingForm.billing_id && !billingForm.stripe_payment_method_id)}
            >
              <SaveIcon /> {billingForm.billing_id ? 'Update Address' : 'Complete Registration'}
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}