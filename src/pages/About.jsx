import React from "react";
import { FaTree, FaWater, FaChartLine, FaUsers, FaCalendarAlt, FaRuler, FaClipboardCheck, FaLeaf } from "react-icons/fa";
import { GiGrowth } from "react-icons/gi";
import { RiHealthBookFill } from "react-icons/ri";

const About = () => {
  // Sample monitoring data
  const monitoringData = {
    survivalRate: 85,
    initialPlants: 20,
    survivingPlants: 17,
    averageHeight: "65.2 cm",
    heightIncrease: "15.2 cm dari penanaman",
    averageDiameter: "1.8 cm",
    diameterIncrease: "0.6 cm dari penanaman",
    healthCondition: "Baik",
    healthDetails: "85% daun sehat, 15% menunjukkan sedikit kerusakan tepi daun"
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-emerald-800 mb-4">
          Restorasi Mangrove Teluk Jakarta
        </h1>
        <div className="w-32 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 mx-auto rounded-full mb-6"></div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Upaya kolaboratif untuk memulihkan ekosistem pesisir melalui penanaman dan pemantauan mangrove berkelanjutan
        </p>
      </div>

      {/* Background Section */}
      <div className="grid md:grid-cols-2 gap-12 mb-20">
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold text-emerald-700">
            Latar Belakang
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Degradasi lahan di Teluk Jakarta menjadi tantangan lingkungan signifikan akibat urbanisasi cepat, aktivitas industri, dan pertumbuhan populasi tak terkendali. Penelitian menunjukkan dalam periode 1972-2015, abrasi pesisir mencapai 2,24 meter per tahun dengan total kehilangan 76,55 meter.
            </p>
            <p>
              Ekosistem mangrove yang rusak diperparah oleh kebutuhan ekonomi, pencemaran, dan konversi hutan tanpa pertimbangan lingkungan. Kawasan mangrove Angke Kapuk berperan vital melindungi pesisir namun menghadapi ancaman serius dari aktivitas manusia dan perubahan iklim.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-xl border border-emerald-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="bg-emerald-100 p-3 rounded-lg mr-4">
              <FaTree className="text-emerald-700 text-2xl" />
            </div>
            <h3 className="text-2xl font-semibold text-emerald-800">
              Peran Penting Mangrove
            </h3>
          </div>
          <ul className="space-y-4">
            {[
              "Melindungi pantai dari abrasi dan intrusi air laut",
              "Memecah gelombang dan mencegah banjir rob",
              "Menyediakan habitat bagi biodiversitas pesisir",
              "Menyerap karbon 4-5x lebih efektif dari hutan tropis",
              "Menyaring polutan dan meningkatkan kualitas air"
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <div className="bg-emerald-100 p-1 rounded-full mr-3 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                </div>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Restoration Initiative Section */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold text-emerald-700 mb-8 text-center">
          Inisiatif Restorasi oleh Avoskin & Sebumi
        </h2>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gradient-to-b from-emerald-700 to-teal-600 p-8 flex items-center">
              <div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg inline-block mb-4">
                  <FaLeaf className="text-white text-3xl" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-3">Program CSR</h3>
                <p className="text-emerald-100">
                  Kolaborasi strategis untuk restorasi ekosistem pesisir melalui pendekatan berbasis sains dan komunitas.
                </p>
              </div>
            </div>
            
            <div className="md:w-2/3 p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: <FaCalendarAlt className="text-emerald-700 text-xl" />,
                    title: "Penanaman Perdana",
                    desc: "28 April 2024 - 20 bibit mangrove ditanam di TWA Angke Kapuk"
                  },
                  {
                    icon: <FaUsers className="text-emerald-700 text-xl" />,
                    title: "Partisipasi",
                    desc: "Melibatkan karyawan CPA Australia dalam kegiatan penanaman"
                  },
                  {
                    icon: <GiGrowth className="text-emerald-700 text-xl" />,
                    title: "Spesies Dipilih",
                    desc: "Rhizophora mucronata dan Avicennia marina sebagai spesies utama"
                  },
                  {
                    icon: <FaChartLine className="text-emerald-700 text-xl" />,
                    title: "Evaluasi Berkala",
                    desc: "Pemantauan parameter pertumbuhan dan kesehatan bibit triwulanan"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-emerald-100 p-3 rounded-lg mr-4">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Method Section */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold text-emerald-700 mb-8">
          Metode Monitoring
        </h2>
        
        <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                  <FaCalendarAlt className="text-emerald-700 text-lg" />
                </div>
                <h3 className="font-medium text-gray-800">Waktu Monitoring</h3>
              </div>
              <p className="text-gray-700 font-medium">22 April 2025</p>
              <p className="text-sm text-gray-500 mt-1">Evaluasi 12 bulan pasca penanaman</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                  <FaWater className="text-emerald-700 text-lg" />
                </div>
                <h3 className="font-medium text-gray-800">Lokasi</h3>
              </div>
              <p className="text-gray-700 font-medium">TWA Angke Kapuk</p>
              <p className="text-sm text-gray-500 mt-1">Dikelola BKSDA DKI Jakarta</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-xs border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                  <FaRuler className="text-emerald-700 text-lg" />
                </div>
                <h3 className="font-medium text-gray-800">Parameter</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Survival rate", "Tinggi tanaman", "Diameter batang", "Kondisi kesehatan"].map((item, index) => (
                  <span key={index} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-white p-6 rounded-lg border border-gray-100">
            <h4 className="font-medium text-gray-800 mb-3">Alat Monitoring</h4>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "Pita ukur", color: "emerald" },
                { name: "Jangka sorong", color: "teal" },
                { name: "Kamera dokumentasi", color: "green" },
                { name: "Tally sheet", color: "emerald" },
                { name: "GPS", color: "teal" },
                { name: "PH meter", color: "green" }
              ].map((tool, index) => (
                <div key={index} className={`bg-${tool.color}-100 text-${tool.color}-800 px-4 py-2 rounded-lg flex items-center`}>
                  <div className={`h-2 w-2 rounded-full bg-${tool.color}-600 mr-2`}></div>
                  {tool.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results & Discussion Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-semibold text-emerald-700 mb-8 flex items-center">
          <FaClipboardCheck className="mr-3" />
          Hasil & Pembahasan Monitoring
        </h2>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Column - Metrics */}
            <div className="p-8 md:p-10 bg-gradient-to-br from-gray-50 to-white">
              <div className="space-y-8">
                {/* Survival Rate */}
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                    <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                      <FaChartLine className="text-emerald-700" />
                    </div>
                    Survival Rate
                  </h3>
                  <div className="pl-11">
                    <div className="flex items-end mb-2">
                      <span className="text-4xl font-bold text-emerald-700 mr-2">
                        {monitoringData.survivalRate}%
                      </span>
                      <span className="text-gray-500 mb-1">
                        ({monitoringData.survivingPlants}/{monitoringData.initialPlants} bibit)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full" 
                        style={{ width: `${monitoringData.survivalRate}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Tingkat kelangsungan hidup di atas rata-rata untuk restorasi mangrove di area urban.
                    </p>
                  </div>
                </div>
                
                {/* Growth Metrics */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-gray-700 font-medium mb-2">Tinggi Rata-rata</h4>
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-700">
                        {monitoringData.averageHeight}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        +{monitoringData.heightIncrease}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-gray-700 font-medium mb-2">Diameter Batang</h4>
                    <div className="bg-teal-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-teal-700">
                        {monitoringData.averageDiameter}
                      </p>
                      <p className="text-xs text-teal-600 mt-1">
                        +{monitoringData.diameterIncrease}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Health & Discussion */}
            <div className="p-8 md:p-10 border-t md:border-t-0 md:border-l border-gray-200">
              <div className="space-y-8">
                {/* Health Condition */}
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                    <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                      <RiHealthBookFill className="text-emerald-700" />
                    </div>
                    Kondisi Kesehatan
                  </h3>
                  <div className="pl-11">
                    <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium mb-3">
                      {monitoringData.healthCondition}
                    </div>
                    <p className="text-gray-700 mb-4">
                      {monitoringData.healthDetails}
                    </p>
                    <div className="flex space-x-3">
                      {["Daun sehat", "Kerusakan minimal", "Tidak ada hama"].map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm text-gray-600">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Discussion */}
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-4">Pembahasan</h3>
                  <div className="prose prose-emerald max-w-none">
                    <p className="text-gray-700">
                      Hasil monitoring menunjukkan perkembangan yang sangat positif dengan survival rate mencapai {monitoringData.survivalRate}%, mengindikasikan adaptasi yang baik terhadap lingkungan setempat. Pertumbuhan tinggi dan diameter batang yang konsisten menunjukkan kondisi ekologi yang mendukung.
                    </p>
                    <p className="text-gray-700">
                      Faktor pendukung keberhasilan meliputi: pemilihan bibit berkualitas, waktu penanaman yang tepat (musim hujan), dan keterlibatan masyarakat dalam pemeliharaan. Tantangan utama berupa kompetisi dengan vegetasi invasif dan fluktuasi salinitas air telah berhasil diatasi melalui intervensi tepat waktu.
                    </p>
                    <p className="text-gray-700">
                      Rekomendasi untuk monitoring berikutnya mencakup pengukuran parameter tambahan seperti kandungan karbon tanah dan keanekaragaman fauna yang kembali menghuni area restorasi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;