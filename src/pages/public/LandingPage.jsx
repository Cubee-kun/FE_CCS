import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiPlay, FiStar, FiUsers, FiTrendingUp, FiShield, FiZap, FiHeart, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../../components/common/Footer";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme(); // ✅ Get current theme
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const stats = [
    { label: "Pengguna Aktif", value: "10K+", icon: FiUsers },
    { label: "Proyek Selesai", value: "500+", icon: FiTrendingUp },
    { label: "Rating Kepuasan", value: "4.9/5", icon: FiStar },
    { label: "Tahun Pengalaman", value: "5+", icon: FiShield }
  ];

  const features = [
    {
      title: "Blockchain Recording",
      description: "Sistem pencatatan data menggunakan teknologi blockchain untuk transparansi dan keamanan data yang tidak dapat diubah.",
      icon: "⛓️",
      gradient: "from-blue-500 via-blue-600 to-cyan-500",
      glowColor: "rgba(59, 130, 246, 0.3)",
      benefits: ["Data immutable", "Transparansi penuh", "Audit trail lengkap"]
    },
    {
      title: "Smart Contracts",
      description: "Otomatisasi proses verifikasi dan validasi data menggunakan smart contract untuk menjamin integritas sistem.",
      icon: "📋",
      gradient: "from-purple-500 via-purple-600 to-pink-500",
      glowColor: "rgba(168, 85, 247, 0.3)",
      benefits: ["Verifikasi otomatis", "Validasi real-time", "Kontrak digital"]
    },
    {
      title: "Distributed Ledger",
      description: "Penyimpanan data tersebar dengan sistem ledger yang memastikan keamanan dan aksesibilitas data konservasi.",
      icon: "🌐",
      gradient: "from-green-500 via-emerald-600 to-teal-500",
      glowColor: "rgba(16, 185, 129, 0.3)",
      benefits: ["Sinkronisasi multi-node", "Backup otomatis", "High availability"]
    },
    {
      title: "Crypto Analytics",
      description: "Analisis data konservasi dengan teknologi blockchain analytics untuk insights yang lebih mendalam dan terverifikasi.",
      icon: "📈",
      gradient: "from-orange-500 via-red-500 to-pink-500",
      glowColor: "rgba(249, 115, 22, 0.3)",
      benefits: ["Data terenkripsi", "Analytics on-chain", "Reporting terverifikasi"]
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sari Wijaya",
      role: "Environmental Scientist",
      company: "Green Indonesia Foundation",
      content: "Platform ini benar-benar mengubah cara kami mengelola proyek konservasi. Interface yang intuitif dan fitur monitoring real-time sangat membantu!",
      avatar: "👩‍🔬",
      rating: 5,
      image: "/images/login-bg.jpg"
    },
    {
      name: "Budi Santoso",
      role: "Project Manager",
      company: "EcoTech Solutions",
      content: "Dengan AgroPariwisata, produktivitas tim kami meningkat 300%. Fitur kolaborasi dan AI-nya luar biasa!",
      avatar: "👨‍💼",
      rating: 5,
      image: "/images/login-bg.jpg"
    },
    {
      name: "Maya Kusuma",
      role: "Research Director",
      company: "Marine Conservation NGO",
      content: "Tool terbaik untuk monitoring proyek marine conservation. Dashboard analytics-nya sangat comprehensive dan mudah dipahami.",
      avatar: "👩‍🔬",
      rating: 5,
      image: "/images/login-bg.jpg"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.querySelector(sectionId);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ Smart navigation ke verifikasi berdasarkan status autentikasi
  const handleVerifikasiClick = () => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/admin/verifikasi");
      } else if (user?.role === "user") {
        navigate("/user/verifikasi");
      }
    } else {
      navigate("/verifikasi");
    }
  };

  return (
    <div className={`min-h-screen text-gray-900 dark:text-gray-100 overflow-x-hidden transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' 
        : 'bg-white'
    }`}>
      {/* ✅ Hero Section - dengan dark mode support */}
      <section id="home" className="relative pt-0 md:pt-0 min-h-screen flex items-center overflow-hidden">
        {/* Background - Responsive to theme */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${
            theme === 'dark'
              ? 'from-gray-900 via-gray-800 to-gray-900'
              : 'from-emerald-50 via-white to-teal-50'
          }`}></div>
          <div className={`absolute inset-0 bg-[url('/images/login-bg.jpg')] bg-cover bg-center ${
            theme === 'dark' ? 'opacity-10' : 'opacity-5'
          }`}></div>
          
          {/* Floating Elements - Color changes with theme */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                theme === 'dark' 
                  ? 'bg-emerald-400' 
                  : 'bg-emerald-200'
              }`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge - Theme adaptive */}
              <motion.div 
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm mb-6 shadow-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800/80 backdrop-blur-sm border-emerald-500/30'
                    : 'bg-white backdrop-blur-sm border-emerald-200'
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="mr-2">🌱</span>
                <span className={`font-medium ${
                  theme === 'dark' 
                    ? 'text-emerald-300' 
                    : 'text-emerald-700'
                }`}>
                  Platform Konservasi Terdepan
                </span>
                <div className="ml-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                className={`text-4xl md:text-6xl font-bold leading-tight mb-6 transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span>Revolusi</span>{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Konservasi Digital
                </span>{" "}
                <motion.span
                  className="inline-block"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  🌍
                </motion.span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className={`text-xl mb-8 leading-relaxed transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-300' 
                    : 'text-gray-600'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Platform all-in-one untuk manajemen proyek konservasi dengan{" "}
                <span className="font-semibold text-emerald-500 dark:text-emerald-400">teknologi blockchain</span>,{" "}
                pencatatan immutable, dan transparansi data yang terjamin.
              </motion.p>

              {/* Key Points - Theme adaptive */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {[
                  { icon: FiZap, text: "Blockchain-powered" },
                  { icon: FiShield, text: "Data immutable" },
                  { icon: FiHeart, text: "Transparansi penuh" },
                  { icon: FiUsers, text: "Distributed network" }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      className="flex items-center space-x-3"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        theme === 'dark'
                          ? 'bg-emerald-900/40 text-emerald-400'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`font-medium transition-colors ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        {item.text}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <motion.button
                  onClick={() => navigate("/register")}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Mulai Gratis Sekarang
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.button
                  onClick={() => scrollToSection("#features")}
                  className={`px-8 py-4 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all border flex items-center justify-center group ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiPlay className="mr-2 group-hover:scale-110 transition-transform" />
                  Selengkapnya
                </motion.button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.p
                className={`text-sm mt-6 transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                ⭐ Dipercaya oleh 10,000+ organisasi konservasi di Indonesia
              </motion.p>
            </motion.div>

            {/* Right Content - Dashboard Preview */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                {/* Main Dashboard Card */}
                <motion.div
                  className={`rounded-2xl shadow-2xl overflow-hidden border transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`flex items-center justify-between p-4 border-b transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h3 className={`font-semibold transition-colors ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      Dashboard CCS
                    </h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Image Dashboard */}
                  <div className="relative h-96 overflow-hidden">
                    <motion.img
                      src="/images/login-bg.jpg"
                      alt="Dashboard Preview"
                      className={`w-full h-full object-cover transition-opacity ${
                        theme === 'dark' ? 'opacity-70' : 'opacity-100'
                      }`}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 1.5 }}
                    />
                    {/* Overlay gradient */}
                    <div className={`absolute inset-0 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-t from-gray-900/50 via-transparent to-transparent'
                        : 'bg-gradient-to-t from-emerald-900/30 via-transparent to-transparent'
                    }`}></div>
                    
                    {/* Stats overlay */}
                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6`}>
                      <div className="grid grid-cols-3 gap-4">
                                              {[
                                                { label: "Proyek Aktif", value: "24" },
                                                { label: "Tim Online", value: "12" },
                                                { label: "Progress", value: "87%" }
                                              ].map((stat, index) => (
                                                <motion.div 
                                                  key={index} 
                                                  className="text-center"
                                                  initial={{ opacity: 0, y: 20 }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{ delay: 0.5 + index * 0.1 }}
                                                >
                                                  <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
                                                  <div className="text-xs text-emerald-200">{stat.label}</div>
                                                </motion.div>
                                              ))}
                                            </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Cards - Theme adaptive */}
                <motion.div
                  className={`absolute -top-4 -right-4 rounded-lg shadow-lg p-3 border backdrop-blur-sm transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className={`text-xs transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Real-time Update
                  </div>
                  <div className={`text-sm font-semibold transition-colors ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-green-600'
                  }`}>
                    +5 New Reports
                  </div>
                </motion.div>

                <motion.div
                  className={`absolute -bottom-4 -left-4 rounded-lg shadow-lg p-3 border backdrop-blur-sm transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <div className={`text-xs transition-colors ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Blockchain Verified
                  </div>
                  <div className={`text-sm font-semibold transition-colors ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    100% Secure
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Theme adaptive */}
      <section className={`py-8 sm:py-12 md:py-16 transition-colors ${
        theme === 'dark'
          ? 'bg-gray-900/50'
          : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className={`text-center group rounded-2xl p-6 transition-all ${
                  theme === 'dark'
                    ? 'hover:bg-gray-800'
                    : 'hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className={`text-3xl font-bold mb-2 transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </div>
                <div className={`transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section - Theme adaptive (simplified for brevity) */}
      <section id="features" className={`py-16 sm:py-24 md:py-32 relative overflow-hidden transition-colors ${
        theme === 'dark'
          ? 'bg-gray-900'
          : 'bg-gradient-to-b from-white via-gray-50 to-white'
      }`}>
        {/* Background blobs - theme adaptive */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-float ${
            theme === 'dark'
              ? 'bg-emerald-500/10'
              : 'bg-emerald-200/20'
          }`}></div>
          <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-float ${
            theme === 'dark'
              ? 'bg-teal-500/10'
              : 'bg-teal-200/20'
          }`} style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-5xl md:text-6xl font-black mb-6 leading-tight transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Teknologi{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Blockchain
                </span>
              </span>
              <br />untuk Konservasi
            </h2>
            
            <p className={`text-xl max-w-3xl mx-auto leading-relaxed transition-colors ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Sistem pencatatan data konservasi yang <span className="font-semibold">transparan</span>, <span className="font-semibold">aman</span>, dan <span className="font-semibold">tidak dapat diubah</span> menggunakan teknologi blockchain terdepan
            </p>
          </motion.div>

          {/* Features Grid - Theme adaptive */}
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br rounded-3xl transition-all duration-500 ${
                  theme === 'dark'
                    ? 'from-gray-800 to-gray-700/50'
                    : 'from-white to-gray-50'
                }`}></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-all duration-500`}></div>
                
                <div className={`relative rounded-3xl p-8 border transition-all duration-500 shadow-lg group-hover:shadow-2xl ${
                  theme === 'dark'
                    ? 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50 group-hover:border-gray-600/50'
                    : 'bg-white/80 backdrop-blur-xl border-gray-200/50 group-hover:border-gray-300/50'
                }`}>
                  {/* Content */}
                  <div className="flex items-start gap-6 mb-6">
                    <motion.div 
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-xl`}>
                        {feature.icon}
                      </div>
                    </motion.div>
                    
                    <div className="flex-1">
                      <h3 className={`text-2xl font-bold mb-3 transition-colors ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {feature.title}
                      </h3>
                      <p className={`leading-relaxed transition-colors ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Benefits */}
                  <div className="space-y-3 mb-6">
                    {feature.benefits.map((benefit, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        viewport={{ once: true }}
                      >
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                          <FiCheck className="w-3 h-3 text-white" />
                        </div>
                        <span className={`text-sm font-medium transition-colors ${
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {benefit}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Kurangi padding */}
      <section id="testimonials" className="py-16 sm:py-24 md:py-32 bg-gradient-to-b from-white via-emerald-50/30 to-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 rounded-full mb-6"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <FiStar className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">Testimoni Pengguna</span>
            </motion.div>

            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
              Apa Kata{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Pengguna Kami
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bergabunglah dengan <span className="font-bold text-emerald-600">10,000+</span> profesional yang telah merasakan transformasi digital dalam konservasi
            </p>
          </motion.div>

          {/* Testimonial Carousel */}
          <div className="relative max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                className="relative"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                {/* Card */}
                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5"></div>
                  
                  <div className="relative grid md:grid-cols-2 gap-8 p-8 md:p-12">
                    {/* Left Side - Image */}
                    <div className="relative">
                      <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                        <motion.img
                          src={testimonials[activeTestimonial].image}
                          alt={testimonials[activeTestimonial].name}
                          className="w-full h-full object-cover"
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.8 }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      </div>

                      {/* Floating Stats */}
                      <motion.div
                        className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className="w-4 h-4 text-amber-400 fill-current" />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-gray-900">5.0</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Perfect Rating</p>
                      </motion.div>
                    </div>

                    {/* Right Side - Content */}
                    <div className="flex flex-col justify-center">
                      {/* Quote Icon */}
                      <div className="mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-3xl text-white">"</span>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex mb-4">
                        {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: i * 0.1, type: "spring" }}
                          >
                            <FiStar className="w-6 h-6 text-amber-400 fill-current" />
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Content */}
                      <blockquote className="text-xl md:text-2xl font-medium text-gray-800 mb-8 leading-relaxed">
                        "{testimonials[activeTestimonial].content}"
                      </blockquote>
                      
                      {/* Author Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
                          {testimonials[activeTestimonial].avatar}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-900">
                            {testimonials[activeTestimonial].name}
                          </div>
                          <div className="text-emerald-600 font-semibold text-sm">
                            {testimonials[activeTestimonial].role}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {testimonials[activeTestimonial].company}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-3 mt-10">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className="relative group"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeTestimonial
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 w-10"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}></div>
                  {index === activeTestimonial && (
                    <motion.div
                      className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-50"
                      layoutId="activeDot"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Arrow Navigation */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4 pointer-events-none">
              <motion.button
                onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="w-12 h-12 rounded-full bg-white shadow-xl border border-gray-200 flex items-center justify-center pointer-events-auto hover:bg-gray-50 transition-all"
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiArrowRight className="w-5 h-5 rotate-180 text-gray-700" />
              </motion.button>
              <motion.button
                onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="w-12 h-12 rounded-full bg-white shadow-xl border border-gray-200 flex items-center justify-center pointer-events-auto hover:bg-gray-50 transition-all"
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiArrowRight className="w-5 h-5 text-gray-700" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Kurangi padding */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-emerald-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Siap Memulai Revolusi Konservasi?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-emerald-100 mb-6 sm:mb-8 max-w-3xl mx-auto">
              Bergabunglah dengan ribuan organisasi yang telah mempercayakan proyek konservasi mereka pada platform kami
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8">
              <motion.button
                onClick={() => navigate("/register")}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-emerald-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Mulai Gratis 14 Hari
              </motion.button>
              <motion.button
                onClick={() => navigate("/contact")}
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-emerald-600 transition-all text-sm sm:text-base"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Hubungi Sales
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default LandingPage;