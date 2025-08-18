// src/pages/Verifikasi.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import { toast } from "react-toastify";

export default function Verifikasi() {
  const [scanResult, setScanResult] = useState(null);
  const devices = useDevices(); // untuk dapatkan device list
  const [deviceId, setDeviceId] = useState();
  const navigate = useNavigate();

  const handleScan = (detected) => {
    if (detected?.length > 0 && detected[0].rawValue) {
      const data = detected[0].rawValue;
      setScanResult(data);
      toast.success("QR Code berhasil dipindai!");
      setTimeout(() => navigate("/dashboard"), 1500);
    }
  };

  const handleError = (error) => {
    console.error("QR Scan Error:", error);
    toast.error("Gagal membuka kamera!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-4">
          Verifikasi QR Code
        </h1>

        {/* Pilih kamera device jika tersedia */}
        {devices && (
          <select
            className="mb-4 w-full py-2 rounded-lg border border-gray-300 dark:border-gray-700"
            onChange={(e) => setDeviceId(e.target.value)}
            value={deviceId}
          >
            <option value="">Pilih kamera</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || d.deviceId}
              </option>
            ))}
          </select>
        )}

        {/* Scanner */}
        <div className="rounded-xl overflow-hidden border-4 border-green-500 shadow-md">
          <Scanner
            onDecode={handleScan}
            onError={handleError}
            constraints={{ deviceId: deviceId }}
            classNames={{ /* opsional styling */ }}
          />
        </div>

        {/* Hasil scan */}
        <div className="mt-4">
          {scanResult ? (
            <p className="text-green-800 dark:text-green-200">
              Hasil: <strong>{scanResult}</strong>
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Belum discan</p>
          )}
        </div>
      </div>
    </div>
  );
}
