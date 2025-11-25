import { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";
import { FiCheckCircle, FiUpload, FiX, FiMapPin, FiAlertCircle, FiCamera, FiFolder } from "react-icons/fi";
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
  // ✅ ADD NEW STATES FOR UPLOAD
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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

        console.log('[Monitoring Form] Submitting:', {
          implementasi_id: values.implementasi_id,
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

  // ✅ HANDLE DRAG AND DROP
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  // ✅ PROCESS FILES
  const processFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error("❌ Silakan pilih file gambar!");
      return;
    }

    const currentFiles = formik.values.dokumentasi || [];
    const newFiles = [...currentFiles, ...imageFiles];
    
    formik.setFieldValue("dokumentasi", newFiles);
    setShowUploadModal(false);
    toast.success(`✅ ${imageFiles.length} gambar berhasil ditambahkan!`);
  };

  // ✅ HANDLE FILE INPUT
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
  };

  // ✅ HANDLE CAMERA
  const handleCameraCapture = (e) => {
    const files = e.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
  };

  // ✅ OPEN CAMERA
  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // ✅ OPEN FILE PICKER
  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
            
            {/* ✅ SELECT LOCATION FROM MAP - PERTAMA */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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

              {/* Map */}
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

              {/* ✅ DETAIL LOKASI TERPILIH - DITAMPILKAN DI BAWAH MAPS */}
              {selectedLocation && (
                <motion.div
                  className="mt-6 bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-900/20 dark:to-lime-900/20 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <motion.div
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                    >
                      <FiCheckCircle className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-900 dark:text-green-200 mb-1">
                        Lokasi Implementasi Terpilih
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Berikut adalah detail lokasi implementasi untuk monitoring
                      </p>
                    </div>
                  </div>

                  {/* Detail Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Perusahaan */}
                    <motion.div
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-100 dark:border-green-800"
                      whileHover={{ translateY: -2 }}
                    >
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                        Perusahaan
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 break-words">
                        {selectedLocation.nama_perusahaan}
                      </p>
                    </motion.div>

                    {/* Kegiatan */}
                    <motion.div
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-100 dark:border-green-800"
                      whileHover={{ translateY: -2 }}
                    >
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                        Jenis Kegiatan
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 break-words">
                        {selectedLocation.jenis_kegiatan}
                      </p>
                    </motion.div>

                    {/* PIC Koorlap */}
                    <motion.div
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-100 dark:border-green-800"
                      whileHover={{ translateY: -2 }}
                    >
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                        PIC Koorlap
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 break-words">
                        {selectedLocation.pic_koorlap}
                      </p>
                    </motion.div>

                    {/* Jenis Bibit */}
                    <motion.div
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-100 dark:border-green-800"
                      whileHover={{ translateY: -2 }}
                    >
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                        Jenis Bibit
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 break-words">
                        {selectedLocation.jenis_bibit}
                      </p>
                    </motion.div>

                    {/* Jumlah Bibit */}
                    <motion.div
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-100 dark:border-green-800"
                      whileHover={{ translateY: -2 }}
                    >
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                        Jumlah Bibit
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {selectedLocation.jumlah_bibit} Unit
                      </p>
                    </motion.div>

                    {/* Koordinat */}
                    <motion.div
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-100 dark:border-green-800 md:col-span-2"
                      whileHover={{ translateY: -2 }}
                    >
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                        Koordinat Lokasi
                      </p>
                      <p className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                        Latitude: {selectedLocation.lat} | Longitude: {selectedLocation.long}
                      </p>
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 pt-6 border-t border-green-200 dark:border-green-700">
                    <motion.button
                      type="button"
                      onClick={() => setSelectedLocation(null)}
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Pilih Lokasi Lain
                    </motion.button>
                    <motion.button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium transition-all shadow-md"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Gunakan Lokasi Ini</span>
                    </motion.button>
                  </div>
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

            {/* Input Grid Data Monitoring */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
              transition={{ delay: 0.3 }}
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

            {/* Upload Dokumentasi dengan Drag-Drop */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Dokumentasi Monitoring <span className="text-red-500">*</span>
              </label>

              {/* ✅ DRAG DROP AREA */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 scale-105"
                    : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-green-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="sr-only"
                  id="file-input"
                />
                
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="sr-only"
                  id="camera-input"
                />

                {/* Content */}
                <motion.div
                  className="flex flex-col items-center justify-center"
                  animate={dragActive ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
                    animate={dragActive ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FiUpload className={`w-8 h-8 ${dragActive ? 'text-green-600' : 'text-green-600 dark:text-green-400'}`} />
                  </motion.div>

                  <p className="text-center mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                      {dragActive ? "🎯 Lepaskan gambar di sini" : "📸 Drag & Drop gambar di sini"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                      atau gunakan tombol di bawah
                    </span>
                  </p>

                  {/* Upload Buttons - ONLY SHOWN WHEN NOT DRAGGING */}
                  {!dragActive && (
                    <motion.button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-lg transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Pilih Gambar
                    </motion.button>
                  )}
                </motion.div>
              </div>

              {formik.touched.dokumentasi && formik.errors.dokumentasi && (
                <p className="text-red-500 text-sm mt-2">{formik.errors.dokumentasi}</p>
              )}

              {/* ✅ PREVIEW GRID */}
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
              {submitting ? "⏳ Menyimpan..." : "Simpan Data Monitoring"}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* ✅ MODAL UPLOAD OPTIONS */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                  <motion.div
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <FiUpload className="w-7 h-7 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    Upload Dokumentasi
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pilih sumber gambar untuk dokumentasi
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Camera Option */}
                  <motion.button
                    type="button"
                    onClick={openCamera}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold transition-all"
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"
                      whileHover={{ rotate: 10 }}
                    >
                      <FiCamera className="w-5 h-5 text-white" />
                    </motion.div>
                    <div className="text-left">
                      <p className="font-semibold">Ambil Foto</p>
                      <p className="text-xs opacity-80">Gunakan kamera perangkat</p>
                    </div>
                  </motion.button>

                  {/* File Picker Option */}
                  <motion.button
                    type="button"
                    onClick={openFilePicker}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold transition-all"
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center"
                      whileHover={{ rotate: -10 }}
                    >
                      <FiFolder className="w-5 h-5 text-white" />
                    </motion.div>
                    <div className="text-left">
                      <p className="font-semibold">Pilih dari Galeri</p>
                      <p className="text-xs opacity-80">Pilih dari file tersimpan</p>
                    </div>
                  </motion.button>
                </div>

                <motion.button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Batal
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonitoringForm;
