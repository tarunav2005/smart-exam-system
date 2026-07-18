import { useState, useEffect } from "react";
import { SkeletonTable } from "../../components/Skeleton";
import {
  getCourses,
  getSubjects,
  createSubject,
  deleteSubject,
} from "../../api/services";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", course: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [subRes, courseRes] = await Promise.all([
        getSubjects(),
        getCourses(),
      ]);
      setSubjects(subRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createSubject(form);
      setShowModal(false);
      setForm({ name: "", code: "", course: "" });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create subject");
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this subject? Its questions will remain but be orphaned.",
      )
    )
      return;
    try {
      await deleteSubject(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Subjects</h2>
        <button
          className="btn-primary"
          onClick={() => setShowModal(true)}
          disabled={courses.length === 0}
          title={courses.length === 0 ? "Create a course first" : ""}
        >
          + Add Subject
        </button>
      </div>

      {courses.length === 0 && (
        <p className="empty-state">
          Create a course first before adding subjects.
        </p>
      )}

      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <div className="empty-state-title">No subjects yet</div>
          <p>
            Add a subject under one of your courses to begin building its
            question bank.
          </p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Course</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.code}</td>
                <td>
                  {s.course?.name} ({s.course?.code})
                </td>
                <td>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(s._id)}
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
            <h3>Add New Subject</h3>
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
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                required
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <input
                placeholder="Subject Name (e.g. Data Structures)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                placeholder="Subject Code (e.g. CS301)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
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

export default Subjects;
