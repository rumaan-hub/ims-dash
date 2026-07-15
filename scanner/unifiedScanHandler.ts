/**
 * unifiedScanHandler.ts
 * Centralized scan event orchestration.
 *
 * This module does NOT contain business logic.
 * It provides a factory function to create a unified scan handler
 * that routes results from both CameraScanner and HardwareScanner
 * into a single application-level callback.
 *
 * Usage:
 *   const handler = createUnifiedHandler(handleScan);
 *   cameraScanner.start({ ..., onDetected: handler });
 *   hardwareScanner.start({ onDetected: handler });
 */

export interface UnifiedHandlerOptions {
    /** Application-level scan callback (from useInventory) */
    onScan: (value: string) => void;
    /** Debounce window in ms — prevents duplicate fires (default: 2000) */
    debounceMs?: number;
}

export function createUnifiedScanHandler(options: UnifiedHandlerOptions) {
    const { onScan, debounceMs = 2000 } = options;

    let lastValue = '';
    let lastTime = 0;

    return function unifiedHandler(value: string, format?: string): void {
        if (!value) return;

        const now = Date.now();

        // Debounce: skip if same value scanned within debounce window
        if (value === lastValue && now - lastTime < debounceMs) {
            console.log(`[UnifiedScanHandler] Debounced duplicate: ${value}`);
            return;
        }

        lastValue = value;
        lastTime = now;

        if (format) {
            console.log(`[UnifiedScanHandler] Accepted — Format: ${format} | Value: ${value}`);
        } else {
            console.log(`[UnifiedScanHandler] Accepted (hardware) — Value: ${value}`);
        }

        onScan(value);
    };
}
