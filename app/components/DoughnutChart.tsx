"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface DoughnutChartProps {
    labels: string[];
    data: number[];
    colors: string[];
}

export default function DoughnutChart({ labels, data, colors }: DoughnutChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();

        chartRef.current = new Chart(canvasRef.current, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { padding: 16, usePointStyle: true },
                    },
                },
            },
        });

        return () => { chartRef.current?.destroy(); };
    }, [labels, data, colors]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}
