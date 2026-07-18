const Notification = require("../models/Notification");

// Send a notification to one or many recipients at once
const notify = async (
  recipientIds,
  { title, message, type = "general", link },
) => {
  const ids = Array.isArray(recipientIds) ? recipientIds : [recipientIds];
  const docs = ids.map((recipient) => ({
    recipient,
    title,
    message,
    type,
    link,
  }));
  await Notification.insertMany(docs);
};

module.exports = notify;
