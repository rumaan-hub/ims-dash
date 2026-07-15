/**
 * cameraScanner.ts
 * Production-grade camera scanner module using html5-qrcode.
 * Handles: QR, Code128, Code39, EAN-13, EAN-8, UPC-A, UPC-E
 * Supports: Mobile (back camera), HTTPS secure context
 */

import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export interface CameraScannerOptions {
    /** ID of the visible DOM element to render the video feed into */
    containerId: string;
    /** Called with every successfully decoded barcode value */
    onDetected: (value: string, format: string) => void;
    /** Optional error handler for camera failures */
    onError?: (error: Error) => void;
}

const SUPPORTED_FORMATS = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
];

export class CameraScanner {
    private instance: Html5Qrcode | null = null;
    private running = false;

    isRunning(): boolean {
        return this.running;
    }

    async start(options: CameraScannerOptions): Promise<void> {
        const { containerId, onDetected, onError } = options;

        // Prevent duplicate instances
        if (this.running) {
            await this.stop();
        }

        try {
            this.instance = new Html5Qrcode(containerId, {
                formatsToSupport: SUPPORTED_FORMATS,
                verbose: false,
            });

            await this.instance.start(
                { facingMode: 'environment' }, // Back camera on mobile
                {
                    fps: 15,                          // 15 frames/sec — performant without being heavy
                    qrbox: { width: 280, height: 180 }, // Wide box to capture long Code 128
                    aspectRatio: 1.333,               // 4:3 ratio
                    disableFlip: false,               // Allow mirrored codes
                },
                (decodedText, decodedResult) => {
                    const format =
                        decodedResult?.result?.format?.formatName ?? 'UNKNOWN';
                    console.log(`[CameraScanner] Format: ${format} | Value: ${decodedText}`);
                    onDetected(decodedText, format);
                },
                () => {
                    // Per-frame decode error — silent (normal during search)
                }
            );

            this.running = true;
        } catch (err: unknown) {
            this.running = false;
            this.instance = null;
            const error = err instanceof Error ? err : new Error(String(err));
            console.error('[CameraScanner] Failed to start:', error.message);
            if (onError) onError(error);
        }
    }

    async stop(): Promise<void> {
        if (this.instance) {
            try {
                if (this.running) {
                    await this.instance.stop();
                }
            } catch {
                // Ignore — instance may already be stopped
            } finally {
                this.instance = null;
                this.running = false;
            }
        }
    }
}
