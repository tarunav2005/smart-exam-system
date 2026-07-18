import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getExams } from "../../api/services";
import { SkeletonTable } from "../../components/Skeleton";

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getExams()
      .then((res) => setExams(res.data))
      .finally(() => setLoading(false));
  }, []);

  const getExamStatus = (exam) => {
    const now = new Date();
    if (now < new Date(exam.startTime))
      return { label: "Upcoming", color: "#4b5563" };
    if (now > new Date(exam.endTime))
      return { label: "Closed", color: "#dc2626" };
    return { label: "Live", color: "#16a34a" };
  };

  return (
    <div>
      <div className="page-header">
        <h2>My Exams</h2>
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : exams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No exams assigned</div>
          <p>
            You don't have any exams assigned to you right now. Check back
            later.
          </p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Duration</th>
              <th>Total Marks</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <tr key={exam._id}>
                  <td>{exam.title}</td>
                  <td>{exam.subject?.name}</td>
                  <td>{exam.duration} min</td>
                  <td>{exam.totalMarks}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${status.color}22`,
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      disabled={status.label !== "Live"}
                      onClick={() => navigate(`/student/exam/${exam._id}`)}
                    >
                      {status.label === "Live" ? "Start Exam" : status.label}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentExams;
