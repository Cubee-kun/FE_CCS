import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";

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
    <div>
      <label className="block font-medium text-gray-800 dark:text-gray-200 mb-2">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {["<25%", "25–45%", "50–74%", ">75%"].map((option) => (
          <label
            key={option}
            className={`flex items-center justify-center border rounded-xl py-2 px-3 cursor-pointer 
              transition shadow-sm
              ${
                formik.values.kondisi_daun[name] === option
                  ? "bg-green-600 text-white border-green-600 shadow-md"
                  : "bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            <input
              type="radio"
              name={`kondisi_daun.${name}`}
              value={option}
              checked={formik.values.kondisi_daun[name] === option}
              onChange={(e) => formik.setFieldValue(`kondisi_daun.${name}`, e.target.value)}
              className="hidden"
            />
            {option}
          </label>
        ))}
      </div>
      {formik.touched.kondisi_daun?.[name] && formik.errors.kondisi_daun?.[name] && (
        <p className="text-red-500 text-sm mt-1">{formik.errors.kondisi_daun[name]}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 md:p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg transition">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-green-700 dark:text-green-400">
        📋 Form Monitoring Kegiatan
      </h2>

      {success && (
        <p className="text-green-600 dark:text-green-400 mb-4 text-center font-medium">
          ✅ Data berhasil disimpan!
        </p>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-8">
        {/* Input grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: "jumlah_bibit_ditanam", label: "Jumlah Bibit Ditanam", type: "number", placeholder: "contoh: 100" },
            { name: "jumlah_bibit_mati", label: "Jumlah Bibit Mati", type: "number", placeholder: "contoh: 5" },
            { name: "diameter_batang", label: "Diameter Batang (cm)", type: "number", step: "0.1", placeholder: "contoh: 2.5" },
            { name: "jumlah_daun", label: "Jumlah Daun", type: "number", placeholder: "contoh: 20" },
            { name: "survival_rate", label: "Survival Rate (%)", type: "number", placeholder: "0 - 100" },
          ].map(({ name, label, type, step, placeholder }) => (
            <div key={name}>
              <label className="block text-gray-800 dark:text-gray-200 font-medium mb-1">{label}</label>
              <input
                type={type}
                step={step}
                name={name}
                placeholder={placeholder}
                value={formik.values[name]}
                onChange={formik.handleChange}
                className="w-full border rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800 
                  text-gray-900 dark:text-gray-100 
                  focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              />
              {formik.touched[name] && formik.errors[name] && (
                <p className="text-red-500 text-sm">{formik.errors[name]}</p>
              )}
            </div>
          ))}
        </div>

        {/* kondisi daun */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
            🌱 Kondisi Kesehatan Bibit
          </h3>
          {renderRadioGroup("mengering", "Daun Mengering")}
          {renderRadioGroup("layu", "Daun Layu")}
          {renderRadioGroup("menguning", "Daun Menguning")}
          {renderRadioGroup("bercak", "Bercak Daun")}
          {renderRadioGroup("hama", "Daun Terserang Hama / Dimakan Hewan")}
        </div>

        {/* upload file */}
        <div>
          <label className="block text-gray-800 dark:text-gray-200 font-medium mb-2">
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
        </div>

        {/* tombol submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-600 dark:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold 
          hover:bg-green-700 dark:hover:bg-green-600 transition shadow-md disabled:opacity-50"
        >
          {submitting ? "⏳ Menyimpan..." : "💾 Simpan Data"}
        </button>
      </form>
    </div>
  );
};

export default MonitoringForm;
