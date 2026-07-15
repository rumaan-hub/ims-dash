"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/app/utils/auth";

export default function SystemAdminGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Auth gate: token is only readable client-side, and `router.push` is a
    // side effect that cannot run during render — so checking + setting auth
    // state in an effect is the correct pattern, not a lazy useState init.
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
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setIsAuthorized(true);
            } else {
                router.push("/");
            }
        } catch {
            router.push("/login");
        }
    }, [router]);

    if (!isAuthorized) return null;

    return <>{children}</>;
}
