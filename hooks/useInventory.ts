"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useInventoryStore, Product } from "@/store/reducers/inventoryStore";
import toast from "react-hot-toast";
import { CameraScanner } from "@/scanner/cameraScanner";
import { HardwareScanner } from "@/scanner/hardwareScanner";
import { createUnifiedScanHandler } from "@/scanner/unifiedScanHandler";
import { useSystemActivity } from "@/hooks/useSystemActivity";

interface User {
    id: number;
    name: string;
    role: 'Admin' | 'Client';
    email: string;
}

export type IMSStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELLED';

export const useInventoryPage = () => {
    const searchParams = useSearchParams();

    // Zustand Store
    const { trackEditAction } = useSystemActivity();
    const {
        products, offices, staff, allDbProducts,
        dropdownItems, dropdownTotalPages, dropdownIsLoading,
        loading, error,
        fetchProducts, fetchOffices, fetchStaff, fetchAllDbProducts,
        fetchDropdownItems,
        addProduct, updateProduct, deleteProduct,
        fetchCompleteProductById
    } = useInventoryStore();

    // Local State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [vendorFilter, setVendorFilter] = useState('');
    const [officeFilter, setOfficeFilter] = useState('');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Product | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMode, setScanMode] = useState<'in' | 'out'>('in');
    const scanModeRef = useRef<'in' | 'out'>('in');

    const [formData, setFormData] = useState<Partial<Product>>({
        type: 'Consumable',
        name: '',
        brand: '',
        batch: '',
        available: 0,
        used: 0,
        damaged: 0,
        repair: 0,
        status: 'Available',
        productId: '',
        office_id: '',
        destination_office_id: '',
        staff_id: '',
        transaction_type: 'IN',
        unit_price: 0,
        price: 0
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    // --- Production Scanner Refs ---
    const cameraScannerRef = useRef<CameraScanner | null>(null);
    const hardwareScannerRef = useRef<HardwareScanner | null>(null);
    const lastScannedCode = useRef<string>('');
    const lastScannedTime = useRef<number>(0);

    // Fetch products whenever officeFilter changes
    useEffect(() => {
        fetchProducts(officeFilter);
    }, [officeFilter, fetchProducts]);

    const handleLogin = () => {
        const u = "smile"; const p = "123";
        if (u === "smile" && p === "123") {
            setIsLoggedIn(true);
            setCurrentUser({ id: 1, name: "Admin User", role: "Admin", email: "admin@medistry99.com" });
        } else {
            toast.error("Wrong username or password");
        }
    };

    useEffect(() => {
        // Assume API-driven now
        fetchOffices();
        fetchStaff();
        fetchAllDbProducts();

        // Auto-login (keeping the client-side mock logic untouched)
        handleLogin();
        // initial-load only — fetchers from zustand store are stable references
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Derived Data
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesType = !typeFilter || p.type === typeFilter;
            const matchesVendor = !vendorFilter || (p.supplier && p.supplier.toLowerCase().includes(vendorFilter.toLowerCase()));
            return matchesSearch && matchesType && matchesVendor;
        });
    }, [products, searchTerm, typeFilter, vendorFilter]);

    const groupedProducts = useMemo(() => {
        return filteredProducts.reduce((acc, p) => {
            const key = `${p.name}|${p.type}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(p);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [filteredProducts]);

    const uniqueVendors = useMemo(() => {
        return [...new Set(products.map(p => p.supplier).filter(Boolean))];
    }, [products]);

    // Helpers
    const isLowStock = (product: Product) => product.available <= 10;
    const isNearExpiry = (product: Product) => {
        if (!product.expiry) return false;
        const today = new Date();
        const expiryDate = new Date(product.expiry);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    };
    const getFEFOItem = (items: Product[]) => {
        if (!items || items.length === 0) return null;
        const itemsWithExpiry = items.filter(item => item.expiry);
        if (itemsWithExpiry.length === 0) return items[0];
        return itemsWithExpiry.sort((a, b) => {
            if (!a.expiry) return 1;
            if (!b.expiry) return -1;
            return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
        })[0];
    };

    // Modal Operations
    const openAddModal = (item: Product | null = null) => {
        setEditingItem(item);
        setFormData(item ? { ...item } : {
            type: 'Consumable',
            name: '',
            brand: '',
            batch: '',
            available: 0,
            used: 0,
            damaged: 0,
            repair: 0,
            status: 'Available',
            productId: '',
            office_id: '',
            destination_office_id: '',
            staff_id: '',
            transaction_type: 'IN',
            unit_price: 0,
            price: 0,
            expiry: '',
            supplier: '',
            category: ''
        });
        setIsAddModalOpen(true);
    };

    const closeAllModals = () => {
        setIsAddModalOpen(false);
        setIsScannerModalOpen(false);
        setIsScanning(false);
        setEditingItem(null);
        stopScanner();
    };

    // Handle reorder query string — must be defined AFTER openAddModal so the
    // ref to it is already declared by the time the effect runs.
    const hasHandledQueryString = useRef(false);
    useEffect(() => {
        const action = searchParams?.get('action');
        const product = searchParams?.get('product');

        if (action === 'reorder' && product && !hasHandledQueryString.current) {
            hasHandledQueryString.current = true;
            // Short delay to ensure React commits state before we override it
            setTimeout(() => {
                openAddModal(null);
                setFormData(prev => ({
                    ...prev,
                    transaction_type: 'IN', // 'IN' means restock/receiving
                    productId: String(product)
                }));
            }, 100);
        }
    }, [searchParams]);

    // Auto-populate form when productId changes directly from Backend
    useEffect(() => {
        if (!formData.productId) return;

        let isMounted = true;
        const fetchFullProduct = async () => {
            try {
                // Fetch fully hydrated product via existing specific product endpoint
                const completeProduct = await fetchCompleteProductById(formData.productId as string);

                if (isMounted && completeProduct) {
                    setFormData(prev => {
                        // Backend can hand us either nested objects or plain strings — narrow both shapes.
                        const cp = completeProduct as typeof completeProduct & { categories?: Array<{ category?: { name?: string } }> };
                        const brand = cp.brand;
                        const brandValue =
                            typeof brand === 'string' ? brand : brand?.name;
                        const categoryValue =
                            cp.category || cp.categories?.[0]?.category?.name;
                        const material = cp.material;
                        const materialValue =
                            typeof material === 'string' ? material : material?.name;
                        const vendor = cp.vendor;
                        const vendorValue =
                            !vendor
                                ? cp.supplier
                                : typeof vendor === 'string'
                                    ? vendor
                                    : `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim();

                        return {
                            ...prev,
                            name: String(completeProduct.title || completeProduct.name || ''),
                            brand: brandValue ? String(brandValue) : '',
                            category: categoryValue ? String(categoryValue) : '',
                            size: String(completeProduct.size || completeProduct.packaging || ''),
                            material: materialValue ? String(materialValue) : '',
                            batch: String(completeProduct.batch || completeProduct.batch_no || ''),
                            expiry: completeProduct.expiry || completeProduct.expiry_date
                                ? String(completeProduct.expiry || completeProduct.expiry_date).split('T')[0]
                                : '',
                            supplier: vendorValue ? String(vendorValue) : '',
                            price: Number(prev.price || completeProduct.price || completeProduct.unit_price || 0),
                            unit_price: Number(prev.unit_price || completeProduct.price || completeProduct.unit_price || 0),
                            available: Number(prev.available ?? (completeProduct.quantity ?? 0))
                        };
                    });
                }
            } catch (error) {
                console.warn("Failed to fetch complete product data", error);
            }
        };

        fetchFullProduct();

        return () => { isMounted = false; };
        // fetchCompleteProductById from zustand store is a stable reference
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.productId, allDbProducts]);

    const handleScan = async (code: string) => {
        if (!code) return;

        // ── Step 1: Normalize input ──────────────────────────────────
        // Remove hidden chars from USB scanners, trim whitespace
        const rawInput = code;
        code = code.replace(/[\r\n\t]/g, '').trim();
        console.log('[handleScan] Raw input:', JSON.stringify(rawInput), '→ Normalized:', code);

        if (!code) return;

        // Debounce: ignore if same code scanned in last 3 seconds.
        // handleScan is a runtime callback (fires on scan events, not during render),
        // so Date.now() here is safe.
        const now = Date.now();
        if (code === lastScannedCode.current && (now - lastScannedTime.current < 3000)) {
            return;
        }

        lastScannedCode.current = code;
        lastScannedTime.current = now;

        // ── Step 2: Extract ID from URL if scanned code is a link ────
        let searchCode = code;
        try {
            if (code.startsWith('http://') || code.startsWith('https://')) {
                const url = new URL(code);
                const pathParts = url.pathname.split('/').filter(Boolean);
                const productIndex = pathParts.findIndex(p => p === 'product' || p === 'products');
                if (productIndex !== -1 && pathParts[productIndex + 1]) {
                    searchCode = pathParts[productIndex + 1];
                } else {
                    searchCode = pathParts[pathParts.length - 1] || code;
                }
                console.log('[handleScan] Extracted Product ID from URL:', searchCode);
            }
        } catch {
            // Not a valid URL, use normalized code
        }

        const searchUpper = searchCode.toUpperCase();
        const codeUpper = code.toUpperCase();

        // ── Step 3: Match product ────────────────────────────────────
        // Search: product.id, product.title, AND variant.sku / variant.barCode
        const matched = allDbProducts.find(p => {
            // Match by product ID
            if (String(p.id) === searchCode || String(p.id) === code) return true;
            // Match by product title (case-insensitive)
            if (p.title && p.title.toUpperCase() === searchUpper) return true;
            // Match by product-level sku/barCode (if they exist)
            if (p.sku && String(p.sku).toUpperCase() === searchUpper) return true;
            if (p.barCode && (String(p.barCode).toUpperCase() === searchUpper || String(p.barCode).toUpperCase() === codeUpper)) return true;
            // Match by VARIANT sku or barCode (this is where SKUs actually live in the DB)
            if (p.variants && Array.isArray(p.variants)) {
                return p.variants.some((v: { sku?: string; barCode?: string }) =>
                    (v.sku && String(v.sku).toUpperCase() === searchUpper) ||
                    (v.sku && String(v.sku).toUpperCase() === codeUpper) ||
                    (v.barCode && String(v.barCode).toUpperCase() === searchUpper) ||
                    (v.barCode && String(v.barCode).toUpperCase() === codeUpper)
                );
            }
            // Partial ID match fallback
            if (searchCode.length > 8 && String(p.id).includes(searchCode)) return true;
            return false;
        });

        if (matched) {
            // Use ref to get the LATEST scan mode (avoids stale closure)
            const currentMode = scanModeRef.current;
            const txType = currentMode === 'in' ? 'IN' : 'OUT';

            // Fully reset formData with fresh values
            setFormData({
                transaction_type: txType,
                productId: String(matched.id),
                type: (matched.inventoryType === 'EQUIPMENT' || matched.inventoryType === 'Equipment') ? 'Equipment' : 'Consumable',
                // Explicitly clear manual inputs as per requirements
                available: 0,
                office_id: '',
                staff_id: '',
                price: 0,
                unit_price: 0,
                room: '',
                status: 'Available'
            });

            // Close scanner and open form
            setIsScannerModalOpen(false);
            setIsScanning(false);
            stopScanner();
            setIsAddModalOpen(true);

            toast.success(`Scanned: ${matched.title || matched.name}`);
        } else {
            // Show the user exactly what was detected so they can verify it against their DB
            toast.error(`Detected [${code}], but no matching Product found in Database.`);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // If type changes, clear the product selection to keep filtering consistent
        if (name === 'type') {
            setFormData(prev => ({
                ...prev,
                type: value as 'Consumable' | 'Equipment',
                productId: '',
                name: ''
            }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate manual and required fields
        if (!formData.productId || !formData.staff_id || !formData.office_id || !formData.available || Number(formData.available) <= 0) {
            toast.error("Product, Staff, Office, and a Quantity > 0 are strictly required.");
            return;
        }

        // Custom vs catalog is decided by the SELECTED item's source (robust across
        // picker-select, scan, and edit) — not just the type dropdown. For a custom item
        // the selected id (formData.productId) is its customProductId.
        const selectedItem = allDbProducts.find((p) => String(p.id) === String(formData.productId));
        const isCustom = selectedItem?.source === 'custom' || !!selectedItem?.customProductId || formData.type === 'Custom Products';
        const payload: Record<string, unknown> = {
            transaction_type: formData.transaction_type || 'IN',
            staff_id: formData.staff_id,
            office_id: formData.office_id,
            destination_office_id: formData.transaction_type === 'TRANSFER' ? formData.destination_office_id : undefined,
            ...(isCustom
                ? { customProductId: formData.productId }
                : { productId: formData.productId }),
            brand: formData.brand || undefined,
            quantity: Number(formData.available || 0),
            batch_no: formData.batch || undefined,
            expiry_date: (formData.expiry && !isNaN(new Date(formData.expiry).getTime()))
                ? new Date(formData.expiry).toISOString()
                : undefined,
            unit_price: Number(formData.price || formData.unit_price || 0),
            room_number: formData.room || undefined,
            status: (['ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED'].includes(formData.status || '')
                ? formData.status
                : 'ACTIVE') as IMSStatus,
            productName: formData.name || undefined,
            productType: formData.type || undefined,
            supplier: formData.supplier || undefined,
            size: formData.size || undefined,
            category: formData.category || undefined,
        };

        try {
            const isVirtual = editingItem?.id && String(editingItem.id).startsWith('virtual-');

            // Explicitly force ANY logical deductions or transfers to create a new ledger row instead of editing the past 'IN' record
            const isNewLedgerEntry = ['OUT', 'TRANSFER', 'ADJUSTMENT'].includes(formData.transaction_type || '');

            if (editingItem && editingItem.id && !isVirtual && !isNewLedgerEntry) {
                await updateProduct(editingItem.id, payload);
                trackEditAction("Product updated", formData.name || undefined, offices.find(o => o.office_id === formData.office_id)?.office_name);
                toast.success("Item updated successfully");
            } else {
                await addProduct(payload);
                trackEditAction("Inventory quantity adjusted", formData.name || undefined, offices.find(o => o.office_id === formData.office_id)?.office_name);
                toast.success("Item added successfully");
            }
            await fetchProducts(officeFilter); // Refresh list
            closeAllModals();
        } catch {
            toast.error("Failed to save item");
        }
    };

    const handleDeleteItem = async (item: Product) => {
        // A custom item is identified by its customProductId (its productId is null).
        const isCustom = item?.source === 'custom' || !!item?.customProductId;

        // Net stock for this card's group (same key the grid groups by).
        const group = groupedProducts[`${item.name}|${item.type}`];
        const netTotal = group ? group.reduce((acc, it) => {
            const txType = (it.transaction_type || 'IN').toUpperCase();
            const qty = Number(it.available) || 0;
            if (txType === 'IN') return acc + qty;
            if (txType === 'OUT' || txType === 'TRANSFER' || txType === 'ADJUSTMENT') return acc - qty;
            return acc + qty;
        }, 0) : 0;

        if (netTotal > 0) {
            toast.error("Cannot delete product until stock is 0");
            return;
        }

        if (confirm("Delete this product from inventory permanently?")) {
            try {
                if (isCustom) {
                    // Soft-delete the INVENTORY presence only (Inventory.status=INACTIVE) — the catalog
                    // product stays active, so it remains in the "Custom Products" picker and is re-stockable.
                    // Backend blocks if net stock > 0.
                    await deleteProduct(String(item.customProductId) + '?type=customProduct');
                } else {
                    await deleteProduct(String(item.productId) + '?type=product');
                }
                // Only reached on a real 2xx — toast is NOT optimistic.
                toast.success("Product deleted successfully");
                await fetchProducts(officeFilter);
                await fetchAllDbProducts();
            } catch (err: unknown) {
                const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete product";
                toast.error(message);
            }
        }
    };

    // ─── Scanner layer ─────────────────────────────────────────────
    // All scan results (camera OR hardware) flow through handleScan.

    const stopScanner = async () => {
        // Stop camera scanner
        if (cameraScannerRef.current) {
            await cameraScannerRef.current.stop();
            cameraScannerRef.current = null;
        }
        // Stop hardware (USB) scanner listener
        if (hardwareScannerRef.current) {
            hardwareScannerRef.current.stop();
            hardwareScannerRef.current = null;
        }
        // Clear leftover video stream (fallback)
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    };

    const startScanner = async (mode: 'in' | 'out' = 'in') => {
        const txType = mode === 'in' ? 'IN' : 'OUT';
        setScanMode(mode);
        scanModeRef.current = mode;

        // Fully reset form to prevent state leaking between scans
        setFormData({
            type: 'Consumable',
            name: '',
            brand: '',
            batch: '',
            available: 0,
            used: 0,
            damaged: 0,
            repair: 0,
            status: 'Available',
            productId: '',
            office_id: '',
            destination_office_id: '',
            staff_id: '',
            transaction_type: txType,
            unit_price: 0,
            price: 0
        });

        // Stop any running scanner before starting new one
        await stopScanner();

        setIsScannerModalOpen(true);
        setIsScanning(true);

        // ── Unified handler (debounced, routes both camera & hardware) ──
        const unified = createUnifiedScanHandler({
            onScan: handleScan,   // unchanged Scan In / Scan Out flow
            debounceMs: 2000
        });

        // ── 1. Hardware (USB) scanner listener ──────────────────────
        // Works on desktop immediately — no permissions needed
        hardwareScannerRef.current = new HardwareScanner();
        hardwareScannerRef.current.start({
            onDetected: (value) => unified(value),
            minLength: 3,
            timeout: 80
        });

        // ── 2. Camera scanner (mobile / desktop webcam) ─────────────
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('Camera unavailable — hardware scanner still active.');
            return;
        }

        // Short delay so the modal renders and #html5qr-scanner-anchor mounts
        await new Promise(resolve => setTimeout(resolve, 350));

        cameraScannerRef.current = new CameraScanner();
        await cameraScannerRef.current.start({
            containerId: 'html5qr-scanner-anchor',
            onDetected: (value, format) => unified(value, format),
            onError: (err) => {
                console.warn('[Camera] Startup error:', err.message);
                toast.error(`Camera error: ${err.message}`);
                setIsScanning(false);
            }
        });

        toast.success('Scanner Ready — Camera + USB scanner active');
    };

    return {
        isLoggedIn, currentUser, handleLogin,
        loading, error,
        searchTerm, setSearchTerm,
        typeFilter, setTypeFilter,
        vendorFilter, setVendorFilter,
        officeFilter, setOfficeFilter,
        isAddModalOpen, openAddModal,
        isScannerModalOpen, startScanner, closeAllModals,
        editingItem, isScanning, scanMode, setScanMode,
        formData, handleFormChange, handleFormSubmit, setFormData,
        videoRef, handleScan,
        groupedProducts, uniqueVendors, offices, staff, allDbProducts,
        dropdownItems, dropdownTotalPages, dropdownIsLoading, fetchDropdownItems,
        isLowStock, isNearExpiry, getFEFOItem,
        handleDeleteItem, fetchProducts, fetchAllDbProducts
    };
};