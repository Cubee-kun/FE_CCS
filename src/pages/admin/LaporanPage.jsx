import { useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function LaporanPage() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const response = await api.get("/laporan");
        setLaporan(response.data);
      } catch (err) {
        setError("Gagal mengambil data laporan.");
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-6">Laporan</h1>

      {laporan.length === 0 ? (
        <p>Tidak ada laporan tersedia.</p>
      ) : (
        <ul className="list-disc pl-5 space-y-2">
          {laporan.map((item) => (
            <li key={item.id} className="border-b border-gray-200 pb-2">
              <p className="font-semibold">{item.judul}</p>
              <p className="text-sm text-gray-600">{item.deskripsi}</p>
              <p className="text-xs text-gray-400">Tanggal: {new Date(item.tanggal).toLocaleDateString("id-ID")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
