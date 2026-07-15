/**
 * hardwareScanner.ts
 * Production-grade USB/hardware barcode scanner listener.
 * USB scanners act as HID keyboards — they type the barcode
 * and send Enter at the end. This module captures that input.
 *
 * Handles: Any format (USB scanner sends raw string)
 * Works on: Desktop, any environment
 */

export interface HardwareScannerOptions {
    /** Called with the complete scanned barcode string */
    onDetected: (value: string) => void;
    /** Minimum barcode length to be considered valid (default: 3) */
    minLength?: number;
    /**
     * Time in ms to wait for all characters before submitting.
     * USB scanners typically finish within 50ms. (default: 80)
     */
    timeout?: number;
}

export class HardwareScanner {
    private buffer = '';
    private timer: ReturnType<typeof setTimeout> | null = null;
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;
    private active = false;

    isActive(): boolean {
        return this.active;
    }

    start(options: HardwareScannerOptions): void {
        const { onDetected, minLength = 3, timeout = 80 } = options;

        // Prevent duplicate listeners
        if (this.active) {
            this.stop();
        }

        this.keyHandler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();

            // Ignore keypresses inside input/textarea fields
            // (so typing in the manual input box isn't captured)
            if (tag === 'input' || tag === 'textarea' || tag === 'select') {
                return;
            }

            if (e.key === 'Enter') {
                // Enter = end of barcode from USB scanner
                const value = this.buffer.trim();
                this.buffer = '';
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
                if (value.length >= minLength) {
                    console.log(`[HardwareScanner] Scanned: ${value}`);
                    onDetected(value);
                }
                return;
            }

            // Accumulate characters
            if (e.key.length === 1) {
                this.buffer += e.key;

                // Auto-submit if no Enter arrives within timeout
                if (this.timer) clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    const value = this.buffer.trim();
                    this.buffer = '';
                    if (value.length >= minLength) {
                        console.log(`[HardwareScanner] Timeout flush: ${value}`);
                        onDetected(value);
                    }
                }, timeout);
            }
        };

        document.addEventListener('keydown', this.keyHandler);
        this.active = true;
        console.log('[HardwareScanner] Listening for USB scanner input.');
    }

    stop(): void {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.buffer = '';
        this.active = false;
        console.log('[HardwareScanner] Stopped.');
    }
}
