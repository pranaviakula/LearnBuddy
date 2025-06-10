import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  try {
    const jsonPath = path.resolve('./data/boomi_courses_with_details.json');
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);

    res.status(200).json({ success: true, courses: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
