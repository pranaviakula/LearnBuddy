// api/slackLearningPlan.js
import { WebClient } from '@slack/web-api';

const slackToken = process.env.SLACK_BOT_TOKEN;
const client = new WebClient(slackToken);

function parseDuration(durationStr) {
  const hrMatch = durationStr.match(/(\d+)\s*hr/);
  const minMatch = durationStr.match(/(\d+)\s*min/);
  return {
    hours: hrMatch ? parseInt(hrMatch[1]) : 0,
    minutes: minMatch ? parseInt(minMatch[1]) : 0,
  };
}

function createDetailedPlan(modules) {
  const plan = [];
  let day = 1;
  let week = 1;

  modules.forEach((module) => {
    const title = module.title || 'Untitled Module';
    const duration = module.duration || '0 hr 0 min';
    const link = module.link;
    const { hours, minutes } = parseDuration(duration);
    const totalMinutes = hours * 60 + minutes;
    const morningMinutes = Math.floor(totalMinutes * 0.55);
    const afternoonMinutes = totalMinutes - morningMinutes;

    const formatDuration = (mins) =>
      `${Math.floor(mins / 60)} hr ${mins % 60} min`;

    if ((day - 1) % 5 === 0) {
      plan.push(`*Week ${week}*`);
      week++;
    }

    plan.push(`*Day ${day}:* ${title}
*Morning Session:* ${title} – ${formatDuration(morningMinutes)}
*Break:* 15 min
*Afternoon Session:* Practice & Review – ${formatDuration(afternoonMinutes)}
${link ? `<${link}|View Course>` : ''}`);

    day++;
  });

  return plan.join('\n\n');
}

export default async function handler(req, res) {
  try {
    const { slackId, modules } = req.body;

    if (!slackId || !Array.isArray(modules)) {
      return res.status(400).json({ error: 'Missing slackId or modules' });
    }

    const message = `:date: *Your Detailed Learning Plan: Boomi Training*\n\n${createDetailedPlan(modules)}`;

    await client.chat.postMessage({
      channel: slackId,
      text: message,
      mrkdwn: true,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
