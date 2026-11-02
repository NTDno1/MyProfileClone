import type { NextApiRequest, NextApiResponse } from 'next';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
  ip?: string;
}

// In-memory fallback storage
const messagesStore: ContactMessage[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { name, email, phone, subject, message } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const newMessage: ContactMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: name.trim(),
      email: email.trim(),
      phone: phone ? String(phone).trim() : undefined,
      subject: subject ? String(subject).trim() : 'Liên hệ từ Website Profile',
      message: message.trim(),
      createdAt: new Date().toISOString(),
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
    };

    messagesStore.push(newMessage);
    console.log('[Contact API] ✉️ New message received:', newMessage);

    return res.status(200).json({
      success: true,
      message: 'Tin nhắn đã được gửi thành công!',
      id: newMessage.id,
    });
  } catch (error) {
    console.error('[Contact API] Error handling message:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
