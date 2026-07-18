const PDFDocument = require("pdfkit");

const generateScorecardPDF = (res, data) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="scorecard-${data.studentName.replace(/\s+/g, "_")}.pdf"`,
  );
  doc.pipe(res);

  // Header
  doc
    .fontSize(20)
    .fillColor("#4f46e5")
    .text("ExamSphere — Result Scorecard", { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .fillColor("#666")
    .text("Smart Online Examination & Assessment System", { align: "center" });
  doc.moveDown(1.5);

  // Divider
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").stroke();
  doc.moveDown(1);

  // Student & exam info
  doc.fontSize(12).fillColor("#000");
  const infoRows = [
    ["Student Name", data.studentName],
    ["Email", data.studentEmail],
    ["Exam", data.examTitle],
    ["Subject", data.subject],
    ["Submitted On", new Date(data.submittedAt).toLocaleString()],
  ];
  infoRows.forEach(([label, value]) => {
    doc
      .font("Helvetica-Bold")
      .text(`${label}: `, { continued: true })
      .font("Helvetica")
      .text(value);
  });

  doc.moveDown(1.5);

  // Score box
  doc.rect(50, doc.y, 495, 80).fillAndStroke("#eef2ff", "#c7d2fe");
  const boxTop = doc.y + 15;
  doc
    .fillColor("#4338ca")
    .fontSize(28)
    .text(`${data.score} / ${data.totalMarks}`, 50, boxTop, {
      align: "center",
      width: 495,
    });
  doc
    .fontSize(11)
    .fillColor("#555")
    .text(
      `${data.percentage}% — Grade ${data.grade} — ${data.passFail}`,
      50,
      boxTop + 38,
      { align: "center", width: 495 },
    );
  doc.moveDown(6);

  // Breakdown
  doc
    .fontSize(12)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("Performance Breakdown");
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(11);
  doc
    .fillColor("#16a34a")
    .text(`Correct: ${data.correctCount}`, { continued: true });
  doc.fillColor("#000").text("   ", { continued: true });
  doc
    .fillColor("#dc2626")
    .text(`Wrong: ${data.wrongCount}`, { continued: true });
  doc.fillColor("#000").text("   ", { continued: true });
  doc.fillColor("#94a3b8").text(`Skipped: ${data.skippedCount}`);
  doc.fillColor("#000").moveDown(0.3);
  if (data.rank) {
    doc.text(`Rank: #${data.rank} of ${data.totalAttempts} students`);
  }
  if (data.timeTakenSeconds) {
    doc.text(
      `Time Taken: ${Math.floor(data.timeTakenSeconds / 60)}m ${data.timeTakenSeconds % 60}s`,
    );
  }

  doc.moveDown(2);
  doc
    .fontSize(9)
    .fillColor("#999")
    .text("This is a system-generated scorecard.", { align: "center" });

  doc.end();
};

module.exports = generateScorecardPDF;
