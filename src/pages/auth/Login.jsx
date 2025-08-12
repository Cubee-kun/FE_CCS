// src/pages/auth/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon, HomeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(credentials);

    setLoading(false);

    if (!result.success) {
      setError(result.message || "Login gagal");
    } else {
      localStorage.setItem("user", JSON.stringify(result.data.user));

      if (result.data.user.role === "admin") {
        navigate("/admin");
      } else if (result.data.user.role === "user") {
        navigate("/user");
      } else {
        navigate("/");
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Left Side Image - Desktop Only */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 z-10"></div>
        <img
          src="/images/login-bg.jpg"
          alt="Login background"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="relative z-20 w-full max-w-lg bg-white/90 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-xl border border-white/20">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">Selamat Datang Kembali</h1>
          <p className="text-emerald-700/90 mb-6">
            Sistem Manajemen CCS yang aman dan efisien untuk kebutuhan bisnis Anda
          </p>
          <div className="space-y-4">
            {[
              { icon: "🔒", text: "Autentikasi aman dengan enkripsi" },
              { icon: "⚡", text: "Proses cepat dan responsif" },
              { icon: "🌱", text: "Ramah lingkungan - paperless" }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-emerald-800/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-white/20 relative">
          {/* Home Button - Top Right */}
          <Link
            to="/"
            className="absolute top-4 right-4 text-emerald-800 hover:text-emerald-800 transition-colors p-2 rounded-full hover:bg-emerald-50"
            title="Kembali ke Home"
          >
            <HomeIcon className="h-5 w-5" />
          </Link>

          {/* Form Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-center">
            <h2 className="text-2xl font-bold text-white">Masuk ke Akun Anda</h2>
            <p className="text-white/90 text-sm mt-1">
              Silakan masuk untuk mengakses dashboard
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 bg-red-50/80 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2 border border-red-100">
                <div className="flex-1 text-center">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Alamat Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                    required
                    placeholder="email@example.com"
                    className="block w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        password: e.target.value,
                      })
                    }
                    required
                    placeholder="••••••••"
                    className="block w-full px-4 py-2.5 text-sm md:text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-12 transition-all bg-white placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-emerald-600 transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm md:text-base tracking-wide transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Masuk Sekarang</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                Belum punya akun?{" "}
                <Link
                  to="/register"
                  className="font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                >
                  Buat akun baru
                </Link>
              </p>
            </div>

            <div className="mt-6 md:mt-8 border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500 text-center">
                © {new Date().getFullYear()} CCS System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}