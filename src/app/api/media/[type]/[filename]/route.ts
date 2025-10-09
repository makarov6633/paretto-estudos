import { NextResponse } from 'next/server';
import { getUserIdFromRequest, checkUserAccess } from '@/lib/access-control';
import fs from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['pdf', 'audio'] as const;
type MediaType = typeof ALLOWED_TYPES[number];

/**
 * Protected media endpoint
 * Requires authentication and validates access before serving files
 */
export async function GET(
  req: Request,
  { params }: { params: { type: string; filename: string } }
) {
  // Validate media type
  if (!ALLOWED_TYPES.includes(params.type as MediaType)) {
    return new NextResponse('Invalid media type', { status: 400 });
  }

  // Check authentication
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Check access (premium or free tier)
  const access = await checkUserAccess(userId);
  if (!access.allowed) {
    if (access.reason === 'limit') {
      return NextResponse.json(
        { error: 'Free tier limit reached. Upgrade to premium for unlimited access.' },
        { status: 402 }
      );
    }
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Sanitize filename to prevent directory traversal
  const sanitizedFilename = path.basename(params.filename);
  const filePath = path.join(
    process.cwd(),
    'private',
    params.type,
    sanitizedFilename
  );

  try {
    // Check file exists
    await fs.access(filePath);

    // Read and serve file
    const file = await fs.readFile(filePath);

    // Set appropriate content type
    const contentType = params.type === 'pdf'
      ? 'application/pdf'
      : 'audio/wav';

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${sanitizedFilename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving protected media:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
