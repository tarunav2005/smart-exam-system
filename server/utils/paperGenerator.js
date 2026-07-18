const Question = require("../models/Question");

/**
 * Fisher-Yates shuffle — unbiased random shuffle
 */
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Picks `count` random questions of a given difficulty from a subject's pool.
 * Throws an error if not enough questions exist — better to fail loudly than
 * silently generate an incomplete/unfair paper.
 */
const pickRandomQuestions = async (subjectId, difficulty, count) => {
  if (count === 0) return [];

  const pool = await Question.find({
    subject: subjectId,
    difficulty,
    isActive: true,
  });

  if (pool.length < count) {
    throw new Error(
      `Not enough '${difficulty}' questions in question bank. Need ${count}, have ${pool.length}.`,
    );
  }

  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, count);
};

/**
 * Generates one randomized paper for a single student based on an exam's config.
 * Returns an array of { question, marks } ready to save into ExamPaper.
 */
const generatePaperForStudent = async (exam) => {
  const { easyCount, mediumCount, hardCount } = exam.paperConfig;

  const [easyQs, mediumQs, hardQs] = await Promise.all([
    pickRandomQuestions(exam.subject, "easy", easyCount),
    pickRandomQuestions(exam.subject, "medium", mediumCount),
    pickRandomQuestions(exam.subject, "hard", hardCount),
  ]);

  const allQuestions = shuffleArray([...easyQs, ...mediumQs, ...hardQs]);

  return allQuestions.map((q) => ({
    question: q._id,
    marks: q.marks,
    // Store a shuffled option order for this student, only meaningful for mcq/multiple_correct.
    // Evaluation logic still compares against the question's real correctAnswer/correctAnswers,
    // so shuffling display order never affects correctness — it only changes what the student sees.
    shuffledOptions:
      q.type === "mcq" || q.type === "multiple_correct"
        ? shuffleArray(q.options)
        : [],
  }));
};

/**
 * Generates N fixed paper sets for an exam (Set A, Set B, ...). Each set is generated
 * once using the same logic as a per-student paper, then reused for whichever students
 * get assigned to it — used when an exam needs a small number of distinct papers
 * (e.g. matching physical exam-hall conventions) rather than one unique paper per student.
 */
const generatePaperSets = async (exam, numberOfSets) => {
  const sets = [];
  for (let i = 0; i < numberOfSets; i++) {
    const questions = await generatePaperForStudent(exam);
    sets.push({
      setLabel: `Set ${String.fromCharCode(65 + i)}`, // Set A, Set B, Set C...
      questions,
    });
  }
  return sets;
};

module.exports = { generatePaperForStudent, generatePaperSets, shuffleArray };
