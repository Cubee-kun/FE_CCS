import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FiCheck, FiX, FiUpload, FiCheckCircle, FiMapPin, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

// ✅ Blue marker for existing planned locations
const existingMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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

const ImplementasiForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingLocations, setExistingLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perencanaans, setPerencanaans] = useState([]);
  const [selectedPerencanaan, setSelectedPerencanaan] = useState(null);
  const [loadingPerencanaan, setLoadingPerencanaan] = useState(true);

  const validationSchema = Yup.object({
    perencanaan_id: Yup.string().required("Wajib pilih perencanaan"),
    pic_koorlap: Yup.string().required("Wajib diisi"),
    dokumentasi: Yup.mixed().required("Wajib diisi"),
    geotagging: Yup.string().required("Wajib diisi - Pilih lokasi dari peta"),
  });

  const formik = useFormik({
    initialValues: {
      perencanaan_id: "",
      kesesuaian: {
        nama_perusahaan: false,
        lokasi: false,
        jenis_kegiatan: false,
        jumlah_bibit: false,
        jenis_bibit: false,
        tanggal: false,
      },
      pic_koorlap: "",
      dokumentasi: null,
      geotagging: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append("perencanaan_id", values.perencanaan_id);
        formData.append("kesesuaian", JSON.stringify(values.kesesuaian));
        formData.append("pic_koorlap", values.pic_koorlap);
        if (Array.isArray(values.dokumentasi)) {
          values.dokumentasi.forEach((file) => formData.append("dokumentasi[]", file));
        }
        formData.append("geotagging", values.geotagging);

        const response = await api.post("/implementasi", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.status === 201 || response.status === 200) {
          setSuccess(true);
          toast.success("✅ Implementasi berhasil disimpan!");
          setTimeout(() => {
            formik.resetForm();
            setSelectedLocation(null);
            setSelectedPerencanaan(null);
            setSuccess(false);
          }, 2500);
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        const errorMsg = error.response?.data?.message || error.message || "Gagal menyimpan implementasi";
        toast.error(`❌ ${errorMsg}`);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ✅ Fetch daftar perencanaan dan lokasi (combined)
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await api.get("/perencanaan");
        const data = response.data?.data || response.data || [];
        
        if (isMounted) {
          setPerencanaans(data);
          setExistingLocations(data);
          
          if (data.length > 0) {
            console.log(`✅ ${data.length} lokasi perencanaan ditemukan`);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setPerencanaans([]);
          setExistingLocations([]);
        }
      } finally {
        if (isMounted) {
          setLoadingPerencanaan(false);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ Handle perencanaan selection
  const handlePerencanaanSelect = (perencanaan) => {
    setSelectedPerencanaan(perencanaan);
    formik.setFieldValue("perencanaan_id", perencanaan.id);
    // Auto-select lokasi dari perencanaan yang dipilih
    handleLocationSelect(perencanaan);
  };

  // ✅ Handle marker selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    // Format geotagging as "lat,long"
    const geotagging = `${location.lat},${location.long}`;
    formik.setFieldValue("geotagging", geotagging);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-900/20 px-4 py-2 rounded-full mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FiCheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">Formulir Implementasi</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
            Form Implementasi Kegiatan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Dokumentasi pelaksanaan kegiatan konservasi
          </p>
        </motion.div>

        {/* Success Animation */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="mb-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 text-white text-center"
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
              <h3 className="text-2xl font-bold mb-2">Data Tersimpan!</h3>
              <p>Implementasi kegiatan berhasil didokumentasikan</p>
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
            {/* ✅ SELECT PERENCANAAN DROPDOWN */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Pilih Perencanaan <span className="text-red-500">*</span>
              </label>

              {loadingPerencanaan ? (
                <div className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Memuat data perencanaan...</span>
                </div>
              ) : perencanaans.length === 0 ? (
                <div className="w-full px-4 py-3.5 rounded-xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-amber-700 dark:text-amber-300">Tidak ada data perencanaan. Silakan buat perencanaan terlebih dahulu.</p>
                </div>
              ) : (
                <select
                  id="perencanaan_id"
                  name="perencanaan_id"
                  value={formik.values.perencanaan_id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    formik.setFieldValue("perencanaan_id", selectedId);
                    if (selectedId) {
                      const perencanaan = perencanaans.find(p => String(p.id) === String(selectedId));
                      if (perencanaan) {
                        handlePerencanaanSelect(perencanaan);
                      }
                    }
                  }}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all ${
                    formik.touched.perencanaan_id && formik.errors.perencanaan_id
                      ? "border-red-400 focus:ring-4 focus:ring-red-200"
                      : "border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  }`}
                >
                  <option value="">-- Pilih Perencanaan --</option>
                  {perencanaans.map((perencanaan) => (
                    <option key={perencanaan.id} value={perencanaan.id}>
                      {perencanaan.nama_perusahaan} • {perencanaan.jenis_kegiatan}
                    </option>
                  ))}
                </select>
              )}

              {formik.touched.perencanaan_id && formik.errors.perencanaan_id && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.perencanaan_id}</p>
              )}

              {/* Info dari perencanaan terpilih */}
              {selectedPerencanaan && (
                <motion.div
                  className="mt-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-2 border-teal-300 dark:border-teal-700 rounded-xl p-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Perusahaan</p>
                      <p className="text-sm font-bold text-teal-900 dark:text-teal-200">{selectedPerencanaan.nama_perusahaan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Jenis Kegiatan</p>
                      <p className="text-sm font-bold text-teal-900 dark:text-teal-200">{selectedPerencanaan.jenis_kegiatan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Jumlah Bibit</p>
                      <p className="text-sm font-bold text-teal-900 dark:text-teal-200">{selectedPerencanaan.jumlah_bibit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Jenis Bibit</p>
                      <p className="text-sm font-bold text-teal-900 dark:text-teal-200">{selectedPerencanaan.jenis_bibit}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Checklist Kesesuaian */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <FiCheckCircle className="w-6 h-6 text-teal-600" />
                Checklist Kesesuaian Perencanaan
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(formik.values.kesesuaian).map((field, index) => (
                  <motion.label
                    key={field}
                    className={`relative cursor-pointer group`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      formik.values.kesesuaian[field]
                        ? "border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30"
                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-teal-300"
                    }`}>
                      <input
                        type="checkbox"
                        checked={formik.values.kesesuaian[field]}
                        onChange={(e) => formik.setFieldValue(`kesesuaian.${field}`, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        formik.values.kesesuaian[field]
                          ? "border-teal-500 bg-teal-500"
                          : "border-gray-300 dark:border-gray-500"
                      }`}>
                        {formik.values.kesesuaian[field] && (
                          <FiCheck className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className={`text-sm font-medium capitalize ${
                        formik.values.kesesuaian[field]
                          ? "text-teal-700 dark:text-teal-300"
                          : "text-gray-700 dark:text-gray-300"
                      }`}>
                        {field.replace("_", " ")}
                      </span>
                    </div>
                  </motion.label>
                ))}
              </div>
            </motion.div>

            {/* PIC Koorlap */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                PIC Koorlap <span className="text-red-500">*</span>
              </label>
              <input
                id="pic_koorlap"
                name="pic_koorlap"
                placeholder="Masukkan nama PIC Koorlap"
                value={formik.values.pic_koorlap}
                onChange={formik.handleChange}
                className={`w-full px-4 py-3.5 rounded-xl border-2 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all ${
                  formik.touched.pic_koorlap && formik.errors.pic_koorlap
                    ? "border-red-400 focus:ring-4 focus:ring-red-200"
                    : "border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                }`}
              />
              {formik.touched.pic_koorlap && formik.errors.pic_koorlap && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.pic_koorlap}</p>
              )}
            </motion.div>

            {/* Upload Dokumentasi dengan Preview Modern */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Dokumentasi Implementasi <span className="text-red-500">*</span>
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
                    className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4"
                  >
                    <FiUpload className="w-8 h-8 text-teal-600 dark:text-teal-400" />
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

              {/* Preview Grid dengan Animasi */}
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

            {/* ✅ SELECT FROM EXISTING LOCATIONS */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                <FiMapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Pilih Lokasi Implementasi
                <span className="text-red-500">*</span>
              </label>

              {/* Info Box */}
              <div className="mb-4 bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-200 dark:border-teal-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-teal-900 dark:text-teal-200 mb-2">
                      📍 Pilih dari Lokasi yang Sudah Direncanakan
                    </h4>
                    <p className="text-sm text-teal-800 dark:text-teal-300">
                      Klik pada marker biru di peta untuk memilih lokasi implementasi. 
                      Lokasi ini berasal dari data perencanaan yang sudah dibuat sebelumnya.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Location Display */}
              {selectedLocation && (
                <motion.div
                  className="mb-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-2 border-teal-300 dark:border-teal-700 rounded-xl p-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                      <FiCheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-teal-900 dark:text-teal-200 mb-1">
                        Lokasi Terpilih
                      </h4>
                      <p className="text-sm text-teal-800 dark:text-teal-300">
                        <strong>Perusahaan:</strong> {selectedLocation.nama_perusahaan}
                      </p>
                      <p className="text-xs text-teal-700 dark:text-teal-400 font-mono mt-1">
                        Koordinat: {selectedLocation.lokasi}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Map with Existing Locations */}
              {loading ? (
                <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Memuat lokasi perencanaan...</p>
                  </div>
                </div>
              ) : existingLocations.length === 0 ? (
                <div className="h-96 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 flex items-center justify-center">
                  <div className="text-center p-8">
                    <FiAlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">
                      Belum Ada Lokasi Perencanaan
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300">
                      Silakan buat perencanaan terlebih dahulu untuk menandai lokasi.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  className="rounded-2xl overflow-hidden border-2 border-teal-200 dark:border-teal-700 shadow-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <MapContainer
                    center={
                      existingLocations.length > 0
                        ? [
                            parseFloat(existingLocations[0].lat) || -2.5489,
                            parseFloat(existingLocations[0].long) || 118.0149
                          ]
                        : [-2.5489, 118.0149]
                    }
                    zoom={13}
                    style={{ height: "500px", width: "100%" }}
                    className="z-0"
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
                          icon={isSelected ? selectedMarkerIcon : existingMarkerIcon}
                          eventHandlers={{
                            click: () => handleLocationSelect(location),
                          }}
                        >
                          <Popup>
                            <div className="text-center">
                              <p className="font-bold text-teal-700">{location.nama_perusahaan}</p>
                              <p className="text-xs text-gray-600 mb-2">
                                {location.jenis_kegiatan}
                              </p>
                              <button
                                onClick={() => handleLocationSelect(location)}
                                className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white text-xs rounded-lg transition-colors"
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
              {formik.touched.geotagging && formik.errors.geotagging && (
                <motion.p
                  className="text-red-500 text-sm mt-3 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>⚠️</span>
                  {formik.errors.geotagging}
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
                  : "bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 hover:from-teal-600 hover:via-emerald-600 hover:to-green-600 text-white"
              }`}
              whileHover={!submitting ? { scale: 1.02, boxShadow: "0 20px 60px -10px rgba(20, 184, 166, 0.5)" } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
            >
              {submitting ? "Menyimpan..." : "Simpan Data Implementasi"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ImplementasiForm;
