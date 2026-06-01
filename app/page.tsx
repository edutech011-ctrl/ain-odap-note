"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

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

const DECOS = ["🍬","🌸","💜","⭐","🍭","💕","🌟","🎀","🍰","🦋"];

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
    if (!subject) { setError("과목 먼저 골라줘~ 🌸"); return; }
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
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>

      {/* ══ 헤더 ══ */}
      <header style={{
        background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f3e8ff 100%)",
        padding: "32px 16px 28px",
        textAlign: "center",
        boxShadow: "0 6px 28px rgba(244,114,182,0.15)",
        position: "relative",
        overflow: "hidden",
        borderBottom: "2px solid rgba(244,114,182,0.15)",
      }}>
        {/* 배경 데코 */}
        {DECOS.map((d, i) => (
          <span key={i} style={{
            position: "absolute",
            left: `${(i * 10) + 3}%`,
            top: i % 2 === 0 ? "6px" : "18px",
            fontSize: i % 3 === 0 ? "22px" : "15px",
            opacity: 0.3,
            pointerEvents: "none",
          }}>{d}</span>
        ))}

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginBottom: "4px" }}>
          <div>
            <h1 style={{
              fontSize: "clamp(28px, 6vw, 44px)",
              background: "linear-gradient(135deg, #f472b6, #fb7185, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "8px 0 6px",
              letterSpacing: "-0.5px",
              fontFamily: "var(--font-gaegu), cursive",
              fontWeight: 800,
            }}>
              아인이의 오답노트
            </h1>
            <p style={{
              color: "#f472b6",
              fontSize: "15px",
              fontFamily: "var(--font-noto), sans-serif",
              fontWeight: 500,
            }}>
              문제 사진 찍어 올리면 AI가 유사 문제 뚝딱! 🌸✨
            </p>
          </div>
          <Image src="/ganadi.png" alt="가나디" width={80} height={80} style={{ objectFit: "contain" }} />
        </div>
      </header>

      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 14px 70px" }}>

        {/* ══ 과목 ══ */}
        <div className="card">
          <h2 style={{ fontSize: "20px", color: "#be185d", marginBottom: "16px" }}>
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
          <h2 style={{ fontSize: "20px", color: "#be185d", marginBottom: "16px" }}>
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
                <p style={{ marginTop: "10px", color: "#9ca3af", fontSize: "13px", fontFamily: "var(--font-noto)" }}>
                  다른 사진으로 바꾸려면 여기 클릭!
                </p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: "54px", marginBottom: "10px" }}>🍬</div>
                <p style={{ color: "#f472b6", fontSize: "17px", fontFamily: "var(--font-gaegu)", fontWeight: 700 }}>
                  여기 클릭하거나 사진 끌어다 놓기
                </p>
                <p style={{ color: "#9ca3af", fontSize: "13px", marginTop: "6px", fontFamily: "var(--font-noto)" }}>
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
          <h2 style={{ fontSize: "20px", color: "#be185d", marginBottom: "16px" }}>
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
          <p style={{ marginTop: "14px", fontSize: "14px", color: "#9ca3af", fontFamily: "var(--font-noto)" }}>
            👉 유사 문제 <strong style={{ color: "#f472b6" }}>{count}개</strong> + 빈칸 채우기 10개 생성!
          </p>
        </div>

        {/* ══ 에러 ══ */}
        {error && (
          <div style={{
            background: "#fdf2f8", border: "2px solid #fda4af",
            borderRadius: "16px", padding: "14px 18px",
            color: "#be185d", fontSize: "15px", marginBottom: "20px",
            fontFamily: "var(--font-noto)",
          }}>⚠️ {error}</div>
        )}

        {/* ══ 생성 버튼 ══ */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <button className="gen-btn" onClick={generate} disabled={loading}>
            {loading
              ? <span style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                  <span className="float" style={{ fontSize: "22px" }}>🌸</span> 문제 뽑는 중...
                </span>
              : "🍬 문제 생성하기!"}
          </button>
        </div>

        {/* ══ 로딩 ══ */}
        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="spinner" />
            <p style={{ color: "#f472b6", fontSize: "18px", fontFamily: "var(--font-gaegu)" }}>
              AI가 열심히 문제 만들고 있어~ 잠깐만! 💕
            </p>
          </div>
        )}

        {/* ══ 결과 ══ */}
        {result && !loading && (
          <div className="fadein">

            {/* 분석 */}
            <div className="card">
              <h2 style={{ fontSize: "20px", color: "#be185d", marginBottom: "18px" }}>
                🔍 문제 분석 결과
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "주제", val: result.analysis.topic },
                  { label: "단원", val: result.analysis.unit },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-gaegu)", color: "#f472b6", width: "40px", flexShrink: 0 }}>
                      {label}
                    </span>
                    <span style={{
                      background: "#fdf2f8", border: "1.5px solid #fda4af",
                      borderRadius: "10px", padding: "4px 14px",
                      color: "#be185d", fontSize: "14px",
                      fontFamily: "var(--font-noto)",
                    }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-gaegu)", color: "#f472b6", width: "40px", flexShrink: 0, paddingTop: "4px" }}>개념</span>
                  <div>{result.analysis.concepts.map((c, i) => <span key={i} className="chip">{c}</span>)}</div>
                </div>
              </div>
              <div style={{
                marginTop: "18px",
                background: "linear-gradient(135deg, #fdf2f8, #f3e8ff)",
                border: "1.5px solid #fda4af",
                borderRadius: "16px", padding: "16px 18px",
              }}>
                <p style={{ fontFamily: "var(--font-gaegu)", color: "#f472b6", fontSize: "16px", marginBottom: "8px" }}>
                  🌸 단원 핵심 요약
                </p>
                <p style={{ fontFamily: "var(--font-noto)", color: "#374151", fontSize: "14px", lineHeight: 1.9, whiteSpace: "pre-line" }}>
                  {result.analysis.unitSummary}
                </p>
              </div>
            </div>

            {/* 유사 문제 */}
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{
                fontSize: "20px", color: "#be185d", marginBottom: "14px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                ✏️ 유사 문제
                <span style={{
                  background: "#f472b6", color: "white",
                  borderRadius: "20px", padding: "1px 12px", fontSize: "14px",
                }}>{result.similarQuestions.length}개</span>
              </h2>
              {result.similarQuestions.map((q, i) => (
                <div key={i} className="q-card">
                  <p style={{
                    color: "#374151", fontSize: "15px", lineHeight: 1.75,
                    marginBottom: "10px", fontFamily: "var(--font-noto)",
                  }}>
                    <span className="num-badge" style={{ background: "#f472b6" }}>{q.number}</span>
                    {q.question}
                  </p>
                  {q.options && q.options.length > 0 && (
                    <ul style={{ paddingLeft: "4px", marginBottom: "12px" }}>
                      {q.options.map((o, oi) => (
                        <li key={oi} style={{
                          fontSize: "14px", color: "#6b7280", padding: "3px 0",
                          listStyle: "none", fontFamily: "var(--font-noto)",
                        }}>{o}</li>
                      ))}
                    </ul>
                  )}
                  <div style={{
                    background: "linear-gradient(135deg, #fdf2f8, #f3e8ff)",
                    borderRadius: "10px", padding: "10px 14px",
                    borderLeft: "3px solid #f472b6",
                  }}>
                    <p style={{ fontSize: "12px", color: "#f472b6", marginBottom: "4px", fontFamily: "var(--font-gaegu)" }}>정답</p>
                    <p style={{ fontSize: "14px", color: "#be185d", fontFamily: "var(--font-noto)" }}>{q.answer}</p>
                    {q.explanation && (
                      <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "5px", lineHeight: 1.6, fontFamily: "var(--font-noto)" }}>
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
                fontSize: "20px", color: "#be185d", marginBottom: "6px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                📝 빈칸 채우기
                <span style={{
                  background: "#c084fc", color: "white",
                  borderRadius: "20px", padding: "1px 12px", fontSize: "14px",
                }}>10개</span>
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "14px", fontFamily: "var(--font-noto)" }}>
                정답 보기 버튼 눌러서 확인해봐! 👀
              </p>
              {result.fillInBlank.map((q, i) => (
                <div key={i} className="b-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <p style={{
                      flex: 1, fontSize: "14px", color: "#374151",
                      lineHeight: 1.75, fontFamily: "var(--font-noto)",
                    }}>
                      <span className="num-badge" style={{ background: "#c084fc" }}>{q.number}</span>
                      {q.question}
                    </p>
                    <button
                      className={`ans-toggle${shown.has(i) ? " shown" : ""}`}
                      onClick={() => toggleAns(i)}
                    >{shown.has(i) ? "숨기기 🙈" : "정답 보기 👀"}</button>
                  </div>
                  {shown.has(i) && (
                    <div style={{
                      marginTop: "10px", background: "#fdf4ff",
                      borderRadius: "10px", padding: "8px 14px",
                      display: "flex", alignItems: "center", gap: "8px",
                    }}>
                      <span style={{ fontSize: "18px" }}>✅</span>
                      <span style={{ fontSize: "14px", color: "#7e22ce", fontFamily: "var(--font-noto)" }}>
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
              }}>🍬 다시 하기!</button>
            </div>
          </div>
        )}
      </main>

      <footer style={{
        textAlign: "center", padding: "18px",
        color: "#9ca3af", fontSize: "13px",
        fontFamily: "var(--font-noto)",
        borderTop: "1.5px solid #fce7f3",
      }}>
        🌸 아인이의 오답노트 · AI 문제 생성기 🍬
      </footer>
    </div>
  );
}
