import { useState, useEffect } from 'react';
import { apiCallManager } from '@/_api_/apiCallManager';
import { clearAuth } from '@/app/utils/auth';

// Define the shape of our permission strings
export type PermissionString =
    | 'inventory.view'
    | 'inventory.create'
    | 'inventory.edit'
    | 'inventory.delete'
    | 'purchase.view'
    | 'purchase.create'
    | 'transfer.create'
    | 'office.manage'
    | 'staff.view'
    | 'staff.manage'
    | 'ledger.view'
    | 'roles.view'
    | 'roles.manage';

export function usePermissions() {
    const [permissions, setPermissions] = useState<PermissionString[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real application, you would fetch these from your backend API
        // using the user's JWT token, e.g., an endpoint: /api/ims/permissions/my-permissions
        // For now, we mock fetching the dynamic roles for the currently logged-in user.

        const fetchPermissions = async () => {
            try {
                const data = await apiCallManager.getMyPermissions();
                if (Array.isArray(data)) {
                    setPermissions(data as PermissionString[]);
                }
            } catch (error) {
                console.error("Failed to load permissions", error);
                // If it fails, we assume the token is invalid/expired
                clearAuth();
                window.location.href = "/login";
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    /**
     * Helper function to check if the current user has a specific permission
     */
    const hasPermission = (permission: PermissionString) => {
        return permissions.includes(permission);
    };

    /**
     * Helper function to check if the current user has ANY of the provided permissions
     */
    const hasAnyPermission = (requiredPermissions: PermissionString[]) => {
        return requiredPermissions.some(p => permissions.includes(p));
    };

    return { permissions, hasPermission, hasAnyPermission, loading };
}
