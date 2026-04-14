import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const getProgressInfo = (item) => {
  const hasImplementasi = !!item?.is_implemented || !!item?.implementasi;
  const hasMonitoring = !!item?.implementasi?.monitoring || (Array.isArray(item?.monitoring) && item.monitoring.length > 0);
  const hasEvaluasi = !!item?.evaluasi || !!item?.implementasi?.evaluasi || !!item?.implementasi?.monitoring?.evaluasi;
  const currentStage = hasMonitoring ? "Monitoring" : hasImplementasi ? "Implementasi" : "Perencanaan";

  return {
    hasImplementasi,
    hasMonitoring,
    hasEvaluasi,
    currentStage,
  };
};

export const getStageDetails = (item) => {
  const implementasi = item?.implementasi || null;
  const monitoring = implementasi?.monitoring || (Array.isArray(item?.monitoring) ? item.monitoring[0] : item?.monitoring || null);

  return {
    implementasi,
    monitoring,
  };
};

export const parseStoredFiles = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      return [value];
    }

    return [value];
  }

  return [];
};

const drawWrappedText = (page, text, x, y, maxWidth, font, size, color) => {
  const words = String(text ?? "-").split(" ");
  const lines = [];
  let line = "";

  const breakLongWord = (word) => {
    if (font.widthOfTextAtSize(word, size) <= maxWidth) return [word];

    const chunks = [];
    let chunk = "";

    for (const char of word) {
      const test = `${chunk}${char}`;
      if (font.widthOfTextAtSize(test, size) > maxWidth && chunk) {
        chunks.push(chunk);
        chunk = char;
      } else {
        chunk = test;
      }
    }

    if (chunk) chunks.push(chunk);
    return chunks;
  };

  for (const word of words) {
    const chunks = breakLongWord(word);
    for (const chunk of chunks) {
      const testLine = line ? `${line} ${chunk}` : chunk;
      if (font.widthOfTextAtSize(testLine, size) > maxWidth && line) {
        lines.push(line);
        line = chunk;
      } else {
        line = testLine;
      }
    }
  }

  if (line) lines.push(line);

  let cursorY = y;
  lines.forEach((currentLine) => {
    page.drawText(currentLine, {
      x,
      y: cursorY,
      size,
      font,
      color,
    });
    cursorY -= 14;
  });

  return cursorY;
};

const addLogoToQRCode = async (qrDataUrl, logoPath = "/images/icon.png") => {
  return new Promise((resolve) => {
    const qrImage = new Image();
    const logoImage = new Image();

    let loaded = 0;
    const onAssetLoaded = () => {
      loaded += 1;
      if (loaded < 2) return;

      try {
        const canvas = document.createElement("canvas");
        const size = qrImage.width || 400;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(qrDataUrl);
          return;
        }

        ctx.drawImage(qrImage, 0, 0, size, size);

        const logoSize = Math.floor(size * 0.2);
        const logoX = Math.floor((size - logoSize) / 2);
        const logoY = Math.floor((size - logoSize) / 2);
        const bgPadding = Math.floor(logoSize * 0.18);
        const bgX = logoX - bgPadding;
        const bgY = logoY - bgPadding;
        const bgSize = logoSize + bgPadding * 2;
        const radius = Math.floor(bgSize * 0.2);

        ctx.fillStyle = "#fff7ea";
        ctx.beginPath();
        ctx.moveTo(bgX + radius, bgY);
        ctx.lineTo(bgX + bgSize - radius, bgY);
        ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + radius);
        ctx.lineTo(bgX + bgSize, bgY + bgSize - radius);
        ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - radius, bgY + bgSize);
        ctx.lineTo(bgX + radius, bgY + bgSize);
        ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - radius);
        ctx.lineTo(bgX, bgY + radius);
        ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(107, 68, 35, 0.35)";
        ctx.lineWidth = Math.max(1, Math.floor(size * 0.006));
        ctx.stroke();

        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        console.warn("[laporanPdf] Failed to composite QR logo:", err);
        resolve(qrDataUrl);
      }
    };

    const onError = () => resolve(qrDataUrl);

    qrImage.onload = onAssetLoaded;
    logoImage.onload = onAssetLoaded;
    qrImage.onerror = onError;
    logoImage.onerror = onError;

    qrImage.src = qrDataUrl;
    logoImage.src = logoPath;
  });
};

export const buildLaporanPdfBlob = async (item) => {
  const progress = getProgressInfo(item);
  const { implementasi, monitoring } = getStageDetails(item);
  const pdfDoc = await PDFDocument.create();
  const pageSize = [595.28, 841.89];
  let page = null;
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 42;
  const contentWidth = 595.28 - margin * 2;
  const labelWidth = 178;
  const valueWidth = contentWidth - labelWidth - 16;
  let y = 800;
  let pageNumber = 0;

  let logoImage = null;
  try {
    const logoRes = await fetch("/images/icon.png");
    if (logoRes.ok) {
      const logoBytes = await logoRes.arrayBuffer();
      logoImage = await pdfDoc.embedPng(logoBytes);
    }
  } catch (logoErr) {
    console.warn("[laporanPdf] logo load skipped:", logoErr?.message || logoErr);
  }

  let qrCodeImage = null;
  try {
    const qrContent = item.blockchain_tx_hash
      ? `https://sepolia.etherscan.io/tx/${item.blockchain_tx_hash}`
      : `${window.location.origin}/public/laporan/${item.id}`;

    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 200,
      color: { dark: "#1f2937", light: "#ffffff" },
    });
    const qrWithLogo = await addLogoToQRCode(qrDataUrl);
    const qrBytes = await fetch(qrWithLogo).then((response) => response.arrayBuffer());
    qrCodeImage = await pdfDoc.embedPng(qrBytes);
  } catch (qrErr) {
    console.warn("[laporanPdf] QR code generation skipped:", qrErr?.message || qrErr);
  }

  const drawText = (text, x, yPos, options = {}) => {
    page.drawText(String(text ?? "-"), {
      x,
      y: yPos,
      size: options.size || 11,
      font: options.bold ? bold : regular,
      color: options.color || rgb(0.1, 0.1, 0.1),
    });
  };

  const drawHeader = () => {
    const headerTopY = 810;

    if (logoImage) {
      page.drawImage(logoImage, {
        x: margin,
        y: headerTopY - 35,
        width: 35,
        height: 35,
      });
    }

    const headerX = logoImage ? margin + 42 : margin;
    drawText("3TREESIFY CCS", headerX, headerTopY, { size: 13, bold: true, color: rgb(0.1, 0.32, 0.25) });
    drawText("Sistem Konservasi Berbasis Blockchain", headerX, headerTopY - 13, { size: 9, color: rgb(0.33, 0.33, 0.33) });
    drawText("Pelaporan Perencanaan, Implementasi, dan Monitoring", headerX, headerTopY - 25, { size: 8, color: rgb(0.4, 0.4, 0.4) });

    if (qrCodeImage) {
      page.drawImage(qrCodeImage, {
        x: margin + contentWidth - 62,
        y: headerTopY - 65,
        width: 60,
        height: 60,
      });
      drawText("Verifikasi", margin + contentWidth - 64, headerTopY - 68, { size: 7, color: rgb(0.45, 0.45, 0.45), bold: true });
      drawText("Dokumen", margin + contentWidth - 54, headerTopY - 75, { size: 7, color: rgb(0.45, 0.45, 0.45), bold: true });
    }

    drawText(`Halaman ${pageNumber}`, margin + contentWidth - 52, headerTopY, { size: 8.5, color: rgb(0.4, 0.4, 0.4) });

    page.drawLine({ start: { x: margin, y: headerTopY - 105 }, end: { x: margin + contentWidth, y: headerTopY - 105 }, thickness: 1.2, color: rgb(0.12, 0.42, 0.32) });
    page.drawLine({ start: { x: margin, y: headerTopY - 108 }, end: { x: margin + contentWidth, y: headerTopY - 108 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
  };

  const drawMetaBlock = () => {
    page.drawRectangle({
      x: margin,
      y: 660,
      width: contentWidth,
      height: 50,
      color: rgb(0.96, 0.98, 0.97),
      borderColor: rgb(0.8, 0.9, 0.86),
      borderWidth: 1,
    });

    drawText("Nomor Laporan", margin + 12, 702, { size: 9, bold: true, color: rgb(0.35, 0.35, 0.35) });
    drawText(String(item.id), margin + 12, 690, { size: 10.5, color: rgb(0.1, 0.1, 0.1) });

    drawText("Tanggal Cetak", margin + 190, 702, { size: 9, bold: true, color: rgb(0.35, 0.35, 0.35) });
    drawText(new Date().toLocaleString("id-ID"), margin + 190, 690, { size: 10.5, color: rgb(0.1, 0.1, 0.1) });

    drawText("Tahap Saat Ini", margin + 390, 702, { size: 9, bold: true, color: rgb(0.35, 0.35, 0.35) });
    drawText(progress.currentStage, margin + 390, 690, { size: 10.5, bold: true, color: rgb(0.1, 0.32, 0.25) });
  };

  const startNewPage = () => {
    page = pdfDoc.addPage(pageSize);
    pageNumber += 1;
    drawHeader();
    drawMetaBlock();
    y = 645;
  };

  const ensureSpace = (neededHeight = 28) => {
    if (y - neededHeight < 60) {
      startNewPage();
    }
  };

  const addField = (label, value) => {
    const lines = String(value ?? "-").split(" ");
    const rowText = lines.join(" ");
    const rowHeight = Math.max(1, Math.ceil(rowText.length / 50)) * 14 + 8;
    ensureSpace(rowHeight);

    page.drawRectangle({
      x: margin,
      y: y - rowHeight + 5,
      width: contentWidth,
      height: rowHeight,
      color: rgb(0.995, 0.995, 0.995),
      borderColor: rgb(0.92, 0.92, 0.92),
      borderWidth: 0.4,
    });

    drawText(label, margin + 8, y - 7, { size: 9.5, bold: true, color: rgb(0.35, 0.35, 0.35) });
    drawText(":", margin + labelWidth, y - 7, { size: 9.5, bold: true, color: rgb(0.4, 0.4, 0.4) });

    let valueY = y - 7;
    const wrappedValue = rowText.match(new RegExp(`.{1,${Math.max(20, Math.floor(valueWidth / 4))}}`, "g")) || ["-"];
    wrappedValue.forEach((line) => {
      drawText(line, margin + labelWidth + 10, valueY, { size: 10.5, color: rgb(0.1, 0.1, 0.1) });
      valueY -= 14;
    });

    y -= rowHeight;
  };

  const addSection = (title) => {
    ensureSpace(30);
    page.drawRectangle({
      x: margin,
      y: y - 16,
      width: contentWidth,
      height: 20,
      color: rgb(0.9, 0.96, 0.93),
      borderColor: rgb(0.72, 0.84, 0.78),
      borderWidth: 0.8,
    });
    drawText(title, margin + 8, y - 2, { size: 11, bold: true, color: rgb(0.08, 0.32, 0.25) });
    y -= 24;
  };

  const boolLabel = (value) => (value === undefined || value === null ? "-" : value ? "Sesuai" : "Tidak Sesuai");

  startNewPage();

  addSection("DATA PERENCANAAN");
  addField("ID Laporan", item.id);
  addField("Nama Perusahaan", item.nama_perusahaan);
  addField("Nama PIC", item.nama_pic);
  addField("Narahubung", item.narahubung || "-");
  addField("Jenis Kegiatan", item.jenis_kegiatan);
  addField("Jenis Bibit", item.jenis_bibit || "-");
  addField("Jumlah Bibit", item.jumlah_bibit ? `${item.jumlah_bibit} Unit` : "-");
  addField("Lokasi", item.lokasi || "-");
  addField("Tanggal Pelaksanaan", item.tanggal_pelaksanaan || "-");
  addField("Koordinat", `${item.lat ?? "-"}, ${item.long ?? "-"}`);

  addSection("STATUS DAN VERIFIKASI");
  addField("Status Implementasi", item.is_implemented ? "Sudah Implementasi" : "Belum Implementasi");
  addField("Tahap Saat Ini", progress.currentStage);
  addField("Progress Perencanaan", "Aktif");
  addField("Progress Implementasi", progress.hasImplementasi ? "Aktif" : "Belum");
  addField("Progress Monitoring", progress.hasMonitoring ? "Aktif" : "Belum");
  addField("Progress Evaluasi", progress.hasEvaluasi ? "Aktif" : "Belum");
  addField("Blockchain Doc Hash", item.blockchain_doc_hash || "-");
  addField("Blockchain TX Hash", item.blockchain_tx_hash || "-");
  addField("Blockchain Verification", item.blockchainData?.verified ? "Full Verified" : (item.blockchain_tx_hash ? "Uploaded (Pending Verify)" : "Not Uploaded"));

  if (progress.hasImplementasi || implementasi) {
    const implementasiDocs = parseStoredFiles(implementasi?.dokumentasi_kegiatan);
    addSection("DETAIL IMPLEMENTASI");
    addField("PIC Koorlap", implementasi?.pic_koorlap || "-");
    addField("Kesesuaian Nama Perusahaan", boolLabel(implementasi?.nama_perusahaan_sesuai));
    addField("Kesesuaian Lokasi", boolLabel(implementasi?.lokasi_sesuai));
    addField("Kesesuaian Jenis Kegiatan", boolLabel(implementasi?.jenis_kegiatan_sesuai));
    addField("Kesesuaian Jumlah Bibit", boolLabel(implementasi?.jumlah_bibit_sesuai));
    addField("Kesesuaian Jenis Bibit", boolLabel(implementasi?.jenis_bibit_sesuai));
    addField("Kesesuaian Tanggal", boolLabel(implementasi?.tanggal_sesuai));
    addField("Geotagging Implementasi", implementasi?.geotagging || "-");
    addField("Koordinat Implementasi", `${implementasi?.lat ?? "-"}, ${implementasi?.long ?? "-"}`);
    addField("Dokumentasi Implementasi", implementasiDocs.length > 0 ? `${implementasiDocs.length} file` : "-");
  }

  if (progress.hasMonitoring || monitoring) {
    const monitoringDocs = parseStoredFiles(monitoring?.dokumentasi_monitoring);
    addSection("DETAIL MONITORING");
    addField("Jumlah Bibit Ditanam", monitoring?.jumlah_bibit_ditanam ?? "-");
    addField("Jumlah Bibit Mati", monitoring?.jumlah_bibit_mati ?? "-");
    addField("Diameter Batang", monitoring?.diameter_batang ? `${monitoring.diameter_batang} cm` : "-");
    addField("Jumlah Daun", monitoring?.jumlah_daun ?? "-");
    addField("Survival Rate", monitoring?.survival_rate !== undefined && monitoring?.survival_rate !== null ? `${monitoring.survival_rate}%` : "-");
    addField("Kondisi Daun Mengering", monitoring?.daun_mengering ?? "-");
    addField("Kondisi Daun Layu", monitoring?.daun_layu ?? "-");
    addField("Kondisi Daun Menguning", monitoring?.daun_menguning ?? "-");
    addField("Bercak Daun", monitoring?.bercak_daun ?? "-");
    addField("Serangan Hama/Serangga", monitoring?.daun_serangga ?? "-");
    addField("Dokumentasi Monitoring", monitoringDocs.length > 0 ? `${monitoringDocs.length} file` : "-");
  }

  page.drawLine({ start: { x: margin, y: 46 }, end: { x: margin + contentWidth, y: 46 }, thickness: 0.6, color: rgb(0.76, 0.76, 0.76) });
  drawText("Dokumen ini dihasilkan otomatis oleh 3TREESIFY CCS. QR code di atas dapat digunakan untuk memverifikasi keaslian dokumen.", margin, 33, { size: 8.5, color: rgb(0.45, 0.45, 0.45) });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};
