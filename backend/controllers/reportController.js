const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const asyncHandler = require("../utils/asyncHandler");
const Booking = require("../models/bookingModel");
const Trip = require("../models/tripModel");

// ── Helper: build report data from date range ──────────────────────────────
async function buildReportData({ from, to }) {
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1); // inclusive
    dateFilter.$lte = toDate;
  }

  const match = { bookingStatus: "active" };
  if (from || to) match.createdAt = dateFilter;

  // Revenue aggregation per day
  const dailyStats = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" } },
        bookings: { $sum: 1 },
        revenue: { $sum: "$finalPrice" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Overview totals
  const overview = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$finalPrice" },
        paidBookings: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } }
      }
    }
  ]);

  // Top trips by bookings
  const topTrips = await Booking.aggregate([
    { $match: match },
    { $group: { _id: "$trip", bookingCount: { $sum: 1 }, revenue: { $sum: "$finalPrice" } } },
    { $sort: { bookingCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "trips",
        localField: "_id",
        foreignField: "_id",
        as: "trip"
      }
    },
    { $unwind: { path: "$trip", preserveNullAndEmpty: true } },
    {
      $lookup: { from: "stations", localField: "trip.fromStation", foreignField: "_id", as: "from" }
    },
    {
      $lookup: { from: "stations", localField: "trip.toStation", foreignField: "_id", as: "to" }
    }
  ]);

  const totals = overview[0] || { totalBookings: 0, totalRevenue: 0, paidBookings: 0 };
  const fromLabel = from || "Tất cả";
  const toLabel   = to   || "Tất cả";

  return { dailyStats, topTrips, totals, fromLabel, toLabel };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/excel?from=YYYY-MM-DD&to=YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
exports.exportExcel = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const { dailyStats, topTrips, totals, fromLabel, toLabel } = await buildReportData({ from, to });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BusBooking System";
  workbook.created = new Date();

  // ── Sheet 1: Overview ────────────────────────────────────────────────────
  const overviewSheet = workbook.addWorksheet("Tổng quan");
  overviewSheet.columns = [
    { header: "Chỉ tiêu", key: "metric", width: 30 },
    { header: "Giá trị",  key: "value",  width: 20 }
  ];

  // Style header
  overviewSheet.getRow(1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  overviewSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };

  overviewSheet.addRow({ metric: "Kỳ báo cáo",        value: `${fromLabel} → ${toLabel}` });
  overviewSheet.addRow({ metric: "Tổng đơn đặt vé",   value: totals.totalBookings });
  overviewSheet.addRow({ metric: "Đơn đã thanh toán", value: totals.paidBookings });
  overviewSheet.addRow({ metric: "Tổng doanh thu (đ)", value: totals.totalRevenue });

  // ── Sheet 2: Daily Stats ──────────────────────────────────────────────────
  const dailySheet = workbook.addWorksheet("Theo ngày");
  dailySheet.columns = [
    { header: "Ngày",          key: "date",     width: 16 },
    { header: "Số đặt vé",     key: "bookings", width: 14 },
    { header: "Doanh thu (đ)", key: "revenue",  width: 20 }
  ];
  dailySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  dailySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };

  dailyStats.forEach(d => dailySheet.addRow({ date: d._id, bookings: d.bookings, revenue: d.revenue }));

  // Totals row
  const lastRow = dailySheet.addRow({
    date: "TỔNG",
    bookings: totals.totalBookings,
    revenue: totals.totalRevenue
  });
  lastRow.font = { bold: true };
  lastRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };

  // ── Sheet 3: Top Trips ────────────────────────────────────────────────────
  const tripSheet = workbook.addWorksheet("Chuyến hàng đầu");
  tripSheet.columns = [
    { header: "Tuyến đường",  key: "route",    width: 34 },
    { header: "Số đặt vé",   key: "bookings", width: 14 },
    { header: "Doanh thu (đ)", key: "revenue", width: 20 }
  ];
  tripSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  tripSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };

  topTrips.forEach(t => {
    const fromCity = t.from?.[0]?.city || "?";
    const toCity   = t.to?.[0]?.city   || "?";
    tripSheet.addRow({ route: `${fromCity} → ${toCity}`, bookings: t.bookingCount, revenue: t.revenue });
  });

  // Send as download
  const filename = `BaoCao_${fromLabel}_${toLabel}.xlsx`.replace(/\s/g, "_");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
exports.exportPDF = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const { dailyStats, topTrips, totals, fromLabel, toLabel } = await buildReportData({ from, to });

  const doc = new PDFDocument({ margin: 50, size: "A4" });

  const filename = `BaoCao_${fromLabel}_${toLabel}.pdf`.replace(/\s/g, "_");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  // ── Header ────────────────────────────────────────────────────────────────
  doc.fontSize(20).font("Helvetica-Bold").text("BAO CAO DOANH THU", { align: "center" });
  doc.fontSize(11).font("Helvetica").text(`Ky bao cao: ${fromLabel} den ${toLabel}`, { align: "center" });
  doc.moveDown();

  // ── Overview box ─────────────────────────────────────────────────────────
  doc.fontSize(13).font("Helvetica-Bold").text("TONG QUAN");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.4);

  const ovRows = [
    ["Tong don dat ve", totals.totalBookings.toString()],
    ["Don da thanh toan", totals.paidBookings.toString()],
    ["Tong doanh thu", `${totals.totalRevenue.toLocaleString("vi-VN")} dong`],
  ];
  ovRows.forEach(([label, val]) => {
    doc.fontSize(11).font("Helvetica").text(label, 60, doc.y, { continued: true, width: 260 });
    doc.font("Helvetica-Bold").text(val, { align: "right" });
  });
  doc.moveDown();

  // ── Daily table ───────────────────────────────────────────────────────────
  doc.fontSize(13).font("Helvetica-Bold").text("THONG KE THEO NGAY");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.4);

  const colWidths = [160, 120, 160];
  const headers = ["Ngay", "So dat ve", "Doanh thu (dong)"];

  // Table header
  let x = 60;
  headers.forEach((h, i) => {
    doc.fontSize(10).font("Helvetica-Bold").text(h, x, doc.y, { width: colWidths[i], continued: i < 2 });
    x += colWidths[i];
  });
  doc.moveDown(0.3);

  dailyStats.forEach((d, idx) => {
    const y = doc.y;
    if (idx % 2 === 0) {
      doc.rect(50, y - 3, 495, 16).fillAndStroke("#F3F4F6", "#F3F4F6");
    }
    let cx = 60;
    [d._id, d.bookings.toString(), d.revenue.toLocaleString("vi-VN")].forEach((v, i) => {
      doc.fontSize(10).font("Helvetica").fillColor("black").text(v, cx, y, { width: colWidths[i], continued: i < 2 });
      cx += colWidths[i];
    });
    doc.moveDown(0.3);
  });

  // Totals row
  doc.moveDown(0.3);
  doc.fontSize(11).font("Helvetica-Bold")
    .text(`TONG: ${totals.totalBookings} don — ${totals.totalRevenue.toLocaleString("vi-VN")} dong`, { align: "right" });

  doc.moveDown();

  // ── Top trips ─────────────────────────────────────────────────────────────
  if (topTrips.length > 0) {
    doc.fontSize(13).font("Helvetica-Bold").text("TOP TUYEN XE");
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.4);

    topTrips.slice(0, 5).forEach((t, i) => {
      const fromCity = t.from?.[0]?.city || "?";
      const toCity   = t.to?.[0]?.city   || "?";
      doc.fontSize(10).font("Helvetica")
        .text(`${i + 1}. ${fromCity} → ${toCity}   |   ${t.bookingCount} ve   |   ${t.revenue.toLocaleString("vi-VN")} dong`);
    });
  }

  // Footer
  doc.moveDown(2);
  doc.fontSize(9).font("Helvetica").fillColor("gray")
    .text(`Xuat tai: ${new Date().toLocaleString("vi-VN")} — BusBooking System`, { align: "center" });

  doc.end();
});
