import { useState, useEffect } from "react";
import {
  getCourses,
  createCourse,
  deleteCourse,
  getInstitutes,
} from "../../api/services";
import { SkeletonTable } from "../../components/Skeleton";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    semester: "",
    institute: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [institutes, setInstitutes] = useState([]);

  const loadCourses = async () => {
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    getInstitutes().then((res) => setInstitutes(res.data));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createCourse({
        ...form,
        semester: Number(form.semester),
        institute: form.institute || null,
      });
      setShowModal(false);
      setForm({ name: "", code: "", semester: "", institute: "" });
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create course");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course? This cannot be undone.")) return;
    try {
      await deleteCourse(id);
      loadCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Courses</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Course
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">No courses yet</div>
          <p>Create your first course to start organizing subjects under it.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Semester</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.code}</td>
                <td>{c.semester}</td>
                <td>{c.createdBy?.name || "-"}</td>
                <td>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(c._id)}
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
            <h3>Add New Course</h3>
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
                placeholder="Course Name (e.g. B.Tech CSE)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                placeholder="Course Code (e.g. BTCSE)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Semester (1-8)"
                min="1"
                max="8"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                required
              />
              <select
                value={form.institute}
                onChange={(e) =>
                  setForm({ ...form, institute: e.target.value })
                }
              >
                <option value="">No institute (optional)</option>
                {institutes.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name}
                  </option>
                ))}
              </select>

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

export default Courses;
