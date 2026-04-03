import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthOrg, AuthError } from "@/lib/auth";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

/**
 * POST /api/attachments/ocr
 * 첨부된 고지서 이미지에서 사용량 숫자를 추출
 * body: { attachmentId: number } 또는 FormData(file)
 */
export async function POST(req: NextRequest) {
  try {
    await getAuthOrg();

    const contentType = req.headers.get("content-type") ?? "";
    let imageBase64: string;
    let mediaType: string;
    let fileName: string;

    if (contentType.includes("multipart/form-data")) {
      // FormData로 직접 파일 전송
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
      const buffer = Buffer.from(await file.arrayBuffer());
      imageBase64 = buffer.toString("base64");
      mediaType = file.type;
      fileName = file.name;
    } else {
      // JSON으로 attachmentId 전송 → DB에서 파일 조회
      const body = await req.json();
      const { attachmentId } = body;
      if (!attachmentId) return NextResponse.json({ error: "attachmentId가 필요합니다." }, { status: 400 });

      const att = await prisma.activityAttachment.findUnique({ where: { id: attachmentId } });
      if (!att) return NextResponse.json({ error: "첨부파일을 찾을 수 없습니다." }, { status: 404 });

      if (!att.fileType.startsWith("image/")) {
        return NextResponse.json({ error: "이미지 파일만 OCR 처리할 수 있습니다." }, { status: 400 });
      }

      imageBase64 = Buffer.from(att.fileData).toString("base64");
      mediaType = att.fileType;
      fileName = att.fileName;
    }

    // Anthropic Claude Haiku Vision API 직접 호출
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: imageBase64 },
              },
              {
                type: "text",
                text: `이 이미지는 한국의 공과금 고지서입니다.

## 최우선 규칙 — 도시가스 고지서
도시가스 고지서에는 여러 숫자가 있습니다. 반드시 아래 우선순위로 usage 값을 선택하세요:
1순위: "보정량" 행의 숫자 (보통 표의 마지막 열에 있음, 소수점 4자리)
2순위: "사용량" 행의 숫자
3순위: "당월 사용량" 또는 "금월검침-전월검침"

"보정량"이라는 글자 옆이나 같은 행에 있는 숫자를 반드시 찾으세요.
절대 다른 숫자(요금, 단가, 검침값 등)를 사용하지 마세요.

## 전기/수도 고지서
- 전기: "당월 사용량(kWh)" 값
- 수도: "당월 사용량(m³)" 값

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "type": "도시가스|전기|수도|열|기타",
  "usage": 숫자(소수점 포함, 쉼표 제거),
  "unit": "Nm3|kWh|m3|MJ|기타",
  "period": "YYYY-MM",
  "amount": 숫자(청구금액, 없으면 null),
  "provider": "공급사명(없으면 null)",
  "confidence": 0.0~1.0
}

- 쉼표 제거: 2,276.2478 → 2276.2478
- 소수점 자릿수 그대로 유지
- 여러 항목이면 배열: [{ ... }, { ... }]`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[OCR API] AI Gateway error:", errText);
      return NextResponse.json({ error: "AI 서비스 호출에 실패했습니다." }, { status: 502 });
    }

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text ?? "";

    // JSON 파싱 (마크다운 코드블록 제거)
    const jsonStr = content.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    let extracted: any;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({
        error: "AI 응답을 파싱할 수 없습니다.",
        raw: content,
      }, { status: 422 });
    }

    // 배열이 아니면 배열로 감싸기
    const results = Array.isArray(extracted) ? extracted : [extracted];

    return NextResponse.json({
      ok: true,
      fileName,
      results,
    });
  } catch (err: any) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[POST /api/attachments/ocr]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
