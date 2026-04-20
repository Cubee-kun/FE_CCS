import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const safeText = (value) => String(value ?? "-");

const getSuccessLabel = (survivalRate) => {
  const rate = Number.parseFloat(String(survivalRate).replace("%", ""));
  if (Number.isNaN(rate)) return "-";
  if (rate >= 80) return "BERHASIL";
  if (rate >= 50) return "PERLU PERHATIAN";
  return "GAGAL";
};

const getSectionColor = (survivalRate) => {
  const rate = Number.parseFloat(String(survivalRate).replace("%", ""));
  if (Number.isNaN(rate) || rate < 50) return rgb(0.75, 0.12, 0.12);
  if (rate < 80) return rgb(0.78, 0.53, 0.08);
  return rgb(0.1, 0.52, 0.3);
};

const downloadAssetAsBytes = async (url) => {
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.arrayBuffer();
};

const wrapText = (font, text, size, maxWidth) => {
  const words = safeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  const splitLongWord = (word) => {
    if (font.widthOfTextAtSize(word, size) <= maxWidth) return [word];

    const chunks = [];
    let chunk = "";
    for (const char of word) {
      const candidate = `${chunk}${char}`;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && chunk) {
        chunks.push(chunk);
        chunk = char;
      } else {
        chunk = candidate;
      }
    }

    if (chunk) chunks.push(chunk);
    return chunks;
  };

  for (const word of words) {
    for (const chunk of splitLongWord(word)) {
      const candidate = currentLine ? `${currentLine} ${chunk}` : chunk;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = chunk;
      } else {
        currentLine = candidate;
      }
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : ["-"];
};

const startNewPage = (pdfDoc, pageRef, fonts, state) => {
  pageRef.current = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  state.y = PAGE_HEIGHT - MARGIN - 18;
  drawHeader(pageRef.current, fonts, state.pageNumber + 1);
  state.pageNumber += 1;
};

const drawHeader = (page, fonts, pageNumber) => {
  const { regular, bold } = fonts;
  const topY = PAGE_HEIGHT - MARGIN + 10;

  page.drawText("3TREESIFY CCS", {
    x: MARGIN,
    y: topY,
    size: 13,
    font: bold,
    color: rgb(0.1, 0.32, 0.25),
  });
  page.drawText("Laporan Evaluasi Hasil Monitoring", {
    x: MARGIN,
    y: topY - 13,
    size: 9,
    font: regular,
    color: rgb(0.33, 0.33, 0.33),
  });
  page.drawText(`Halaman ${pageNumber}`, {
    x: PAGE_WIDTH - MARGIN - 60,
    y: topY,
    size: 8.5,
    font: regular,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawLine({
    start: { x: MARGIN, y: topY - 25 },
    end: { x: PAGE_WIDTH - MARGIN, y: topY - 25 },
    thickness: 1.2,
    color: rgb(0.12, 0.42, 0.32),
  });
  page.drawLine({
    start: { x: MARGIN, y: topY - 28 },
    end: { x: PAGE_WIDTH - MARGIN, y: topY - 28 },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });
};

const drawTitle = (page, fonts, text, y) => {
  page.drawText(text, {
    x: MARGIN,
    y,
    size: 18,
    font: fonts.bold,
    color: rgb(0.1, 0.2, 0.18),
  });
};

const drawSectionTitle = (page, fonts, text, y, color = rgb(0.1, 0.32, 0.25)) => {
  page.drawText(text, {
    x: MARGIN,
    y,
    size: 12.5,
    font: fonts.bold,
    color,
  });
  page.drawLine({
    start: { x: MARGIN, y: y - 4 },
    end: { x: PAGE_WIDTH - MARGIN, y: y - 4 },
    thickness: 0.8,
    color,
  });
};

const drawParagraph = (page, fonts, text, x, y, width, size = 10.4, color = rgb(0.15, 0.15, 0.15)) => {
  const lines = wrapText(fonts.regular, text, size, width);
  let cursorY = y;
  for (const line of lines) {
    page.drawText(line, {
      x,
      y: cursorY,
      size,
      font: fonts.regular,
      color,
    });
    cursorY -= size + 4;
  }
  return cursorY;
};

const drawLabeledRow = (page, fonts, label, value, y, labelWidth = 170) => {
  page.drawText(label, {
    x: MARGIN,
    y,
    size: 10.2,
    font: fonts.bold,
    color: rgb(0.22, 0.22, 0.22),
  });
  page.drawText(":", {
    x: MARGIN + labelWidth - 7,
    y,
    size: 10.2,
    font: fonts.regular,
    color: rgb(0.22, 0.22, 0.22),
  });

  const valueLines = wrapText(fonts.regular, value, 10.2, CONTENT_WIDTH - labelWidth - 16);
  let cursorY = y;
  valueLines.forEach((line, index) => {
    page.drawText(line, {
      x: MARGIN + labelWidth + 10,
      y: cursorY,
      size: 10.2,
      font: index === 0 ? fonts.bold : fonts.regular,
      color: rgb(0.17, 0.17, 0.17),
    });
    cursorY -= 13;
  });

  return Math.min(y - 12, cursorY);
};

export const buildEvaluasiPdfBlob = async (report, narratives, recommendations = []) => {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  const pageRef = { current: null };
  const state = { y: PAGE_HEIGHT - MARGIN - 18, pageNumber: 0 };

  const logoBytes = await downloadAssetAsBytes("/images/icon.png");
  let logoImage = null;
  if (logoBytes) {
    try {
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (error) {
      console.warn("[evaluasiPdf] logo skipped:", error?.message || error);
    }
  }

  startNewPage(pdfDoc, pageRef, fonts, state);
  const page = pageRef.current;

  if (logoImage) {
    page.drawImage(logoImage, {
      x: PAGE_WIDTH - MARGIN - 38,
      y: PAGE_HEIGHT - MARGIN - 28,
      width: 30,
      height: 30,
    });
  }

  drawTitle(page, fonts, "LAPORAN EVALUASI RESTORASI", state.y - 14);
  page.drawText("Narasi eksekutif yang disusun dari data monitoring lapangan", {
    x: MARGIN,
    y: state.y - 32,
    size: 9,
    font: fonts.regular,
    color: rgb(0.35, 0.35, 0.35),
  });

  state.y -= 56;

  page.drawText("INFORMASI PROYEK", {
    x: MARGIN,
    y: state.y,
    size: 12,
    font: fonts.bold,
    color: rgb(0.1, 0.32, 0.25),
  });
  state.y -= 18;

  state.y = drawLabeledRow(page, fonts, "Nama Perusahaan", safeText(report.namaPerusahaan), state.y);
  state.y = drawLabeledRow(page, fonts, "Jenis Kegiatan", safeText(report.jenisKegiatan), state.y);
  state.y = drawLabeledRow(page, fonts, "Lokasi", safeText(report.lokasi), state.y);
  state.y = drawLabeledRow(page, fonts, "Geotagging", safeText(report.lokasiGeotagging), state.y);
  state.y = drawLabeledRow(page, fonts, "Tanggal Pelaksanaan", safeText(report.tanggalPelaksanaan), state.y);
  state.y = drawLabeledRow(page, fonts, "Tanggal Monitoring", safeText(report.monitoringDate), state.y);
  state.y = drawLabeledRow(page, fonts, "Jumlah Bibit", safeText(report.jumlahBibit), state.y);
  state.y = drawLabeledRow(page, fonts, "Total Monitoring", safeText(report.totalMonitoring), state.y);

  state.y -= 10;
  drawSectionTitle(page, fonts, "RINGKASAN EKSEKUTIF", state.y, getSectionColor(report.survivalRate));
  state.y -= 22;

  const metricColor = getSectionColor(report.survivalRate);
  page.drawRectangle({ x: MARGIN, y: state.y - 12, width: CONTENT_WIDTH, height: 56, color: rgb(0.97, 0.98, 0.98), borderColor: metricColor, borderWidth: 1 });
  page.drawText(`Survival Rate: ${safeText(report.survivalRate)} (${getSuccessLabel(report.survivalRate)})`, {
    x: MARGIN + 12,
    y: state.y + 22,
    size: 11,
    font: fonts.bold,
    color: metricColor,
  });
  page.drawText(`Kondisi Kesehatan: ${safeText(report.healthCondition)}`, {
    x: MARGIN + 12,
    y: state.y + 8,
    size: 10,
    font: fonts.regular,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText(`Tinggi Rata-rata: ${safeText(report.avgHeight)} cm | Diameter Rata-rata: ${safeText(report.avgDiameter)} cm`, {
    x: MARGIN + 12,
    y: state.y - 6,
    size: 10,
    font: fonts.regular,
    color: rgb(0.2, 0.2, 0.2),
  });
  state.y -= 30;

  const sections = [
    { title: "HASIL & PEMBAHASAN", color: rgb(0.1, 0.32, 0.25), items: [
      ["a. Survival Rate", narratives?.survivalRate],
      ["b. Tinggi Bibit Rata-rata", narratives?.height],
      ["c. Diameter Batang Rata-rata", narratives?.diameter],
      ["d. Kondisi Kesehatan Bibit Tanaman", narratives?.health],
    ]},
    { title: "REKOMENDASI & TINDAKAN LANJUT", color: rgb(0.36, 0.18, 0.45), items: recommendations.map((item) => [`${item.level}`, item.text]) },
  ];

  for (const section of sections) {
    if (state.y < 140) startNewPage(pdfDoc, pageRef, fonts, state);
    const currentPage = pageRef.current;

    drawSectionTitle(currentPage, fonts, section.title, state.y, section.color);
    state.y -= 20;

    for (const [label, value] of section.items) {
      if (state.y < 120) startNewPage(pdfDoc, pageRef, fonts, state);
      const text = safeText(value);
      const lines = wrapText(fonts.regular, text, 10.1, CONTENT_WIDTH - 16);
      const requiredHeight = lines.length * 14 + 18;
      if (state.y - requiredHeight < 70) {
        startNewPage(pdfDoc, pageRef, fonts, state);
      }

      const activePage = pageRef.current;
      activePage.drawText(label, {
        x: MARGIN,
        y: state.y,
        size: 10.2,
        font: fonts.bold,
        color: rgb(0.22, 0.22, 0.22),
      });
      state.y -= 14;
      state.y = drawParagraph(activePage, fonts, text, MARGIN, state.y, CONTENT_WIDTH, 10.1);
      state.y -= 10;
    }
  }

  const output = await pdfDoc.save();
  return new Blob([output], { type: "application/pdf" });
};
