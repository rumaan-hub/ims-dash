"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface LineChartProps {
    labels: string[];
    data: number[];
}

export default function LineChart({ labels, data }: LineChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasRef.current.height);
        gradient.addColorStop(0, "rgba(37, 99, 235, 0.15)");
        gradient.addColorStop(1, "rgba(37, 99, 235, 0)");

        chartRef.current = new Chart(canvasRef.current, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    data,
                    borderColor: "#2563eb",
                    backgroundColor: gradient,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: "#2563eb",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `$${(ctx.parsed.y ?? 0).toFixed(2)}`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { color: "#f1f5f9" },
                        ticks: { color: "#9ca3af", font: { size: 11 } },
                    },
                    y: {
                        grid: { color: "#f1f5f9" },
                        ticks: {
                            color: "#9ca3af",
                            font: { size: 11 },
                            callback: (value) => `$${value}`,
                        },
                        beginAtZero: true,
                    },
                },
            },
        });

        return () => { chartRef.current?.destroy(); };
    }, [labels, data]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}
