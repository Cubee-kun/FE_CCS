import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiArrowRight } from "react-icons/fi";

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = ["Home", "About", "Services", "Gallery", "Pricing", "Contact"];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-800">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Logo */}
        <div
          className="text-2xl font-bold cursor-pointer bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent"
          onClick={() => navigate("/")}
        >
          CCS-Project
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-8 items-center">
          {navItems.map((item) => (
            <li
              key={item}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
            >
              {item}
            </li>
          ))}
          <div className="flex space-x-4 ml-6">
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              LOG IN
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all shadow-md hover:shadow-lg"
            >
              Sign Up Free
            </button>
          </div>
        </ul>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg md:hidden">
          <div className="flex flex-col space-y-6 px-6 py-4">
            {navItems.map((item) => (
              <div
                key={item}
                className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors border-b border-gray-100 dark:border-gray-800 py-3 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
                <FiArrowRight className="ml-auto opacity-70" />
              </div>
            ))}
            <div className="flex flex-col space-y-4 pt-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full py-3 text-center font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                LOG IN
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/register");
                }}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-full transition-all shadow-md"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with optimized background */}
      <section className="relative flex flex-col items-center justify-center text-center text-white flex-grow mt-16">
        {/* Semi-transparent background image layer */}
        <div 
          className="absolute inset-0 bg-[url('/images/login-bg.jpg')] bg-cover bg-center opacity-30"
          aria-hidden="true"
        ></div>
        
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-900/20"></div>

        <div className="relative z-10 max-w-4xl px-6 py-20 md:py-40 w-full">
          {/* Highlight Label */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs mb-6 uppercase tracking-widest shadow-lg border border-white/20">
            <span className="mr-2">🌳</span>
            Nature & Technology
            <button
              onClick={() => navigate("/register")}
              className="ml-3 bg-green-500 hover:bg-green-400 px-3 py-0.5 rounded-full text-xs font-semibold text-white transition-all"
            >
              JOIN NOW
            </button>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 drop-shadow-lg px-4">
            Bringing Nature <br className="hidden md:block" /> Into Your Digital World
          </h1>
          
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 md:mb-12 text-green-100 drop-shadow-md px-4">
            GreenWay combines cutting-edge technology with the serenity of
            nature, creating an inspiring experience for creators and dreamers.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
            <button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold px-8 py-3 rounded-full transition-all text-lg shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate("/about")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-medium px-8 py-3 rounded-full transition-all text-lg shadow-lg hover:shadow-xl"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 md:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-green-100 text-sm md:text-base">
          {[
            { title: "Eco-Inspired Design", link: "Learn More" },
            { title: "Sustainable Solutions", link: "Explore Projects" },
            { title: "Join the Movement", link: "Sign Up Today" },
            { title: "Our Commitment", link: "Read Our Mission" }
          ].map((item, index) => (
            <div key={index} className="text-center sm:text-left">
              <h3 className="font-semibold mb-2 text-white">{item.title}</h3>
              <a 
                href="#" 
                className="inline-flex items-center text-green-200 hover:text-white transition-colors group"
              >
                {item.link}
                <FiArrowRight className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          ))}
        </footer>
      </section>
    </div>
  );
};

export default LandingPage;