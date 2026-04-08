import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
  "text/csv": "CSV",
  "video/mp4": "MP4",
  "video/quicktime": "MOV",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "ファイルサイズが100MBを超えています" }, { status: 400 });
  }

  const fileType = ALLOWED_TYPES[file.type];
  if (!fileType) {
    return NextResponse.json(
      { error: `未対応のファイル形式です: ${file.type}` },
      { status: 400 }
    );
  }

  try {
    // Upload to Vercel Blob
    const blob = await put(`raw/${Date.now()}_${file.name}`, file, {
      access: "public",
    });

    // Save metadata to DB
    const rawFile = await prisma.rawFile.create({
      data: {
        fileName: file.name,
        fileType,
        mimeType: file.type,
        fileSize: file.size,
        blobUrl: blob.url,
        status: "uploaded",
      },
    });

    return NextResponse.json(rawFile, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
