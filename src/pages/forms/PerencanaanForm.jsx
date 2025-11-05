import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";
import { FiMapPin, FiCalendar, FiUser, FiPhone, FiBriefcase, FiCheckCircle, FiNavigation, FiLink } from "react-icons/fi";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-toastify/dist/ReactToastify.css";
import { useBlockchain } from "../../contexts/BlockchainContext";

// ✅ Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// ✅ Custom green marker for new locations
const newMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ✅ Map click handler component
function LocationMarker({ onLocationSelect, selectedLocation }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
      toast.success("📍 Lokasi berhasil ditandai di peta!", {
        position: "top-center",
        autoClose: 2000
      });
    },
  });

  return selectedLocation ? (
    <Marker position={selectedLocation} icon={newMarkerIcon}>
      <Popup>
        <div className="text-center">
          <p className="font-semibold text-emerald-700">Lokasi Perencanaan</p>
          <p className="text-xs text-gray-600">
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

const PerencanaanForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-2.5489, 118.0149]); // Indonesia center
  const { isConnected, connectWallet, storeDocument } = useBlockchain();
  const [blockchainData, setBlockchainData] = useState(null);
  const [savingToBlockchain, setSavingToBlockchain] = useState(false);

  const validationSchema = Yup.object({
    nama_perusahaan: Yup.string().required("Wajib diisi"),
    nama_pic: Yup.string().required("Wajib diisi"),
    narahubung: Yup.string().required("Wajib diisi"),
    jenis_kegiatan: Yup.string().required("Pilih salah satu"),
    lokasi: Yup.string().required("Wajib diisi - Klik pada peta untuk menandai lokasi"),
    jumlah_bibit: Yup.number().required("Wajib diisi").positive("Harus positif"),
    jenis_bibit: Yup.string().required("Wajib diisi"),
    tanggal_pelaksanaan: Yup.date().required("Wajib diisi"),
  });

  const formik = useFormik({
    initialValues: {
      nama_perusahaan: "",
      nama_pic: "",
      narahubung: "",
      jenis_kegiatan: "",
      lokasi: "",
      jumlah_bibit: "",
      jenis_bibit: "",
      tanggal_pelaksanaan: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      
      try {
        // ✅ 1. Save to backend first
        const response = await api.post("/forms/perencanaan", values);
        const savedId = response.data?.id;
        
        setSuccess(true);
        toast.success("✅ Data berhasil disimpan!");

        // ✅ 2. Save hash to blockchain
        if (isConnected) {
          setSavingToBlockchain(true);
          toast.info("💎 Menyimpan hash ke blockchain...");
          
          const blockchainResult = await storeDocument(
            'PERENCANAAN',
            values,
            {
              backendId: savedId,
              nama_perusahaan: values.nama_perusahaan,
              jenis_kegiatan: values.jenis_kegiatan,
            }
          );

          if (blockchainResult) {
            setBlockchainData(blockchainResult);
            
            // Update backend with blockchain info
            await api.put(`/forms/perencanaan/${savedId}`, {
              blockchain_tx_hash: blockchainResult.txHash,
              blockchain_doc_id: blockchainResult.docId,
              blockchain_doc_hash: blockchainResult.docHash,
            });
            
            toast.success("✅ Hash berhasil disimpan ke blockchain!");
          }
          
          setSavingToBlockchain(false);
        } else {
          toast.warning("⚠️ Wallet tidak terhubung. Data hanya tersimpan di database.");
        }

        setTimeout(() => {
          resetForm();
          setSelectedLocation(null);
          setSuccess(false);
          setBlockchainData(null);
        }, 5000);
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("❌ Gagal menyimpan data!");
      } finally {
        setSubmitting(false);
        setSavingToBlockchain(false);
      }
    },
  });

  // ✅ Handle map click untuk menandai lokasi
  const handleLocationSelect = (latlng) => {
    setSelectedLocation(latlng);
    const coords = `${latlng.lat},${latlng.lng}`;
    formik.setFieldValue("lokasi", coords);
  };

  // ✅ Get current location sebagai starting point
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung geolocation!");
      return;
    }

    toast.info("📍 Mendapatkan lokasi Anda...", { autoClose: 2000 });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        toast.success("✅ Peta dipusatkan ke lokasi Anda!", { autoClose: 2000 });
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.warning("⚠️ Tidak dapat mendapatkan lokasi, menggunakan lokasi default");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const inputFields = [
    { name: "nama_perusahaan", label: "Nama Perusahaan", icon: FiBriefcase, placeholder: "PT. Contoh Indonesia" },
    { name: "nama_pic", label: "Nama PIC", icon: FiUser, placeholder: "John Doe" },
    { name: "narahubung", label: "Narahubung", icon: FiPhone, placeholder: "+62 812-3456-7890" },
    { name: "jumlah_bibit", label: "Jumlah Bibit", icon: FiCheckCircle, type: "number", placeholder: "100" },
    { name: "jenis_bibit", label: "Jenis Bibit", icon: FiCheckCircle, placeholder: "Mangrove, Bakau, dll" },
    { name: "tanggal_pelaksanaan", label: "Tanggal Pelaksanaan", icon: FiCalendar, type: "date" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/20 px-4 py-2 rounded-full mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Formulir Perencanaan</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Form Perencanaan Kegiatan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Isi data dengan lengkap untuk merencanakan kegiatan konservasi
          </p>
        </motion.div>

        {/* Success Animation */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white text-center"
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
              <h3 className="text-2xl font-bold mb-2">Berhasil Disimpan!</h3>
              <p>Data perencanaan Anda telah tersimpan dengan baik</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ Blockchain Connection Card */}
        {!isConnected && (
          <motion.div
            className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3">
              <FiLink className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">
                  💎 Simpan Hash ke Blockchain
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  Hubungkan wallet MetaMask untuk menyimpan hash dokumen ke blockchain Ethereum. 
                  Ini memberikan bukti kriptografis yang tidak dapat diubah.
                </p>
                <motion.button
                  onClick={connectWallet}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium shadow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5" />
                  <span>Hubungkan MetaMask</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ✅ Blockchain Success Info */}
        <AnimatePresence>
          {blockchainData && (
            <motion.div
              className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h4 className="font-bold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5" />
                ✅ Hash Tersimpan di Blockchain
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-32">Document Hash:</span>
                  <code className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono break-all">
                    {blockchainData.docHash}
                  </code>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-32">Transaction:</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${blockchainData.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-blue-600 hover:text-blue-800 underline break-all text-xs"
                  >
                    {blockchainData.txHash}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-32">Block Number:</span>
                  <span className="text-gray-900 dark:text-gray-100">{blockchainData.blockNumber}</span>
                </div>
              </div>
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
            {/* Input Fields Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {inputFields.map((field, index) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="group"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    <field.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formik.values[field.name]}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 bg-white dark:bg-gray-700 dark:text-gray-100 transition-all duration-300 ${
                        formik.touched[field.name] && formik.errors[field.name]
                          ? "border-red-400 focus:ring-4 focus:ring-red-200"
                          : "border-gray-200 dark:border-gray-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50"
                      }`}
                    />
                  </div>
                  {formik.touched[field.name] && formik.errors[field.name] && (
                    <motion.p
                      className="text-red-500 text-sm mt-2 flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span>⚠️</span>
                      {formik.errors[field.name]}
                    </motion.p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Jenis Kegiatan */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Jenis Kegiatan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["Planting Mangrove", "Coral Transplanting"].map((option) => (
                  <motion.label
                    key={option}
                    className={`relative cursor-pointer group`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="radio"
                      name="jenis_kegiatan"
                      value={option}
                      checked={formik.values.jenis_kegiatan === option}
                      onChange={formik.handleChange}
                      className="peer sr-only"
                    />
                    <div className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 ${
                      formik.values.jenis_kegiatan === option
                        ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 shadow-lg"
                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                    }`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        formik.values.jenis_kegiatan === option
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-gray-300 dark:border-gray-500"
                      }`}>
                        {formik.values.jenis_kegiatan === option && (
                          <motion.div
                            className="w-3 h-3 rounded-full bg-white"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                        )}
                      </div>
                      <span className={`font-semibold text-lg ${
                        formik.values.jenis_kegiatan === option
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-gray-700 dark:text-gray-300"
                      }`}>
                        {option}
                      </span>
                    </div>
                  </motion.label>
                ))}
              </div>
              {formik.touched.jenis_kegiatan && formik.errors.jenis_kegiatan && (
                <motion.p
                  className="text-red-500 text-sm mt-3 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>⚠️</span>
                  {formik.errors.jenis_kegiatan}
                </motion.p>
              )}
            </motion.div>

            {/* ✅ INTERACTIVE MAP - Tandai Lokasi Baru */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                <FiMapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Tandai Lokasi di Peta
                <span className="text-red-500">*</span>
              </label>

              {/* Info Box */}
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">
                      📍 Cara Menandai Lokasi
                    </h4>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                      <li>Klik tombol "Pusatkan ke Lokasi Saya" untuk memudahkan (opsional)</li>
                      <li><strong>Klik pada peta</strong> di lokasi yang diinginkan</li>
                      <li>Marker hijau akan muncul di lokasi yang dipilih</li>
                      <li>Koordinat otomatis tersimpan</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Map Controls */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {/* Coordinates Display */}
                <input
                  type="text"
                  value={formik.values.lokasi || "Belum ada lokasi yang ditandai"}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 font-mono text-sm"
                />
                
                {/* Center Map Button */}
                <motion.button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiNavigation className="w-5 h-5" />
                  <span className="hidden sm:inline">Pusatkan ke Lokasi Saya</span>
                  <span className="sm:hidden">Lokasi Saya</span>
                </motion.button>
              </div>

              {/* Interactive Map */}
              <motion.div
                className="rounded-2xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-700 shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: "500px", width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker 
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                  />
                </MapContainer>
              </motion.div>

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

              {/* Success indicator */}
              {selectedLocation && (
                <motion.div
                  className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <FiCheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Lokasi berhasil ditandai!</span>
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    Koordinat: <span className="font-mono">{formik.values.lokasi}</span>
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                type="submit"
                disabled={submitting || savingToBlockchain}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all ${
                  submitting || savingToBlockchain
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white"
                }`}
              >
                {savingToBlockchain ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    Menyimpan ke Blockchain...
                  </span>
                ) : submitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiCheckCircle className="w-6 h-6" />
                    {isConnected ? "Simpan Data & Hash ke Blockchain" : "Simpan Data Perencanaan"}
                  </span>
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PerencanaanForm;
