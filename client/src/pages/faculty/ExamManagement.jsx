import { useState, useEffect } from "react";
import { SkeletonTable } from "../../components/Skeleton";
import {
  getSubjects,
  getStudents,
  getExams,
  createExamAPI,
  publishExamAPI,
  deleteExamAPI,
} from "../../api/services";

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    duration: 60,
    totalMarks: 10,
    totalQuestions: 5,
    easyPercent: 50,
    mediumPercent: 30,
    hardPercent: 20,
    startTime: "",
    endTime: "",
    assignedStudents: [],
    numberOfSets: 0,
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [examRes, subjectRes, studentRes] = await Promise.all([
        getExams(),
        getSubjects(),
        getStudents(),
      ]);
      setExams(examRes.data);
      setSubjects(subjectRes.data);
      setStudents(studentRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const computeCounts = () => {
    const total = Number(form.totalQuestions) || 0;
    const easy = Math.round((total * Number(form.easyPercent)) / 100);
    const medium = Math.round((total * Number(form.mediumPercent)) / 100);
    const hard = Math.max(0, total - easy - medium); // remainder goes to hard, avoids rounding gaps
    return { easy, medium, hard };
  };

  const resetForm = () => {
    setForm({
      title: "",
      subject: "",
      duration: 60,
      totalMarks: 10,
      totalQuestions: 5,
      easyPercent: 50,
      mediumPercent: 30,
      hardPercent: 20,
      startTime: "",
      endTime: "",
      assignedStudents: [],
      numberOfSets: 0,
    });
  };

  const toggleStudent = (studentId) => {
    setForm((prev) => ({
      ...prev,
      assignedStudents: prev.assignedStudents.includes(studentId)
        ? prev.assignedStudents.filter((id) => id !== studentId)
        : [...prev.assignedStudents, studentId],
    }));
  };

  const selectAllStudents = () => {
    setForm((prev) => ({
      ...prev,
      assignedStudents:
        prev.assignedStudents.length === students.length
          ? []
          : students.map((s) => s._id),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (form.assignedStudents.length === 0) {
      setError("Assign at least one student");
      return;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      setError("End time must be after start time");
      return;
    }

    const percentSum =
      Number(form.easyPercent) +
      Number(form.mediumPercent) +
      Number(form.hardPercent);
    if (percentSum !== 100) {
      setError(
        `Difficulty percentages must add up to 100% (currently ${percentSum}%)`,
      );
      return;
    }

    try {
      const counts = computeCounts();
      const payload = {
        title: form.title,
        subject: form.subject,
        duration: Number(form.duration),
        totalMarks: Number(form.totalMarks),
        paperConfig: {
          easyCount: counts.easy,
          mediumCount: counts.medium,
          hardCount: counts.hard,
        },
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        assignedStudents: form.assignedStudents,
        numberOfSets: Number(form.numberOfSets) || 0,
      };
      await createExamAPI(payload);
      setShowModal(false);
      resetForm();
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create exam");
    }
  };

  const handlePublish = async (examId) => {
    if (
      !window.confirm(
        "Publish this exam? Students will be able to start it once the start time is reached.",
      )
    )
      return;
    setPublishingId(examId);
    try {
      await publishExamAPI(examId);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to publish");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (examId) => {
    if (!window.confirm("Delete this draft exam?")) return;
    try {
      await deleteExamAPI(examId);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const statusBadge = (status) => {
    const map = {
      draft: { bg: "#f3f4f6", color: "#4b5563" },
      published: { bg: "#dcfce7", color: "#15803d" },
      completed: { bg: "#dbeafe", color: "#1d4ed8" },
    };
    const s = map[status] || map.draft;
    return (
      <span className="badge" style={{ background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2>Exam Management</h2>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          disabled={subjects.length === 0}
        >
          + Create Exam
        </button>
      </div>

      {subjects.length === 0 && (
        <p className="empty-state">
          Create a subject with questions first before creating an exam.
        </p>
      )}

      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : exams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No exams created yet</div>
          <p>
            Create your first exam and assign it to students to get started.
          </p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Duration</th>
              <th>Marks</th>
              <th>Students</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam._id}>
                <td>{exam.title}</td>
                <td>{exam.subject?.name}</td>
                <td>{exam.duration} min</td>
                <td>{exam.totalMarks}</td>
                <td>{exam.assignedStudents?.length || 0}</td>
                <td>{statusBadge(exam.status)}</td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  {exam.status === "draft" && (
                    <>
                      <button
                        className="btn-primary"
                        style={{
                          padding: "0.4rem 0.85rem",
                          fontSize: "0.82rem",
                        }}
                        disabled={publishingId === exam._id}
                        onClick={() => handlePublish(exam._id)}
                      >
                        {publishingId === exam._id
                          ? "Publishing..."
                          : "Publish"}
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(exam._id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-box"
            style={{ width: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Create New Exam</h3>
            {error && <p className="error-text">{error}</p>}
            <form
              onSubmit={handleCreate}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <input
                placeholder="Exam Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

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

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <input
                  type="number"
                  placeholder="Duration (min)"
                  min="1"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Total Marks"
                  min="1"
                  value={form.totalMarks}
                  onChange={(e) =>
                    setForm({ ...form, totalMarks: e.target.value })
                  }
                  required
                />
              </div>

              <input
                type="number"
                placeholder="Total number of questions"
                min="1"
                value={form.totalQuestions}
                onChange={(e) =>
                  setForm({ ...form, totalQuestions: e.target.value })
                }
                required
              />
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#888",
                  marginTop: "0.2rem",
                }}
              >
                Difficulty split (must total 100%):
              </p>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <input
                  type="number"
                  placeholder="Easy %"
                  min="0"
                  max="100"
                  value={form.easyPercent}
                  onChange={(e) =>
                    setForm({ ...form, easyPercent: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Medium %"
                  min="0"
                  max="100"
                  value={form.mediumPercent}
                  onChange={(e) =>
                    setForm({ ...form, mediumPercent: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Hard %"
                  min="0"
                  max="100"
                  value={form.hardPercent}
                  onChange={(e) =>
                    setForm({ ...form, hardPercent: e.target.value })
                  }
                />
              </div>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#4f46e5",
                  fontWeight: 600,
                }}
              >
                {(() => {
                  const c = computeCounts();
                  return `→ ${c.easy} easy, ${c.medium} medium, ${c.hard} hard`;
                })()}
              </p>

              <label style={{ fontSize: "0.82rem", color: "#555" }}>
                Paper Sets (0 = unique random paper per student, recommended)
              </label>
              <input
                type="number"
                placeholder="Number of fixed sets (0-5)"
                min="0"
                max="5"
                value={form.numberOfSets}
                onChange={(e) =>
                  setForm({ ...form, numberOfSets: e.target.value })
                }
              />

              <label style={{ fontSize: "0.82rem", color: "#555" }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                required
              />

              <label style={{ fontSize: "0.82rem", color: "#555" }}>
                End Time
              </label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "0.3rem",
                }}
              >
                <label style={{ fontSize: "0.82rem", color: "#555" }}>
                  Assign Students ({form.assignedStudents.length} selected)
                </label>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
                  onClick={selectAllStudents}
                >
                  {form.assignedStudents.length === students.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div
                style={{
                  maxHeight: "150px",
                  overflowY: "auto",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "0.6rem",
                }}
              >
                {students.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#888" }}>
                    No students registered yet.
                  </p>
                ) : (
                  students.map((s) => (
                    <label
                      key={s._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.3rem 0",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.assignedStudents.includes(s._id)}
                        onChange={() => toggleStudent(s._id)}
                      />
                      {s.name} ({s.email})
                    </label>
                  ))
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
