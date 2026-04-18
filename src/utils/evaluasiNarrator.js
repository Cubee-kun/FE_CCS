/**
 * Utility untuk menghasilkan narasi evaluasi berdasarkan data monitoring
 */

export const generateSurvivalNarrative = (report) => {
  const survivalRate = parseFloat(report.survivalRate);
  if (!survivalRate || survivalRate <= 0) {
    return "Data survival rate belum tersedia untuk analisis.";
  }

  const planted = report.jumlahBibit;
  const survived = Math.round((survivalRate / 100) * planted);
  const date = report.monitoringDate;
  const company = report.namaPerusahaan;
  const location = report.lokasi;

  return `Berdasarkan hasil monitoring pada ${date}, dari total ${planted} bibit yang ditanam oleh ${company}, sebanyak ${survived} bibit ditemukan dalam kondisi hidup. Hal ini menunjukkan tingkat kelangsungan hidup (Survival Rate) sebesar ${survivalRate.toFixed(2)}%, yang dikategorikan sebagai keberhasilan restorasi yang ${getSurvivalCategory(survivalRate)}.`;
};

export const generateHeightNarrative = (avgHeight) => {
  if (!avgHeight || avgHeight <= 0) {
    return "Data tinggi bibit rata-rata belum tersedia.";
  }

  const heightNum = parseFloat(avgHeight);
  return `Tinggi bibit rata-rata yang terukur adalah ${heightNum.toFixed(2)} cm. Pertumbuhan vertikal menunjukkan adaptasi bibit terhadap kondisi lingkungan setempat.`;
};

export const generateDiameterNarrative = (avgDiameter) => {
  if (!avgDiameter || avgDiameter <= 0) {
    return "Data diameter batang rata-rata belum tersedia.";
  }

  const diameterNum = parseFloat(avgDiameter);
  return `Diameter batang rata-rata yang terukur adalah ${diameterNum.toFixed(2)} cm, yang mencerminkan kekuatan dan stabilitas struktural bibit mangrove.`;
};

export const generateHealthNarrative = (healthCondition, monitoringData = {}) => {
  const baseNarrative = {
    "Sangat Baik": "Secara umum, bibit berada dalam kondisi sangat sehat dengan minimal kehilangan daun atau gejala penyakit.",
    "Baik": "Bibit berada dalam kondisi sehat, meskipun terdapat beberapa gejala minor yang tidak signifikan.",
    "Perlu Perhatian": "Bibit menunjukkan beberapa gejala kesehatan yang memerlukan perhatian khusus dan tindakan preventif.",
    "Kurang Sehat": "Bibit mengalami kondisi kesehatan yang lemah dan memerlukan intervensi segera.",
    "Data kesehatan belum tersedia": "Data kesehatan belum tersedia untuk analisis mendalam.",
  };

  let narrative = baseNarrative[healthCondition] || baseNarrative["Data kesehatan belum tersedia"];

  // Tambahkan detail dari monitoring jika ada
  if (monitoringData && Object.keys(monitoringData).length > 0) {
    const details = [];

    if (monitoringData.daun_menguning) {
      details.push(`daun menguning (${monitoringData.daun_menguning})`);
    }
    if (monitoringData.daun_layu) {
      details.push(`daun layu (${monitoringData.daun_layu})`);
    }
    if (monitoringData.bercak_daun) {
      details.push(`bercak daun (${monitoringData.bercak_daun})`);
    }
    if (monitoringData.daun_serangga) {
      details.push(`kerusakan akibat serangga (${monitoringData.daun_serangga})`);
    }
    if (monitoringData.daun_mengering) {
      details.push(`daun mengering (${monitoringData.daun_mengering})`);
    }

    if (details.length > 0) {
      narrative += ` Observasi mencatat: ${details.join(", ")}.`;
    } else {
      narrative += " Tidak ditemukan adanya serangan hama atau penyakit yang signifikan pada saat pengamatan dilakukan.";
    }
  } else {
    narrative += " Tidak ditemukan adanya serangan hama atau penyakit yang signifikan pada saat pengamatan dilakukan.";
  }

  return narrative;
};

export const getSurvivalCategory = (survivalRate) => {
  if (survivalRate >= 80) return "sangat baik";
  if (survivalRate >= 50) return "baik (perlu perawatan ekstra)";
  return "kurang memuaskan (perlu penanaman ulang)";
};

export const getSuccessStatus = (survivalRate) => {
  const rate = parseFloat(survivalRate);
  if (rate >= 80) return "BERHASIL";
  if (rate >= 50) return "PERLU_PERHATIAN";
  return "GAGAL";
};

export const getRecommendations = (report, monitoringData = {}) => {
  const recommendations = [];
  const survivalRate = parseFloat(report.survivalRate);

  // Rekomendasi berdasarkan Survival Rate
  if (survivalRate < 50) {
    recommendations.push({
      level: "KRITIS",
      text: "Tingkat keberhasilan sangat rendah. Rekomendasi: evaluasi ulang metode penanaman, kondisi tanah, dan sumber air. Pertimbangkan penanaman ulang dengan spesies yang lebih sesuai.",
      icon: "alert",
    });
  } else if (survivalRate < 80) {
    recommendations.push({
      level: "TINGGI",
      text: "Beberapa bibit tidak bertahan. Rekomendasi: tingkatkan frekuensi pemantauan, perhatikan masalah drainase, dan pertahankan level air yang optimal.",
      icon: "warning",
    });
  }

  // Rekomendasi berdasarkan kondisi kesehatan
  if (monitoringData.daun_menguning && monitoringData.daun_menguning !== "<25%") {
    recommendations.push({
      level: "SEDANG",
      text: "Daun menguning terdeteksi. Rekomendasi: periksa keseimbangan nutrisi, kemungkinan kekurangan Fe atau Mn. Lakukan pemberian pupuk cair jika diperlukan.",
      icon: "info",
    });
  }

  if (monitoringData.bercak_daun && monitoringData.bercak_daun !== "<25%") {
    recommendations.push({
      level: "SEDANG",
      text: "Bercak daun terdeteksi. Rekomendasi: penawaran pestisida organik, peningkatan sirkulasi udara, dan pengurangan kelembaban berlebih.",
      icon: "info",
    });
  }

  if (monitoringData.daun_layu && monitoringData.daun_layu !== "<25%") {
    recommendations.push({
      level: "TINGGI",
      text: "Daun layu terdeteksi. Rekomendasi: periksa kelembaban tanah, sistem irigasi, dan kemungkinan serangan patogen akar.",
      icon: "warning",
    });
  }

  if (monitoringData.daun_serangga && monitoringData.daun_serangga !== "<25%") {
    recommendations.push({
      level: "SEDANG",
      text: "Kerusakan akibat serangga terdeteksi. Rekomendasi: aplikasi pestisida organik, pengendalian hayati, atau penyemprotan air dengan sabun organik.",
      icon: "info",
    });
  }

  // Rekomendasi default
  if (recommendations.length === 0) {
    recommendations.push({
      level: "BAIK",
      text: "Kondisi bibit secara keseluruhan baik. Rekomendasi: lanjutkan pemantauan berkala, pemeliharaan rutin, dan pencatatan data berkala.",
      icon: "check",
    });
  }

  return recommendations;
};

export const getSuccessColor = (survivalRate) => {
  const rate = parseFloat(survivalRate);
  if (rate >= 80) return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-800" };
  if (rate >= 50) return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800" };
  return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" };
};

export const generateFullNarrative = (report, monitoringData = {}) => {
  return {
    survivalRate: generateSurvivalNarrative(report),
    height: generateHeightNarrative(report.avgHeight),
    diameter: generateDiameterNarrative(report.avgDiameter),
    health: generateHealthNarrative(report.healthCondition, monitoringData),
  };
};
