import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  LinearScale,
  BarElement
);

export function PieChart({ data = [] }) {
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item) => item.color),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Jenis Kegiatan",
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}

export function BarChart({ data = [] }) {
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: "Progress",
        data: data.map((item) => item.value),
        backgroundColor: data.map((item) => item.color),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Progress Bulan Ini",
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}