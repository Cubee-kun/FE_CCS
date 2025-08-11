// src/pages/auth/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon, HomeIcon } from "@heroicons/react/24/outline";

export default function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login(credentials);

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left side image */}
      <div className="hidden md:flex md:w-1/2">
        <img
          src="/images/login-bg.jpg"
          alt="Login background"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Right side form */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12 bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6 relative">
          {/* Home icon */}
          <Link
            to="/"
            className="absolute top-5 left-5 text-green-600 hover:text-green-800 transition-colors"
            title="Kembali ke Home"
          >
            <HomeIcon className="h-6 w-6" />
          </Link>

          <h2 className="text-3xl font-bold text-green-700 text-center">
            Selamat Datang
          </h2>
          <p className="text-center text-gray-500 text-sm">
            Silakan masuk untuk melanjutkan
          </p>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                required
                placeholder="Masukkan email"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  placeholder="Masukkan password"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Login
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link
              to="/register"
              className="text-green-600 hover:underline font-medium"
            >
              Daftar disini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
