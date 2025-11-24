import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";
import { FiCheckCircle, FiUpload, FiX, FiMapPin, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "react-toastify";

// ✅ Purple marker untuk lokasi implementasi
const implementationMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-purple.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ✅ Selected marker (red)
const selectedMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MonitoringForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [implementasis, setImplementasis] = useState([]);
  const [selectedImplementasi, setSelectedImplementasi] = useState(null);
  const [loadingImplementasi, setLoadingImplementasi] = useState(true);
  const [existingLocations, setExistingLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const validationSchema = Yup.object({
    implementasi_id: Yup.string().required("Wajib pilih implementasi terlebih dahulu"),
    jumlah_bibit_ditanam: Yup.number().required("Wajib diisi").positive("Harus positif"),
    jumlah_bibit_mati: Yup.number().required("Wajib diisi").min(0, "Tidak boleh negatif"),
    diameter_batang: Yup.number().required("Wajib diisi").positive("Harus positif"),
    jumlah_daun: Yup.number().required("Wajib diisi").positive("Harus positif"),
    survival_rate: Yup.number().required("Wajib diisi").min(0).max(100),
    kondisi_daun: Yup.object().shape({
      mengering: Yup.string().required("Wajib dipilih"),
      layu: Yup.string().required("Wajib dipilih"),
      menguning: Yup.string().required("Wajib dipilih"),
      bercak: Yup.string().required("Wajib dipilih"),
      hama: Yup.string().required("Wajib dipilih"),
    }),
    dokumentasi: Yup.mixed().required("Wajib diisi"),
    lokasi: Yup.string().required("Wajib memilih lokasi dari peta"),
  });

  const formik = useFormik({
    initialValues: {
      implementasi_id: "",
      jumlah_bibit_ditanam: "",
      jumlah_bibit_mati: "",
      diameter_batang: "",
      jumlah_daun: "",
      survival_rate: "",
      kondisi_daun: {
        mengering: "",
        layu: "",
        menguning: "",
        bercak: "",
        hama: "",
      },
      dokumentasi: null,
      lokasi: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append("implementasi_id", values.implementasi_id);
        formData.append("daun_mengering", values.kondisi_daun.mengering);
        formData.append("daun_layu", values.kondisi_daun.layu);
        formData.append("daun_menguning", values.kondisi_daun.menguning);
        formData.append("bercak_daun", values.kondisi_daun.bercak);
        formData.append("daun_serangga", values.kondisi_daun.hama);
        formData.append("jumlah_bibit_ditanam", values.jumlah_bibit_ditanam);
        formData.append("jumlah_bibit_mati", values.jumlah_bibit_mati);
        formData.append("diameter_batang", values.diameter_batang);
        formData.append("jumlah_daun", values.jumlah_daun);
        formData.append("survival_rate", values.survival_rate);
        
        // Append dokumentasi dengan index yang jelas
        if (values.dokumentasi && Array.isArray(values.dokumentasi) && values.dokumentasi.length > 0) {
          values.dokumentasi.forEach((file, index) => {
            if (file instanceof File) {
              formData.append(`dokumentasi_monitoring_${index}`, file);
            }
          });
          formData.append("dokumentasi_count", values.dokumentasi.length);
        }

        // Log form data untuk debug
        console.log('[Monitoring Form] Submitting:', {
          implementasi_id: values.implementasi_id,
          daun_mengering: values.kondisi_daun.mengering,
          daun_layu: values.kondisi_daun.layu,
          daun_menguning: values.kondisi_daun.menguning,
          bercak_daun: values.kondisi_daun.bercak,
          daun_serangga: values.kondisi_daun.hama,
          jumlah_bibit_ditanam: values.jumlah_bibit_ditanam,
          jumlah_bibit_mati: values.jumlah_bibit_mati,
          diameter_batang: values.diameter_batang,
          jumlah_daun: values.jumlah_daun,
          survival_rate: values.survival_rate,
          files: values.dokumentasi?.length || 0
        });

        const response = await api.post(`/monitoring`, formData);

        if (response.status === 201 || response.status === 200) {
          setSuccess(true);
          toast.success("✅ Monitoring berhasil disimpan!");
          setTimeout(() => {
            formik.resetForm();
            setSelectedLocation(null);
            setSelectedImplementasi(null);
            setSuccess(false);
          }, 2500);
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        console.error("Error response data:", error.response?.data);
        const errorMsg = error.response?.data?.message || error.message || "Gagal menyimpan monitoring";
        toast.error(`❌ ${errorMsg}`);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ✅ Fetch implementasi dan lokasi
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await api.get("/implementasi");
        const data = response.data?.data || response.data || [];
        
        if (isMounted) {
          setImplementasis(data);
          setExistingLocations(data);
          
          if (data.length > 0) {
            console.log(`✅ ${data.length} data implementasi ditemukan`);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setImplementasis([]);
          setExistingLocations([]);
        }
      } finally {
        if (isMounted) {
          setLoadingImplementasi(false);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ Handle implementasi selection
  const handleImplementasiSelect = (implementasi) => {
    setSelectedImplementasi(implementasi);
    formik.setFieldValue("implementasi_id", implementasi.id);
    // Auto-select lokasi dari implementasi yang dipilih
    handleLocationSelect(implementasi);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    // Format geotagging as "lat,long"
    const geotagging = `${location.lat},${location.long}`;
    formik.setFieldValue("lokasi", geotagging);
  };

  const renderRadioGroup = (name, label) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {label}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["<25%", "25–45%", "50–74%", ">75%"].map((option) => (
          <motion.label
            key={option}
            className="relative cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <input
              type="radio"
              name={`kondisi_daun.${name}`}
              value={option}
              checked={formik.values.kondisi_daun[name] === option}
              onChange={(e) => formik.setFieldValue(`kondisi_daun.${name}`, e.target.value)}
              className="peer sr-only"
            />
            <div className={`flex items-center justify-center p-4 rounded-xl border-2 font-semibold transition-all ${
              formik.values.kondisi_daun[name] === option
                ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 shadow-lg"
                : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300"
            }`}>
              {option}
            </div>
          </motion.label>
        ))}
      </div>
      {formik.touched.kondisi_daun?.[name] && formik.errors.kondisi_daun?.[name] && (
        <p className="text-red-500 text-sm mt-2">{formik.errors.kondisi_daun[name]}</p>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 px-4 py-2 rounded-full mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Formulir Monitoring</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-lime-600 bg-clip-text text-transparent mb-4">
            Form Monitoring Kegiatan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Monitoring kesehatan bibit dari hasil implementasi yang telah dilakukan
          </p>
        </motion.div>

        {/* Success Animation */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="mb-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <FiCheckCircle className="w-16 h-16 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">✅ Data Berhasil Disimpan!</h3>
              <p>Monitoring kegiatan telah tercatat dengan baik</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Card */}
        <motion.div
          className="glass bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={formik.handleSubmit} className="p-8 md:p-12">
            {/* ✅ SELECT IMPLEMENTASI DROPDOWN */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Pilih Implementasi <span className="text-red-500">*</span>
              </label>

              {loadingImplementasi ? (
                <div className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Memuat data implementasi...</span>
                </div>
              ) : implementasis.length === 0 ? (
                <div className="w-full px-4 py-3.5 rounded-xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-amber-700 dark:text-amber-300">Tidak ada data implementasi. Silakan buat implementasi terlebih dahulu.</p>
                </div>
              ) : (
                <select
                  id="implementasi_id"
                  name="implementasi_id"
                  value={formik.values.implementasi_id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    formik.setFieldValue("implementasi_id", selectedId);
                    if (selectedId) {
                      const implementasi = implementasis.find(i => String(i.id) === String(selectedId));
                      if (implementasi) {
                        handleImplementasiSelect(implementasi);
                      }
                    }
                  }}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all ${
                    formik.touched.implementasi_id && formik.errors.implementasi_id
                      ? "border-red-400 focus:ring-4 focus:ring-red-200"
                      : "border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  }`}
                >
                  <option value="">-- Pilih Implementasi --</option>
                  {implementasis.map((impl) => (
                    <option key={impl.id} value={impl.id}>
                      {impl.nama_perusahaan || "N/A"} • {impl.pic_koorlap || "N/A"}
                    </option>
                  ))}
                </select>
              )}

              {formik.touched.implementasi_id && formik.errors.implementasi_id && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.implementasi_id}</p>
              )}

              {/* Info dari implementasi terpilih */}
              {selectedImplementasi && (
                <motion.div
                  className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Perusahaan</p>
                      <p className="text-sm font-bold text-green-900 dark:text-green-200">{selectedImplementasi.nama_perusahaan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">PIC Koorlap</p>
                      <p className="text-sm font-bold text-green-900 dark:text-green-200">{selectedImplementasi.pic_koorlap}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Input Grid Data Monitoring */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                📊 Data Monitoring
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { name: "jumlah_bibit_ditanam", label: "Jumlah Bibit Ditanam", placeholder: "100", icon: "🌱" },
                  { name: "jumlah_bibit_mati", label: "Jumlah Bibit Mati", placeholder: "5", icon: "💀" },
                  { name: "diameter_batang", label: "Diameter Batang (cm)", placeholder: "2.5", step: "0.1", icon: "📏" },
                  { name: "jumlah_daun", label: "Jumlah Daun", placeholder: "20", icon: "🍃" },
                  { name: "survival_rate", label: "Survival Rate (%)", placeholder: "95", icon: "📈" },
                ].map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <span className="mr-2">{field.icon}</span>
                      {field.label}
                    </label>
                    <input
                      type="number"
                      step={field.step}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formik.values[field.name]}
                      onChange={formik.handleChange}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/50 transition-all"
                    />
                    {formik.touched[field.name] && formik.errors[field.name] && (
                      <p className="text-red-500 text-sm mt-2">{formik.errors[field.name]}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Kondisi Kesehatan Bibit */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                🌱 Kondisi Kesehatan Bibit
              </h3>
              <div className="space-y-6">
                {renderRadioGroup("mengering", "🍂 Daun Mengering")}
                {renderRadioGroup("layu", "💧 Daun Layu")}
                {renderRadioGroup("menguning", "🟡 Daun Menguning")}
                {renderRadioGroup("bercak", "🔴 Bercak Daun")}
                {renderRadioGroup("hama", "🐛 Terserang Hama")}
              </div>
            </motion.div>

            {/* Upload Dokumentasi */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                📸 Dokumentasi Monitoring <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files);
                    formik.setFieldValue("dokumentasi", files);
                  }}
                  className="sr-only"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
                  >
                    <FiUpload className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Klik untuk upload gambar
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, JPEG (Max 5MB per file)
                  </p>
                </label>
              </div>

              {formik.touched.dokumentasi && formik.errors.dokumentasi && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.dokumentasi}</p>
              )}

              {/* Preview Grid */}
              {formik.values.dokumentasi && formik.values.dokumentasi.length > 0 && (
                <motion.div
                  className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {formik.values.dokumentasi.map((file, index) => (
                    <motion.div
                      key={index}
                      className="relative group"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-md">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                        <motion.button
                          type="button"
                          onClick={() => {
                            const newFiles = [...formik.values.dokumentasi];
                            newFiles.splice(index, 1);
                            formik.setFieldValue("dokumentasi", newFiles);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FiX className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
                        {file.name}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* ✅ Select Location Map - DARI IMPLEMENTASI */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                <FiMapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                Pilih Lokasi Implementasi untuk Monitoring
                <span className="text-red-500">*</span>
              </label>

              {/* Info Box */}
              <div className="mb-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 dark:text-green-200 mb-2">
                      📍 Pilih dari Lokasi Implementasi
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Klik pada marker di peta untuk memilih lokasi implementasi yang akan dimonitor. 
                      Hanya lokasi yang telah diimplementasikan yang dapat dipilih untuk monitoring.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Location Display */}
              {selectedLocation && (
                <motion.div
                  className="mb-4 bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-900/20 dark:to-lime-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <FiCheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-green-900 dark:text-green-200 mb-1">
                        Lokasi Implementasi Terpilih
                      </h4>
                      <p className="text-sm text-green-800 dark:text-green-300">
                        <strong>Perusahaan:</strong> {selectedLocation.nama_perusahaan}
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-300">
                        <strong>Kegiatan:</strong> {selectedLocation.jenis_kegiatan}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400 font-mono mt-1">
                        Koordinat: {selectedLocation.lat}, {selectedLocation.long}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Map with Implementasi Locations */}
              {loading ? (
                <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Memuat lokasi implementasi...</p>
                  </div>
                </div>
              ) : existingLocations.length === 0 ? (
                <div className="h-96 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 flex items-center justify-center">
                  <div className="text-center p-8">
                    <FiAlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">
                      Belum Ada Lokasi Implementasi
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300">
                      Silakan lakukan implementasi terlebih dahulu untuk mendapatkan data lokasi monitoring.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  className="rounded-2xl overflow-hidden border-2 border-green-200 dark:border-green-700 shadow-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <MapContainer
                    center={
                      selectedImplementasi
                        ? [
                            parseFloat(selectedImplementasi.lat) || -2.5489,
                            parseFloat(selectedImplementasi.long) || 118.0149
                          ]
                        : existingLocations.length > 0
                        ? [
                            parseFloat(existingLocations[0].lat) || -2.5489,
                            parseFloat(existingLocations[0].long) || 118.0149
                          ]
                        : [-2.5489, 118.0149]
                    }
                    zoom={13}
                    style={{ height: "500px", width: "100%" }}
                    className="z-0"
                    key={selectedImplementasi?.id || 'default'}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {existingLocations.map((location) => {
                      const lat = parseFloat(location.lat);
                      const lng = parseFloat(location.long);
                      const isSelected = selectedLocation?.id === location.id;
                      
                      // Skip invalid coordinates
                      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                        return null;
                      }
                      
                      return (
                        <Marker
                          key={location.id}
                          position={[lat, lng]}
                          icon={isSelected ? selectedMarkerIcon : implementationMarkerIcon}
                          eventHandlers={{
                            click: () => handleLocationSelect(location),
                          }}
                        >
                          <Popup>
                            <div className="text-center">
                              <p className="font-bold text-green-700">{location.nama_perusahaan}</p>
                              <p className="text-xs text-gray-600 mb-1">
                                Implementasi: {location.jenis_kegiatan}
                              </p>
                              <p className="text-xs text-gray-600 mb-3">
                                Bibit: {location.jenis_bibit} ({location.jumlah_bibit} unit)
                              </p>
                              <button
                                onClick={() => handleLocationSelect(location)}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors font-semibold"
                              >
                                Pilih Lokasi Ini
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </motion.div>
              )}

              {/* Validation Error */}
              {formik.touched.lokasi && formik.errors.lokasi && (
                <motion.p
                  className="text-red-500 text-sm mt-3 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>⚠️</span>
                  {formik.errors.lokasi}
                </motion.p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 via-emerald-500 to-lime-500 hover:from-green-600 hover:via-emerald-600 hover:to-lime-600 text-white"
              }`}
              whileHover={!submitting ? { scale: 1.02, boxShadow: "0 20px 60px -10px rgba(34, 197, 94, 0.5)" } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
            >
              {submitting ? "⏳ Menyimpan..." : "💾 Simpan Data Monitoring"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default MonitoringForm;
