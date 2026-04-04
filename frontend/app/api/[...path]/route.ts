import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL ?? 'http://localhost:8000';

async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const url = `${BACKEND_URL}${pathname}${search}`;

  const headers = new Headers();
  headers.set('Content-Type', req.headers.get('Content-Type') ?? 'application/json');
  const auth = req.headers.get('Authorization');
  if (auth) headers.set('Authorization', auth);

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text()
    : undefined;

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
