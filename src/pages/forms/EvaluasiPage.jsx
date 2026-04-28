import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiBarChart2, FiDownload, FiRefreshCw, FiX } from "react-icons/fi";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SummaryCards from "../../components/evaluasi/SummaryCards";
import NarrativeEditor from "../../components/evaluasi/NarrativeEditor";
import RecommendationsSection from "../../components/evaluasi/RecommendationsSection";
import IntroductionSection from "../../components/evaluasi/IntroductionSection";
import MethodologySection from "../../components/evaluasi/MethodologySection";
import { buildEvaluasiPdfBlob } from "../../utils/evaluasiPdf";
import { generateFullNarrative, getSuccessStatus, getRecommendations } from "../../utils/evaluasiNarrator";

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

const deriveSurvivalRate = (monitoring) => {
  const planted = parseNumber(monitoring?.jumlah_bibit_ditanam);
  const dead = parseNumber(monitoring?.jumlah_bibit_mati);

  if (planted === null || planted <= 0 || dead === null || dead < 0) {
    return null;
  }

  const survived = Math.max(planted - dead, 0);
  return (survived / planted) * 100;
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

const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function EvaluasiPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perencanaanList, setPerencanaanList] = useState([]);
  const [implementasiList, setImplementasiList] = useState([]);
  const [monitoringList, setMonitoringList] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [narratives, setNarratives] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [savedNarratives, setSavedNarratives] = useState({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
        .map((item) => parseNumber(item?.survival_rate) ?? deriveSurvivalRate(item))
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

  // Generate narratives dan recommendations ketika company berubah
  useEffect(() => {
    if (!selectedCompanyReport) {
      setNarratives({});
      setRecommendations([]);
      setSavedNarratives({});
      return;
    }

    // Generate narratives
    const generated = generateFullNarrative(selectedCompanyReport);
    setNarratives(generated);
    setSavedNarratives(generated);

    // Generate recommendations
    const recs = getRecommendations(selectedCompanyReport);
    setRecommendations(recs);
  }, [selectedCompanyReport]);

  const handleDownloadPdf = async () => {
    if (!selectedCompanyReport) return;

    setIsGeneratingPdf(true);
    try {
      const blob = await buildEvaluasiPdfBlob(selectedCompanyReport, narratives, recommendations);
      downloadBlob(blob, `evaluasi-${selectedCompanyReport.namaPerusahaan}-${selectedCompanyReport.id}.pdf`);
    } catch (error) {
      console.error("[EvaluasiPage] PDF generation error:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl p-6 md:p-8 relative max-h-[95vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedCompanyId(null)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                >
                  <FiX className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Evaluasi Restorasi - {selectedCompanyReport.namaPerusahaan}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Laporan evaluasi otomatis berdasarkan data monitoring. Anda dapat mengedit narasi sesuai kebutuhan.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Ringkasan Data</h3>
                    <SummaryCards 
                      report={selectedCompanyReport}
                      survivalStatus={getSuccessStatus(selectedCompanyReport.survivalRate)}
                      healthStatus={selectedCompanyReport.healthCondition}
                    />
                  </div>

                  {/* Info Perusahaan */}
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Informasi Proyek</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Jenis Kegiatan</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedCompanyReport.jenisKegiatan}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Lokasi</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedCompanyReport.lokasi}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Jumlah Bibit</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedCompanyReport.jumlahBibit}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Tanggal Pelaksanaan</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedCompanyReport.tanggalPelaksanaan}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Tanggal Monitoring</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedCompanyReport.monitoringDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Geotagging</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mt-1 text-xs">{selectedCompanyReport.lokasiGeotagging}</p>
                      </div>
                    </div>
                  </div>

                  {/* Introduction Section */}
                  <IntroductionSection report={selectedCompanyReport} />

                  {/* Methodology Section */}
                  <MethodologySection report={selectedCompanyReport} />

                  {/* Narrative Editor */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Hasil & Pembahasan (Dapat Diedit)</h3>
                    <NarrativeEditor 
                      narratives={narratives}
                      onSave={(field, value) => {
                        setNarratives(prev => ({ ...prev, [field]: value }));
                      }}
                    />
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Rekomendasi & Tindakan Perbaikan</h3>
                    <RecommendationsSection recommendations={recommendations} />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={isGeneratingPdf}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-sm font-semibold transition-colors"
                    >
                      <FiDownload size={16} />
                      {isGeneratingPdf ? "Membuat PDF..." : "Unduh PDF Laporan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNarratives({ ...savedNarratives })}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 text-sm font-semibold transition-colors"
                    >
                      <FiRefreshCw size={16} />
                      Reset Narasi
                    </button>
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
