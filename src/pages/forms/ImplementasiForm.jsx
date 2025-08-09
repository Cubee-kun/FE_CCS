import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Container,
  Paper,
} from '@mui/material';
import api from '../../api/axios';

const ImplementasiForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validationSchema = Yup.object({
    pic_koorlap: Yup.string().required('Wajib diisi'),
    dokumentasi: Yup.mixed().required('Wajib diisi'),
    geotagging: Yup.string().required('Wajib diisi'),
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
      pic_koorlap: '',
      dokumentasi: null,
      geotagging: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('kesesuaian', JSON.stringify(values.kesesuaian));
        formData.append('pic_koorlap', values.pic_koorlap);
        formData.append('dokumentasi', values.dokumentasi);
        formData.append('geotagging', values.geotagging);

        await api.post('/implementasi', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
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
          Form Implementasi Kegiatan
        </Typography>

        {success && (
          <Typography color="success.main" sx={{ mb: 2 }}>
            Data berhasil disimpan!
          </Typography>
        )}

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Checklist Kesesuaian Perencanaan:
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={formik.values.kesesuaian.nama_perusahaan}
                onChange={(e) =>
                  formik.setFieldValue('kesesuaian.nama_perusahaan', e.target.checked)
                }
              />
            }
            label="Nama Perusahaan sesuai"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formik.values.kesesuaian.lokasi}
                onChange={(e) => formik.setFieldValue('kesesuaian.lokasi', e.target.checked)}
              />
            }
            label="Lokasi sesuai"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formik.values.kesesuaian.jenis_kegiatan}
                onChange={(e) =>
                  formik.setFieldValue('kesesuaian.jenis_kegiatan', e.target.checked)
                }
              />
            }
            label="Jenis kegiatan sesuai"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formik.values.kesesuaian.jumlah_bibit}
                onChange={(e) =>
                  formik.setFieldValue('kesesuaian.jumlah_bibit', e.target.checked)
                }
              />
            }
            label="Jumlah bibit sesuai"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formik.values.kesesuaian.jenis_bibit}
                onChange={(e) =>
                  formik.setFieldValue('kesesuaian.jenis_bibit', e.target.checked)
                }
              />
            }
            label="Jenis bibit sesuai"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formik.values.kesesuaian.tanggal}
                onChange={(e) => formik.setFieldValue('kesesuaian.tanggal', e.target.checked)}
              />
            }
            label="Tanggal sesuai"
          />

          <TextField
            fullWidth
            margin="normal"
            label="PIC Koorlap"
            name="pic_koorlap"
            value={formik.values.pic_koorlap}
            onChange={formik.handleChange}
            error={formik.touched.pic_koorlap && Boolean(formik.errors.pic_koorlap)}
            helperText={formik.touched.pic_koorlap && formik.errors.pic_koorlap}
          />

          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Dokumentasi Kegiatan (foto):</Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                formik.setFieldValue('dokumentasi', event.currentTarget.files[0]);
              }}
            />
            {formik.touched.dokumentasi && formik.errors.dokumentasi && (
              <Typography color="error" variant="caption">
                {formik.errors.dokumentasi}
              </Typography>
            )}
          </Box>

          <TextField
            fullWidth
            margin="normal"
            label="Geotagging (maps/pin lokasi penanaman)"
            name="geotagging"
            value={formik.values.geotagging}
            onChange={formik.handleChange}
            error={formik.touched.geotagging && Boolean(formik.errors.geotagging)}
            helperText={formik.touched.geotagging && formik.errors.geotagging}
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

export default ImplementasiForm;