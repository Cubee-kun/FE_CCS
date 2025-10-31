import { useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FiFileText, FiCalendar } from "react-icons/fi";

export default function LaporanPage() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const response = await api.get("/laporan");
        const data = response.data?.data || response.data;
        setLaporan(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
        // Jika endpoint tidak tersedia, set data kosong dan tampilkan pesan
        if (err.response?.status === 404 || err.response?.status === 405) {
          setError("Endpoint laporan belum tersedia di backend.");
        } else {
          setError("Gagal mengambil data laporan.");
        }
        setLaporan([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <LoadingSpinner />
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-green-800 flex items-center gap-2">
        <FiFileText className="text-green-600" /> Laporan Kegiatan
      </h1>

      {laporan.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-6 text-center">
          Tidak ada laporan tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {laporan.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 border border-gray-100 flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-2">
                <FiFileText className="text-2xl text-green-500" />
                <span className="font-semibold text-lg text-green-800">{item.judul}</span>
              </div>
              <p className="text-gray-600 mb-4 flex-1">{item.deskripsi}</p>
              <div className="flex items-center text-sm text-gray-400 mt-auto">
                <FiCalendar className="mr-1" />
                {item.tanggal
                  ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "-"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}