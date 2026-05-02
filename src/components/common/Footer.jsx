import { motion } from "framer-motion";
import { FiMail, FiPhone, FiMapPin, FiGithub, FiLinkedin, FiTwitter, FiInstagram } from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const footerLinks = [
    { name: "Beranda", href: "/" },
    { name: "Tentang", href: "/about" },
    { name: "Verifikasi", href: "/verifikasi" },
    { name: "Login", href: "/login" },
  ];

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

  const footerClass = isDark
    ? "bg-gradient-to-b from-green-950 via-emerald-950 to-slate-950 text-emerald-100/85"
    : "bg-gradient-to-b from-emerald-100 via-white to-emerald-50 text-emerald-900";
  const ambientClass = isDark ? "absolute inset-0 opacity-35 pointer-events-none" : "absolute inset-0 opacity-70 pointer-events-none";
  const glowLeftClass = isDark
    ? "absolute -top-24 -left-16 w-[30rem] h-[30rem] bg-emerald-400/35 rounded-full blur-3xl"
    : "absolute -top-24 -left-16 w-[30rem] h-[30rem] bg-emerald-300/55 rounded-full blur-3xl";
  const glowRightClass = isDark
    ? "absolute -bottom-24 -right-10 w-[28rem] h-[28rem] bg-teal-400/30 rounded-full blur-3xl"
    : "absolute -bottom-24 -right-10 w-[28rem] h-[28rem] bg-teal-300/50 rounded-full blur-3xl";
  const radialClass = isDark
    ? "absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.16),transparent_42%)]"
    : "absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.95),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.20),transparent_44%)]";
  const panelClass = isDark
    ? "rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.8)] px-6 sm:px-8 lg:px-10 pt-10 sm:pt-12 pb-8"
    : "rounded-3xl border border-emerald-300/40 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_20px_55px_-28px_rgba(5,150,105,0.35)] px-6 sm:px-8 lg:px-10 pt-10 sm:pt-12 pb-8";
  const brandTitleClass = isDark
    ? "text-2xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent"
    : "text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent";
  const brandSubClass = isDark ? "text-xs text-emerald-100/55" : "text-xs text-emerald-900/65";
  const descClass = isDark ? "text-emerald-100/70 mb-6 leading-relaxed text-sm" : "text-emerald-900/75 mb-6 leading-relaxed text-sm";
  const socialBtnClass = isDark
    ? "w-10 h-10 rounded-xl border border-white/20 bg-white/10 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 backdrop-blur-xl flex items-center justify-center transition-all duration-300 group"
    : "w-10 h-10 rounded-xl border border-emerald-300/45 bg-white/65 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 backdrop-blur-xl flex items-center justify-center transition-all duration-300 group";
  const socialIconClass = isDark ? "w-5 h-5 text-emerald-100/75 group-hover:text-white transition-colors" : "w-5 h-5 text-emerald-700 group-hover:text-white transition-colors";
  const sectionTitleClass = isDark ? "text-emerald-50 font-semibold mb-4 text-sm uppercase tracking-wider" : "text-emerald-900 font-semibold mb-4 text-sm uppercase tracking-wider";
  const linkClass = isDark
    ? "text-emerald-100/70 hover:text-emerald-200 transition-colors text-sm flex items-center group"
    : "text-emerald-800/80 hover:text-emerald-600 transition-colors text-sm flex items-center group";
  const linkAccentClass = isDark
    ? "w-0 group-hover:w-2 h-0.5 bg-emerald-300 mr-0 group-hover:mr-2 transition-all duration-300"
    : "w-0 group-hover:w-2 h-0.5 bg-emerald-600 mr-0 group-hover:mr-2 transition-all duration-300";
  const contactItemClass = isDark
    ? "flex items-center space-x-3 text-sm rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg px-3 py-2"
    : "flex items-center space-x-3 text-sm rounded-xl border border-emerald-300/35 bg-white/55 backdrop-blur-lg px-3 py-2";
  const contactIconWrapClass = isDark
    ? "w-8 h-8 rounded-lg bg-emerald-400/15 border border-emerald-200/20 flex items-center justify-center flex-shrink-0"
    : "w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300/45 flex items-center justify-center flex-shrink-0";
  const contactIconClass = isDark ? "w-4 h-4 text-emerald-200" : "w-4 h-4 text-emerald-700";
  const contactTextClass = isDark ? "text-emerald-100/75" : "text-emerald-900/80";
  const bottomClass = isDark
    ? "flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/15"
    : "flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-emerald-300/45";
  const copyClass = isDark ? "text-emerald-100/60 text-sm" : "text-emerald-900/65 text-sm";
  const copyBrandClass = isDark ? "text-emerald-200 font-semibold" : "text-emerald-700 font-semibold";
  const legalClass = isDark
    ? "text-emerald-100/60 hover:text-emerald-200 transition-colors relative group"
    : "text-emerald-900/65 hover:text-emerald-700 transition-colors relative group";
  const legalUnderlineClass = isDark
    ? "absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-300 group-hover:w-full transition-all duration-300"
    : "absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300";

  return (
    <footer className={`${footerClass} relative overflow-hidden`}>
      {/* Decorative Background Elements */}
      <div className={ambientClass}>
        <div className={glowLeftClass}></div>
        <div className={glowRightClass}></div>
        <div className={radialClass}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-8">
        <div className={panelClass}>
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-12 mb-12">
            {/* Brand Section */}
            <motion.div
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
                  <h3 className={brandTitleClass}>
                    3TREESIFY
                  </h3>
                  <p className={brandSubClass}>Monitoring & Restorasi Ekosistem</p>
                </div>
              </div>

              {/* Description */}
              <p className={descClass}>
                Sistem monitoring terintegrasi untuk mendukung proyek restorasi ekosistem dengan data akurat dan transparan.
              </p>

              {/* Social Links */}
              <div className="flex space-x-3 mt-6">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className={socialBtnClass}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className={socialIconClass} />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Navigation Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className={sectionTitleClass}>
                Navigasi
              </h4>
              <ul className="space-y-3">
                {footerLinks.map((link, linkIndex) => (
                  <motion.li
                    key={linkIndex}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <a
                      href={link.href}
                      className={linkClass}
                    >
                      <span className={linkAccentClass}></span>
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className={sectionTitleClass}>
                Hubungi Kami
              </h4>
              <div className="space-y-3">
                {contactInfo.map((item, index) => (
                  <motion.div
                    key={index}
                    className={contactItemClass}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className={contactIconWrapClass}>
                      <item.icon className={contactIconClass} />
                    </div>
                    <span className={contactTextClass}>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

        {/* Bottom Section */}
        <motion.div
          className={bottomClass}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className={copyClass}>
              © {currentYear}{" "}
              <span className={copyBrandClass}>Coastal Conservation System</span>
              . Semua hak cipta dilindungi.
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {["Kebijakan Privasi", "Syarat & Ketentuan", "Lisensi"].map((item, index) => (
              <motion.a
                key={index}
                href="#"
                className={legalClass}
                whileHover={{ y: -2 }}
              >
                {item}
                <span className={legalUnderlineClass}></span>
              </motion.a>
            ))}
          </div>
        </motion.div>
        </div>
      </div>
    </footer>
  );
}
