const express = require('express');
const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ debug: true });

const slackToken = process.env.SLACK_BOT_TOKEN;
console.log('Loaded Slack Token:', slackToken)
const client = new WebClient(slackToken);

// Parse "5 hr 15 min" -> { hours: 5, minutes: 15 }
function parseDuration(durationStr) {
  const hrMatch = durationStr.match(/(\d+)\s*hr/);
  const minMatch = durationStr.match(/(\d+)\s*min/);
  const hours = hrMatch ? parseInt(hrMatch[1]) : 0;
  const minutes = minMatch ? parseInt(minMatch[1]) : 0;
  return { hours, minutes };
}

// Create a detailed weekly learning plan
function createDetailedPlan(modules) {
  const plan = [];
  let day = 1;
  let week = 1;

  modules.forEach((module, index) => {
    const title = module.title || 'Untitled Module';
    const duration = module.duration || '0 hr 0 min';
    const link = module.link;

    const { hours, minutes } = parseDuration(duration);
    const totalMinutes = hours * 60 + minutes;

    const morningMinutes = Math.floor(totalMinutes * 0.55); // 55% for morning
    const afternoonMinutes = totalMinutes - morningMinutes;

    const formatDuration = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h} hr ${m} min`;
    };

    const morningDuration = formatDuration(morningMinutes);
    const afternoonDuration = formatDuration(afternoonMinutes);

    if ((day - 1) % 5 === 0) {
      plan.push(`*Week ${week}*`);
      week++;
    }

    plan.push(`*Day ${day}:* ${title}
*Morning Session:* ${title} – ${morningDuration}
*Break:* 15 min
*Afternoon Session:* Practice & Review – ${afternoonDuration}
${link ? `<${link}|View Course>` : ''}`);

    day++;
  });

  return plan.join('\n\n');
}

const app = express();
app.use(express.json());

app.post('/send-learning-plan', async (req, res) => {
  const { slackId, modules } = req.body;

  if (!slackId || !Array.isArray(modules)) {
    return res.status(400).json({ error: 'Missing slackId or modules' });
  }

  const message = `:date: *Your Detailed Learning Plan: Boomi Training*\n\n${createDetailedPlan(modules)}`;

  try {
    await client.chat.postMessage({
      channel: slackId,
      text: message,
      mrkdwn: true,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending message to Slack:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
