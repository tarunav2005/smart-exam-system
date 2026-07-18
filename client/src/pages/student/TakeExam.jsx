import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  startExam,
  saveAnswer,
  submitExam,
  recordTabSwitch,
  getExamById,
  recordRefresh,
} from "../../api/services";

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [violationWarning, setViolationWarning] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const submittedRef = useRef(false); // prevents double-submit race conditions
  const refreshCheckDone = useRef(false);

  // Load / resume the paper on mount
  useEffect(() => {
    const loadExam = async () => {
      try {
        const [paperRes, examRes] = await Promise.all([
          startExam(examId),
          getExamById(examId),
        ]);

        const paperData = paperRes.data;
        const durationMinutes = examRes.data.duration || 60; // safe fallback only if exam data is somehow missing

        setPaper(paperData);

        // Timer is anchored to when the student actually started (paper.startedAt),
        // not the current moment — so refreshing the page doesn't reset or extend time.
        const startedAt = new Date(paperData.startedAt).getTime();
        const endTime = startedAt + durationMinutes * 60 * 1000;
        const remaining = Math.max(
          0,
          Math.floor((endTime - Date.now()) / 1000),
        );

        setTimeLeft(remaining);
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const res = await submitExam(examId, auto);
        setResult(res.data);
      } catch (err) {
        alert(err.response?.data?.message || "Submit failed");
      } finally {
        setSubmitting(false);
      }
    },
    [examId],
  );

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmit(true); // auto-submit when time runs out
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result, handleSubmit]);

  // Anti-cheat: detect tab switch / window blur
  useEffect(() => {
    if (!paper || result) return;

    const reportViolation = async () => {
      try {
        const res = await recordTabSwitch(examId);
        if (res.data.autoSubmitted) {
          submittedRef.current = true;
          setResult({ score: res.data.score, totalMarks: res.data.totalMarks });
          alert(
            "You have exceeded the allowed number of tab-switch violations. Your exam has been auto-submitted.",
          );
        } else {
          setViolationWarning(
            `Warning: Tab switch detected (${res.data.tabSwitchCount}/${res.data.maxViolations}). Further violations will auto-submit your exam.`,
          );
          setTimeout(() => setViolationWarning(null), 4000);
        }
      } catch (err) {
        console.error("Failed to record violation", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) reportViolation();
    };

    const handleBlur = () => reportViolation();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [paper, result, examId, handleSubmit]);

  // Anti-cheat: detect page refresh during an active exam

  useEffect(() => {
    if (!paper || result || refreshCheckDone.current) return;
    refreshCheckDone.current = true;

    const wasAlreadyActive = sessionStorage.getItem(`examWasActive_${examId}`);
    if (wasAlreadyActive === "true") {
      recordRefresh(examId).then((res) => {
        setViolationWarning(
          `Page refresh detected (${res.data.refreshCount} total). This is being logged.`,
        );
        setTimeout(() => setViolationWarning(null), 4000);
      });
    }
    sessionStorage.setItem(`examWasActive_${examId}`, "true");
  }, [paper, result, examId]);

  // Anti-cheat: enforce fullscreen
  useEffect(() => {
    if (!paper || result) return;

    const enterFullscreen = () => {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      const fsActive = !!document.fullscreenElement;
      setIsFullscreen(fsActive);
      if (!fsActive) {
        setViolationWarning(
          "You exited fullscreen. Please return to fullscreen mode to continue the exam.",
        );
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [paper, result]);

  // Anti-cheat: block copy, paste, right-click, and dev-tools shortcuts
  useEffect(() => {
    if (!paper || result) return;

    const blockAction = (e) => {
      if (e.target.classList?.contains("code-editor-input")) return;
      e.preventDefault();
    };

    const blockShortcuts = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+Shift+I, F12, PrintScreen
      if (
        (e.ctrlKey && ["c", "v", "u", "x"].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", blockAction);
    document.addEventListener("paste", blockAction);
    document.addEventListener("contextmenu", blockAction);
    document.addEventListener("keydown", blockShortcuts);

    return () => {
      document.removeEventListener("copy", blockAction);
      document.removeEventListener("paste", blockAction);
      document.removeEventListener("contextmenu", blockAction);
      document.removeEventListener("keydown", blockShortcuts);
    };
  }, [paper, result]);

  useEffect(() => {
    if (result && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [result]);

  useEffect(() => {
    if (result) {
      sessionStorage.removeItem(`examWasActive_${examId}`);
      sessionStorage.removeItem(`examActive_${examId}`);
    }
  }, [result, examId]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleAnswerChange = async (value) => {
    const q = paper.questions[currentIndex].question;
    const updatedAnswers = paper.answers.map((a) =>
      a.question === q._id || a.question?._id === q._id
        ? { ...a, selectedAnswer: value }
        : a,
    );
    setPaper({ ...paper, answers: updatedAnswers });
    try {
      await saveAnswer(examId, { questionId: q._id, selectedAnswer: value });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  const handleMultiAnswerChange = async (option) => {
    const q = paper.questions[currentIndex].question;
    const currentAnswer = paper.answers.find(
      (a) => a.question === q._id || a.question?._id === q._id,
    );
    const current = currentAnswer?.selectedAnswers || [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];

    const updatedAnswers = paper.answers.map((a) =>
      a.question === q._id || a.question?._id === q._id
        ? { ...a, selectedAnswers: updated }
        : a,
    );
    setPaper({ ...paper, answers: updatedAnswers });
    try {
      await saveAnswer(examId, { questionId: q._id, selectedAnswers: updated });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  const toggleReview = async () => {
    const q = paper.questions[currentIndex].question;
    const current = paper.answers.find(
      (a) => a.question === q._id || a.question?._id === q._id,
    );
    const newVal = !current?.markedForReview;
    const updatedAnswers = paper.answers.map((a) =>
      a.question === q._id || a.question?._id === q._id
        ? { ...a, markedForReview: newVal }
        : a,
    );
    setPaper({ ...paper, answers: updatedAnswers });
    await saveAnswer(examId, { questionId: q._id, markedForReview: newVal });
  };

  if (loading) return <p style={{ padding: "2rem" }}>Loading exam...</p>;
  if (!paper) return <p style={{ padding: "2rem" }}>Could not load exam.</p>;

  if (result) {
    return (
      <div className="exam-result-screen">
        <h2>Exam Submitted</h2>
        <p className="result-score">
          {result.score} / {result.totalMarks}
        </p>
        {result.correctCount !== undefined && (
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
            <span style={{ color: "#16a34a", fontWeight: 600 }}>
              {result.correctCount} Correct
            </span>
            <span style={{ color: "#dc2626", fontWeight: 600 }}>
              {result.wrongCount} Wrong
            </span>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>
              {result.skippedCount} Skipped
            </span>
          </div>
        )}
        <p>Your answers have been recorded and evaluated.</p>
        <button className="btn-primary" onClick={() => navigate("/student")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = paper.questions[currentIndex].question;
  const currentAnswer = paper.answers.find(
    (a) => a.question === currentQ._id || a.question?._id === currentQ._id,
  );

  const currentPaperEntry = paper.questions[currentIndex];
  const displayOptions =
    currentPaperEntry.shuffledOptions &&
    currentPaperEntry.shuffledOptions.length > 0
      ? currentPaperEntry.shuffledOptions
      : currentQ.options;

  return (
    <div className="exam-layout">
      <div className="exam-header">
        <h3>Exam in Progress</h3>
        <div className={`exam-timer ${timeLeft < 300 ? "timer-danger" : ""}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {violationWarning && (
        <div className="violation-banner">⚠️ {violationWarning}</div>
      )}

      <div className="exam-body">
        <div className="exam-question-panel">
          <p className="question-meta">
            Question {currentIndex + 1} of {paper.questions.length}{" "}
            &nbsp;•&nbsp;
            {paper.questions[currentIndex].marks} mark(s)
          </p>
          <h3 className="question-text">{currentQ.questionText}</h3>

          {currentQ.type === "mcq" && (
            <div className="options-list">
              {displayOptions.map((opt, i) => (
                <label
                  key={i}
                  className={`option-item ${currentAnswer?.selectedAnswer === opt ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="answer"
                    checked={currentAnswer?.selectedAnswer === opt}
                    onChange={() => handleAnswerChange(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {currentQ.type === "true_false" && (
            <div className="options-list">
              {["true", "false"].map((opt) => (
                <label
                  key={opt}
                  className={`option-item ${currentAnswer?.selectedAnswer === opt ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="answer"
                    checked={currentAnswer?.selectedAnswer === opt}
                    onChange={() => handleAnswerChange(opt)}
                  />
                  {opt === "true" ? "True" : "False"}
                </label>
              ))}
            </div>
          )}

          {currentQ.type === "fill_blank" && (
            <input
              className="fill-blank-input"
              placeholder="Type your answer"
              value={currentAnswer?.selectedAnswer || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />
          )}

          {currentQ.type === "multiple_correct" && (
            <div className="options-list">
              {displayOptions.map((opt, i) => {
                const selected = currentAnswer?.selectedAnswers || [];
                const isChecked = selected.includes(opt);
                return (
                  <label
                    key={i}
                    className={`option-item ${isChecked ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMultiAnswerChange(opt)}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          )}

          {currentQ.type === "numerical" && (
            <input
              type="number"
              step="any"
              className="fill-blank-input"
              placeholder="Enter your numeric answer"
              value={currentAnswer?.selectedAnswer || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
            />
          )}

          {currentQ.type === "short_answer" && (
            <textarea
              className="fill-blank-input"
              rows={5}
              placeholder="Type your answer here — this question will be graded manually by faculty"
              value={currentAnswer?.selectedAnswer || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          )}

          {currentQ.type === "programming" && (
            <div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#888",
                  marginBottom: "0.5rem",
                }}
              >
                Write your solution below. Your code will be run against hidden
                test cases when you submit.
              </p>
              <textarea
                className="code-editor-input"
                rows={14}
                spellCheck={false}
                placeholder="// Write your code here..."
                value={currentAnswer?.selectedAnswer || ""}
                onChange={(e) => handleAnswerChange(e.target.value)}
              />
            </div>
          )}

          <div className="exam-nav-buttons">
            <button
              className="btn-secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              Previous
            </button>
            <button className="btn-secondary" onClick={toggleReview}>
              {currentAnswer?.markedForReview
                ? "Unmark Review"
                : "Mark for Review"}
            </button>
            <button
              className="btn-secondary"
              disabled={currentIndex === paper.questions.length - 1}
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              Next
            </button>
          </div>
        </div>

        <div className="exam-palette">
          <h4>Questions</h4>
          <div className="palette-grid">
            {paper.questions.map((q, i) => {
              const ans = paper.answers.find(
                (a) =>
                  a.question === q.question._id ||
                  a.question?._id === q.question._id,
              );
              const hasAnswer =
                ans?.selectedAnswer ||
                (ans?.selectedAnswers && ans.selectedAnswers.length > 0);
              let cls = "palette-btn";
              if (ans?.markedForReview) cls += " palette-review";
              else if (hasAnswer) cls += " palette-answered";
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => setCurrentIndex(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="palette-legend">
            <span>
              <i className="dot answered"></i> Answered
            </span>
            <span>
              <i className="dot review"></i> Marked for Review
            </span>
            <span>
              <i className="dot unanswered"></i> Not Answered
            </span>
          </div>

          <button
            className="btn-primary submit-exam-btn"
            disabled={submitting}
            onClick={() => {
              if (
                window.confirm(
                  "Submit the exam? You cannot change answers after this.",
                )
              ) {
                handleSubmit(false);
              }
            }}
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;
