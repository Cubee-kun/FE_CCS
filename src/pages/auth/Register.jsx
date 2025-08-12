// src/pages/auth/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon, HomeIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      return;
    }

    const result = await register(form);
    if (!result.success) {
      setError(result.message || "Pendaftaran gagal");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-green-200 via-emerald-100 to-lime-100">
      {/* Left Side Image */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center p-10 relative">
        <img
          src="/images/login-bg.jpg"
          alt="Register background"
          className="rounded-3xl shadow-2xl object-cover w-full h-full"
        />
        <div className="absolute bottom-10 left-10 bg-white/70 backdrop-blur-md px-6 py-3 rounded-xl shadow-lg border border-green-100">
          <h2 className="text-xl font-bold text-green-800">
            Daftar & Bergabung
          </h2>
          <p className="text-green-700 text-sm">
            Bersama memajukan argopariwisata 🌱
          </p>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg p-8 space-y-6 relative border border-green-100">
          {/* Home Button */}
          <Link
            to="/"
            className="absolute top-5 left-5 text-green-700 hover:text-green-900 transition-colors"
            title="Kembali ke Home"
          >
            <HomeIcon className="h-6 w-6" />
          </Link>

          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-green-900 tracking-tight">
              Buat Akun Baru ✨
            </h2>
            <p className="text-green-800 text-sm mt-2">
              Bergabung dan mulai berkontribusi
            </p>
          </div>

          {error && (
            <div className="bg-red-100/80 text-red-700 px-4 py-2 rounded-lg text-sm text-center shadow-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-green-900 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Masukkan nama lengkap"
                className="block w-full px-4 py-2 border border-green-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white/90"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-green-900 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="Masukkan email Anda"
                className="block w-full px-4 py-2 border border-green-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white/90"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-green-900 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Masukkan password"
                  className="block w-full px-4 py-2 border border-green-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none pr-10 bg-white/90"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-green-700 hover:text-green-900 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-green-900 mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  required
                  placeholder="Ulangi password"
                  className="block w-full px-4 py-2 border border-green-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none pr-10 bg-white/90"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-green-700 hover:text-green-900 transition-colors"
                >
                  {showConfirm ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-semibold tracking-wide transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Daftar
            </button>
          </form>

          <p className="text-center text-sm text-green-800">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-green-900 hover:underline font-medium"
            >
              Login disini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
