import React from "react";

const LeafSpinner = ({ show, message = "Memuat data, mohon tunggu..." }) => {
  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300 ease-in-out z-[9999]
        ${show ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      {/* Animated leaf container */}
      <div className="relative">
        {/* Main rotating leaf */}
        <svg
          className="animate-spin-slow h-20 w-20"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M32 2C28 10 20 14 16 24C10 38 18 52 32 62C46 52 54 38 48 24C44 14 36 10 32 2Z"
            fill="url(#leafGradient)"
            stroke="#047857"
            strokeWidth="2"
          />
          <path
            d="M32 8C30 16 24 20 20 28C14 40 20 50 32 58"
            stroke="#064e3b"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="leafGradient" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981"/>
              <stop offset="1" stopColor="#059669"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Floating mini leaves */}
        {[1, 2, 3].map((i) => (
          <svg
            key={i}
            className={`absolute h-6 w-6 animate-float-leaf-${i}`}
            style={{
              top: `${Math.random() * 30 + 5}px`,
              left: `${Math.random() * 30 + 5}px`,
            }}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C10 6 6 8 4 12C2 16 4 20 8 22C12 20 16 16 14 12C12 8 10 6 12 2Z"
              fill="#86efac"
            />
          </svg>
        ))}
      </div>

      {/* Loading text with progress dots */}
      <div className="mt-6 text-center">
        <p className="text-green-800 font-medium text-lg tracking-wide mb-2">
          {message}
        </p>
        <div className="flex justify-center space-x-2">
          {[1, 2, 3].map((dot) => (
            <div
              key={dot}
              className={`h-2 w-2 rounded-full bg-green-600 animate-bounce`}
              style={{ animationDelay: `${dot * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 2.5s linear infinite;
        }
        @keyframes float-leaf-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(10deg); }
        }
        @keyframes float-leaf-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-5deg); }
        }
        @keyframes float-leaf-3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(15deg); }
        }
        .animate-float-leaf-1 {
          animation: float-leaf-1 3s ease-in-out infinite;
        }
        .animate-float-leaf-2 {
          animation: float-leaf-2 3.5s ease-in-out infinite;
        }
        .animate-float-leaf-3 {
          animation: float-leaf-3 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LeafSpinner;