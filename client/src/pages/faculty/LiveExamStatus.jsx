import { useState, useEffect } from "react";
import { getExams, getLiveExamStatus } from "../../api/services";

const LiveExamStatus = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getExams().then((res) =>
      setExams(res.data.filter((e) => e.status === "published")),
    );
  }, []);

  const loadStatus = async (examId) => {
    if (!examId) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await getLiveExamStatus(examId);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus(selectedExam);
    if (!selectedExam) return;
    const interval = setInterval(() => loadStatus(selectedExam), 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [selectedExam]);

  const formatElapsed = (s) => (s ? `${Math.floor(s / 60)}m ${s % 60}s` : "—");

  return (
    <div>
      <div className="page-header">
        <h2>Live Exam Status</h2>
      </div>

      <select
        className="filter-select"
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
      >
        <option value="">Select a published exam</option>
        {exams.map((e) => (
          <option key={e._id} value={e._id}>
            {e.title}
          </option>
        ))}
      </select>

      {loading && <p>Loading...</p>}

      {!loading && !selectedExam && (
        <div className="empty-state">
          <div className="empty-state-icon">🔴</div>
          <div className="empty-state-title">No exam selected</div>
          <p>Select a published exam to monitor live activity.</p>
        </div>
      )}

      {!loading && data && (
        <>
          <div
            className="stats-grid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <div className="stat-card">
              <p className="stat-label">Not Started</p>
              <p className="stat-value" style={{ color: "#94a3b8" }}>
                {data.summary.notStarted}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">In Progress</p>
              <p className="stat-value" style={{ color: "#eab308" }}>
                {data.summary.inProgress}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Submitted</p>
              <p className="stat-value" style={{ color: "#16a34a" }}>
                {data.summary.submitted}
              </p>
            </div>
          </div>

          {data.liveList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👀</div>
              <div className="empty-state-title">No activity yet</div>
              <p>No students have started this exam.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Elapsed / Time Taken</th>
                  <th>Tab Switches</th>
                  <th>Refreshes</th>
                </tr>
              </thead>
              <tbody>
                {data.liveList.map((s, i) => (
                  <tr key={i}>
                    <td>{s.studentName}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            s.status === "in_progress" ? "#fef9c3" : "#dcfce7",
                          color:
                            s.status === "in_progress" ? "#a16207" : "#15803d",
                        }}
                      >
                        {s.status === "in_progress"
                          ? "🟡 In Progress"
                          : "🟢 Submitted"}
                      </span>
                    </td>
                    <td>
                      {s.status === "in_progress"
                        ? formatElapsed(s.elapsedSeconds)
                        : new Date(s.submittedAt).toLocaleTimeString()}
                    </td>
                    <td
                      style={{
                        color: s.tabSwitchCount > 0 ? "#dc2626" : "#888",
                      }}
                    >
                      {s.tabSwitchCount}
                    </td>
                    <td
                      style={{ color: s.refreshCount > 0 ? "#dc2626" : "#888" }}
                    >
                      {s.refreshCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p
            style={{ fontSize: "0.78rem", color: "#aaa", marginTop: "0.8rem" }}
          >
            Auto-refreshes every 15 seconds.
          </p>
        </>
      )}
    </div>
  );
};

export default LiveExamStatus;
