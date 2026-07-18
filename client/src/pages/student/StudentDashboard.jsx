import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SkeletonStatsGrid, SkeletonTable } from "../../components/Skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  getMyResults,
  downloadFile,
  getScorecardUrl,
} from "../../api/services";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [subjectWise, setSubjectWise] = useState([]);
  const [difficultyWise, setDifficultyWise] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyResults()
      .then((res) => {
        setResults(res.data.results);
        setSubjectWise(res.data.subjectWise);
        setDifficultyWise(res.data.difficultyWise);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2>My Performance</h2>
        </div>
        <SkeletonStatsGrid count={4} />
        <SkeletonTable rows={4} cols={6} />
      </div>
    );
  }

  const totalExams = results.length;
  const avgPercentage = totalExams
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalExams)
    : 0;
  const bestScore = totalExams
    ? Math.max(...results.map((r) => r.percentage))
    : 0;
  const totalViolations = results.reduce(
    (sum, r) => sum + (r.tabSwitchCount || 0),
    0,
  );
  const lowestScore = totalExams
    ? Math.min(...results.map((r) => r.percentage))
    : 0;
  const avgAccuracy = totalExams
    ? Math.round(
        results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / totalExams,
      )
    : 0;
  const avgSpeed = totalExams
    ? Math.round(
        results
          .filter((r) => r.speedPerQuestion)
          .reduce((sum, r) => sum + r.speedPerQuestion, 0) /
          (results.filter((r) => r.speedPerQuestion).length || 1),
      )
    : 0;

  // Chart data — chronological order for trend line
  const trendData = [...results]
    .reverse()
    .map((r, i) => ({ name: `Exam ${i + 1}`, percentage: r.percentage }));

  const barData = results.map((r) => ({
    name:
      r.examTitle?.length > 15 ? r.examTitle.slice(0, 15) + "…" : r.examTitle,
    score: r.percentage,
  }));

  return (
    <div>
      <div className="page-header">
        <h2>My Performance</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Exams Taken</p>
          <p className="stat-value">{totalExams}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Average Score</p>
          <p className="stat-value">{avgPercentage}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Best Score</p>
          <p className="stat-value">{bestScore}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Violations</p>
          <p
            className="stat-value"
            style={{ color: totalViolations > 0 ? "#dc2626" : "#16a34a" }}
          >
            {totalViolations}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Lowest Score</p>
          <p className="stat-value">{lowestScore}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Accuracy</p>
          <p className="stat-value">{avgAccuracy}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Speed</p>
          <p className="stat-value">
            {avgSpeed}s
            <span style={{ fontSize: "0.6em", color: "#888" }}>/question</span>
          </p>
        </div>
      </div>

      {totalExams === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No results yet</div>
          <p>Complete an exam to see your performance and score trends here.</p>
        </div>
      ) : (
        <>
          <div className="chart-card">
            <h3>Score Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Score by Exam</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {subjectWise.length > 0 && (
            <div className="chart-card">
              <h3>Subject-wise Performance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={subjectWise.map((s) => ({
                    name: s.subject,
                    avg: s.averagePercentage,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {difficultyWise.length > 0 && (
            <div className="chart-card">
              <h3>Difficulty-wise Accuracy</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={difficultyWise.map((d) => ({
                    name: d.difficulty,
                    accuracy: d.accuracy,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="accuracy"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="chart-card">
            <h3>Time Spent per Exam</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={results.map((r) => ({
                  name: r.examTitle?.slice(0, 12),
                  minutes: r.timeTakenSeconds
                    ? Math.round(r.timeTakenSeconds / 60)
                    : 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 style={{ margin: "1.8rem 0 1rem", fontSize: "1.1rem" }}>
            Exam History
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Result</th>
                  <th>Rank</th>
                  <th>Correct / Wrong / Skipped</th>
                  <th>Time Taken</th>
                  <th>Submitted</th>
                  <th>Scorecard</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r._id}>
                    <td>{r.examTitle}</td>
                    <td>{r.subject}</td>
                    <td>
                      {r.score} / {r.totalMarks}{" "}
                      <span style={{ color: "#888", fontSize: "0.78rem" }}>
                        ({r.percentage}%)
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: r.grade === "F" ? "#fee2e2" : "#eef2ff",
                          color: r.grade === "F" ? "#b91c1c" : "#4338ca",
                        }}
                      >
                        {r.grade}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            r.passFail === "Pass" ? "#dcfce7" : "#fee2e2",
                          color: r.passFail === "Pass" ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {r.passFail}
                      </span>
                    </td>
                    <td>
                      #{r.rank} of {r.totalAttempts}
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>
                      <span style={{ color: "#16a34a" }}>
                        {r.correctCount}✓
                      </span>{" "}
                      <span style={{ color: "#dc2626" }}>{r.wrongCount}✗</span>{" "}
                      <span style={{ color: "#94a3b8" }}>
                        {r.skippedCount}—
                      </span>
                    </td>
                    <td>
                      {r.timeTakenSeconds
                        ? `${Math.floor(r.timeTakenSeconds / 60)}m ${r.timeTakenSeconds % 60}s`
                        : "—"}
                    </td>
                    <td>{new Date(r.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{
                          padding: "0.35rem 0.7rem",
                          fontSize: "0.8rem",
                        }}
                        onClick={() =>
                          downloadFile(
                            getScorecardUrl(r._id),
                            `scorecard-${r.examTitle}.pdf`,
                          )
                        }
                      >
                        📄 PDF
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{
                          padding: "0.35rem 0.7rem",
                          fontSize: "0.8rem",
                        }}
                        onClick={() => navigate(`/student/review/${r._id}`)}
                      >
                        🔍 Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
