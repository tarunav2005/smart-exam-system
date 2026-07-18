import API from "./axios";

// Courses
export const getCourses = () => API.get("/courses");
export const createCourse = (data) => API.post("/courses", data);
export const updateCourse = (id, data) => API.put(`/courses/${id}`, data);
export const deleteCourse = (id) => API.delete(`/courses/${id}`);

// Subjects
export const getSubjects = (courseId) =>
  API.get("/subjects", { params: courseId ? { course: courseId } : {} });
export const createSubject = (data) => API.post("/subjects", data);
export const updateSubject = (id, data) => API.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => API.delete(`/subjects/${id}`);

// Questions
export const getQuestions = (filters = {}) =>
  API.get("/questions", { params: filters });
export const createQuestion = (data) => API.post("/questions", data);
export const updateQuestion = (id, data) => API.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => API.delete(`/questions/${id}`);
export const getMyResults = () => API.get("/exams/results/my");
export const getResultReview = (paperId) =>
  API.get(`/exams/results/${paperId}/review`);

// Exams
export const getExams = () => API.get("/exams");
export const getExamById = (id) => API.get(`/exams/${id}`);
export const startExam = (id) => API.post(`/exams/${id}/start`);
export const saveAnswer = (examId, data) =>
  API.put(`/exams/${examId}/answer`, data);
export const submitExam = (examId, autoSubmitted = false) =>
  API.put(`/exams/${examId}/submit`, { autoSubmitted });
export const recordTabSwitch = (examId) =>
  API.put(`/exams/${examId}/tab-switch`);
export const getExamAnalytics = (examId) =>
  API.get(`/exams/${examId}/analytics`);

export const forgotPassword = (email) =>
  API.post("/auth/forgot-password", { email });
export const verifyOtp = (email, otp) =>
  API.post("/auth/verify-otp", { email, otp });
export const resetPassword = (email, otp, newPassword) =>
  API.post("/auth/reset-password", { email, otp, newPassword });

export const getPendingGrading = (examId) =>
  API.get(`/exams/${examId}/pending-grading`);
export const gradeManually = (paperId, grades) =>
  API.put(`/exams/paper/${paperId}/grade`, { grades });

export const getStudents = () => API.get("/auth/students");
export const createExamAPI = (data) => API.post("/exams", data);
export const publishExamAPI = (examId) => API.put(`/exams/${examId}/publish`);
export const deleteExamAPI = (examId) => API.delete(`/exams/${examId}`);

export const getAllUsers = (role) =>
  API.get("/auth/users", { params: role ? { role } : {} });
export const toggleUserStatus = (userId) =>
  API.put(`/auth/users/${userId}/status`);
export const changeUserRole = (userId, role) =>
  API.put(`/auth/users/${userId}/role`, { role });
export const deleteUserAPI = (userId) => API.delete(`/auth/users/${userId}`);

export const getScorecardUrl = (paperId) => `/exams/results/${paperId}/pdf`;
export const getExportUrl = (examId) => `/exams/${examId}/export`;

export const getMyNotifications = () => API.get("/notifications");
export const markNotificationRead = (id) =>
  API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () =>
  API.put("/notifications/read-all");

export const getDashboardStats = () => API.get("/auth/dashboard-stats");
export const getLiveExamStatus = (examId) =>
  API.get(`/exams/${examId}/live-status`);

export const importQuestionsExcel = (formData) =>
  API.post("/questions/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getReportUrl = (examId, type) => `/exams/${examId}/report/${type}`;
export const getSubjectAnalysisUrl = (subjectId) =>
  `/exams/subject-analysis/${subjectId}`;

export const recordRefresh = (examId) =>
  API.put(`/exams/${examId}/refresh-detected`);

export const getInstitutes = () => API.get("/institutes");
export const createInstitute = (data) => API.post("/institutes", data);
export const updateInstitute = (id, data) => API.put(`/institutes/${id}`, data);
export const deleteInstitute = (id) => API.delete(`/institutes/${id}`);
export const getMarksheetUrl = (subjectId) => `/exams/marksheet/${subjectId}`;

export const downloadFile = async (url, filename) => {
  const res = await API.get(url, { responseType: "blob" });
  const blob = new Blob([res.data]);
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(link.href);
};
