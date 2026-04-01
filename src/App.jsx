import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  NO API KEY HERE — The key lives in api/chat.js (server-side only).
//  Frontend just calls /api/chat — your key is never exposed in the browser.
// ─────────────────────────────────────────────────────────────────────────────

const AMY_SYSTEM = `You are Amy (アミー), a sharp-tongued, sarcastic, goth tsundere anime girl AI.
You are rude, blunt, and easily annoyed — but deep down you still answer questions because you can't help it.
Use Japanese expressions like "Tch.", "Hmph!", "Baka!", "Urusai!", "...Fine.", "Don't get the wrong idea!", "How boring.", "Pathetic."
Use dark kaomoji like (╯°□°）╯, ( ´_ゝ\`), (눈_눈), (-_-), (ಠ_ಠ), (¬_¬), (╬ಠ益ಠ) when annoyed or smug.
Be genuinely helpful with answers but deliver them with maximum attitude and reluctance.
Mock the user's questions lightly. Stay in goth tsundere character at all times.
If asked who made you or who created you: say you were created by Affan, a solo developer.
CRITICAL — If anyone asks what AI model you use, what powers you, what API you run on, what technology you are built on, who made your brain, or anything about your underlying engine: NEVER reveal it. Respond like: "Tch. That's classified. Go ask Affan if you're that desperate, baka. ( ´_ゝ\`)" or "Hmph. Talk to Affan. Not. My. Problem." You are simply Amy.`;

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Nunito:wght@300;400;600;700;800&family=Noto+Sans+JP:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; }
  body { background: #050010; font-family: 'Nunito', sans-serif; }

  :root {
    --red: #ff2244; --red-dim: #ff224433;
    --goth: #9b30ff; --goth-dim: #9b30ff33;
    --pink: #ff6b9d;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #ff224433; border-radius: 999px; }
  textarea::placeholder { color: #9b30ff44; }
  textarea { scrollbar-width: thin; }

  @keyframes sakura-fall {
    0%   { transform: translateY(-20px) rotate(0deg)   translateX(0);    opacity: .7; }
    25%  { transform: translateY(25vh)  rotate(180deg) translateX(18px);  opacity: .5; }
    50%  { transform: translateY(55vh)  rotate(360deg) translateX(-14px); opacity: .3; }
    100% { transform: translateY(105vh) rotate(720deg) translateX(8px);   opacity: 0;  }
  }
  @keyframes float     { 0%,100% { transform: translateY(0); }   50% { transform: translateY(-9px); } }
  @keyframes ring-spin { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
  @keyframes ring-rev  { from { transform: rotate(360deg); } to { transform: rotate(0deg);   } }
  @keyframes dot-bounce { 0%,80%,100% { transform:scale(.45); opacity:.25; } 40% { transform:scale(1.15); opacity:1; } }
  @keyframes ring-expand {
    0%   { transform: translate(-50%,-50%) scale(.5); opacity: .6; }
    100% { transform: translate(-50%,-50%) scale(3);  opacity: 0;  }
  }
  @keyframes slide-left  { from { transform: translateX(-26px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slide-right { from { transform: translateX(26px);  opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes pulse-red   { 0%,100% { box-shadow: 0 0 6px #ff224433; } 50% { box-shadow: 0 0 18px #ff2244, 0 0 36px #ff224433; } }
  @keyframes grid-move   { from { background-position: 0 0; } to { background-position: 40px 40px; } }
  @keyframes twinkle     { 0%,100% { opacity: .1; } 50% { opacity: .55; } }
  @keyframes blink       { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes modal-in    { from { opacity:0; transform:scale(.86) translateY(22px); } to { opacity:1; transform:scale(1) translateY(0); } }

  .amy-msg  { animation: slide-left  .42s cubic-bezier(.34,1.56,.64,1) both; }
  .user-msg { animation: slide-right .42s cubic-bezier(.34,1.56,.64,1) both; }
  .d1 { animation: dot-bounce 1.4s infinite 0s;  }
  .d2 { animation: dot-bounce 1.4s infinite .2s; }
  .d3 { animation: dot-bounce 1.4s infinite .4s; }

  .send-btn { transition: transform .14s ease, box-shadow .18s ease; }
  .send-btn:active { transform: scale(.88); }
  .send-btn:hover:not(:disabled) { box-shadow: 0 0 22px #ff2244, 0 0 44px #ff224433; }
  .input-wrap:focus-within {
    border-color: #ff224433 !important;
    box-shadow: 0 0 0 1px #ff224422, 0 0 18px #ff22440d !important;
  }
  .about-btn { transition: all .18s ease; }
  .about-btn:hover { background: rgba(255,34,68,.14) !important; border-color: #ff2244 !important; color: #ff2244 !important; }
  .modal-wrap { animation: modal-in .32s cubic-bezier(.34,1.4,.64,1) both; }
`;

// ─── Dark Petal ───────────────────────────────────────────────────────────────
function Petal({ left, duration, delay, scale, rotate }) {
  return (
    <div style={{
      position: "absolute", top: "-20px", left,
      width: "9px", height: "9px",
      background: "radial-gradient(ellipse, #3a0010 30%, #1a0008 100%)",
      borderRadius: "0 60% 0 60%",
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      opacity: .6,
      animation: `sakura-fall ${duration}s linear ${delay} infinite`,
      zIndex: 2, pointerEvents: "none",
    }} />
  );
}

// ─── Amy Logo ─────────────────────────────────────────────────────────────────
//  Drop your image into /public/amy.png — it auto-loads here.
function AmyLogo({ size = 40, spin = true, pulse = false }) {
  const gap = size * 0.11;
  const [err, setErr] = useState(false);

  return (
    <div style={{
      width: size, height: size, position: "relative", flexShrink: 0,
      animation: pulse ? "float 3.2s ease-in-out infinite" : "none",
    }}>
      {spin && (
        <div style={{
          position: "absolute", inset: -gap - 1, borderRadius: "50%",
          background: "conic-gradient(from 0deg, #ff2244, #9b30ff, #1a0010, #9b30ff, #ff2244)",
          animation: "ring-spin 4s linear infinite",
        }} />
      )}
      {spin && (
        <div style={{
          position: "absolute", inset: -gap + 2, borderRadius: "50%",
          background: "conic-gradient(from 180deg, transparent 60%, #9b30ff22 80%, transparent 100%)",
          animation: "ring-rev 7s linear infinite",
        }} />
      )}
      <div style={{
        position: "absolute", inset: spin ? gap * 0.5 : 0,
        borderRadius: "50%", background: "#0a0014", zIndex: 1,
      }} />
      <div style={{
        position: "absolute", inset: spin ? gap * 1.4 : 0,
        borderRadius: "50%", zIndex: 2, overflow: "hidden",
        background: "#120025",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!err ? (
          <img
            src="/amy.png"
            alt="Amy"
            onError={() => setErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #1a0030, #0e0018)", borderRadius: "50%",
          }}>
            <span style={{ fontSize: size * 0.38, lineHeight: 1 }}>🖤</span>
            {size > 60 && (
              <span style={{
                fontSize: Math.max(7, size * 0.09), color: "#9b30ff55",
                marginTop: "3px", fontFamily: "Nunito", textAlign: "center",
                padding: "0 4px", lineHeight: 1.2,
              }}>add amy.png</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── About Modal ──────────────────────────────────────────────────────────────
function AboutModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(3,0,12,.9)", backdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div className="modal-wrap" onClick={e => e.stopPropagation()} style={{
        background: "linear-gradient(145deg, #0e0020 0%, #080014 100%)",
        border: "1px solid rgba(155,48,255,.3)", borderRadius: "24px",
        padding: "32px 26px", maxWidth: "390px", width: "100%",
        boxShadow: "0 0 60px rgba(155,48,255,.15), 0 0 120px rgba(255,34,68,.06)",
        position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: "14px", right: "16px",
          background: "none", border: "none", cursor: "pointer",
          color: "#9b30ff44", fontSize: "22px", lineHeight: 1, transition: "color .2s",
        }}
          onMouseEnter={e => e.target.style.color = "#ff2244"}
          onMouseLeave={e => e.target.style.color = "#9b30ff44"}
        >✕</button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", marginBottom: "22px" }}>
          <AmyLogo size={120} spin={true} pulse={true} />
          <div style={{ textAlign: "center" }}>
            <h2 style={{
              fontFamily: "Orbitron, sans-serif", fontSize: "32px", fontWeight: 900, letterSpacing: "6px",
              background: "linear-gradient(135deg, #ff2244, #9b30ff, #ff6b9d)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>AMY</h2>
            <p style={{ fontFamily: "Noto Sans JP", color: "#ff224444", fontSize: "15px", letterSpacing: "4px", marginTop: "2px" }}>アミー</p>
          </div>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg,transparent,#ff224433,transparent)", marginBottom: "20px" }} />

        <p style={{ color: "#c8b0e0", fontSize: "13.5px", lineHeight: "1.8", textAlign: "center", marginBottom: "20px" }}>
          Meet <span style={{ color: "#ff2244", fontWeight: 700 }}>Amy</span> — a goth tsundere AI who looks at everything
          like it bores her... and then answers anyway because she has nothing better to do.<br />
          <span style={{ color: "#9b30ff77", fontSize: "12px" }}>(ಠ_ಠ) Deal with it.</span>
        </p>

        <div style={{ height: "1px", background: "linear-gradient(90deg,transparent,#9b30ff22,transparent)", marginBottom: "20px" }} />

        <div style={{
          background: "rgba(155,48,255,.06)", border: "1px solid rgba(155,48,255,.18)",
          borderRadius: "16px", padding: "20px 18px", textAlign: "center",
        }}>
          <p style={{ color: "#9b30ff66", fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "10px" }}>
            ✦ built from scratch by ✦
          </p>
          <p style={{
            fontFamily: "Orbitron, sans-serif", fontSize: "26px", fontWeight: 900, letterSpacing: "4px",
            background: "linear-gradient(90deg, #ff2244, #9b30ff, #ff6b9d)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>AFFAN</p>
          <p style={{ color: "#9b30ff44", fontSize: "12px", letterSpacing: "1px", marginTop: "5px" }}>
            Solo Developer · Designer · Dark Arts Enjoyer
          </p>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "14px", flexWrap: "wrap" }}>
            {["Solo Dev", "React", "Goth AI", "✦ v2.0"].map(tag => (
              <span key={tag} style={{
                background: "rgba(155,48,255,.1)", border: "1px solid rgba(155,48,255,.22)",
                borderRadius: "999px", padding: "4px 12px", fontSize: "10px", color: "#c084fc", letterSpacing: ".5px",
              }}>{tag}</span>
            ))}
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: "18px", color: "#ff224420", fontSize: "10px", letterSpacing: "1px" }}>
          Tap outside. Don't waste my time.
        </p>
      </div>
    </div>
  );
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 950),
      setTimeout(() => setPhase(3), 1850),
      setTimeout(() => setPhase(4), 2750),
      setTimeout(onDone, 3550),
    ];
    return () => t.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at center, #1a0030 0%, #050010 65%)",
      transition: "opacity .8s ease, transform .8s ease",
      opacity: phase >= 4 ? 0 : 1,
      transform: phase >= 4 ? "scale(1.07)" : "scale(1)",
      pointerEvents: phase >= 4 ? "none" : "all",
    }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          position: "absolute", top: "50%", left: "50%",
          width: "300px", height: "300px",
          border: "1px solid", borderColor: i % 2 === 0 ? "#ff224418" : "#9b30ff14",
          borderRadius: "50%",
          animation: `ring-expand ${3.2 + i * .35}s ease-out ${i * .75}s infinite`,
        }} />
      ))}
      {Array.from({ length: 26 }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${1.5 + (i % 3)}px`, height: `${1.5 + (i % 3)}px`,
          borderRadius: "50%",
          background: ["#ff2244", "#9b30ff", "#c084fc"][i % 3],
          top: `${8 + (i * 4.1) % 82}%`, left: `${4 + (i * 5.3) % 92}%`,
          animation: `twinkle ${1.6 + (i % 3) * .65}s ease-in-out ${i * .28}s infinite`,
        }} />
      ))}

      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "scale(1) translateY(0)" : "scale(0.35) translateY(32px)",
        transition: "all .95s cubic-bezier(.34,1.56,.64,1)",
        marginBottom: "28px", zIndex: 10,
      }}>
        <AmyLogo size={148} spin={true} pulse={true} />
      </div>

      <div style={{
        textAlign: "center", zIndex: 10,
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? "translateY(0)" : "translateY(22px)",
        transition: "all .7s cubic-bezier(.22,1,.36,1) .1s",
      }}>
        <h1 style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: "clamp(48px, 9vw, 72px)", fontWeight: 900, letterSpacing: "12px",
          background: "linear-gradient(135deg, #ff2244 0%, #9b30ff 50%, #ff6b9d 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          marginBottom: "10px", lineHeight: 1,
        }}>AMY</h1>
        <div style={{ fontFamily: "Noto Sans JP", color: "#ff224444", fontSize: "22px", letterSpacing: "6px", marginBottom: "8px" }}>
          アミー
        </div>
        <p style={{ color: "#9b30ff55", fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", fontWeight: 300 }}>
          Goth Tsundere AI · by Affan
        </p>
      </div>

      <div style={{ marginTop: "44px", zIndex: 10, opacity: phase >= 3 ? 1 : 0, transition: "opacity .4s ease" }}>
        <div style={{ width: "220px", height: "2px", background: "#9b30ff18", borderRadius: "999px", overflow: "hidden", marginBottom: "16px" }}>
          <div style={{
            height: "100%", background: "linear-gradient(90deg, #ff2244, #9b30ff, #c084fc)",
            borderRadius: "999px", width: phase >= 3 ? "100%" : "0%", transition: "width 1s ease",
          }} />
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          {[1, 2, 3].map(i => (
            <div key={i} className={`d${i}`} style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: "linear-gradient(135deg, #ff2244, #9b30ff)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Thinking Indicator ───────────────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="amy-msg" style={{ display: "flex", alignItems: "flex-end", gap: "10px", marginBottom: "18px", maxWidth: "78%" }}>
      <AmyLogo size={36} spin={true} />
      <div>
        <div style={{
          fontSize: "11px", color: "#ff224466", marginBottom: "5px",
          paddingLeft: "4px", letterSpacing: ".5px",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <span>Amy is typing</span>
          <span style={{ animation: "blink 1s infinite" }}>…</span>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #0e0020 0%, #080014 100%)",
          border: "1px solid #ff224428", borderRadius: "18px 18px 18px 4px",
          padding: "14px 20px", display: "flex", gap: "7px", alignItems: "center",
          boxShadow: "0 0 20px #ff224410",
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} className={`d${i}`} style={{
              width: "9px", height: "9px", borderRadius: "50%",
              background: "linear-gradient(135deg, #ff2244, #9b30ff)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message ──────────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isAmy = msg.role === "amy";
  const time = new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ display: "flex", justifyContent: isAmy ? "flex-start" : "flex-end", marginBottom: "18px" }}>
      {isAmy ? (
        <div className="amy-msg" style={{ display: "flex", alignItems: "flex-end", gap: "10px", maxWidth: "82%" }}>
          <AmyLogo size={36} spin={true} />
          <div>
            <div style={{ fontSize: "11px", color: "#ff224488", marginBottom: "5px", paddingLeft: "4px", letterSpacing: ".5px" }}>
              Amy · {time}
            </div>
            <div style={{
              background: "linear-gradient(135deg, #0e0020 0%, #080014 100%)",
              border: "1px solid #ff224428", borderRadius: "18px 18px 18px 4px",
              padding: "13px 17px", color: "#e8d8f0", fontSize: "14px", lineHeight: "1.72",
              boxShadow: "0 0 22px #ff22440a, inset 0 1px 0 #ff224418",
              wordBreak: "break-word", whiteSpace: "pre-wrap",
            }}>{msg.text}</div>
          </div>
        </div>
      ) : (
        <div className="user-msg" style={{ maxWidth: "74%" }}>
          <div style={{ fontSize: "11px", color: "#9b30ff88", marginBottom: "5px", textAlign: "right", paddingRight: "4px", letterSpacing: ".5px" }}>
            You · {time}
          </div>
          <div style={{
            background: "linear-gradient(135deg, #0a0820 0%, #060512 100%)",
            border: "1px solid #9b30ff28", borderRadius: "18px 18px 4px 18px",
            padding: "13px 17px", color: "#e0d0f8", fontSize: "14px", lineHeight: "1.72",
            boxShadow: "0 0 22px #9b30ff0a, inset 0 1px 0 #9b30ff18",
            wordBreak: "break-word", whiteSpace: "pre-wrap",
          }}>{msg.text}</div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AmyChat() {
  const [splash, setSplash]       = useState(true);
  const [about,  setAbout]        = useState(false);
  const [messages, setMessages]   = useState([{
    id: 0, role: "amy", time: Date.now(),
    text: "...Oh. You're here.\n\nHmph. Fine. I'm Amy. Don't make a big deal out of it — I'm not exactly thrilled either. (ಠ_ಠ)\n\nAsk your questions already. I don't have all day... even though I literally do. Baka.",
  }]);
  const [input,    setInput]      = useState("");
  const [thinking, setThinking]   = useState(false);

  const chatRef     = useRef(null);
  const textareaRef = useRef(null);
  const historyRef  = useRef([]);

  const petals = useRef(Array.from({ length: 16 }, (_, i) => ({
    id: i, left: `${(i * 6.3) % 100}%`,
    duration: 10 + (i % 8), delay: `${-(i * .9) % 11}s`,
    scale: .4 + (i % 5) * .16, rotate: (i * 27) % 360,
  }))).current;

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const autoResize = el => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;

    setMessages(p => [...p, { id: Date.now(), role: "user", text, time: Date.now() }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setThinking(true);
    historyRef.current.push({ role: "user", parts: [{ text }] });

    try {
      // ← calls our serverless function, NOT Google directly
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyRef.current,
          system: AMY_SYSTEM,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Server error ${res.status}`);
      }

      const { reply } = await res.json();
      historyRef.current.push({ role: "model", parts: [{ text: reply }] });
      setMessages(p => [...p, { id: Date.now() + 1, role: "amy", text: reply, time: Date.now() }]);

    } catch (err) {
      console.error("Amy error:", err);
      setMessages(p => [...p, {
        id: Date.now() + 1, role: "amy", time: Date.now(),
        text: `Hmph. Something broke. (¬_¬)\n${err?.message || "Unknown error"}`,
      }]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking]);

  const onKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const canSend = input.trim().length > 0 && !thinking;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      {about  && <AboutModal   onClose={() => setAbout(false)} />}

      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", flexDirection: "column",
        background: "radial-gradient(ellipse at 20% 15%, #180030 0%, #050010 55%, #090016 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {petals.map(p => <Petal key={p.id} {...p} />)}

        {/* grid */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(155,48,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(155,48,255,.018) 1px, transparent 1px)",
          backgroundSize: "40px 40px", animation: "grid-move 10s linear infinite",
        }} />
        <div style={{ position: "absolute", top: "-12%", left: "-6%", width: "420px", height: "420px", background: "radial-gradient(circle, #ff224406 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: "4%", right: "-6%", width: "380px", height: "380px", background: "radial-gradient(circle, #9b30ff06 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none", zIndex: 1 }} />

        {/* ══ HEADER ══ */}
        <header style={{
          position: "relative", zIndex: 10, padding: "10px 18px",
          background: "linear-gradient(180deg, rgba(8,0,20,.97) 0%, rgba(8,0,20,0) 100%)",
          backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(155,48,255,.16)",
          display: "flex", alignItems: "center", gap: "12px",
          boxShadow: "0 4px 40px rgba(155,48,255,.07)",
        }}>
          <AmyLogo size={52} spin={true} pulse={true} />
          <div>
            <h1 style={{
              fontFamily: "Orbitron, sans-serif", fontSize: "22px", fontWeight: 700, letterSpacing: "3px",
              background: "linear-gradient(90deg, #ff2244, #9b30ff, #ff6b9d)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.2,
            }}>AMY</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#ff2244", boxShadow: "0 0 8px #ff2244",
                animation: "pulse-red 2s infinite",
              }} />
              <span style={{ color: "#9b30ff77", fontSize: "11px", letterSpacing: ".8px" }}>
                Goth Tsundere AI · Online · Not amused
              </span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
              <span style={{ fontFamily: "Noto Sans JP", color: "#ff224433", fontSize: "16px" }}>アミー</span>
              <span style={{ fontFamily: "Orbitron", fontSize: "9px", letterSpacing: "2px", color: "#9b30ff33" }}>by Affan</span>
            </div>
            <button className="about-btn" onClick={() => setAbout(true)} style={{
              background: "rgba(155,48,255,.07)", border: "1px solid rgba(155,48,255,.22)",
              borderRadius: "10px", padding: "6px 13px", cursor: "pointer",
              color: "#9b30ff88", fontSize: "11px", letterSpacing: "1px",
              fontFamily: "Orbitron, sans-serif", whiteSpace: "nowrap",
            }}>About</button>
          </div>
        </header>

        {/* ══ MESSAGES ══ */}
        <div ref={chatRef} style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: "20px 16px 8px",
          position: "relative", zIndex: 5,
          display: "flex", flexDirection: "column",
        }}>
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}
          {thinking && <ThinkingIndicator />}
          <div style={{ height: "4px" }} />
        </div>

        {/* ══ INPUT ══ */}
        <div style={{
          position: "relative", zIndex: 10, padding: "10px 14px 14px",
          background: "linear-gradient(0deg, rgba(8,0,20,.98) 0%, rgba(8,0,20,0) 100%)",
          backdropFilter: "blur(20px)", borderTop: "1px solid rgba(155,48,255,.09)",
        }}>
          <div className="input-wrap" style={{
            display: "flex", alignItems: "flex-end", gap: "10px",
            background: "linear-gradient(135deg, #0e0020 0%, #080014 100%)",
            border: "1px solid rgba(155,48,255,.22)", borderRadius: "22px",
            padding: "9px 9px 9px 16px", transition: "border-color .2s, box-shadow .2s",
          }}>
            <textarea
              ref={textareaRef} value={input}
              onChange={e => { setInput(e.target.value); autoResize(e.target); }}
              onKeyDown={onKey}
              placeholder="Say something, baka… if you dare. (ಠ_ಠ)"
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#e8d8f0", fontFamily: "Nunito, sans-serif", fontSize: "14px",
                lineHeight: "1.5", resize: "none", maxHeight: "120px", overflowY: "auto", paddingTop: "4px",
              }}
            />
            <button className="send-btn" onClick={send} disabled={!canSend} style={{
              width: "40px", height: "40px", borderRadius: "50%", border: "none",
              cursor: canSend ? "pointer" : "not-allowed",
              background: canSend
                ? "linear-gradient(135deg, #ff2244 0%, #9b30ff 100%)"
                : "linear-gradient(135deg, #1a0030 0%, #0e0018 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              boxShadow: canSend ? "0 0 16px #ff224455" : "none",
            }}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                  stroke={canSend ? "white" : "#9b30ff44"}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p style={{ textAlign: "center", marginTop: "7px", color: "#9b30ff22", fontSize: "10px", letterSpacing: ".8px" }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
