require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 3000;

// Constants from .env
const CONFLUENCE_URL = "https://boomii.atlassian.net/wiki/spaces/BR/pages/16547217570/Role+Element-specific+training";
const CONFLUENCE_BASE_URL = "https://boomii.atlassian.net";
const AUTH_EMAIL = process.env.CONFLUENCE_USER;
const AUTH_API_TOKEN = process.env.CONFLUENCE_API_TOKEN;
console.log("SLACK_BOT_TOKEN:", process.env.CONFLUENCE_USER);

async function getPageHtml(url) {
  try {
    const response = await axios.get(url, {
      auth: {
        username: AUTH_EMAIL,
        password: AUTH_API_TOKEN
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch page HTML: ${error.message}`);
  }
}

function extractLinksFromHtml(htmlBody) {
  const $ = cheerio.load(htmlBody);
  const links = [];
  
  $('a[href]').each((i, link) => {
    const href = $(link).attr('href');
    if (href.includes('/wiki/spaces/')) {
      links.push({
        title: $(link).text().trim(),
        url: `${CONFLUENCE_BASE_URL}${href}`,
        page_id: href.split('/').pop()
      });
    }
  });

  return links;
}

async function getTrainingForRole(links, roleQuery) {
  for (const link of links) {
    if (link.title.toLowerCase().includes(roleQuery.toLowerCase())) {
      try {
        const pageHtml = await getPageHtml(link.url);
        const content = cheerio.load(pageHtml).text().trim();
        return {
          role: link.title,
          url: link.url,
          content
        };
      } catch (error) {
        return { error: `Failed to fetch page for ${link.title}: ${error.message}` };
      }
    }
  }
  return { error: `No matching training found for role '${roleQuery}'` };
}

app.use(express.json());

app.post('/get-training', async (req, res) => {
  const roleQuery = req.body.role?.trim();

  if (!roleQuery) {
    return res.status(400).json({ error: "Missing 'role' parameter in request body" });
  }

  try {
    const mainPageHtml = await getPageHtml(CONFLUENCE_URL);
    const links = extractLinksFromHtml(mainPageHtml);
    const result = await getTrainingForRole(links, roleQuery);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: `Internal error: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
