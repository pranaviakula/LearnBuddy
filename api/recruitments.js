import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  try {
    const jsonPath = path.resolve('./data/recruiters_openings.json');
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);

    res.status(200).json({ success: true, recruitments: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
