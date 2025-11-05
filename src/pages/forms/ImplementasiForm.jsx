import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FiCheck, FiX, FiUpload, FiImage, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// Icon marker default Leaflet fix
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LocationPicker = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
};

const ImplementasiForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const validationSchema = Yup.object({
    pic_koorlap: Yup.string().required("Wajib diisi"),
    dokumentasi: Yup.mixed().required("Wajib diisi"),
    geotagging: Yup.string().required("Wajib diisi"),
  });

  const formik = useFormik({
    initialValues: {
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
        formData.append("kesesuaian", JSON.stringify(values.kesesuaian));
        formData.append("pic_koorlap", values.pic_koorlap);
        // if dokumentasi is array, append each file
        if (Array.isArray(values.dokumentasi)) {
          values.dokumentasi.forEach((file) => formData.append("dokumentasi[]", file));
        }
        formData.append("geotagging", values.geotagging);

        await api.post("/forms/implementasi", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setSuccess(true);
        formik.resetForm();
        setSelectedLocation(null);
      } catch (error) {
        console.error("Error submitting form:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

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
                Dokumentasi Monitoring <span className="text-red-500">*</span>
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

            {/* Geotagging Map */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Geotagging Lokasi Penanaman <span className="text-red-500">*</span>
              </label>
              <div className="h-64 w-full rounded-lg overflow-hidden border dark:border-gray-700 mt-2 shadow-sm">
                <MapContainer
                  center={[-6.2, 106.8]}
                  zoom={5}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker
                    onSelect={(latlng) => {
                      setSelectedLocation(latlng);
                      formik.setFieldValue("geotagging", `${latlng.lat},${latlng.lng}`);
                    }}
                  />
                  {selectedLocation && <Marker position={selectedLocation} icon={markerIcon} />}
                </MapContainer>
              </div>
              {formik.touched.geotagging && formik.errors.geotagging && (
                <p className="text-red-500 text-xs mt-1">{formik.errors.geotagging}</p>
              )}
              {formik.values.geotagging && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Titik dipilih: {formik.values.geotagging}
                </p>
              )}
            </div>

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
              {submitting ? "Menyimpan..." : "💾 Simpan Data Implementasi"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ImplementasiForm;
