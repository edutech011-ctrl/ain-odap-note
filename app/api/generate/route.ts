import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SUBJECT_NAMES: Record<string, string> = {
  korean: "국어",
  english: "영어",
  math: "수학",
  science: "과학",
  history: "역사",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const subject = formData.get("subject") as string;
    const count = parseInt(formData.get("count") as string, 10) || 3;

    if (!imageFile || !subject) {
      return NextResponse.json({ error: "이미지와 과목을 모두 입력해 주세요." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API 키가 설정되지 않았어요." }, { status: 500 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";
    const subjectName = SUBJECT_NAMES[subject] || subject;

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `당신은 대한민국 중학교 ${subjectName} 전문 교사입니다.
학생이 업로드한 문제 이미지를 분석하고 유사 문제와 빈칸 채우기 문제를 생성합니다.
반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

    const userPrompt = `중학교 ${subjectName} 문제 이미지를 분석하여 다음을 수행해 주세요:

1. 문제의 주제, 단원, 핵심 개념 분석
2. 유사한 문제 ${count}개 생성 (원본 문제와 같은 유형 및 난이도)
3. 해당 단원의 핵심 개념 요약
4. 핵심 개념 관련 빈칸 채우기 문제 정확히 10개 생성

다음 JSON 형식으로 응답하세요:
{
  "analysis": {
    "topic": "문제의 핵심 주제 (예: 조선의 건국, 이차방정식, 문학의 3대 장르 등)",
    "unit": "해당 단원명 (예: 3단원. 조선의 성립과 발전)",
    "concepts": ["핵심개념1", "핵심개념2", "핵심개념3"],
    "unitSummary": "단원 핵심 개념 요약 (5~8줄, 중요 개념과 내용을 불릿 포인트로 정리)"
  },
  "similarQuestions": [
    {
      "number": 1,
      "question": "문제 내용 (객관식이면 선택지 포함, 주관식/서술형이면 질문만)",
      "options": ["① 선택지1", "② 선택지2", "③ 선택지3", "④ 선택지4", "⑤ 선택지5"],
      "answer": "정답 (객관식: ①~⑤ 중 하나, 주관식: 정답 내용)",
      "explanation": "정답 해설 (2~3문장)"
    }
  ],
  "fillInBlank": [
    {
      "number": 1,
      "question": "빈칸이 포함된 문장 (___에 들어갈 말은?)",
      "answer": "정답 단어 또는 구"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
            },
            { type: "text", text: userPrompt },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON을 찾을 수 없어요.");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "AI 응답 파싱에 실패했어요. 다시 시도해 주세요." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("Generate API error:", err);
    const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
