"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import { getToken } from "@/app/utils/auth";
import type { PermissionString } from "@/hooks/usePermissions";

const ROUTE_PERMISSIONS: Record<string, PermissionString> = {
    "/inventory": "inventory.view",
    "/purchase": "purchase.view",
    "/transfer": "transfer.create",
    "/offices": "office.manage",
    "/staff": "staff.view",
    "/ledger": "ledger.view",
    "/roles": "roles.view",
};

export default function RouteGuard({ children }: { children: ReactNode }) {
    const { hasPermission, loading } = usePermissions();
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Auth gate: token is client-only and `router.push` is a side effect, so
    // this MUST run in an effect rather than during render.
    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (
                payload.is_system_admin === true ||
                payload.role === "SYSTEM_ADMIN" ||
                payload.role === "SUPER_ADMIN"
            ) {
                router.push("/system-admin/home");
                return;
            }
        } catch {
            router.push("/login");
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsAuthorized(true);
    }, [router]);

    useEffect(() => {
        if (!isAuthorized || loading) return;

        const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
            pathname.startsWith(route)
        )?.[1];

        if (requiredPermission && !hasPermission(requiredPermission)) {
            router.replace("/");
        }
    }, [pathname, loading, hasPermission, router, isAuthorized]);

    if (!isAuthorized || loading) return null;

    return <>{children}</>;
}
