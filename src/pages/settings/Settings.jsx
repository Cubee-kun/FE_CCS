import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FiUser, FiMail, FiLock, FiSave, FiShield, FiCamera } from "react-icons/fi";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

export default function Settings() {
  const { user, refreshUserProfile } = useAuth();
  const avatarInputRef = useRef(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    role: "",
    password: "",
    password_confirmation: "",
  });

  const isPasswordFilled = form.password.trim().length > 0 || form.password_confirmation.trim().length > 0;

  const canSubmit = useMemo(() => {
    if (!form.name.trim() || !form.email.trim()) return false;
    if (isPasswordFilled) {
      if (form.password.length < 6) return false;
      if (form.password !== form.password_confirmation) return false;
    }
    return true;
  }, [form, isPasswordFilled]);

  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await api.get("/user-profile");
        const profile = response.data || {};

        setForm((prev) => ({
          ...prev,
          id: profile.id || user?.id || "",
          name: profile.name || user?.name || "",
          email: profile.email || user?.email || "",
          role: profile.role || user?.role || "user",
          password: "",
          password_confirmation: "",
        }));

        setAvatarPreview(profile.avatar || user?.avatar || "");
      } catch (error) {
        toast.error(error.response?.data?.message || "Gagal memuat profil user");
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran avatar maksimal 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarPreview(result);
      toast.success("Preview avatar diperbarui");
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.warning("Periksa kembali input profil Anda");
      return;
    }

    if (!form.id) {
      toast.error("User ID tidak ditemukan");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
    };

    if (isPasswordFilled) {
      payload.password = form.password;
    }

    setSaving(true);
    try {
      await api.put(`/users/${form.id}`, payload);

      if (avatarPreview) {
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...savedUser, avatar: avatarPreview }));
      }

      await refreshUserProfile();

      setForm((prev) => ({
        ...prev,
        password: "",
        password_confirmation: "",
      }));

      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Gagal memperbarui profil";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen px-4 py-10 bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Memuat profil...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Pengaturan Profil
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Perbarui informasi akun Anda.
          </p>
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          className="rounded-3xl border border-white/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl p-6 md:p-8 space-y-6"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <img
                src={avatarPreview || "https://ui-avatars.com/api/?name=" + encodeURIComponent(form.name || "User") + "&background=10b981&color=ffffff"}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-200 dark:border-emerald-700 shadow-md"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-all"
                aria-label="Upload avatar"
              >
                <FiCamera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Klik ikon kamera untuk upload avatar (maks. 2MB)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                <FiUser className="w-4 h-4 text-emerald-600" />
                Nama
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 transition-all"
                placeholder="Nama lengkap"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                <FiMail className="w-4 h-4 text-emerald-600" />
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 transition-all"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              <FiShield className="w-4 h-4 text-emerald-600" />
              Role
            </label>
            <input
              type="text"
              value={form.role || "user"}
              disabled
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/70 dark:text-gray-200 cursor-not-allowed"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Ubah Password (opsional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <FiLock className="w-4 h-4 text-emerald-600" />
                  Password Baru
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 transition-all"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <FiLock className="w-4 h-4 text-emerald-600" />
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) => onChange("password_confirmation", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 transition-all"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            {isPasswordFilled && form.password !== form.password_confirmation && (
              <p className="text-sm text-red-500 mt-3">Konfirmasi password tidak sama.</p>
            )}
            {isPasswordFilled && form.password.length > 0 && form.password.length < 6 && (
              <p className="text-sm text-red-500 mt-1">Password minimal 6 karakter.</p>
            )}
          </div>

          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={!canSubmit || saving}
              className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                !canSubmit || saving
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
              }`}
              whileHover={!canSubmit || saving ? {} : { scale: 1.02 }}
              whileTap={!canSubmit || saving ? {} : { scale: 0.98 }}
            >
              <FiSave className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
