import { useSystemActivityStore } from "@/store/reducers/systemActivityStore";
import { useCallback } from "react";

export const useSystemActivity = () => {
    const { logs, loadingLogs, errorLogs, fetchLogs, logActivity } = useSystemActivityStore();

    const trackPageOpen = useCallback((pageName: string) => {
        logActivity({ action: `User opened ${pageName} page` });
    }, [logActivity]);

    const trackEditAction = useCallback((actionDesc: string, productName?: string, officeName?: string) => {
        logActivity({
            action: actionDesc,
            product: productName,
            office: officeName
        });
    }, [logActivity]);

    return {
        logs,
        loadingLogs,
        errorLogs,
        fetchLogs,
        logActivity,
        trackPageOpen,
        trackEditAction
    };
};
