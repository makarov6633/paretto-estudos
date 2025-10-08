import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

// Serve um áudio de exemplo para o player da home.
// Usa suporte básico a Range para streaming eficiente.
export async function GET(req: Request) {
  try {
    const filePath = path.join(
      process.cwd(),
      "resumos e audio",
      "Habitos_Atomicos_James_Clear.wav",
    );
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.get("range");

    const contentType = "audio/wav";

    if (range) {
      const bytesPrefix = "bytes=";
      if (!range.startsWith(bytesPrefix)) {
        return new NextResponse("Malformed Range", { status: 416 });
      }
      const [startStr, endStr] = range.replace(bytesPrefix, "").split("-");
      let start = parseInt(startStr, 10);
      let end = endStr
        ? parseInt(endStr, 10)
        : Math.min(start + 1024 * 1024 - 1, fileSize - 1); // ~1MB chunks

      start = isNaN(start) ? 0 : start;
      end = isNaN(end) ? Math.min(start + 1024 * 1024 - 1, fileSize - 1) : end;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse("Range Not Satisfiable", { status: 416 });
      }

      const stream = fs.createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(
        stream,
      ) as unknown as ReadableStream<Uint8Array>;

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": String(end - start + 1),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const full = fs.createReadStream(filePath);
    const web = Readable.toWeb(full) as unknown as ReadableStream<Uint8Array>;
    return new NextResponse(web, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileSize),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Server Error", { status: 500 });
  }
}
