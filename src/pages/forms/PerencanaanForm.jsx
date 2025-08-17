import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";
import { FiMapPin } from "react-icons/fi";

const PerencanaanForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingLokasi, setLoadingLokasi] = useState(false);
  const [errorLokasi, setErrorLokasi] = useState("");

  const validationSchema = Yup.object({
    nama_perusahaan: Yup.string().required("Wajib diisi"),
    nama_pic: Yup.string().required("Wajib diisi"),
    narahubung: Yup.string().required("Wajib diisi"),
    jenis_kegiatan: Yup.string().required("Pilih salah satu"),
    lokasi: Yup.string().required("Wajib diisi"),
    jumlah_bibit: Yup.number()
      .required("Wajib diisi")
      .positive("Harus positif"),
    jenis_bibit: Yup.string().required("Wajib diisi"),
    tanggal_pelaksanaan: Yup.date().required("Wajib diisi"),
  });

  const formik = useFormik({
    initialValues: {
      nama_perusahaan: "",
      nama_pic: "",
      narahubung: "",
      jenis_kegiatan: "",
      lokasi: "", // ini akan kita isi otomatis dari geotagging
      jumlah_bibit: "",
      jenis_bibit: "",
      tanggal_pelaksanaan: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        await api.post("/perencanaan", values);
        setSuccess(true);
        formik.resetForm();
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        console.error("Error submitting form:", error);
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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-green-100 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h1 className="text-3xl font-bold mb-6 text-green-800 text-center">
            Form Perencanaan Kegiatan
          </h1>

          {success && (
            <div className="mb-6 p-3 text-green-800 bg-green-100 border border-green-300 rounded-lg text-center animate-fade-in">
              ✅ Data berhasil disimpan!
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            {/* Input generator */}
            {[
              { name: "nama_perusahaan", label: "Nama Perusahaan", type: "text" },
              { name: "nama_pic", label: "Nama PIC", type: "text" },
              { name: "narahubung", label: "Narahubung", type: "text" },
              { name: "jumlah_bibit", label: "Jumlah Bibit yang Ditanam", type: "number" },
              { name: "jenis_bibit", label: "Jenis Bibit Tanaman", type: "text" },
              { name: "tanggal_pelaksanaan", label: "Tanggal Pelaksanaan", type: "date" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 font-medium mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formik.values[field.name]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition ${
                    formik.touched[field.name] && formik.errors[field.name]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-green-500"
                  }`}
                />
                {formik.touched[field.name] && formik.errors[field.name] && (
                  <p className="text-red-500 text-sm mt-1">
                    {formik.errors[field.name]}
                  </p>
                )}
              </div>
            ))}

            {/* Lokasi dengan Geotagging */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Lokasi (Geotagging)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="lokasi"
                  value={formik.values.lokasi}
                  readOnly
                  className={`flex-grow border rounded-lg px-3 py-2 bg-gray-50 focus:outline-none ${
                    formik.touched.lokasi && formik.errors.lokasi
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Klik Ambil Lokasi"
                />
                <button
                  type="button"
                  onClick={ambilLokasi}
                  disabled={loadingLokasi}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <FiMapPin />
                  {loadingLokasi ? "Mencari..." : "Ambil"}
                </button>
              </div>
              {formik.touched.lokasi && formik.errors.lokasi && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.lokasi}
                </p>
              )}
              {errorLokasi && (
                <p className="text-red-500 text-sm mt-1">{errorLokasi}</p>
              )}
              {formik.values.lokasi && (
                <iframe
                  title="Map Preview"
                  className="mt-3 w-full h-60 rounded-lg border border-gray-300"
                  src={`https://maps.google.com/maps?q=${formik.values.lokasi}&z=15&output=embed`}
                ></iframe>
              )}
            </div>

            {/* Radio group */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Jenis Kegiatan
              </label>
              <div className="flex flex-wrap gap-4">
                {["Planting Mangrove", "Coral Transplanting"].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition ${
                      formik.values.jenis_kegiatan === option
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-300 hover:bg-gray-50"
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
              {formik.touched.jenis_kegiatan &&
                formik.errors.jenis_kegiatan && (
                  <p className="text-red-500 text-sm mt-1">
                    {formik.errors.jenis_kegiatan}
                  </p>
                )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                submitting
                  ? "bg-green-400 text-white cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800 text-white shadow-md"
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
