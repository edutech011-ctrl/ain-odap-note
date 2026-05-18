"use client";

import { useState, useRef, useCallback } from "react";

const SUBJECTS = [
  { id: "korean",  label: "📖 국어",  cls: "subj-korean"  },
  { id: "english", label: "🔤 영어",  cls: "subj-english" },
  { id: "math",    label: "🔢 수학",  cls: "subj-math"    },
  { id: "science", label: "🔬 과학",  cls: "subj-science" },
  { id: "history", label: "🏛️ 역사", cls: "subj-history" },
];
const COUNTS = [1, 3, 5, 7, 10];

interface GenerateResult {
  analysis: { topic: string; unit: string; concepts: string[]; unitSummary: string };
  similarQuestions: { number: number; question: string; options?: string[]; answer: string; explanation: string }[];
  fillInBlank: { number: number; question: string; answer: string }[];
}

/* 헤더에 떠다니는 여름 아이콘들 */
const DECOS = ["☀️","🌊","🍦","🌴","🐚","🏖️","🌺","🍧","🦀","🐠"];

export default function Home() {
  const [subject, setSubject]     = useState("");
  const [count, setCount]         = useState(3);
  const [image, setImage]         = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<GenerateResult | null>(null);
  const [error, setError]         = useState("");
  const [dragOver, setDragOver]   = useState(false);
  const [shown, setShown]         = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("이미지 파일만 올릴 수 있어요 🥲"); return; }
    setImageFile(file); setError(""); setResult(null);
    const r = new FileReader();
    r.onload = (e) => setImage(e.target?.result as string);
    r.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) loadImage(f);
  }, [loadImage]);

  const generate = async () => {
    if (!subject) { setError("과목 먼저 골라줘~ ☀️"); return; }
    if (!imageFile) { setError("문제 사진을 올려줘! 📸"); return; }
    setLoading(true); setError(""); setResult(null); setShown(new Set());
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("subject", subject);
      fd.append("count", String(count));
      const res = await fetch("/api/generate", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "실패!"); }
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "앗 오류났어! 다시 해봐 😅");
    } finally { setLoading(false); }
  };

  const toggleAns = (i: number) => setShown(prev => {
    const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s;
  });

  return (
    <div style={{ minHeight: "100vh" }}>

      {/* ══ 헤더 ══ */}
      <header style={{
        background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 40%, #FFD600 100%)",
        padding: "32px 16px 28px",
        textAlign: "center",
        boxShadow: "0 6px 28px rgba(255,107,107,0.35)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* 배경 데코 */}
        {DECOS.map((d, i) => (
          <span key={i} style={{
            position: "absolute",
            left: `${(i * 10) + 3}%`,
            top: i % 2 === 0 ? "6px" : "18px",
            fontSize: i % 3 === 0 ? "22px" : "15px",
            opacity: 0.28,
            pointerEvents: "none",
          }}>{d}</span>
        ))}

        <div className="float" style={{ fontSize: "64px", lineHeight: 1, display: "inline-block" }}>☀️</div>
        <h1 style={{
          fontSize: "clamp(28px, 6vw, 44px)",
          color: "white",
          textShadow: "0 3px 12px rgba(0,0,0,0.18)",
          margin: "8px 0 6px",
          letterSpacing: "-0.5px",
        }}>
          아인이의 오답노트
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.93)",
          fontSize: "16px",
          fontFamily: "var(--font-noto), sans-serif",
        }}>
          문제 사진 찍어 올리면 AI가 유사 문제 뚝딱! 🌊✨
        </p>

        {/* 파도 모양 */}
        <div style={{
          position: "absolute", bottom: -1, left: 0, right: 0, height: "28px",
          background: "linear-gradient(160deg,#E0F7FA 0%,#B2EBF2 40%,#E0F2F1 100%)",
          clipPath: "ellipse(55% 100% at 50% 100%)",
        }} />
      </header>

      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 14px 70px" }}>

        {/* ══ 과목 ══ */}
        <div className="card">
          <h2 style={{ fontSize: "20px", color: "#0277BD", marginBottom: "16px" }}>
            📚 어떤 과목이야?
          </h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                className={`subj-btn ${s.cls}${subject === s.id ? " active" : ""}`}
                onClick={() => setSubject(s.id)}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* ══ 사진 ══ */}
        <div className="card">
          <h2 style={{ fontSize: "20px", color: "#0277BD", marginBottom: "16px" }}>
            📸 문제 사진 올려줘!
          </h2>
          <div
            className={`upload-box${dragOver ? " drag" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {image ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="문제사진" style={{
                  maxHeight: "260px", maxWidth: "100%",
                  borderRadius: "14px", objectFit: "contain",
                }} />
                <p style={{ marginTop: "10px", color: "#78909C", fontSize: "13px", fontFamily: "var(--font-noto)" }}>
                  다른 사진으로 바꾸려면 여기 클릭!
                </p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: "54px", marginBottom: "10px" }}>🌊</div>
                <p style={{ color: "#0288D1", fontSize: "17px", fontFamily: "var(--font-gaegu)", fontWeight: 700 }}>
                  여기 클릭하거나 사진 끌어다 놓기
                </p>
                <p style={{ color: "#90A4AE", fontSize: "13px", marginTop: "6px", fontFamily: "var(--font-noto)" }}>
                  JPG, PNG, GIF 다 돼요~
                </p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => e.target.files?.[0] && loadImage(e.target.files[0])} />
        </div>

        {/* ══ 개수 ══ */}
        <div className="card">
          <h2 style={{ fontSize: "20px", color: "#0277BD", marginBottom: "16px" }}>
            🔢 유사 문제 몇 개 만들어줄까?
          </h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {COUNTS.map(c => (
              <button key={c}
                className={`cnt-btn${count === c ? " active" : ""}`}
                onClick={() => setCount(c)}
              >{c}</button>
            ))}
          </div>
          <p style={{ marginTop: "14px", fontSize: "14px", color: "#78909C", fontFamily: "var(--font-noto)" }}>
            👉 유사 문제 <strong style={{ color: "#FF6B6B" }}>{count}개</strong> + 빈칸 채우기 10개 생성!
          </p>
        </div>

        {/* ══ 에러 ══ */}
        {error && (
          <div style={{
            background: "#FFF3E0", border: "2px solid #FF8E53",
            borderRadius: "16px", padding: "14px 18px",
            color: "#E64A19", fontSize: "15px", marginBottom: "20px",
            fontFamily: "var(--font-noto)",
          }}>⚠️ {error}</div>
        )}

        {/* ══ 생성 버튼 ══ */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <button className="gen-btn" onClick={generate} disabled={loading}>
            {loading
              ? <span style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                  <span className="float" style={{ fontSize: "22px" }}>🌊</span> 문제 뽑는 중...
                </span>
              : "☀️ 문제 생성하기!"}
          </button>
        </div>

        {/* ══ 로딩 ══ */}
        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="spinner" />
            <p style={{ color: "#0288D1", fontSize: "18px", fontFamily: "var(--font-gaegu)" }}>
              AI가 열심히 문제 만들고 있어~ 잠깐만! 🏖️
            </p>
          </div>
        )}

        {/* ══ 결과 ══ */}
        {result && !loading && (
          <div className="fadein">

            {/* 분석 */}
            <div className="card">
              <h2 style={{ fontSize: "20px", color: "#0277BD", marginBottom: "18px" }}>
                🔍 문제 분석 결과
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "주제", val: result.analysis.topic },
                  { label: "단원", val: result.analysis.unit },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-gaegu)", color: "#0288D1", width: "40px", flexShrink: 0 }}>
                      {label}
                    </span>
                    <span style={{
                      background: "#E1F5FE", border: "1.5px solid #81D4FA",
                      borderRadius: "10px", padding: "4px 14px",
                      color: "#01579B", fontSize: "14px",
                      fontFamily: "var(--font-noto)",
                    }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-gaegu)", color: "#0288D1", width: "40px", flexShrink: 0, paddingTop: "4px" }}>개념</span>
                  <div>{result.analysis.concepts.map((c, i) => <span key={i} className="chip">{c}</span>)}</div>
                </div>
              </div>
              <div style={{
                marginTop: "18px",
                background: "linear-gradient(135deg,#E1F5FE,#E0F2F1)",
                border: "1.5px solid #B2EBF2",
                borderRadius: "16px", padding: "16px 18px",
              }}>
                <p style={{ fontFamily: "var(--font-gaegu)", color: "#0288D1", fontSize: "16px", marginBottom: "8px" }}>
                  🌴 단원 핵심 요약
                </p>
                <p style={{ fontFamily: "var(--font-noto)", color: "#37474F", fontSize: "14px", lineHeight: 1.9, whiteSpace: "pre-line" }}>
                  {result.analysis.unitSummary}
                </p>
              </div>
            </div>

            {/* 유사 문제 */}
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{
                fontSize: "20px", color: "#0277BD", marginBottom: "14px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                ✏️ 유사 문제
                <span style={{
                  background: "#29B6F6", color: "white",
                  borderRadius: "20px", padding: "1px 12px", fontSize: "14px",
                }}>{result.similarQuestions.length}개</span>
              </h2>
              {result.similarQuestions.map((q, i) => (
                <div key={i} className="q-card">
                  <p style={{
                    color: "#37474F", fontSize: "15px", lineHeight: 1.75,
                    marginBottom: "10px", fontFamily: "var(--font-noto)",
                  }}>
                    <span className="num-badge" style={{ background: "#29B6F6" }}>{q.number}</span>
                    {q.question}
                  </p>
                  {q.options && q.options.length > 0 && (
                    <ul style={{ paddingLeft: "4px", marginBottom: "12px" }}>
                      {q.options.map((o, oi) => (
                        <li key={oi} style={{
                          fontSize: "14px", color: "#546E7A", padding: "3px 0",
                          listStyle: "none", fontFamily: "var(--font-noto)",
                        }}>{o}</li>
                      ))}
                    </ul>
                  )}
                  <div style={{
                    background: "linear-gradient(135deg,#E1F5FE,#E0F2F1)",
                    borderRadius: "10px", padding: "10px 14px",
                    borderLeft: "3px solid #29B6F6",
                  }}>
                    <p style={{ fontSize: "12px", color: "#0288D1", marginBottom: "4px", fontFamily: "var(--font-gaegu)" }}>정답</p>
                    <p style={{ fontSize: "14px", color: "#01579B", fontFamily: "var(--font-noto)" }}>{q.answer}</p>
                    {q.explanation && (
                      <p style={{ fontSize: "13px", color: "#546E7A", marginTop: "5px", lineHeight: 1.6, fontFamily: "var(--font-noto)" }}>
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 빈칸 채우기 */}
            <div>
              <h2 style={{
                fontSize: "20px", color: "#0277BD", marginBottom: "6px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                📝 빈칸 채우기
                <span style={{
                  background: "#26C6DA", color: "white",
                  borderRadius: "20px", padding: "1px 12px", fontSize: "14px",
                }}>10개</span>
              </h2>
              <p style={{ color: "#78909C", fontSize: "13px", marginBottom: "14px", fontFamily: "var(--font-noto)" }}>
                정답 보기 버튼 눌러서 확인해봐! 👀
              </p>
              {result.fillInBlank.map((q, i) => (
                <div key={i} className="b-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <p style={{
                      flex: 1, fontSize: "14px", color: "#37474F",
                      lineHeight: 1.75, fontFamily: "var(--font-noto)",
                    }}>
                      <span className="num-badge" style={{ background: "#26C6DA" }}>{q.number}</span>
                      {q.question}
                    </p>
                    <button
                      className={`ans-toggle${shown.has(i) ? " shown" : ""}`}
                      onClick={() => toggleAns(i)}
                    >{shown.has(i) ? "숨기기 🙈" : "정답 보기 👀"}</button>
                  </div>
                  {shown.has(i) && (
                    <div style={{
                      marginTop: "10px", background: "#E0F7FA",
                      borderRadius: "10px", padding: "8px 14px",
                      display: "flex", alignItems: "center", gap: "8px",
                    }}>
                      <span style={{ fontSize: "18px" }}>✅</span>
                      <span style={{ fontSize: "14px", color: "#00838F", fontFamily: "var(--font-noto)" }}>
                        {q.answer}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <button className="gen-btn" onClick={() => {
                setResult(null); setShown(new Set());
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}>☀️ 다시 하기!</button>
            </div>
          </div>
        )}
      </main>

      <footer style={{
        textAlign: "center", padding: "18px",
        color: "#90A4AE", fontSize: "13px",
        fontFamily: "var(--font-noto)",
        borderTop: "1.5px solid #B2EBF2",
      }}>
        ☀️ 아인이의 오답노트 · AI 문제 생성기 🌊
      </footer>
    </div>
  );
}
