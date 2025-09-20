import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";
import { FiMapPin } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PerencanaanForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loadingLokasi, setLoadingLokasi] = useState(false);
  const [errorLokasi, setErrorLokasi] = useState("");

  const validationSchema = Yup.object({
    nama_perusahaan: Yup.string().required("Wajib diisi"),
    nama_pic: Yup.string().required("Wajib diisi"),
    narahubung: Yup.string().required("Wajib diisi"),
    jenis_kegiatan: Yup.string().required("Pilih salah satu"),
    lokasi: Yup.string().required("Wajib diisi"),
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
        await api.post("/forms/perencanaan", values);
        toast.success("✅ Data berhasil disimpan!", { autoClose: 3000 });
        resetForm();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("❌ Gagal menyimpan data!", { autoClose: 4000 });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const ambilLokasi = () => {
    if (!navigator.geolocation) {
      setErrorLokasi("Browser tidak mendukung geolokasi.");
      return;
    }
    setLoadingLokasi(true);
    setErrorLokasi("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        formik.setFieldValue("lokasi", coords);
        setLoadingLokasi(false);
      },
      (err) => {
        setErrorLokasi("Gagal mengambil lokasi: " + err.message);
        setLoadingLokasi(false);
      }
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-3xl">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 transition">
          <h1 className="text-3xl font-extrabold mb-8 text-green-800 dark:text-green-400 text-center tracking-wide">
            Form Perencanaan Kegiatan
          </h1>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Input generator */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: "nama_perusahaan", label: "Nama Perusahaan", type: "text" },
                { name: "nama_pic", label: "Nama PIC", type: "text" },
                { name: "narahubung", label: "Narahubung", type: "text" },
                { name: "jumlah_bibit", label: "Jumlah Bibit yang Ditanam", type: "number" },
                { name: "jenis_bibit", label: "Jenis Bibit Tanaman", type: "text" },
                { name: "tanggal_pelaksanaan", label: "Tanggal Pelaksanaan", type: "date" },
              ].map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formik.values[field.name]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full border rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 transition focus:outline-none focus:ring-2 ${
                      formik.touched[field.name] && formik.errors[field.name]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 dark:border-gray-700 focus:ring-green-500"
                    }`}
                  />
                  {formik.touched[field.name] && formik.errors[field.name] && (
                    <p className="text-red-500 text-sm mt-1">
                      {formik.errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Lokasi dengan Geotagging */}
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                Lokasi (Geotagging)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  name="lokasi"
                  value={formik.values.lokasi}
                  readOnly
                  className="flex-grow border rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:outline-none"
                  placeholder="Klik Ambil Lokasi"
                />
                <button
                  type="button"
                  onClick={ambilLokasi}
                  disabled={loadingLokasi}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition"
                >
                  <FiMapPin />
                  {loadingLokasi ? "Mencari..." : "Ambil"}
                </button>
              </div>
              {errorLokasi && (
                <p className="text-red-500 text-sm mt-1">{errorLokasi}</p>
              )}
              {formik.values.lokasi && (
                <iframe
                  title="Map Preview"
                  className="mt-4 w-full h-64 rounded-xl border border-gray-300 dark:border-gray-700"
                  src={`https://maps.google.com/maps?q=${formik.values.lokasi}&z=15&output=embed`}
                ></iframe>
              )}
            </div>

            {/* Radio group */}
            <div>
              <label className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                Jenis Kegiatan
              </label>
              <div className="flex flex-wrap gap-4">
                {["Planting Mangrove", "Coral Transplanting"].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer transition font-medium ${
                      formik.values.jenis_kegiatan === option
                        ? "border-green-600 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                        : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="jenis_kegiatan"
                      value={option}
                      checked={formik.values.jenis_kegiatan === option}
                      onChange={formik.handleChange}
                      className="accent-green-600"
                    />
                    {option}
                  </label>
                ))}
              </div>
              {formik.touched.jenis_kegiatan && formik.errors.jenis_kegiatan && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.jenis_kegiatan}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-xl font-semibold text-lg shadow-md transition ${
                submitting
                  ? "bg-green-400 text-white cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800 text-white"
              }`}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PerencanaanForm;
