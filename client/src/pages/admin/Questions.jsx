import { useState, useEffect } from "react";
import { SkeletonTable } from "../../components/Skeleton";
import {
  getSubjects,
  getQuestions,
  createQuestion,
  deleteQuestion,
  importQuestionsExcel,
} from "../../api/services";

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const [form, setForm] = useState({
    subject: "",
    type: "mcq",
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    correctAnswers: [],
    numericalTolerance: 0,
    difficulty: "medium",
    marks: 1,
    negativeMarks: 0,
    chapter: "",
    explanation: "",
    tags: "",
    testCases: [{ input: "", expectedOutput: "" }],
    languageId: 71,
  });

  const loadSubjects = async () => {
    const res = await getSubjects();
    setSubjects(res.data);
  };

  const loadQuestions = async (subjectId) => {
    setLoading(true);
    try {
      const filters = subjectId ? { subject: subjectId } : {};
      const res = await getQuestions(filters);
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
    loadQuestions();
  }, []);

  useEffect(() => {
    loadQuestions(selectedSubject);
  }, [selectedSubject]);

  const resetForm = () => {
    setForm({
      subject: "",
      type: "mcq",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      correctAnswers: [],
      numericalTolerance: 0,
      difficulty: "medium",
      marks: 1,
      negativeMarks: 0,
      chapter: "",
      explanation: "",
      tags: "",
      testCases: [{ input: "", expectedOutput: "" }],
      languageId: 71,
    });
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...form.testCases];
    updated[index][field] = value;
    setForm({ ...form, testCases: updated });
  };
  const addTestCase = () =>
    setForm({
      ...form,
      testCases: [...form.testCases, { input: "", expectedOutput: "" }],
    });
  const removeTestCase = (index) =>
    setForm({
      ...form,
      testCases: form.testCases.filter((_, i) => i !== index),
    });

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const toggleCorrectAnswer = (opt) => {
    setForm((prev) => ({
      ...prev,
      correctAnswers: prev.correctAnswers.includes(opt)
        ? prev.correctAnswers.filter((a) => a !== opt)
        : [...prev.correctAnswers, opt],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        marks: Number(form.marks),
        negativeMarks: Number(form.negativeMarks),
        numericalTolerance: Number(form.numericalTolerance) || 0,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      };
      if (form.type === "mcq" || form.type === "multiple_correct") {
        payload.options = form.options.filter((o) => o.trim() !== "");
      } else {
        payload.options = [];
      }
      if (form.type !== "multiple_correct") {
        payload.correctAnswers = [];
      }

      await createQuestion(payload);
      setShowModal(false);
      resetForm();
      loadQuestions(selectedSubject);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create question");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(id);
      loadQuestions(selectedSubject);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await importQuestionsExcel(formData);
      setImportResult(res.data);
      loadQuestions(selectedSubject);
    } catch (err) {
      alert(err.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Question Bank</h2>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setImportFile(e.target.files[0])}
            style={{ fontSize: "0.82rem" }}
          />
          <button
            className="btn-secondary"
            onClick={handleImport}
            disabled={!importFile || importing}
          >
            {importing ? "Importing..." : "📥 Import Excel"}
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
            disabled={subjects.length === 0}
          >
            + Add Question
          </button>
        </div>
      </div>

      {importResult && (
        <p
          style={{
            fontSize: "0.85rem",
            background: "#eef2ff",
            color: "#4338ca",
            padding: "0.6rem 0.9rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          {importResult.message}
          {importResult.failed.length > 0 &&
            ` — ${importResult.failed.length} rows failed`}
        </p>
      )}

      {subjects.length === 0 && (
        <p className="empty-state">
          Create a subject first before adding questions.
        </p>
      )}

      <select
        className="filter-select"
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
      >
        <option value="">All Subjects</option>
        {subjects.map((s) => (
          <option key={s._id} value={s._id}>
            {s.name}
          </option>
        ))}
      </select>

      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <div className="empty-state-title">No questions yet</div>
            <p>
              Add your first question to start building this subject's question
              bank.
            </p>
          </div>
          <p>
            Add your first question to start building this subject's question
            bank.
          </p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Marks</th>
              <th>Negative</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q._id}>
                <td>{q.questionText}</td>
                <td>{q.type}</td>
                <td>{q.subject?.name}</td>
                <td>
                  <span className={`badge badge-${q.difficulty}`}>
                    {q.difficulty}
                  </span>
                </td>
                <td>{q.marks}</td>
                <td>{q.negativeMarks > 0 ? `-${q.negativeMarks}` : "—"}</td>
                <td>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(q._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Question</h3>
            {error && <p className="error-text">{error}</p>}
            <form
              onSubmit={handleCreate}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                    correctAnswer: "",
                    correctAnswers: [],
                  })
                }
              >
                <option value="mcq">MCQ (single correct)</option>
                <option value="multiple_correct">
                  Multiple Correct (checkboxes)
                </option>
                <option value="true_false">True / False</option>
                <option value="fill_blank">Fill in the Blank</option>
                <option value="numerical">Numerical</option>
                <option value="short_answer">
                  Short Answer (manual grading)
                </option>
                <option value="programming">Programming</option>
              </select>

              <textarea
                placeholder="Question text"
                rows={3}
                value={form.questionText}
                onChange={(e) =>
                  setForm({ ...form, questionText: e.target.value })
                }
                required
              />

              {form.type === "mcq" && (
                <>
                  {form.options.map((opt, i) => (
                    <input
                      key={i}
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                    />
                  ))}
                  <select
                    value={form.correctAnswer}
                    onChange={(e) =>
                      setForm({ ...form, correctAnswer: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Correct Answer</option>
                    {form.options
                      .filter((o) => o.trim() !== "")
                      .map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                </>
              )}

              {/* ADD ALL THREE NEW BLOCKS RIGHT HERE */}
              {form.type === "multiple_correct" && (
                <>
                  {form.options.map((opt, i) => (
                    <input
                      key={i}
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                    />
                  ))}
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#888",
                      margin: "0.2rem 0",
                    }}
                  >
                    Check all correct options:
                  </p>
                  {form.options
                    .filter((o) => o.trim() !== "")
                    .map((opt, i) => (
                      <label
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.88rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.correctAnswers.includes(opt)}
                          onChange={() => toggleCorrectAnswer(opt)}
                        />
                        {opt}
                      </label>
                    ))}
                </>
              )}

              {form.type === "numerical" && (
                <>
                  <input
                    type="number"
                    step="any"
                    placeholder="Correct numeric answer"
                    value={form.correctAnswer}
                    onChange={(e) =>
                      setForm({ ...form, correctAnswer: e.target.value })
                    }
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Tolerance (e.g. 0.5 — accepts ± this range)"
                    value={form.numericalTolerance}
                    onChange={(e) =>
                      setForm({ ...form, numericalTolerance: e.target.value })
                    }
                  />
                </>
              )}

              {form.type === "short_answer" && (
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#888",
                    background: "#f8fafc",
                    padding: "0.6rem",
                    borderRadius: "8px",
                  }}
                >
                  This question will be graded manually by faculty after
                  submission — no correct answer needed here.
                </p>
              )}
              {/* END OF NEW BLOCKS */}

              {form.type === "programming" && (
                <>
                  <select
                    value={form.languageId}
                    onChange={(e) =>
                      setForm({ ...form, languageId: Number(e.target.value) })
                    }
                  >
                    <option value={71}>Python 3</option>
                    <option value={62}>Java</option>
                    <option value={54}>C++</option>
                    <option value={63}>JavaScript</option>
                  </select>
                  <p style={{ fontSize: "0.8rem", color: "#888" }}>
                    Test Cases:
                  </p>
                  {form.testCases.map((tc, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        placeholder="Input (stdin)"
                        value={tc.input}
                        onChange={(e) =>
                          handleTestCaseChange(i, "input", e.target.value)
                        }
                      />
                      <input
                        placeholder="Expected Output"
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          handleTestCaseChange(
                            i,
                            "expectedOutput",
                            e.target.value,
                          )
                        }
                        required
                      />
                      {form.testCases.length > 1 && (
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => removeTestCase(i)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={addTestCase}
                  >
                    + Add Test Case
                  </button>
                </>
              )}

              {form.type === "true_false" && (
                <select
                  value={form.correctAnswer}
                  onChange={(e) =>
                    setForm({ ...form, correctAnswer: e.target.value })
                  }
                  required
                >
                  <option value="">Select Correct Answer</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              )}

              {form.type === "true_false" && (
                <select
                  value={form.correctAnswer}
                  onChange={(e) =>
                    setForm({ ...form, correctAnswer: e.target.value })
                  }
                  required
                >
                  <option value="">Select Correct Answer</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              )}

              {form.type === "fill_blank" && (
                <input
                  placeholder="Correct answer"
                  value={form.correctAnswer}
                  onChange={(e) =>
                    setForm({ ...form, correctAnswer: e.target.value })
                  }
                  required
                />
              )}

              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <input
                type="number"
                placeholder="Marks"
                min="1"
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: e.target.value })}
                required
              />

              <input
                type="number"
                placeholder="Negative Marks (0 for none)"
                min="0"
                step="0.25"
                value={form.negativeMarks}
                onChange={(e) =>
                  setForm({ ...form, negativeMarks: e.target.value })
                }
              />

              <input
                placeholder="Chapter (optional)"
                value={form.chapter}
                onChange={(e) => setForm({ ...form, chapter: e.target.value })}
              />
              <textarea
                placeholder="Explanation (shown after result, optional)"
                rows={2}
                value={form.explanation}
                onChange={(e) =>
                  setForm({ ...form, explanation: e.target.value })
                }
              />
              <input
                placeholder="Tags (comma-separated, e.g. sql, joins, basics)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
