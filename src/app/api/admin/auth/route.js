import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export const dynamic = 'force-dynamic';

const SECRET  = process.env.ADMIN_SECRET  || 'fallback-dev-secret-change-in-prod';
const USER    = process.env.ADMIN_USERNAME || 'admin';
const PASS    = process.env.ADMIN_PASSWORD || 'admin123';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function signToken(payload) {
  const data = JSON.stringify(payload);
  const sig  = createHmac('sha256', SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, sig })).toString('base64url');
}

function verifyToken(token) {
  try {
    const { data, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    const expected = createHmac('sha256', SECRET).update(data).digest('hex');
    if (sig !== expected) return null;
    const payload = JSON.parse(data);
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// POST /api/admin/auth — login
export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (username !== USER || password !== PASS) {
      return NextResponse.json(
        { success: false, message: 'ভুল ব্যবহারকারীর নাম বা পাসওয়ার্ড।' },
        { status: 401 }
      );
    }

    const payload = {
      user: USER,
      exp: Date.now() + SESSION_DURATION_MS,
    };

    const token = signToken(payload);

    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'সার্ভার সমস্যা: ' + err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
  return res;
}

// GET /api/admin/auth — verify session
export async function GET(req) {
  const token = req.cookies.get('admin_session')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: payload.user });
}
