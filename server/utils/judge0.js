const axios = require("axios");

const JUDGE0_URL = `https://${process.env.JUDGE0_API_HOST}`;

// Submits code + input to Judge0, waits for the result (using Judge0's "wait=true" sync mode)
const runCode = async (sourceCode, languageId, stdin) => {
  const response = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin || "",
    },
    {
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
        "X-RapidAPI-Host": process.env.JUDGE0_API_HOST,
      },
    },
  );
  return response.data; // { stdout, stderr, status: { id, description }, ... }
};

// Runs code against multiple test cases, returns pass/fail count
const evaluateProgrammingSubmission = async (
  sourceCode,
  languageId,
  testCases,
) => {
  let passed = 0;
  const results = [];

  for (const tc of testCases) {
    try {
      const result = await runCode(sourceCode, languageId, tc.input);
      const actualOutput = (result.stdout || "").trim();
      const expected = (tc.expectedOutput || "").trim();
      const isPass = actualOutput === expected;
      if (isPass) passed += 1;

      results.push({
        input: tc.input,
        expected,
        actualOutput,
        passed: isPass,
        error: result.stderr || result.compile_output || null,
      });
    } catch (err) {
      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actualOutput: "",
        passed: false,
        error: err.message,
      });
    }
  }

  return { passed, total: testCases.length, results };
};

module.exports = { runCode, evaluateProgrammingSubmission };
