import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Container,
  Paper,
} from '@mui/material';
import api from '../../api/axios';

const PerencanaanForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validationSchema = Yup.object({
    nama_perusahaan: Yup.string().required('Wajib diisi'),
    nama_pic: Yup.string().required('Wajib diisi'),
    narahubung: Yup.string().required('Wajib diisi'),
    jenis_kegiatan: Yup.string().required('Pilih salah satu'),
    lokasi: Yup.string().required('Wajib diisi'),
    jumlah_bibit: Yup.number().required('Wajib diisi').positive('Harus positif'),
    jenis_bibit: Yup.string().required('Wajib diisi'),
    tanggal_pelaksanaan: Yup.date().required('Wajib diisi'),
  });

  const formik = useFormik({
    initialValues: {
      nama_perusahaan: '',
      nama_pic: '',
      narahubung: '',
      jenis_kegiatan: '',
      lokasi: '',
      jumlah_bibit: '',
      jenis_bibit: '',
      tanggal_pelaksanaan: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        await api.post('/perencanaan', values);
        setSuccess(true);
        formik.resetForm();
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Form Perencanaan Kegiatan
          </h1>
          {success && (
            <div className="mb-4 text-green-700 bg-green-100 border border-green-300 rounded px-4 py-2 text-center">
              Data berhasil disimpan!
            </div>
          )}
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Nama Perusahaan</label>
              <input
                type="text"
                name="nama_perusahaan"
                value={formik.values.nama_perusahaan}
                onChange={formik.handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${formik.touched.nama_perusahaan && formik.errors.nama_perusahaan ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formik.touched.nama_perusahaan && formik.errors.nama_perusahaan && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.nama_perusahaan}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Nama PIC</label>
              <input
                type="text"
                name="nama_pic"
                value={formik.values.nama_pic}
                onChange={formik.handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${formik.touched.nama_pic && formik.errors.nama_pic ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formik.touched.nama_pic && formik.errors.nama_pic && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.nama_pic}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Narahubung</label>
              <input
                type="text"
                name="narahubung"
                value={formik.values.narahubung}
                onChange={formik.handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${formik.touched.narahubung && formik.errors.narahubung ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formik.touched.narahubung && formik.errors.narahubung && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.narahubung}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Jenis Kegiatan</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="jenis_kegiatan"
                    value="Planting Mangrove"
                    checked={formik.values.jenis_kegiatan === "Planting Mangrove"}
                    onChange={formik.handleChange}
                    className="accent-green-600"
                  />
                  Planting Mangrove
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="jenis_kegiatan"
                    value="Coral Transplanting"
                    checked={formik.values.jenis_kegiatan === "Coral Transplanting"}
                    onChange={formik.handleChange}
                    className="accent-green-600"
                  />
                  Coral Transplanting
                </label>
              </div>
              {formik.touched.jenis_kegiatan && formik.errors.jenis_kegiatan && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.jenis_kegiatan}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Lokasi</label>
              <input
                type="text"
                name="lokasi"
                value={formik.values.lokasi}
                onChange={formik.handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${formik.touched.lokasi && formik.errors.lokasi ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formik.touched.lokasi && formik.errors.lokasi && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.lokasi}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Jumlah Bibit yang Ditanam</label>
              <input
                type="number"
                name="jumlah_bibit"
                value={formik.values.jumlah_bibit}
                onChange={formik.handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${formik.touched.jumlah_bibit && formik.errors.jumlah_bibit ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formik.touched.jumlah_bibit && formik.errors.jumlah_bibit && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.jumlah_bibit}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Jenis Bibit Tanaman</label>
              <input
                type="text"
                name="jenis_bibit"
                value={formik.values.jenis_bibit}
                onChange={formik.handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${formik.touched.jenis_bibit && formik.errors.jenis_bibit ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formik.touched.jenis_bibit && formik.errors.jenis_bibit && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.jenis_bibit}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Tanggal Pelaksanaan</label>
              <input
                type="date"
                name="tanggal_pelaksanaan"
                value={formik.values.tanggal_pelaksanaan}
                onChange={formik.handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${formik.touched.tanggal_pelaksanaan && formik.errors.tanggal_pelaksanaan ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formik.touched.tanggal_pelaksanaan && formik.errors.tanggal_pelaksanaan && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.tanggal_pelaksanaan}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PerencanaanForm;