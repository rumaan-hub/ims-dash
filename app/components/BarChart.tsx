"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface BarChartProps {
    labels: string[];
    data: number[];
    colors: string[];
}

export default function BarChart({ labels, data, colors }: BarChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();

        chartRef.current = new Chart(canvasRef.current, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Count",
                    data,
                    backgroundColor: colors,
                    borderRadius: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                },
            },
        });

        return () => { chartRef.current?.destroy(); };
    }, [labels, data, colors]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}
