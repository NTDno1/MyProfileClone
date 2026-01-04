import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminCredentials, getAuthToken } from '@/lib/auth';

type Data = {
  success: boolean;
  token?: string;
  message?: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  if (verifyAdminCredentials(username, password)) {
    const token = getAuthToken();
    return res.status(200).json({ success: true, token });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
}

