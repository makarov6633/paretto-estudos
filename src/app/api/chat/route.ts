import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len && len > 256 * 1024) {
    return new Response("Payload too large", { status: 413 });
  }
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL || "gpt-5-mini"),
    messages: convertToModelMessages(messages),
  });

  return (
    result as unknown as { toUIMessageStreamResponse: () => Response }
  ).toUIMessageStreamResponse();
}
