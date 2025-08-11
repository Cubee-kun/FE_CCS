import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-transparent fixed top-0 left-0 right-0 z-50">
        <div
          className="text-white font-bold text-2xl tracking-wide cursor-pointer"
          onClick={() => navigate("/home")}
        >
          CCS-Project
        </div>
        <ul className="hidden md:flex space-x-6 text-white text-sm font-medium">
          {["Home", "About", "Services", "Gallery", "Pricing", "Contact"].map(
            (item) => (
              <li
                key={item}
                className="hover:text-green-300 transition cursor-pointer"
              >
                {item}
              </li>
            )
          )}
        </ul>
        <div className="hidden md:flex space-x-4">
          <button
            onClick={() => navigate("/login")}
            className="text-white text-sm font-semibold hover:text-green-300 transition"
          >
            LOG IN
          </button>
          <button
            onClick={() => navigate("/register")}
            className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2 rounded-full transition shadow-md"
          >
            Sign Up — It’s Free
          </button>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white focus:outline-none">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>

      {/* Hero Section */}
      <section
        className="relative flex flex-col items-center justify-center text-center text-white flex-grow bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
      >
        {/* Green Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/70 to-green-700/50"></div>

        <div className="relative z-10 max-w-4xl px-6 py-40">
          {/* Highlight Label */}
          <div className="inline-flex bg-green-800 bg-opacity-70 rounded-full px-4 py-1 text-xs mb-6 uppercase tracking-widest shadow-lg">
            Nature & Technology&nbsp;
            <button
              className="bg-green-500 hover:bg-green-400 px-3 rounded ml-2 font-semibold text-white transition"
              onClick={() => navigate("/register")}
            >
              JOIN NOW
            </button>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">
            Bringing Nature <br /> Into Your Digital World
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 text-green-100 drop-shadow-md">
            GreenWay combines cutting-edge technology with the serenity of
            nature, creating an inspiring experience for creators and dreamers.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-full transition text-lg shadow-lg drop-shadow-lg"
          >
            Get Started — It’s Free
          </button>
        </div>

        {/* Footer */}
        <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex flex-wrap justify-between text-green-100 text-sm md:text-base">
          <div className="mb-6 md:mb-0 max-w-xs">
            <h3 className="font-semibold mb-2">Eco-Inspired Design</h3>
            <a href="#" className="hover:text-green-300 transition">
              Learn More
            </a>
          </div>
          <div className="mb-6 md:mb-0 max-w-xs">
            <h3 className="font-semibold mb-2">Sustainable Solutions</h3>
            <a href="#" className="hover:text-green-300 transition">
              Explore Our Projects
            </a>
          </div>
          <div className="mb-6 md:mb-0 max-w-xs">
            <h3 className="font-semibold mb-2">Join the Green Movement</h3>
            <a href="#" className="hover:text-green-300 transition">
              Sign Up Today
            </a>
          </div>
          <div className="max-w-xs">
            <h3 className="font-semibold mb-2">Our Commitment</h3>
            <a href="#" className="hover:text-green-300 transition">
              Read Our Mission
            </a>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default LandingPage;
