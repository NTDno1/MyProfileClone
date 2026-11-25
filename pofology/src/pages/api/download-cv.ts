import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const FILE_SERVER_URL = (process.env.FILE_SERVER_URL || 'http://file-storage:3010').replace(/\/$/, '');
const CV_REL_PATH = 'pofology/cv/NguyenTienDatCV.pdf';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. Ưu tiên lấy CV từ container file-storage
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const remote = await fetch(`${FILE_SERVER_URL}/files/${CV_REL_PATH}`, { signal: ctrl.signal });
    clearTimeout(timer);

    if (remote.ok && remote.body) {
      res.setHeader('Content-Type', 'application/pdf');
      const len = remote.headers.get('content-length');
      if (len) res.setHeader('Content-Length', len);
      res.setHeader('Content-Disposition', 'attachment; filename="NguyenTienDatCV.pdf"');
      Readable.fromWeb(remote.body as any).pipe(res);
      return;
    }
  } catch {
    // Container lưu trữ chưa sẵn sàng -> dùng bản dự phòng trong image
  }

  // 2. Dự phòng: file nằm trong image (CVProfile hoặc public/CV)
  const candidates = [
    path.join(process.cwd(), 'CVProfile', 'NguyenTienDatCV.pdf'),
    path.join(process.cwd(), 'public', 'CV', 'Nguyen_Tien_Dat_CV.pdf'),
  ];
  const cvPath = candidates.find((p) => fs.existsSync(p));

  try {
    if (!cvPath) {
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
