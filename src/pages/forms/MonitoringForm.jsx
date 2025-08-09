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

const MonitoringForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validationSchema = Yup.object({
    jumlah_bibit_ditanam: Yup.number().required('Wajib diisi').positive('Harus positif'),
    jumlah_bibit_mati: Yup.number().required('Wajib diisi').min(0, 'Tidak boleh negatif'),
    diameter_batang: Yup.number().required('Wajib diisi').positive('Harus positif'),
    jumlah_daun: Yup.number().required('Wajib diisi').positive('Harus positif'),
    survival_rate: Yup.number().required('Wajib diisi').min(0).max(100),
    kondisi_daun: Yup.object().shape({
      mengering: Yup.string().required('Wajib dipilih'),
      layu: Yup.string().required('Wajib dipilih'),
      menguning: Yup.string().required('Wajib dipilih'),
      bercak: Yup.string().required('Wajib dipilih'),
      hama: Yup.string().required('Wajib dipilih'),
    }),
    dokumentasi: Yup.mixed().required('Wajib diisi'),
  });

  const formik = useFormik({
    initialValues: {
      jumlah_bibit_ditanam: '',
      jumlah_bibit_mati: '',
      diameter_batang: '',
      jumlah_daun: '',
      survival_rate: '',
      kondisi_daun: {
        mengering: '',
        layu: '',
        menguning: '',
        bercak: '',
        hama: '',
      },
      dokumentasi: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (key !== 'dokumentasi') {
            formData.append(key, JSON.stringify(values[key]));
          } else {
            formData.append(key, values[key]);
          }
        });

        await api.post('/monitoring', formData, {
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

  const renderRadioGroup = (name, label) => (
    <FormControl component="fieldset" sx={{ mt: 1, mb: 2 }}>
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup
        row
        name={`kondisi_daun.${name}`}
        value={formik.values.kondisi_daun[name]}
        onChange={(e) =>
          formik.setFieldValue(`kondisi_daun.${name}`, e.target.value)
        }
      >
        <FormControlLabel value="<25%" control={<Radio />} label="<25%" />
        <FormControlLabel value="25–45%" control={<Radio />} label="25–45%" />
        <FormControlLabel value="50–74%" control={<Radio />} label="50–74%" />
        <FormControlLabel value=">75%" control={<Radio />} label=">75%" />
      </RadioGroup>
      {formik.touched.kondisi_daun?.[name] && formik.errors.kondisi_daun?.[name] && (
        <Typography color="error" variant="caption">
          {formik.errors.kondisi_daun[name]}
        </Typography>
      )}
    </FormControl>
  );

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Form Monitoring Kegiatan
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
            label="Jumlah Bibit Ditanam"
            name="jumlah_bibit_ditanam"
            type="number"
            value={formik.values.jumlah_bibit_ditanam}
            onChange={formik.handleChange}
            error={
              formik.touched.jumlah_bibit_ditanam &&
              Boolean(formik.errors.jumlah_bibit_ditanam)
            }
            helperText={
              formik.touched.jumlah_bibit_ditanam && formik.errors.jumlah_bibit_ditanam
            }
          />

          <TextField
            fullWidth
            margin="normal"
            label="Jumlah Bibit Mati"
            name="jumlah_bibit_mati"
            type="number"
            value={formik.values.jumlah_bibit_mati}
            onChange={formik.handleChange}
            error={
              formik.touched.jumlah_bibit_mati && Boolean(formik.errors.jumlah_bibit_mati)
            }
            helperText={
              formik.touched.jumlah_bibit_mati && formik.errors.jumlah_bibit_mati
            }
          />

          <TextField
            fullWidth
            margin="normal"
            label="Diameter Batang (cm)"
            name="diameter_batang"
            type="number"
            step="0.1"
            value={formik.values.diameter_batang}
            onChange={formik.handleChange}
            error={
              formik.touched.diameter_batang && Boolean(formik.errors.diameter_batang)
            }
            helperText={
              formik.touched.diameter_batang && formik.errors.diameter_batang
            }
          />

          <TextField
            fullWidth
            margin="normal"
            label="Jumlah Daun"
            name="jumlah_daun"
            type="number"
            value={formik.values.jumlah_daun}
            onChange={formik.handleChange}
            error={formik.touched.jumlah_daun && Boolean(formik.errors.jumlah_daun)}
            helperText={formik.touched.jumlah_daun && formik.errors.jumlah_daun}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Survival Rate (%)"
            name="survival_rate"
            type="number"
            value={formik.values.survival_rate}
            onChange={formik.handleChange}
            error={
              formik.touched.survival_rate && Boolean(formik.errors.survival_rate)
            }
            helperText={
              formik.touched.survival_rate && formik.errors.survival_rate
            }
            inputProps={{ min: 0, max: 100 }}
          />

          <Typography variant="h6" sx={{ mt: 3 }}>
            Kondisi Kesehatan Bibit:
          </Typography>

          {renderRadioGroup('mengering', 'Daun mengering')}
          {renderRadioGroup('layu', 'Daun layu')}
          {renderRadioGroup('menguning', 'Daun menguning')}
          {renderRadioGroup('bercak', 'Bercak daun')}
          {renderRadioGroup('hama', 'Daun terserang hama/dimakan hewan/serangga')}

          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Dokumentasi Monitoring:</Typography>
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

export default MonitoringForm;