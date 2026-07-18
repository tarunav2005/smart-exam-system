import { useState, useEffect } from "react";
import { SkeletonStatsGrid, SkeletonTable } from "../../components/Skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  getExamAnalytics,
  getExams,
  getExportUrl,
  getReportUrl,
  downloadFile,
  getSubjects,
  getMarksheetUrl,
} from "../../api/services";

const FacultyAnalytics = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    getExams().then((res) => setExams(res.data));
    getSubjects().then((res) => setSubjects(res.data));
  }, []);

  useEffect(() => {
    if (!selectedExam) {
      setAnalytics(null);
      return;
    }
    setLoading(true);
    getExamAnalytics(selectedExam)
      .then((res) => setAnalytics(res.data))
      .finally(() => setLoading(false));
  }, [selectedExam]);

  const accuracyColor = (acc) => {
    if (acc >= 70) return "#16a34a";
    if (acc >= 40) return "#eab308";
    return "#dc2626";
  };

  return (
    <div>
      <div className="page-header">
        <h2>Exam Analytics</h2>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <select
          className="filter-select"
          id="marksheetSubject"
          style={{ marginBottom: 0 }}
        >
          <option value="">Select subject for marksheet</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          className="btn-secondary"
          onClick={() => {
            const subjId = document.getElementById("marksheetSubject").value;
            if (!subjId) return alert("Select a subject first");
            downloadFile(getMarksheetUrl(subjId), "marksheet.xlsx");
          }}
        >
          📑 Download Marksheet
        </button>
      </div>

      <select
        className="filter-select"
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
      >
        <option value="">Select an exam to view analytics</option>
        {exams.map((e) => (
          <option key={e._id} value={e._id}>
            {e.title}
          </option>
        ))}
      </select>

      {loading && (
        <>
          <SkeletonStatsGrid count={4} />
          <SkeletonTable rows={4} cols={5} />
        </>
      )}

      {!loading && !selectedExam && (
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <div className="empty-state-title">No exam selected</div>
          <p>Select an exam above to view class performance and analytics.</p>
        </div>
      )}

      {!loading && analytics && analytics.attempted === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🧑‍🎓</div>
          <div className="empty-state-title">No attempts yet</div>
          <p>No students have attempted "{analytics.examTitle}" yet.</p>
        </div>
      )}

      {!loading && analytics && analytics.attempted > 0 && (
        <>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <button
              className="btn-secondary"
              onClick={() =>
                downloadFile(
                  getExportUrl(selectedExam),
                  `${analytics.examTitle}_results.xlsx`,
                )
              }
            >
              📊 Full Results
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                downloadFile(
                  getReportUrl(selectedExam, "summary"),
                  `${analytics.examTitle}_summary.xlsx`,
                )
              }
            >
              📄 Summary
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                downloadFile(
                  getReportUrl(selectedExam, "attendance"),
                  `${analytics.examTitle}_attendance.xlsx`,
                )
              }
            >
              ✅ Attendance
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                downloadFile(
                  getReportUrl(selectedExam, "top10"),
                  `${analytics.examTitle}_top10.xlsx`,
                )
              }
            >
              🏆 Top 10
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                downloadFile(
                  getReportUrl(selectedExam, "question-analysis"),
                  `${analytics.examTitle}_questions.xlsx`,
                )
              }
            >
              ❓ Question Analysis
            </button>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Attempted</p>
              <p className="stat-value">
                {analytics.attempted} / {analytics.assigned}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Class Average</p>
              <p className="stat-value">
                {analytics.average} / {analytics.totalMarks}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Highest Score</p>
              <p className="stat-value" style={{ color: "#16a34a" }}>
                {analytics.highest}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Pass Rate</p>
              <p
                className="stat-value"
                style={{
                  color: analytics.passRate >= 60 ? "#16a34a" : "#dc2626",
                }}
              >
                {analytics.passRate}%
              </p>
            </div>
          </div>

          <div className="chart-card">
            <h3>Student Scores</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={analytics.studentScores.map((s) => ({
                  name: s.studentName,
                  score: s.score,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[0, analytics.totalMarks]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {analytics.studentScores.map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.percentage >= 40 ? "#4f46e5" : "#dc2626"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div className="chart-card" style={{ flex: 1, minWidth: "280px" }}>
              <h3>🏆 Top Performers</h3>
              {analytics.topPerformers.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#888" }}>
                  No submissions yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {analytics.topPerformers.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0.7rem",
                        background: "#f0fdf4",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                        #{i + 1} {s.studentName}
                      </span>
                      <span
                        className="badge"
                        style={{ background: "#dcfce7", color: "#15803d" }}
                      >
                        {s.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="chart-card" style={{ flex: 1, minWidth: "280px" }}>
              <h3>⚠️ Students Needing Attention</h3>
              {analytics.weakStudents.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#888" }}>
                  No students below 40% — great result!
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {analytics.weakStudents.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0.7rem",
                        background: "#fef2f2",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                        {s.studentName}
                      </span>
                      <span
                        className="badge"
                        style={{ background: "#fee2e2", color: "#b91c1c" }}
                      >
                        {s.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h3>Question-Level Accuracy</h3>
            <p
              style={{
                fontSize: "0.82rem",
                color: "#888",
                marginBottom: "1rem",
              }}
            >
              Percentage of students who answered each question correctly —
              helps identify weak topics.
            </p>
            {analytics.questionAccuracy.map((q, i) => (
              <div key={i} style={{ marginBottom: "0.9rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    marginBottom: "0.3rem",
                  }}
                >
                  <span>{q.questionText}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: accuracyColor(q.accuracy),
                    }}
                  >
                    {q.accuracy}%
                  </span>
                </div>
                <div
                  style={{
                    background: "#f0f0f0",
                    borderRadius: "6px",
                    height: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${q.accuracy}%`,
                      height: "100%",
                      background: accuracyColor(q.accuracy),
                      borderRadius: "6px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="chart-card">
            <h3>⚠️ Difficult Questions</h3>
            <p
              style={{
                fontSize: "0.82rem",
                color: "#888",
                marginBottom: "1rem",
              }}
            >
              Questions with less than 40% accuracy — may be too hard or
              unclear.
            </p>
            {analytics.questionAccuracy.filter((q) => q.accuracy < 40)
              .length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "#16a34a" }}>
                No unusually difficult questions detected.
              </p>
            ) : (
              analytics.questionAccuracy
                .filter((q) => q.accuracy < 40)
                .sort((a, b) => a.accuracy - b.accuracy)
                .map((q, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.6rem 0.8rem",
                      background: "#fef2f2",
                      borderRadius: "8px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem" }}>
                      {q.questionText}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        flexShrink: 0,
                        marginLeft: "1rem",
                      }}
                    >
                      {q.accuracy}% correct
                    </span>
                  </div>
                ))
            )}
          </div>

          <h3 style={{ margin: "1.8rem 0 1rem", fontSize: "1.1rem" }}>
            Individual Results
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Violations</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.studentScores.map((s, i) => (
                <tr key={i}>
                  <td>{s.studentName}</td>
                  <td>
                    {s.score} / {analytics.totalMarks}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: s.percentage >= 40 ? "#dcfce7" : "#fee2e2",
                        color: s.percentage >= 40 ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {s.percentage}%
                    </span>
                  </td>
                  <td
                    style={{ color: s.tabSwitchCount > 0 ? "#dc2626" : "#888" }}
                  >
                    {s.tabSwitchCount}
                  </td>
                  <td>
                    {s.status === "auto_submitted"
                      ? "Auto-submitted"
                      : "Submitted"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default FacultyAnalytics;
