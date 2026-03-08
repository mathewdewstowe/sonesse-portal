export async function onRequestPost(context) {
  const { request, env } = context;

  const SLACK_WEBHOOK_URL = env.SLACK_WEBHOOK_URL;
  if (!SLACK_WEBHOOK_URL) {
    return jsonResponse(500, "Server configuration error");
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse(400, "Invalid form data");
  }

  // Bot detection — reject if honeypot is filled
  const honeypot = formData.get("_wpcf7_ak_hp_textarea");
  if (honeypot && honeypot.trim() !== "") {
    // Pretend success to not alert bots
    return jsonResponse(200, "Thank you for your message.");
  }

  const formId = formData.get("_wpcf7");
  let fields;

  if (formId === "489") {
    // Popup form
    fields = {
      formName: "Popup Contact Form",
      name: formData.get("your-name") || "",
      email: formData.get("your-email") || "",
      company: formData.get("company") || "",
      message: formData.get("your-message") || "",
      heardAbout: "",
    };
    if (!fields.name.trim() || !fields.email.trim()) {
      return jsonResponse(400, "Name and email are required.");
    }
  } else if (formId === "63") {
    // Demo page form
    fields = {
      formName: "Demo Page Form",
      name: formData.get("text-406") || "",
      email: formData.get("email-828") || "",
      company: formData.get("text-408") || "",
      message: formData.get("textarea-592") || "",
      heardAbout: formData.get("text-506") || "",
    };
    if (!fields.name.trim() || !fields.email.trim() || !fields.company.trim()) {
      return jsonResponse(400, "Name, email, and company are required.");
    }
  } else {
    return jsonResponse(400, "Unknown form.");
  }

  if (!isValidEmail(fields.email)) {
    return jsonResponse(400, "Please enter a valid email address.");
  }

  // Build Slack message
  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: `New Submission: ${fields.formName}` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${fields.name}` },
        { type: "mrkdwn", text: `*Email:*\n${fields.email}` },
      ],
    },
  ];

  if (fields.company) {
    blocks.push({
      type: "section",
      fields: [{ type: "mrkdwn", text: `*Company:*\n${fields.company}` }],
    });
  }

  if (fields.message) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Message:*\n${fields.message}` },
    });
  }

  if (fields.heardAbout) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*How did you hear about us:*\n${fields.heardAbout}` },
    });
  }

  try {
    const slackRes = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    if (!slackRes.ok) {
      console.error("Slack error:", await slackRes.text());
      return jsonResponse(500, "Failed to send message. Please try again.");
    }
  } catch (err) {
    console.error("Slack fetch error:", err);
    return jsonResponse(500, "Failed to send message. Please try again.");
  }

  return jsonResponse(200, "Thank you! We'll be in touch soon.");
}

function jsonResponse(status, message) {
  const ok = status === 200;
  return new Response(
    JSON.stringify({ status: ok ? "mail_sent" : "validation_failed", message }),
    {
      status: ok ? 200 : status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
