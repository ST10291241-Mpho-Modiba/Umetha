import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const fileName = req.nextUrl.searchParams.get("f");

  if (!fileName) {
    return new NextResponse("Missing file parameter", { status: 400 });
  }

  const filePath = path.join("/tmp", fileName);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  const file = fs.readFileSync(filePath);

  return new NextResponse(file, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
