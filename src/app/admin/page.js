import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHmac } from 'crypto';
import AdminUI from './AdminUI';

export const metadata = {
  title: 'Admin Dashboard | বাংলা ই-বুক রিডার',
  description: 'Manage books and chapters',
};

const SECRET = process.env.ADMIN_SECRET || 'fallback-dev-secret-change-in-prod';

function verifyToken(token) {
  try {
    const { data, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    const expected = createHmac('sha256', SECRET).update(data).digest('hex');
    if (sig !== expected) return false;
    const payload = JSON.parse(data);
    return payload.exp >= Date.now();
  } catch {
    return false;
  }
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token || !verifyToken(token)) {
    redirect('/admin/login?from=/admin');
  }

  return <AdminUI />;
}
