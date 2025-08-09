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
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Form Perencanaan Kegiatan
        </Typography>

        {success && (
          <Typography color="success.main" sx={{ mb: 2 }}>
            Data berhasil disimpan!
          </Typography>
        )}

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Nama Perusahaan"
            name="nama_perusahaan"
            value={formik.values.nama_perusahaan}
            onChange={formik.handleChange}
            error={formik.touched.nama_perusahaan && Boolean(formik.errors.nama_perusahaan)}
            helperText={formik.touched.nama_perusahaan && formik.errors.nama_perusahaan}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Nama PIC"
            name="nama_pic"
            value={formik.values.nama_pic}
            onChange={formik.handleChange}
            error={formik.touched.nama_pic && Boolean(formik.errors.nama_pic)}
            helperText={formik.touched.nama_pic && formik.errors.nama_pic}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Narahubung"
            name="narahubung"
            value={formik.values.narahubung}
            onChange={formik.handleChange}
            error={formik.touched.narahubung && Boolean(formik.errors.narahubung)}
            helperText={formik.touched.narahubung && formik.errors.narahubung}
          />

          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <FormLabel component="legend">Jenis Kegiatan</FormLabel>
            <RadioGroup
              row
              name="jenis_kegiatan"
              value={formik.values.jenis_kegiatan}
              onChange={formik.handleChange}
            >
              <FormControlLabel
                value="Planting Mangrove"
                control={<Radio />}
                label="Planting Mangrove"
              />
              <FormControlLabel
                value="Coral Transplanting"
                control={<Radio />}
                label="Coral Transplanting"
              />
            </RadioGroup>
            {formik.touched.jenis_kegiatan && formik.errors.jenis_kegiatan && (
              <Typography color="error" variant="caption">
                {formik.errors.jenis_kegiatan}
              </Typography>
            )}
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Lokasi"
            name="lokasi"
            value={formik.values.lokasi}
            onChange={formik.handleChange}
            error={formik.touched.lokasi && Boolean(formik.errors.lokasi)}
            helperText={formik.touched.lokasi && formik.errors.lokasi}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Jumlah Bibit yang Ditanam"
            name="jumlah_bibit"
            type="number"
            value={formik.values.jumlah_bibit}
            onChange={formik.handleChange}
            error={formik.touched.jumlah_bibit && Boolean(formik.errors.jumlah_bibit)}
            helperText={formik.touched.jumlah_bibit && formik.errors.jumlah_bibit}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Jenis Bibit Tanaman"
            name="jenis_bibit"
            value={formik.values.jenis_bibit}
            onChange={formik.handleChange}
            error={formik.touched.jenis_bibit && Boolean(formik.errors.jenis_bibit)}
            helperText={formik.touched.jenis_bibit && formik.errors.jenis_bibit}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Tanggal Pelaksanaan"
            name="tanggal_pelaksanaan"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formik.values.tanggal_pelaksanaan}
            onChange={formik.handleChange}
            error={
              formik.touched.tanggal_pelaksanaan && Boolean(formik.errors.tanggal_pelaksanaan)
            }
            helperText={
              formik.touched.tanggal_pelaksanaan && formik.errors.tanggal_pelaksanaan
            }
          />

          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ mt: 3, py: 1.5, width: '100%' }}
          >
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PerencanaanForm;