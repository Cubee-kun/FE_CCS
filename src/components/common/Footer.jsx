import { motion } from "framer-motion";
import { FiMail, FiPhone, FiMapPin, FiGithub, FiLinkedin, FiTwitter, FiInstagram } from "react-icons/fi";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produk: [
      { name: "Dashboard", href: "#" },
      { name: "Monitoring", href: "#" },
      { name: "Analytics", href: "#" },
      { name: "Reporting", href: "#" },
      { name: "Mobile App", href: "#" },
    ],
    perusahaan: [
      { name: "Tentang Kami", href: "/about" },
      { name: "Tim", href: "#" },
      { name: "Karir", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Press Kit", href: "#" },
    ],
    dukungan: [
      { name: "Help Center", href: "#" },
      { name: "Dokumentasi", href: "#" },
      { name: "API", href: "#" },
      { name: "Status", href: "#" },
      { name: "Kontak", href: "/contact" },
    ],
  };

  const socialLinks = [
    { icon: FiGithub, href: "#", label: "GitHub" },
    { icon: FiLinkedin, href: "#", label: "LinkedIn" },
    { icon: FiTwitter, href: "#", label: "Twitter" },
    { icon: FiInstagram, href: "#", label: "Instagram" },
  ];

  const contactInfo = [
    { icon: FiMail, text: "info@ccs-system.com" },
    { icon: FiPhone, text: "+62 812 3456 7890" },
    { icon: FiMapPin, text: "Jakarta, Indonesia" },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-900 to-black text-gray-300 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Section - Takes 2 columns on large screens */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3 mb-6">
              <motion.img 
                src="/images/icon.png" 
                alt="CCS System Logo" 
                className="h-12 w-12 object-contain"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              />
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  CCS-System
                </h3>
                <p className="text-xs text-gray-500">Conservation System</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
              Platform konservasi digital berbasis blockchain yang membantu organisasi mengelola proyek lingkungan dengan transparansi data dan keamanan tingkat enterprise.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              {contactInfo.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3 text-sm"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-gray-400">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-600 flex items-center justify-center transition-all duration-300 group"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link, linkIndex) => (
                  <motion.li
                    key={linkIndex}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-emerald-400 transition-colors text-sm flex items-center group"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-emerald-400 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Section */}
        <motion.div
          className="border-t border-b border-gray-800 py-8 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-white font-semibold mb-2">
                📬 Berlangganan Newsletter
              </h4>
              <p className="text-gray-400 text-sm">
                Dapatkan update terbaru tentang konservasi dan teknologi
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Email Anda"
                className="flex-1 md:w-64 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              />
              <motion.button
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-r-lg transition-all duration-300 text-sm whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className="text-gray-500 text-sm">
              © {currentYear}{" "}
              <span className="text-emerald-400 font-semibold">CCS-System</span>
              . All rights reserved.
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Built with ❤️ for a greener future 🌱
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {["Kebijakan Privasi", "Syarat Layanan", "Cookie"].map((item, index) => (
              <motion.a
                key={index}
                href="#"
                className="text-gray-500 hover:text-emerald-400 transition-colors relative group"
                whileHover={{ y: -2 }}
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="mt-8 pt-8 border-t border-gray-800"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>✅ Blockchain Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>🔒 SSL Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>🌍 Carbon Neutral</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>⚡ 99.9% Uptime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
