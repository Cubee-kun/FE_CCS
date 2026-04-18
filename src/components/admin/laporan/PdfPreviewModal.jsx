import { motion } from "framer-motion";
import { FiDownload, FiX } from "react-icons/fi";

export default function PdfPreviewModal({
  open,
  data,
  progress,
  details,
  onClose,
  onDownload,
  parseStoredFiles,
}) {
  if (!open || !data) {
    return null;
  }

  const implementasiDocs = parseStoredFiles?.(details?.implementasi?.dokumentasi_kegiatan) || [];
  const monitoringDocs = parseStoredFiles?.(details?.monitoring?.dokumentasi_monitoring) || [];

  const apiBase = import.meta.env.VITE_API_URL || "";
  const apiOrigin = (() => {
    try {
      return new URL(apiBase).origin;
    } catch {
      return "";
    }
  })();

  const toAbsoluteFileUrl = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = String(path).replace(/\\/g, "/").replace(/^\/+/, "");

    if (apiOrigin) {
      return `${apiOrigin}/${normalized}`;
    }

    return `/${normalized}`;
  };

  const implementationCompleted = !!progress?.hasImplementasi || !!details?.implementasi;
  const monitoringCompleted = !!progress?.hasMonitoring || !!details?.monitoring;
  const evaluasiCompleted = !!progress?.hasEvaluasi || monitoringCompleted;

  const normalizeBoolean = (value) => {
    if (value === true || value === false) return value;
    if (value === 1 || value === "1") return true;
    if (value === 0 || value === "0") return false;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "ya", "yes", "sesuai"].includes(normalized)) return true;
      if (["false", "tidak", "no", "tidak sesuai"].includes(normalized)) return false;
    }
    return null;
  };

  const getKesesuaianValue = (key) => {
    const implementasi = details?.implementasi || {};

    const directMap = {
      nama_perusahaan: implementasi?.nama_perusahaan_sesuai,
      lokasi: implementasi?.lokasi_sesuai,
      jenis_kegiatan: implementasi?.jenis_kegiatan_sesuai,
      jumlah_bibit: implementasi?.jumlah_bibit_sesuai,
      jenis_bibit: implementasi?.jenis_bibit_sesuai,
      tanggal: implementasi?.tanggal_sesuai,
    };

    const nested = implementasi?.kesesuaian?.[key];
    return normalizeBoolean(directMap[key] ?? nested);
  };

  const previewRows = [
    ["ID", data.id],
    ["Tahap Saat Ini", progress?.currentStage],
    ["Nama Perusahaan", data.nama_perusahaan],
    ["Nama PIC", data.nama_pic || "-"],
    ["Narahubung", data.narahubung || "-"],
    ["Jenis Kegiatan", data.jenis_kegiatan || "-"],
    ["Jenis Bibit", data.jenis_bibit || "-"],
    ["Jumlah Bibit", `${data.jumlah_bibit || "-"} Unit`],
    ["Status Implementasi", implementationCompleted ? "Sudah Implementasi" : "Belum Implementasi"],
    ["Progress Perencanaan", "Selesai"],
    ["Progress Implementasi", implementationCompleted ? "Selesai" : "Belum"],
    ["Progress Monitoring", monitoringCompleted ? "Selesai" : "Belum"],
    ["Progress Evaluasi", evaluasiCompleted ? "Selesai" : "Belum"],
    ["Lokasi", data.lokasi || "-"],
    ["Tanggal Pelaksanaan", data.tanggal_pelaksanaan || "-"],
    ["Koordinat", `${data.lat ?? "-"}, ${data.long ?? "-"}`],
    ["Blockchain Doc Hash", data.blockchain_doc_hash || "-"],
    ["Blockchain TX Hash", data.blockchain_tx_hash || "-"],
    ["Status Verifikasi Blockchain", data.blockchainData?.verified ? "Full Verified" : (data.blockchain_tx_hash ? "Uploaded (Pending Verify)" : "Not Uploaded")],
  ];

  const ChecklistRow = ({ label, value }) => (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40">
      <p className="font-semibold mb-2">{label}</p>
      <div className="flex items-center gap-4 text-xs">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={value === true} readOnly className="accent-emerald-600" />
          <span>Sesuai</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={value === false} readOnly className="accent-rose-600" />
          <span>Tidak Sesuai</span>
        </label>
      </div>
    </div>
  );

  const DocumentationGallery = ({ title, files }) => (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 md:col-span-2">
      <p className="font-semibold mb-3">{title}</p>
      {files.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {files.map((filePath, idx) => (
            <a
              key={`${title}-${idx}`}
              href={toAbsoluteFileUrl(filePath)}
              target="_blank"
              rel="noreferrer"
              className="group block"
            >
              <div className="h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                <img
                  src={toAbsoluteFileUrl(filePath)}
                  alt={`${title} ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 truncate">{String(filePath).split("/").pop()}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Preview Laporan PDF
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Semua isi form dan status akan dimasukkan ke PDF.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-6">
            {previewRows.map(([label, value]) => (
              <div
                key={label}
                className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 ${label === "Nama Perusahaan" || label === "Blockchain Doc Hash" || label === "Blockchain TX Hash" || label === "Status Verifikasi Blockchain" ? "md:col-span-2" : ""}`}
              >
                <span className="font-semibold">{label}:</span> {value}
              </div>
            ))}

            {(progress?.hasImplementasi || details?.implementasi) && (
              <>
                <div className="md:col-span-2 mt-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 font-semibold">
                  Detail Implementasi
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">PIC Koorlap:</span> {details?.implementasi?.pic_koorlap || "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Geotagging:</span> {details?.implementasi?.geotagging || "-"}</div>
                <ChecklistRow label="Nama Perusahaan" value={getKesesuaianValue("nama_perusahaan")} />
                <ChecklistRow label="Lokasi" value={getKesesuaianValue("lokasi")} />
                <ChecklistRow label="Jenis Kegiatan" value={getKesesuaianValue("jenis_kegiatan")} />
                <ChecklistRow label="Jumlah Bibit" value={getKesesuaianValue("jumlah_bibit")} />
                <ChecklistRow label="Jenis Bibit" value={getKesesuaianValue("jenis_bibit")} />
                <ChecklistRow label="Tanggal" value={getKesesuaianValue("tanggal")} />
                <DocumentationGallery title="Dokumentasi Implementasi" files={implementasiDocs} />
              </>
            )}

            {(progress?.hasMonitoring || details?.monitoring) && (
              <>
                <div className="md:col-span-2 mt-2 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-300 font-semibold">
                  Detail Monitoring
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jumlah Bibit Ditanam:</span> {details?.monitoring?.jumlah_bibit_ditanam ?? "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jumlah Bibit Mati:</span> {details?.monitoring?.jumlah_bibit_mati ?? "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Diameter Batang:</span> {details?.monitoring?.diameter_batang ? `${details?.monitoring?.diameter_batang} cm` : "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Jumlah Daun:</span> {details?.monitoring?.jumlah_daun ?? "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Survival Rate:</span> {details?.monitoring?.survival_rate !== undefined && details?.monitoring?.survival_rate !== null ? `${details?.monitoring?.survival_rate}%` : "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Daun Mengering:</span> {details?.monitoring?.daun_mengering ?? "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Daun Layu:</span> {details?.monitoring?.daun_layu ?? "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Daun Menguning:</span> {details?.monitoring?.daun_menguning ?? "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Bercak Daun:</span> {details?.monitoring?.bercak_daun ?? "-"}</div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40"><span className="font-semibold">Daun Serangga:</span> {details?.monitoring?.daun_serangga ?? "-"}</div>
                <DocumentationGallery title="Dokumentasi Monitoring" files={monitoringDocs} />
              </>
            )}
          </div>

          <motion.button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-medium shadow-lg transition-all"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiDownload className="w-5 h-5" />
            <span>Download PDF</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
