import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiBarChart2, FiRefreshCw, FiX } from "react-icons/fi";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const toArray = (payload) => payload?.data || payload || [];

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const mean = (arr) => {
  if (!arr.length) return null;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

const formatDateId = (dateLike) => {
  if (!dateLike) return "-";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const leafConditionScore = (monitoring) => {
  const scoreMap = {
    "<25%": 0,
    "25-45%": 1,
    "25-45": 1,
    "25 - 45%": 1,
    "50-74%": 2,
    "50-74": 2,
    "50 - 74%": 2,
    ">75%": 3,
    ">75": 3,
  };

  const fields = [
    monitoring?.daun_mengering,
    monitoring?.daun_layu,
    monitoring?.daun_menguning,
    monitoring?.bercak_daun,
    monitoring?.daun_serangga,
  ];

  const scores = fields
    .map((value) => String(value || "").replace("–", "-").trim())
    .map((value) => scoreMap[value])
    .filter((value) => value !== undefined);

  return scores.length ? mean(scores) : null;
};

const getHealthLabel = (scores) => {
  const avg = mean(scores.filter((value) => value !== null));
  if (avg === null) return "Data kesehatan belum tersedia";
  if (avg <= 0.5) return "Sangat Baik";
  if (avg <= 1.5) return "Baik";
  if (avg <= 2.3) return "Perlu Perhatian";
  return "Kurang Sehat";
};

const getMonitoringListFromAnyShape = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const getHeightValue = (monitoring) => {
  return (
    parseNumber(monitoring?.tinggi_bibit) ??
    parseNumber(monitoring?.tinggi_tanaman) ??
    parseNumber(monitoring?.tinggi) ??
    parseNumber(monitoring?.height_cm) ??
    parseNumber(monitoring?.height)
  );
};

const formatGeoTagging = (lat, long) => {
  const latNum = parseNumber(lat);
  const longNum = parseNumber(long);

  if (latNum === null || longNum === null) {
    return null;
  }

  return `${latNum.toFixed(6)}, ${longNum.toFixed(6)}`;
};

const mergeUniqueById = (items) => {
  const map = new Map();
  items.forEach((item, index) => {
    const key = item?.id ? `id-${item.id}` : `idx-${index}`;
    if (!map.has(key)) map.set(key, item);
  });
  return [...map.values()];
};

const resolveMonitoringDate = (monitoring) => {
  if (!monitoring) return null;

  const candidates = [
    monitoring?.tanggal_monitoring,
    monitoring?.monitoring_date,
    monitoring?.tanggal,
    monitoring?.created_at,
    monitoring?.updated_at,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) {
      return candidate;
    }
  }

  return null;
};

export default function EvaluasiPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perencanaanList, setPerencanaanList] = useState([]);
  const [implementasiList, setImplementasiList] = useState([]);
  const [monitoringList, setMonitoringList] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const fetchEvaluasiData = async () => {
    setLoading(true);
    setError(null);

    try {
      const perencanaanEndpoint = user?.role === "admin" ? "/perencanaan/all" : "/perencanaan";

      const [perencanaanRes, implementasiRes, monitoringRes] = await Promise.allSettled([
        api.get(perencanaanEndpoint),
        api.get("/implementasi"),
        api.get("/monitoring"),
      ]);

      const perencanaanData =
        perencanaanRes.status === "fulfilled" ? toArray(perencanaanRes.value.data) : [];
      const implementasiData =
        implementasiRes.status === "fulfilled" ? toArray(implementasiRes.value.data) : [];
      const monitoringData =
        monitoringRes.status === "fulfilled" ? toArray(monitoringRes.value.data) : [];

      setPerencanaanList(Array.isArray(perencanaanData) ? perencanaanData : []);
      setImplementasiList(Array.isArray(implementasiData) ? implementasiData : []);
      setMonitoringList(Array.isArray(monitoringData) ? monitoringData : []);
    } catch {
      setError("Gagal memuat data evaluasi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluasiData();
  }, [user?.role]);

  const companyReports = useMemo(() => {
    const implementasiByPerencanaan = new Map();
    implementasiList.forEach((item) => {
      if (item?.perencanaan_id) {
        implementasiByPerencanaan.set(String(item.perencanaan_id), item);
      }
    });

    const monitoringByImplementasi = new Map();
    monitoringList.forEach((item) => {
      if (item?.implementasi_id) {
        const key = String(item.implementasi_id);
        const current = monitoringByImplementasi.get(key) || [];
        current.push(item);
        monitoringByImplementasi.set(key, current);
      }
    });

    return perencanaanList.map((perencanaan) => {
      const perencanaanId = String(perencanaan?.id || "");
      const implementasiFromRelation = perencanaan?.implementasi || null;
      const implementasiFromEndpoint = implementasiByPerencanaan.get(perencanaanId) || null;
      const implementasi = implementasiFromRelation || implementasiFromEndpoint;

      const geoTaggingText =
        implementasi?.geotagging ||
        formatGeoTagging(implementasi?.lat, implementasi?.long) ||
        formatGeoTagging(perencanaan?.lat, perencanaan?.long) ||
        "-";

      const monitoringFromPerencanaan = getMonitoringListFromAnyShape(perencanaan?.monitoring);
      const monitoringFromImplementasiRelation = getMonitoringListFromAnyShape(implementasi?.monitoring);
      const monitoringFromEndpoint = implementasi?.id
        ? monitoringByImplementasi.get(String(implementasi.id)) || []
        : [];

      const monitoringItems = mergeUniqueById([
        ...monitoringFromPerencanaan,
        ...monitoringFromImplementasiRelation,
        ...monitoringFromEndpoint,
      ]);

      const survivalValues = monitoringItems
        .map((item) => parseNumber(item?.survival_rate))
        .filter((value) => value !== null);

      const diameterValues = monitoringItems
        .map((item) => parseNumber(item?.diameter_batang))
        .filter((value) => value !== null);

      const heightValues = monitoringItems
        .map((item) => getHeightValue(item))
        .filter((value) => value !== null);

      const healthScores = monitoringItems.map(leafConditionScore);

      const latestMonitoringDate = monitoringItems
        .map((item) => resolveMonitoringDate(item))
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0];

      return {
        id: perencanaan?.id,
        namaPerusahaan: perencanaan?.nama_perusahaan || "Perusahaan tanpa nama",
        jenisKegiatan: perencanaan?.jenis_kegiatan || "-",
        jumlahBibit: perencanaan?.jumlah_bibit || "-",
        lokasi: perencanaan?.lokasi || "-",
        lokasiGeotagging: geoTaggingText,
        tanggalPelaksanaan: formatDateId(perencanaan?.tanggal_pelaksanaan),
        totalMonitoring: monitoringItems.length,
        monitoringDate: latestMonitoringDate ? formatDateId(latestMonitoringDate) : "-",
        survivalRate: survivalValues.length ? `${mean(survivalValues).toFixed(2)}%` : "-",
        avgHeight: heightValues.length ? mean(heightValues).toFixed(2) : "-",
        avgDiameter: diameterValues.length ? mean(diameterValues).toFixed(2) : "-",
        healthCondition: getHealthLabel(healthScores),
      };
    });
  }, [implementasiList, monitoringList, perencanaanList]);

  const selectedCompanyReport = useMemo(() => {
    return companyReports.find((item) => String(item.id) === String(selectedCompanyId)) || null;
  }, [companyReports, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyReport) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedCompanyReport]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <FiBarChart2 className="text-emerald-700 dark:text-emerald-300" size={22} />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">
              4. Evaluasi Hasil Laporan
            </h1>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Pilih perusahaan untuk melihat template evaluasi otomatis pada modal.
          </p>
        </motion.div>

        <div className="flex items-center justify-end">
          <button
            onClick={fetchEvaluasiData}
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiRefreshCw size={14} /> Muat Ulang Data
          </button>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-6"
        >
          {loading ? (
            <div className="py-8">
              <LoadingSpinner show={true} message="Memuat daftar perusahaan..." />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          ) : companyReports.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 text-sm">
              Belum ada data perencanaan untuk dievaluasi.
            </div>
          ) : (
            <div className="space-y-3">
              {companyReports.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCompanyId(item.id)}
                  className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-4 py-4 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{item.namaPerusahaan}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.jenisKegiatan}</p>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p>Monitoring: {item.totalMonitoring} data</p>
                      <p>Survival Rate: {item.survivalRate}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      <AnimatePresence>
        {selectedCompanyReport && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompanyId(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setSelectedCompanyId(null)}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setSelectedCompanyId(null)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Template Evaluasi - {selectedCompanyReport.namaPerusahaan}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                  Template ini disusun otomatis berdasarkan data perusahaan terpilih.
                </p>

                <div className="space-y-5 text-sm leading-7 text-gray-700 dark:text-gray-300">
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Pendahuluan:</h3>
                    <p>
                      Degradasi lahan di Teluk Jakarta menjadi sebuah tantangan lingkungan yang signifikan,
                      disebabkan oleh urbanisasi yang cepat, aktivitas industri, dan pertumbuhan populasi yang tak
                      terkendali. Penelitian telah menunjukkan bahwa selama periode 43 tahun dari 1972 hingga 2015,
                      tingkat abrasi rata-rata pesisir mencapai 2,24 meter per tahun, menyebabkan kehilangan total
                      sebesar 76,55 meter (Libriyono et al., 2018). Kerusakan ekosistem mangrove menjadi salah satu
                      faktor yang memperparah masalah tersebut. Faktor-faktor seperti kebutuhan ekonomi, kegagalan
                      politik, pencemaran, konversi hutan mangrove tanpa mempertimbangkan faktor lingkungan, serta
                      penebangan berlebihan, menjadi penyebab umum kerusakan hutan mangrove (Farhaby dan Anwar 2021).
                      Meskipun memiliki peran penting untuk keberlanjutan di wilayah pesisir, hutan mangrove di
                      Jakarta dan Kepulauan Seribu mengalami kondisi yang semakin memburuk.
                    </p>
                    <p>
                      Mangrove sebagai jenis pohon yang hidup di kawasan pasang surut air laut, memiliki peran yang
                      sangat vital dalam ekosistem pesisir. Selain melindungi pantai dari abrasi dan intrusi air laut,
                      mangrove juga memecah gelombang, menyediakan habitat bagi berbagai jenis satwa, serta menjaga
                      keseimbangan ekologi perairan. Terkait dengan isu perubahan iklim, Donato et al., (2011)
                      Estrada, Soares, Fernadez, & de Almeida (2015) mengidentifikasi bahwa hutan mangrove memiliki
                      simpanan karbon yang relatif tinggi.
                    </p>
                    <p>
                      Kawasan mangrove Angke Kapuk, sebagai salah satu hutan mangrove di Teluk Jakarta, memiliki
                      peran yang sangat penting dalam melindungi pesisir dari abrasi, intrusi air laut, dan banjir.
                      Namun, kawasan ini menghadapi ancaman serius akibat aktivitas manusia yang tidak terencana dan
                      kenaikan permukaan laut sebagai dampak perubahan iklim. Untuk memulihkan fungsi ekosistem
                      mangrove yang optimal, diperlukan upaya perbaikan dan pemeliharaan, termasuk melalui kegiatan
                      restorasi.
                    </p>
                    <p>
                      (
                      {selectedCompanyReport.namaPerusahaan} mempunyai CSR Program dan berkontribusi terhadap upaya
                      restorasi coastal ecosystem terutama di Area Teluk Jakarta melalui kegiatan
                      {" "}{selectedCompanyReport.jenisKegiatan}. Pada tanggal {selectedCompanyReport.tanggalPelaksanaan}
                      {" "}telah dilakukan penanaman mangrove sejumlah {selectedCompanyReport.jumlahBibit} individu
                      di titik geotagging ({selectedCompanyReport.lokasiGeotagging}) pada area
                      {" "}{selectedCompanyReport.lokasi}. Evaluasi berkala untuk melihat persentase tumbuh,
                      parameter pertumbuhan
                      (tinggi dan diameter batang), dan kondisi kesehatan bibit menjadi kunci dalam memastikan
                      keberhasilan upaya restorasi tersebut.
                      )
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Metode Pengamatan:</h3>
                    <p>
                      Kegiatan monitoring dilakukan pada tanggal ({selectedCompanyReport.monitoringDate}) pada titik
                      geotagging ({selectedCompanyReport.lokasiGeotagging}) di area
                      {" "}{selectedCompanyReport.lokasi}. Kawasan ini dikelola oleh Balai Konservasi
                      Sumber Daya Alam (BKSDA) DKI Jakarta di bawah Kementerian Lingkungan Hidup dan Kehutanan.
                      Dalam pelaksanaan monitoring, digunakan metode kuantitatif lapangan dengan pendekatan
                      observasi langsung. Alat yang digunakan pada pengamatan bibit mangrove yang telah ditanam
                      antara lain pita ukur, jangka sorong, kamera, laptop, tally sheet, dan alat tulis.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Hasil & Pembahasan:</h3>
                    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm border-collapse">
                        <tbody>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2 font-medium w-[290px]">a. Survival Rate</td>
                            <td className="px-2 py-2 w-4 text-center">:</td>
                            <td className="px-3 py-2 text-right font-semibold">{selectedCompanyReport.survivalRate}</td>
                          </tr>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2 font-medium">b. Tinggi Bibit Rata-rata</td>
                            <td className="px-2 py-2 text-center">:</td>
                            <td className="px-3 py-2 text-right font-semibold">{selectedCompanyReport.avgHeight} cm</td>
                          </tr>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2 font-medium">c. Diameter Batang Bibit Rata-rata</td>
                            <td className="px-2 py-2 text-center">:</td>
                            <td className="px-3 py-2 text-right font-semibold">{selectedCompanyReport.avgDiameter} cm</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-medium">d. Kondisi Kesehatan Bibit Tanaman</td>
                            <td className="px-2 py-2 text-center">:</td>
                            <td className="px-3 py-2 text-right font-semibold">{selectedCompanyReport.healthCondition}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
