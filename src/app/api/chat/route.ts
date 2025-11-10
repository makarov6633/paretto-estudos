import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyCsrf } from "@/lib/security";
import { validateChatMessage, checkUserRateLimit } from "@/lib/input-sanitization";
import { checkUserAccess } from "@/lib/access-control";

export async function POST(req: Request) {
  // CSRF protection
  if (!verifyCsrf(req)) {
    return new Response("CSRF validation failed", { status: 403 });
  }

  // Authentication check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check access control (premium/free)
  const access = await checkUserAccess(session.user.id);
  if (!access.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Access denied',
        reason: access.reason,
        remainingFree: access.remainingFree,
      }),
      { 
        status: access.reason === 'limit' ? 402 : 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Rate limiting per user (100 messages per minute)
  if (!checkUserRateLimit(session.user.id, 100, 60000)) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many messages. Please wait a moment.',
      }),
      { 
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate payload size
  const len = Number(req.headers.get("content-length") || 0);
  if (len && len > 256 * 1024) {
    return new Response("Payload too large", { status: 413 });
  }

  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("Invalid messages", { status: 400 });
    }

    // Validar e sanitizar cada mensagem
    const sanitizedMessages: UIMessage[] = [];
    for (const msg of messages) {
      if (msg.role === 'user' && typeof msg.content === 'string') {
        const validation = validateChatMessage(msg.content);
        
        if (!validation.isValid) {
          return new Response(
            JSON.stringify({ error: validation.error }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        
        sanitizedMessages.push({
          ...msg,
          content: validation.sanitized || msg.content,
        });
      } else {
        sanitizedMessages.push(msg);
      }
    }

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
      messages: convertToModelMessages(sanitizedMessages),
    });

    return (
      result as unknown as { toUIMessageStreamResponse: () => Response }
    ).toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
