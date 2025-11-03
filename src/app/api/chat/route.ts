import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyCsrf } from "@/lib/security";

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

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
      messages: convertToModelMessages(messages),
    });

    return (
      result as unknown as { toUIMessageStreamResponse: () => Response }
    ).toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
