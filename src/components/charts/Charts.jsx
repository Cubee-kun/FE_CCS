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
  const chartData = {
    labels: data.length > 0 ? data.map((item) => item.label) : ["No Data"],
    datasets: [
      {
        data: data.length > 0 ? data.map((item) => item.value) : [1],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(5, 150, 105, 0.8)",
          "rgba(4, 120, 87, 0.8)",
          "rgba(6, 95, 70, 0.8)",
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(5, 150, 105, 1)",
          "rgba(4, 120, 87, 1)",
          "rgba(6, 95, 70, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      {data.length > 0 ? (
        <Pie data={chartData} options={options} />
      ) : (
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tidak ada data
          </p>
        </div>
      )}
    </div>
  );
}

export function BarChart({ data = [] }) {
  const chartData = {
    labels: data.length > 0 ? data.map((item) => item.label) : ["No Data"],
    datasets: [
      {
        label: "Progress",
        data: data.length > 0 ? data.map((item) => item.value) : [0],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      {data.length > 0 ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tidak ada data
          </p>
        </div>
      )}
    </div>
  );
}