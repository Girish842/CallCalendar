const postmark = require("postmark");
require("dotenv").config();

// Create a client using your Server API token
const client = new postmark.ServerClient("e462e64c-e9a9-4ca9-8650-2c0f3365bccf");

function sendPostmarkMail({ from, to, subject, body, bcc = "" }, callback) {
  const emailData = {
    From: from,
    To:to,
    // To: "web@thesisindia.net",
    //  To: "codersaro@gmail.com",
    Subject: subject,
    HtmlBody: body,
  };

  if (bcc) {
    emailData.Bcc = "web@thesisindia.net";
  }

  console.log("Attempting to send email:", emailData);

  client.sendEmail(emailData, (error, result) => {
    if (error) {
      console.error("Postmark send error:", error.message);
      return callback(error, null);
    } else {
      console.log("Email sent via Postmark:", result);
      return callback(null, result);
    }
  });
}

module.exports = sendPostmarkMail;
