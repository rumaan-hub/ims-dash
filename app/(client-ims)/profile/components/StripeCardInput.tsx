"use client";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

interface StripeCardInputProps {
    onSuccess: (paymentMethodId: string, cardInfo: { brand: string; last4: string; expMonth: number; expYear: number }) => void;
}

export default function StripeCardInput({ onSuccess }: StripeCardInputProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.MouseEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
        });

        if (error) {
            setError(error.message || "An error occurred");
            setProcessing(false);
        } else if (paymentMethod) {
            onSuccess(paymentMethod.id, {
                brand: paymentMethod.card?.brand || "",
                last4: paymentMethod.card?.last4 || "",
                expMonth: paymentMethod.card?.exp_month || 0,
                expYear: paymentMethod.card?.exp_year || 0,
            });
            setProcessing(false);
        }
    };

    return (
        <div className="stripe-input-container">
            <div
                className="form-control"
                style={{
                    padding: '12px',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                }}
            >
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '14px',
                                color: '#1e293b',
                                '::placeholder': {
                                    color: '#94a3b8',
                                },
                            },
                            invalid: {
                                color: '#ef4444',
                            },
                        },
                    }}
                />
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{error}</div>}

            <div style={{ marginTop: '16px' }}>
                <button
                    className="btn btn-primary w-100"
                    onClick={handleSubmit}
                    disabled={!stripe || processing}
                >
                    {processing ? "Verifying..." : "Confirm & Save Card"}
                </button>
            </div>
        </div>
    );
}
