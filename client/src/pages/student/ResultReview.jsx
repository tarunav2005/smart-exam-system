import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getResultReview } from "../../api/services";

const ResultReview = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResultReview(paperId)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [paperId]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading review...</p>;
  if (!data) return <p style={{ padding: "2rem" }}>Could not load review.</p>;

  return (
    <div style={{ maxWidth: "850px", margin: "0 auto", padding: "2rem" }}>
      <button
        className="btn-secondary"
        onClick={() => navigate("/student")}
        style={{ marginBottom: "1.2rem" }}
      >
        ← Back
      </button>
      <h2>{data.examTitle} — Review</h2>
      <p style={{ color: "#888", marginBottom: "1.5rem" }}>
        Score: {data.score} / {data.totalMarks}
      </p>

      {data.review.map((r, i) => (
        <div
          key={i}
          className="chart-card"
          style={{
            borderLeft: `4px solid ${r.isSkipped ? "#94a3b8" : r.isCorrect ? "#16a34a" : "#dc2626"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: "0.6rem",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>
              Q{i + 1}. {r.questionText}
            </p>
            <span
              className="badge"
              style={{
                background: r.isSkipped
                  ? "#f1f5f9"
                  : r.isCorrect
                    ? "#dcfce7"
                    : "#fee2e2",
                color: r.isSkipped
                  ? "#64748b"
                  : r.isCorrect
                    ? "#15803d"
                    : "#b91c1c",
                flexShrink: 0,
                marginLeft: "1rem",
              }}
            >
              {r.isSkipped ? "Skipped" : r.isCorrect ? "Correct" : "Incorrect"}
            </span>
          </div>

          <p style={{ fontSize: "0.85rem", color: "#555" }}>
            <strong>Your answer:</strong>{" "}
            {r.type === "programming" ? (
              <pre
                style={{
                  background: "#1e293b",
                  color: "#e2e8f0",
                  padding: "0.7rem",
                  borderRadius: "6px",
                  overflowX: "auto",
                  fontSize: "0.8rem",
                }}
              >
                {r.studentAnswer}
              </pre>
            ) : (
              r.studentAnswer
            )}
          </p>
          {!r.isCorrect &&
            r.type !== "short_answer" &&
            r.type !== "programming" && (
              <p style={{ fontSize: "0.85rem", color: "#16a34a" }}>
                <strong>Correct answer:</strong> {r.correctAnswer}
              </p>
            )}
          {(r.type === "short_answer" || r.type === "programming") && (
            <p style={{ fontSize: "0.85rem", color: "#4338ca" }}>
              {r.correctAnswer}
            </p>
          )}

          {r.explanation && (
            <p
              style={{
                fontSize: "0.82rem",
                color: "#666",
                background: "#f8fafc",
                padding: "0.6rem",
                borderRadius: "6px",
                marginTop: "0.6rem",
              }}
            >
              💡 {r.explanation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResultReview;
