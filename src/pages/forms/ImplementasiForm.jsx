import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../api/axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Untuk map
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { cn } from "@/lib/utils";

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
        formData.append("dokumentasi", values.dokumentasi);
        formData.append("geotagging", values.geotagging);

        await api.post("/implementasi", formData, {
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <Card className="shadow-xl rounded-2xl border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Form Implementasi Kegiatan
          </CardTitle>
          {success && (
            <p className="text-green-600 text-sm mt-1">
              ✅ Data berhasil disimpan!
            </p>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {/* Checklist */}
            <div>
              <h3 className="text-base font-semibold mb-3 text-gray-700">
                Checklist Kesesuaian Perencanaan
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.keys(formik.values.kesesuaian).map((field) => (
                  <label
                    key={field}
                    className="flex items-center space-x-2 p-2 rounded-md border hover:bg-gray-50 transition cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={formik.values.kesesuaian[field]}
                      onCheckedChange={(val) =>
                        formik.setFieldValue(`kesesuaian.${field}`, val)
                      }
                    />
                    <span className="capitalize">
                      {field.replace("_", " ")} sesuai
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* PIC */}
            <div>
              <Label
                htmlFor="pic_koorlap"
                className="text-sm font-medium text-gray-700"
              >
                PIC Koorlap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pic_koorlap"
                name="pic_koorlap"
                placeholder="Masukkan nama PIC Koorlap"
                value={formik.values.pic_koorlap}
                onChange={formik.handleChange}
                className={cn(
                  "mt-1",
                  formik.touched.pic_koorlap &&
                    formik.errors.pic_koorlap &&
                    "border-red-500"
                )}
              />
              {formik.touched.pic_koorlap && formik.errors.pic_koorlap && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.pic_koorlap}
                </p>
              )}
            </div>

            {/* Upload file dengan preview */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Dokumentasi Monitoring <span className="text-red-500">*</span>
              </Label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files);
                  formik.setFieldValue("dokumentasi", files);
                }}
                className="mt-2 block w-full text-sm text-gray-600
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-100 file:text-green-700
                  hover:file:bg-green-200 transition"
              />

              {formik.touched.dokumentasi && formik.errors.dokumentasi && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.dokumentasi}
                </p>
              )}

              {/* Preview gambar */}
              {formik.values.dokumentasi &&
                formik.values.dokumentasi.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formik.values.dokumentasi.map((file, index) => (
                      <div
                        key={index}
                        className="relative w-full h-32 border rounded-lg overflow-hidden shadow-sm"
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
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Geotagging */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Geotagging Lokasi Penanaman{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="h-64 w-full rounded-lg overflow-hidden border mt-2">
                <MapContainer
                  center={[-6.2, 106.8]} // default Jakarta
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
                      formik.setFieldValue(
                        "geotagging",
                        `${latlng.lat},${latlng.lng}`
                      );
                    }}
                  />
                  {selectedLocation && (
                    <Marker position={selectedLocation} icon={markerIcon} />
                  )}
                </MapContainer>
              </div>
              {formik.touched.geotagging && formik.errors.geotagging && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.geotagging}
                </p>
              )}
              {formik.values.geotagging && (
                <p className="text-xs text-gray-600 mt-1">
                  Titik dipilih: {formik.values.geotagging}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full sm:w-auto px-6"
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImplementasiForm;
