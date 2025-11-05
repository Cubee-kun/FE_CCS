import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";
import { FiCheckCircle, FiUpload, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const MonitoringForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validationSchema = Yup.object({
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
  });

  const formik = useFormik({
    initialValues: {
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
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (key !== "dokumentasi") {
            formData.append(key, JSON.stringify(values[key]));
          } else {
            values[key].forEach((file) => {
              formData.append("dokumentasi", file);
            });
          }
        });

        await api.post("/forms/monitoring", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setSuccess(true);
        formik.resetForm();
      } catch (error) {
        console.error("Error submitting form:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

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
            📋 Form Monitoring Kegiatan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Monitoring dan evaluasi kesehatan bibit tanaman
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
                📸 Dokumentasi Monitoring
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files);
                  formik.setFieldValue("dokumentasi", files);
                }}
                className="block w-full text-sm text-gray-600 dark:text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-50 file:text-green-700
                  hover:file:bg-green-100 dark:file:bg-green-900 dark:file:text-green-300
                  dark:hover:file:bg-green-800"
              />
              {formik.touched.dokumentasi && formik.errors.dokumentasi && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.dokumentasi}</p>
              )}

              {/* preview */}
              {formik.values.dokumentasi && formik.values.dokumentasi.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formik.values.dokumentasi.map((file, index) => (
                    <div
                      key={index}
                      className="relative w-full h-32 border rounded-xl overflow-hidden group shadow-sm"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = [...formik.values.dokumentasi];
                          newFiles.splice(index, 1);
                          formik.setFieldValue("dokumentasi", newFiles);
                        }}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-90 hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
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
