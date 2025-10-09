import { NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';

/**
 * CSRF token endpoint
 * Returns CSRF token for client-side requests
 */
export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ token });

  return setCsrfCookie(response, token);
}
