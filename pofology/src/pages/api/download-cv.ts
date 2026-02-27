import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Serve the PDF directly from pofology/CVProfile without any conversion
  const cvPath = path.join(process.cwd(), 'CVProfile', 'NguyenTienDatCV.pdf');

  try {
    if (!fs.existsSync(cvPath)) {
      return res.status(404).json({ message: 'CV file not found' });
    }

    const stat = fs.statSync(cvPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', 'attachment; filename="NguyenTienDatCV.pdf"');

    const stream = fs.createReadStream(cvPath);
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).end('Failed to read CV file');
      else res.end();
    });
    stream.pipe(res);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

