import { useState, useEffect } from "react";
import { getExams, getPendingGrading, gradeManually } from "../../api/services";

const ManualEvaluation = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [pendingPapers, setPendingPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gradeInputs, setGradeInputs] = useState({}); // { paperId_questionId: { score, feedback } }
  const [savingPaperId, setSavingPaperId] = useState(null);

  useEffect(() => {
    getExams().then((res) => setExams(res.data));
  }, []);

  const loadPending = async (examId) => {
    if (!examId) {
      setPendingPapers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getPendingGrading(examId);
      setPendingPapers(res.data);
      // Pre-fill inputs with existing manual scores if already graded
      const inputs = {};
      res.data.forEach((paper) => {
        paper.shortAnswerItems.forEach((item) => {
          const key = `${paper.paperId}_${item.questionId}`;
          inputs[key] = {
            score: item.manualScore ?? "",
            feedback: item.manualFeedback || "",
          };
        });
      });
      setGradeInputs(inputs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending(selectedExam);
  }, [selectedExam]);

  const handleInputChange = (paperId, questionId, field, value) => {
    const key = `${paperId}_${questionId}`;
    setGradeInputs((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSaveGrades = async (paper) => {
    setSavingPaperId(paper.paperId);
    try {
      const grades = paper.shortAnswerItems.map((item) => {
        const key = `${paper.paperId}_${item.questionId}`;
        const input = gradeInputs[key] || {};
        return {
          questionId: item.questionId,
          manualScore: Number(input.score) || 0,
          manualFeedback: input.feedback || "",
        };
      });
      await gradeManually(paper.paperId, grades);
      alert("Grades saved successfully");
      loadPending(selectedExam);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save grades");
    } finally {
      setSavingPaperId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Manual Evaluation</h2>
      </div>

      <select
        className="filter-select"
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
      >
        <option value="">Select an exam to grade</option>
        {exams.map((e) => (
          <option key={e._id} value={e._id}>
            {e.title}
          </option>
        ))}
      </select>

      {loading && <p>Loading...</p>}

      {!loading && selectedExam && pendingPapers.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">Nothing to grade</div>
          <p>
            No short-answer responses are pending manual evaluation for this
            exam.
          </p>
        </div>
      )}

      {!loading && !selectedExam && (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No exam selected</div>
          <p>Select an exam above to see pending short-answer responses.</p>
        </div>
      )}

      {!loading &&
        pendingPapers.map((paper) => (
          <div key={paper.paperId} className="chart-card">
            <h3>
              {paper.studentName}{" "}
              <span
                style={{ color: "#888", fontWeight: 400, fontSize: "0.85rem" }}
              >
                ({paper.studentEmail})
              </span>
            </h3>

            {paper.shortAnswerItems.map((item) => {
              const key = `${paper.paperId}_${item.questionId}`;
              const input = gradeInputs[key] || { score: "", feedback: "" };
              return (
                <div
                  key={item.questionId}
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>
                    {item.questionText}
                  </p>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#555",
                      background: "#f8fafc",
                      padding: "0.7rem",
                      borderRadius: "8px",
                      marginBottom: "0.7rem",
                    }}
                  >
                    {item.studentAnswer || (
                      <em style={{ color: "#aaa" }}>No answer provided</em>
                    )}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.6rem",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="number"
                      placeholder={`Score (max ${item.maxMarks})`}
                      min="0"
                      max={item.maxMarks}
                      value={input.score}
                      onChange={(e) =>
                        handleInputChange(
                          paper.paperId,
                          item.questionId,
                          "score",
                          e.target.value,
                        )
                      }
                      style={{ width: "140px" }}
                    />
                    <span style={{ fontSize: "0.82rem", color: "#888" }}>
                      / {item.maxMarks} marks
                    </span>
                    {item.alreadyGraded && (
                      <span
                        className="badge"
                        style={{ background: "#dcfce7", color: "#15803d" }}
                      >
                        Graded
                      </span>
                    )}
                  </div>
                  <input
                    placeholder="Optional feedback for student"
                    value={input.feedback}
                    onChange={(e) =>
                      handleInputChange(
                        paper.paperId,
                        item.questionId,
                        "feedback",
                        e.target.value,
                      )
                    }
                    style={{ marginTop: "0.5rem", width: "100%" }}
                  />
                </div>
              );
            })}

            <button
              className="btn-primary"
              style={{ marginTop: "1.2rem" }}
              disabled={savingPaperId === paper.paperId}
              onClick={() => handleSaveGrades(paper)}
            >
              {savingPaperId === paper.paperId ? "Saving..." : "Save Grades"}
            </button>
          </div>
        ))}
    </div>
  );
};

export default ManualEvaluation;
