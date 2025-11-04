import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiPlay, FiStar, FiUsers, FiTrendingUp, FiShield, FiZap, FiHeart } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../../components/common/Footer"; // ✅ Import Footer

const LandingPage = () => {
  const navigate = useNavigate();
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
      color: "from-blue-500 to-cyan-500",
      benefits: ["Data immutable", "Transparansi penuh", "Audit trail lengkap"]
    },
    {
      title: "Smart Contracts",
      description: "Otomatisasi proses verifikasi dan validasi data menggunakan smart contract untuk menjamin integritas sistem.",
      icon: "📋",
      color: "from-purple-500 to-pink-500",
      benefits: ["Verifikasi otomatis", "Validasi real-time", "Kontrak digital"]
    },
    {
      title: "Distributed Ledger",
      description: "Penyimpanan data tersebar dengan sistem ledger yang memastikan keamanan dan aksesibilitas data konservasi.",
      icon: "🌐",
      color: "from-green-500 to-teal-500",
      benefits: ["Sinkronisasi multi-node", "Backup otomatis", "High availability"]
    },
    {
      title: "Crypto Analytics",
      description: "Analisis data konservasi dengan teknologi blockchain analytics untuk insights yang lebih mendalam dan terverifikasi.",
      icon: "📈",
      color: "from-orange-500 to-red-500",
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
      rating: 5
    },
    {
      name: "Budi Santoso",
      role: "Project Manager",
      company: "EcoTech Solutions",
      content: "Dengan AgroPariwisata, produktivitas tim kami meningkat 300%. Fitur kolaborasi dan AI-nya luar biasa!",
      avatar: "👨‍💼",
      rating: 5
    },
    {
      name: "Maya Kusuma",
      role: "Research Director",
      company: "Marine Conservation NGO",
      content: "Tool terbaik untuk monitoring proyek marine conservation. Dashboard analytics-nya sangat comprehensive dan mudah dipahami.",
      avatar: "👩‍🔬",
      rating: 5
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

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Hero Section */}
      <section id="home" className="relative pt-20 min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50"></div>
          <div className="absolute inset-0 bg-[url('/images/login-bg.jpg')] bg-cover bg-center opacity-5"></div>
          
          {/* Floating Elements */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-emerald-200 rounded-full"
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div 
                className="inline-flex items-center bg-white backdrop-blur-sm rounded-full px-4 py-2 text-sm mb-6 shadow-lg border border-emerald-200"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="mr-2">🌱</span>
                <span className="font-medium text-emerald-700">Platform Konservasi Terdepan</span>
                <div className="ml-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                className="text-4xl md:text-6xl font-bold leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="text-gray-900">Revolusi</span>{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
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
                className="text-xl text-gray-600 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Platform all-in-one untuk manajemen proyek konservasi dengan{" "}
                <span className="font-semibold text-emerald-600">teknologi blockchain</span>,{" "}
                pencatatan immutable, dan transparansi data yang terjamin.
              </motion.p>

              {/* Key Points */}
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
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Icon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{item.text}</span>
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
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center justify-center group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiPlay className="mr-2 group-hover:scale-110 transition-transform" />
                  Lihat Demo
                </motion.button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.p
                className="text-sm text-gray-500 mt-6"
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
                {/* Main Dashboard Card with Image */}
                <motion.div
                  className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Dashboard CCS</h3>
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
                      className="w-full h-full object-cover"
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 1.5 }}
                    />
                    {/* Overlay gradient untuk efek premium */}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/30 via-transparent to-transparent"></div>
                    
                    {/* Stats overlay di bagian bawah */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
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

                {/* Floating Cards */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 backdrop-blur-sm"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="text-xs text-gray-600">Real-time Update</div>
                  <div className="text-sm font-semibold text-green-600">+5 New Reports</div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 backdrop-blur-sm"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <div className="text-xs text-gray-600">Blockchain Verified</div>
                  <div className="text-sm font-semibold text-blue-600">100% Secure</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
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
                className="text-center group"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Teknologi <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Blockchain</span> untuk Konservasi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistem pencatatan data konservasi yang transparan, aman, dan tidak dapat diubah menggunakan teknologi blockchain terdepan
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-200 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-start space-x-4">
                  <motion.div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {feature.icon}
                  </motion.div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                    
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3"></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    
                    <motion.button
                      className="mt-4 text-emerald-600 font-medium flex items-center group-hover:text-emerald-700 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      Pelajari lebih lanjut
                      <FiArrowRight className="ml-1 w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Apa Kata <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Pengguna Kami</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bergabunglah dengan ribuan profesional yang telah merasakan manfaat platform kami
            </p>
          </motion.div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                className="bg-gray-50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-3xl shadow-lg">
                      {testimonials[activeTestimonial].avatar}
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex justify-center md:justify-start mb-4">
                      {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                        <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <blockquote className="text-xl md:text-2xl text-gray-700 mb-6 leading-relaxed">
                      "{testimonials[activeTestimonial].content}"
                    </blockquote>
                    
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {testimonials[activeTestimonial].name}
                      </div>
                      <div className="text-emerald-600 font-medium">
                        {testimonials[activeTestimonial].role}
                      </div>
                      <div className="text-gray-500">
                        {testimonials[activeTestimonial].company}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === activeTestimonial
                      ? "bg-emerald-500 w-8"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Siap Memulai Revolusi Konservasi?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-3xl mx-auto">
              Bergabunglah dengan ribuan organisasi yang telah mempercayakan proyek konservasi mereka pada platform kami
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <motion.button
                onClick={() => navigate("/register")}
                className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Mulai Gratis 14 Hari
              </motion.button>
              <motion.button
                onClick={() => navigate("/contact")}
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-emerald-600 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Hubungi Sales
              </motion.button>
            </div>
            
            <p className="text-emerald-100 text-sm">
              ✅ Blockchain-verified • ✅ Data immutable • ✅ Transparansi penuh
            </p>
          </motion.div>
        </div>
      </section>

      {/* ✅ Footer Component */}
      <Footer />
    </div>
  );
};

export default LandingPage;