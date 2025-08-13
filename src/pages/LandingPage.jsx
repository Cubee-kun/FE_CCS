import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiArrowRight, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const navItems = ["Home", "About", "Services", "Gallery", "Pricing", "Contact"];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const floatingShapes = [
    { icon: "🌿", size: "text-4xl", position: "top-1/4 left-1/6" },
    { icon: "🌱", size: "text-3xl", position: "top-1/3 right-1/5" },
    { icon: "🍃", size: "text-5xl", position: "bottom-1/4 left-1/4" },
    { icon: "🌲", size: "text-6xl", position: "bottom-1/3 right-1/6" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 overflow-x-hidden">
      {/* Modern Navbar */}
      
      <motion.nav 
        className={`flex items-center justify-between px-6 py-4 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 shadow-md backdrop-blur-md" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          src="/images/sebumi.png"
          alt="Sebumi Logo"
          className="h-10 w-auto cursor-pointer"
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />

        <ul className="hidden md:flex space-x-8 items-center">
          {navItems.map((item) => (
            <motion.li
              key={item}
              className="relative px-2 py-1"
              onHoverStart={() => setHoveredItem(item)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <span className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors cursor-pointer relative z-10">
                {item}
              </span>
              {hoveredItem === item && (
                <motion.span
                  className="absolute inset-0 bg-green-100 rounded-md"
                  layoutId="navHover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </motion.li>
          ))}
          <div className="flex space-x-4 ml-6">
            <motion.button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Log in
            </motion.button>
            <motion.button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all shadow-md hover:shadow-lg"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up Free
            </motion.button>
          </div>
        </ul>

        <motion.button 
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </motion.button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 pt-20 bg-white/95 backdrop-blur-lg md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col space-y-6 px-6 py-4">
              {navItems.map((item) => (
                <motion.div
                  key={item}
                  className="text-lg font-medium text-gray-800 hover:text-green-600 transition-colors border-b border-gray-100 py-3 flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {item}
                  <FiArrowRight className="ml-auto opacity-70" />
                </motion.div>
              ))}
              <div className="flex flex-col space-y-4 pt-4">
                <motion.button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="w-full py-3 text-center font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  LOG IN
                </motion.button>
                <motion.button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/register");
                  }}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-full transition-all shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign Up Free
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-16">
        <section className="relative py-20 md:py-32 overflow-hidden min-h-[80vh] flex items-center">
          <div className="absolute inset-0 bg-[url('/images/login-bg.jpg')] bg-cover bg-center opacity-20 overflow-hidden ">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-teal-500/10 to-blue-500/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
            />
            
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute border border-gray-300 rounded-lg"
                  style={{
                    width: `${Math.random() * 200 + 50}px`,
                    height: `${Math.random() * 200 + 50}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    rotate: Math.random() * 360
                  }}
                  animate={{
                    y: [0, (Math.random() - 0.5) * 50],
                    x: [0, (Math.random() - 0.5) * 50],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: Math.random() * 10 + 10,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear",
                  }}
                />
              ))}
            </div>
            
            {floatingShapes.map((shape, index) => (
              <motion.div
                key={index}
                className={`absolute ${shape.position} ${shape.size} text-green-600/20`}
                animate={{
                  y: [0, (Math.random() - 0.5) * 40],
                  x: [0, (Math.random() - 0.5) * 40],
                  rotate: [0, Math.random() * 360],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                {shape.icon}
              </motion.div>
            ))}
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <motion.div 
                className="inline-flex items-center bg-white backdrop-blur-sm rounded-full px-4 py-1.5 text-xs mb-6 uppercase tracking-widest shadow-lg border border-gray-200"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.span 
                  className="mr-2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🌍
                </motion.span>
                Sustainable Digital Future
                <motion.button
                  onClick={() => navigate("/register")}
                  className="ml-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 px-3 py-0.5 rounded-full text-xs font-semibold text-white transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  JOIN NOW
                </motion.button>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-600">
                  Innovating
                </span>{" "}
                <motion.span
                  className="inline-block"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    y: [0, -5, 5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  With Nature
                </motion.span>
                <br />
                For a{" "}
                <motion.span
                  className="relative inline-block"
                  animate={{
                    color: ["#10B981", "#3B82F6", "#10B981"]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity
                  }}
                >
                  Better Tomorrow
                </motion.span>
              </motion.h1>
              
              <motion.p
                className="text-lg md:text-xl max-w-2xl mx-auto mb-8 md:mb-12 text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                Where cutting-edge technology meets environmental consciousness to
                create{" "}
                <motion.span
                  className="font-semibold text-green-600"
                  animate={{
                    scale: [1, 1.05, 1],
                    color: ["#10B981", "#059669", "#10B981"]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity
                  }}
                >
                  sustainable digital solutions
                </motion.span>{" "}
                for the modern world.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row justify-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, staggerChildren: 0.1 }}
              >
                <motion.button
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold px-8 py-4 rounded-full transition-all text-lg shadow-lg hover:shadow-xl flex items-center justify-center"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  Get Started Free
                  <motion.span 
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🚀
                  </motion.span>
                </motion.button>
                <motion.button
                  onClick={() => navigate("/about")}
                  className="bg-white hover:bg-gray-50 text-gray-800 font-medium px-8 py-4 rounded-full transition-all text-lg shadow-lg hover:shadow-xl border border-gray-200 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                >
                  Learn More
                  <motion.span 
                    className="ml-2"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    🔄
                  </motion.span>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ 
              y: [0, 10, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity
            }}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-600 mb-2">Scroll Down</span>
              <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                <motion.div
                  className="w-1 h-2 bg-gray-600 rounded-full mt-2"
                  animate={{ 
                    y: [0, 4, 0],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity
                  }}
                />
              </div>
            </div>
          </motion.div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Our <span className="text-green-600">Key Features</span>
              </motion.h2>
              <motion.p
                className="text-lg text-gray-600 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Discover what makes our platform unique and powerful
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  title: "Eco-Inspired Design", 
                  description: "Sustainable digital solutions that reduce environmental impact while delivering exceptional user experiences.",
                  icon: "🌿",
                  color: "from-green-100 to-green-50"
                },
                { 
                  title: "Smart Technology", 
                  description: "AI-powered analytics that help you make data-driven decisions with confidence.",
                  icon: "🤖",
                  color: "from-blue-100 to-blue-50"
                },
                { 
                  title: "Community Focus", 
                  description: "Connect with like-minded people who share your passion for sustainability.",
                  icon: "👥",
                  color: "from-purple-100 to-purple-50"
                },
                { 
                  title: "Future Ready", 
                  description: "Scalable architecture designed to grow with your business needs.",
                  icon: "🚀",
                  color: "from-orange-100 to-orange-50"
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className={`bg-gradient-to-br ${item.color} rounded-xl p-8 shadow-lg border border-gray-200 hover:border-green-400 transition-all cursor-pointer h-full flex flex-col`}
                  whileHover={{ 
                    y: -10,
                    boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.2)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="text-4xl mb-6"
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {item.icon}
                  </motion.div>
                  <h3 className="font-bold text-xl mb-4 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600 mb-6 flex-grow">{item.description}</p>
                  <div className="flex items-center text-green-600 group font-medium">
                    <span>Learn more</span>
                    <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-2" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-r from-green-50 to-teal-50">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-gray-800 mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Ready to <span className="text-green-600">Transform</span> Your Digital Experience?
              </motion.h2>
              <motion.p
                className="text-lg text-gray-600 mb-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Join thousands of satisfied users who are already benefiting from our platform.
              </motion.p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.button
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold px-8 py-4 rounded-full transition-all text-lg shadow-lg hover:shadow-xl"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  Start Your Free Trial
                </motion.button>
                <motion.button
                  onClick={() => navigate("/contact")}
                  className="bg-white hover:bg-gray-50 text-gray-800 font-medium px-8 py-4 rounded-full transition-all text-lg shadow-lg hover:shadow-xl border border-gray-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  Contact Sales
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, duration: 0.6, delay: 0. }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-4">
                CCS-Project
              </h3>
              <p className="text-gray-400 mb-4">
                Bridging the gap between technology and nature for a sustainable future.
              </p>
              <div className="flex space-x-4">
                {["Twitter", "Facebook", "Instagram", "LinkedIn"].map((social, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    className="text-gray-400 hover:text-green-400"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    {social}
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Case Studies", "Updates"]
              },
              {
                title: "Company",
                links: ["About", "Careers", "Contact", "Blog"]
              },
              {
                title: "Support",
                links: ["Help Center", "Terms", "Privacy", "Status"]
              }
            ].map((column, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, duration: 0.6, delay: index * 0.1  }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h4 className="text-lg font-semibold mb-4 text-gray-200">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link, i) => (
                    <motion.li 
                      key={i}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 300, duration: 0.6, delay: i * 0.1 + index * 0.1  }}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                    >
                      <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                        {link}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="pt-8 mt-8 border-t border-gray-800 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} CCS-Project. All rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;