import { NextResponse } from "next/server";
import { getUserIdFromRequest, checkUserAccess } from "@/lib/access-control";

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json(
      { allowed: false, reason: "unauthorized" },
      { status: 401 },
    );
  }

  const access = await checkUserAccess(userId);

  if (!access.allowed) {
    return NextResponse.json(
      {
        allowed: false,
        reason: access.reason,
        remainingFree: access.remainingFree
      },
      { status: access.reason === 'limit' ? 402 : 403 },
    );
  }

  return NextResponse.json({
    allowed: true,
    reason: access.reason,
    remainingFree: access.remainingFree
  });
}
