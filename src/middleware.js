import { NextResponse } from 'next/server';

// Auth is handled server-side in /admin/page.js using cookies() + redirect().
// This middleware is kept as a no-op pass-through.
export function middleware(req) {
  return NextResponse.next();
}

export const config = {
  matcher: [], // No routes matched — middleware is effectively disabled
};
