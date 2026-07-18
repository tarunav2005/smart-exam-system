const cron = require("node-cron");
const Exam = require("../models/Exam");
const notify = require("./notify");

// Runs every 5 minutes: finds published exams starting within the next 30 minutes
// that haven't already been reminded, and notifies assigned students once.
const startReminderJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 60 * 1000);

      const upcomingExams = await Exam.find({
        status: "published",
        startTime: { $gte: now, $lte: soon },
        reminderSent: { $ne: true },
      });

      for (const exam of upcomingExams) {
        if (exam.assignedStudents.length > 0) {
          await notify(exam.assignedStudents, {
            title: "Exam Starting Soon",
            message: `"${exam.title}" starts within 30 minutes. Be ready!`,
            type: "exam_reminder",
            link: "/student",
          });
        }
        exam.reminderSent = true;
        await exam.save();
      }

      if (upcomingExams.length > 0) {
        console.log(
          `Reminder job: notified students for ${upcomingExams.length} upcoming exam(s)`,
        );
      }
    } catch (err) {
      console.error("Exam reminder job failed:", err.message);
    }
  });
};

module.exports = startReminderJob;
