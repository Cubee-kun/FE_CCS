import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function PieChart({ data = [] }) {
  // ✅ FIXED: Validate and transform data
  console.log("[PieChart] Input data:", data);

  let validData = [];
  if (Array.isArray(data) && data.length > 0) {
    validData = data.filter(
      (item) => item && typeof item.value === "number" && item.value > 0
    );
  }

  // ✅ Fallback data jika kosong
  if (validData.length === 0) {
    validData = [{ label: "Belum ada data", value: 1 }];
  }

  console.log("[PieChart] Valid data:", validData);

  const chartData = {
    labels: validData.map((item) => item.label || "Unknown"),
    datasets: [
      {
        data: validData.map((item) => item.value || 0),
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)", // emerald-500
          "rgba(5, 150, 105, 0.8)", // emerald-600
          "rgba(4, 120, 87, 0.8)", // emerald-700
          "rgba(6, 95, 70, 0.8)", // emerald-800
          "rgba(20, 184, 166, 0.8)", // teal-500
          "rgba(15, 118, 110, 0.8)", // teal-600
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(5, 150, 105, 1)",
          "rgba(4, 120, 87, 1)",
          "rgba(6, 95, 70, 1)",
          "rgba(20, 184, 166, 1)",
          "rgba(15, 118, 110, 1)",
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      {validData.length > 0 && validData[0].label !== "Belum ada data" ? (
        <Pie data={chartData} options={options} />
      ) : (
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            Belum ada data kegiatan
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Data akan muncul setelah ada perencanaan kegiatan
          </p>
        </div>
      )}
    </div>
  );
}

export function BarChart({ data = [] }) {
  // ✅ FIXED: Validate and transform data
  console.log("[BarChart] Input data:", data);

  let validData = [];
  if (Array.isArray(data) && data.length > 0) {
    validData = data.filter((item) => item && item.label);
    // Ensure all values are numbers
    validData = validData.map((item) => ({
      ...item,
      value: Number(item.value) || 0,
    }));
  }

  // ✅ Fallback data jika kosong
  if (validData.length === 0) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    validData = months.map((month) => ({ label: month, value: 0 }));
  }

  console.log("[BarChart] Valid data:", validData);

  const chartData = {
    labels: validData.map((item) => item.label),
    datasets: [
      {
        label: "Aktivitas",
        data: validData.map((item) => item.value),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: "rgba(16, 185, 129, 0.9)",
        hoverBorderColor: "rgba(16, 185, 129, 1)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw} kegiatan`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          lineWidth: 1,
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            weight: "bold",
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      {validData.some((item) => item.value > 0) ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div className="text-center">
          <div className="text-6xl mb-4">📈</div>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            Belum ada progress bulan ini
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Grafik akan muncul setelah ada aktivitas
          </p>
        </div>
      )}
    </div>
  );
}