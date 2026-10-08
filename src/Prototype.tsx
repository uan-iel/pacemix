import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  Cross2Icon,
  DownloadIcon,
  DotsHorizontalIcon,
  KeyboardIcon,
  MagicWandIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ReloadIcon,
  Share1Icon,
  SpeakerLoudIcon,
  TrackNextIcon,
} from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { BottomSheet, Carousel, KeyboardTextarea, MobileScroll, useKeyboard, useKeyboardInsets } from "./mobile";
import {
  buildPlan,
  catalog,
  currentScheduleIndex,
  detectPlanConflicts,
  emptyDraft,
  formatTime,
  mergeDraft,
  nextMissing,
  normalizeIntentPayload,
  parseRequest,
  questionFor,
  retunePlanCadence,
  type CadenceProfile,
  type Plan,
  type TrainingDraft,
} from "./lib/pacemix";

type Screen = "arrange" | "plan" | "session" | "mine" | "chat" | "achievement";
type ChatPhase = "input" | "listening" | "analyzing" | "clarify" | "conflict" | "ready" | "generating" | "error";

const readCadence = (): CadenceProfile => {
  try {
    const value = localStorage.getItem("pacemix:v1:cadence");
    return value === "short" || value === "long" ? value : "standard";
  } catch { return "standard"; }
};

const languageLabel = (value: Plan["musicLanguage"] | TrainingDraft["language"]) => value === "en" ? "全部英文歌" : value === "zh" ? "全部华语歌" : "混合曲库";
const intensityLabel = (value: Plan["intensity"] | TrainingDraft["intensity"]) => value === "easy" ? "轻松" : value === "medium" ? "中等" : value === "hard" ? "挑战" : value === "custom" ? "自定义配速" : value === "ai" ? "由 AI 安排" : "待确认";

const shareDate = (date = new Date()) => `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
const averageSpm = (plan: Plan) => Math.round(plan.stages.reduce((sum, stage) => sum + stage.targetSpm * stage.minutes, 0) / Math.max(1, plan.minutes));
const shareCovers = (plan: Plan) => {
  const seen = new Set<string>();
  return plan.schedule.map((item) => item.song).filter((song) => !seen.has(song.id) && !!seen.add(song.id)).slice(0, 3);
};

function refreshCatalogAssets(plan: Plan): Plan {
  const currentSong = (song: Plan["songs"][number]) => catalog.find((item) => item.id === song.id) ?? song;
  return { ...plan, songs: plan.songs.map(currentSong), schedule: plan.schedule.map((item) => ({ ...item, song: currentSong(item.song) })) };
}

function speedSamples(plan: Plan, count = 240) {
  const total = Math.max(1, plan.stages.reduce((sum, stage) => sum + stage.minutes, 0));
  const boundaries: Array<{ at: number; from: number; to: number }> = [];
  let cursor = 0;
  plan.stages.forEach((stage, index) => {
    cursor += stage.minutes;
    const next = plan.stages[index + 1];
    if (next) boundaries.push({ at: cursor, from: stage.speed, to: next.speed });
  });
  const transition = Math.min(.9, total * .025);
  const speedAt = (minute: number) => {
    let elapsed = 0; let value = plan.stages[0]?.speed ?? 0;
    for (const stage of plan.stages) { if (minute <= elapsed + stage.minutes) { value = stage.speed; break; } elapsed += stage.minutes; }
    for (const edge of boundaries) {
      if (minute >= edge.at - transition && minute <= edge.at + transition) {
        const raw = (minute - edge.at + transition) / (transition * 2);
        const eased = raw * raw * (3 - 2 * raw);
        value = edge.from + (edge.to - edge.from) * eased;
      }
    }
    return value;
  };
  return Array.from({ length: count }, (_, index) => ({ minute: total * index / (count - 1), speed: speedAt(total * index / (count - 1)) }));
}

function paintSpeedCurve(context: CanvasRenderingContext2D, plan: Plan, x: number, y: number, width: number, height: number, lineWidth: number) {
  const samples = speedSamples(plan);
  const speeds = plan.stages.map((stage) => stage.speed);
  const min = Math.min(...speeds) - Math.max(.8, (Math.max(...speeds) - Math.min(...speeds)) * .18);
  const max = Math.max(...speeds) + Math.max(.8, (Math.max(...speeds) - Math.min(...speeds)) * .18);
  const point = (sample: { minute: number; speed: number }) => ({ x: x + sample.minute / Math.max(1, plan.minutes) * width, y: y + height - (sample.speed - min) / Math.max(.1, max - min) * height });
  const gradient = context.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, "rgba(49,194,124,.24)"); gradient.addColorStop(1, "rgba(49,194,124,0)");
  context.beginPath(); samples.forEach((sample, index) => { const p = point(sample); index ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y); });
  const last = point(samples.at(-1)!); const first = point(samples[0]); context.lineTo(last.x, y + height); context.lineTo(first.x, y + height); context.closePath(); context.fillStyle = gradient; context.fill();
  context.beginPath(); samples.forEach((sample, index) => { const p = point(sample); index ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y); });
  context.strokeStyle = "#08bd73"; context.lineWidth = lineWidth; context.lineCap = "round"; context.lineJoin = "round"; context.stroke();
}

function SpeedCurve({ plan }: { plan: Plan }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; const context = canvas?.getContext("2d"); if (!canvas || !context) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1); const width = canvas.clientWidth; const height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height);
    paintSpeedCurve(context, plan, 3, 8, width - 6, height - 19, 3.2);
  }, [plan]);
  return <canvas ref={ref} className="share-speed-curve" aria-label="根据训练阶段绘制的速度曲线" />;
}

const loadCanvasImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source;
});

async function renderShareCard(plan: Plan) {
  const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1440;
  const context = canvas.getContext("2d"); if (!context) throw new Error("canvas unavailable");
  const font = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  context.fillStyle = "#f4f7fa"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#08bd73"; context.beginPath(); context.arc(107, 99, 35, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#fff"; context.font = `700 48px ${font}`; context.fillText("♪", 90, 116);
  context.fillStyle = "#111315"; context.font = `800 42px ${font}`; context.fillText("PaceMix · QQ音乐", 158, 113);
  context.textAlign = "right"; context.fillStyle = "#858a90"; context.font = `650 30px ${font}`; context.fillText(shareDate(), 1000, 108); context.textAlign = "left";
  context.fillStyle = "#101214"; context.font = `900 224px ${font}`; context.fillText(`${plan.minutes}:00`, 74, 398);
  context.font = `900 84px ${font}`; context.fillText(`${plan.activity === "跑步" ? "节奏跑" : plan.activity}完成`, 78, 515);
  paintSpeedCurve(context, plan, 40, 570, 1000, 170, 10);
  let elapsed = 0; context.textAlign = "center"; context.font = `700 28px ${font}`;
  plan.stages.forEach((stage) => { const middle = elapsed + stage.minutes / 2; context.fillStyle = stage.speed === Math.max(...plan.stages.map((item) => item.speed)) ? "#079c61" : "#5d6268"; context.fillText(`${stage.name} ${stage.minutes}′`, 40 + middle / plan.minutes * 1000, 800); elapsed += stage.minutes; });
  const stats = [[`${averageSpm(plan)}`, "SPM", "平均步频"], [`${Math.max(...plan.stages.map((stage) => stage.speed))}`, "km/h", "最高速度"], [`${plan.schedule.length}`, "首", "节奏歌曲"]];
  stats.forEach(([value, unit, label], index) => { const x = 82 + index * 335; context.textAlign = "left"; context.fillStyle = "#06ae6a"; context.font = `900 94px ${font}`; context.fillText(value, x, 925); const width = context.measureText(value).width; context.font = `800 31px ${font}`; context.fillText(unit, x + width + 7, 921); context.fillStyle = "#555b62"; context.font = `650 30px ${font}`; context.fillText(label, x, 972); if (index < 2) { context.fillStyle = "rgba(22,28,34,.1)"; context.fillRect(x + 307, 838, 1, 142); } });
  let barX = 72; const barWidth = 936; plan.stages.forEach((stage, index) => { const width = stage.minutes / plan.minutes * barWidth; context.fillStyle = index === 1 || plan.stages.length === 1 ? "#18c77d" : "#b9ead3"; context.beginPath(); context.roundRect(barX, 1026, Math.max(8, width - 7), 22, 11); context.fill(); barX += width; });
  elapsed = 0; context.textAlign = "center"; context.font = `700 27px ${font}`; plan.stages.forEach((stage) => { const middle = elapsed + stage.minutes / 2; context.fillStyle = stage.speed === Math.max(...plan.stages.map((item) => item.speed)) ? "#078f59" : "#62676d"; context.fillText(`${stage.name} ${stage.minutes}′`, 72 + middle / plan.minutes * barWidth, 1100); elapsed += stage.minutes; });
  const covers = shareCovers(plan); const coverImages = await Promise.all(covers.map((song) => loadCanvasImage(song.cover).catch(() => null)));
  coverImages.forEach((image, index) => { const x = 72 + index * 175; const y = 1161; const size = 158; context.save(); context.beginPath(); context.roundRect(x, y, size, size, 13); context.clip(); if (image) { const scale = Math.max(size / image.width, size / image.height); const sw = size / scale; const sh = size / scale; context.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, size, size); } else { const fallback = context.createLinearGradient(x, y, x + size, y + size); fallback.addColorStop(0, "#d8f3e7"); fallback.addColorStop(1, "#75d9aa"); context.fillStyle = fallback; context.fillRect(x, y, size, size); context.fillStyle = "rgba(255,255,255,.9)"; context.font = `700 62px ${font}`; context.textAlign = "center"; context.fillText("♪", x + size / 2, y + 101); } context.restore(); });
  context.fillStyle = "rgba(22,28,34,.1)"; context.fillRect(606, 1161, 1, 158);
  try { const calligraphy = await loadCanvasImage("/ui/pacemix-calligraphy.png"); context.drawImage(calligraphy, 625, 1154, 390, 195); } catch { context.fillStyle = "#08b870"; context.font = `700 48px ${font}`; context.fillText("音乐跟上每一步", 650, 1260); }
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("export failed")), "image/png", 1));
}

async function understandRequest(text: string, draft: TrainingDraft) {
  const rules = parseRequest(text);
  const endpoint = import.meta.env.VITE_PACEMIX_NLU_ENDPOINT;
  if (!endpoint) return mergeDraft(draft, rules);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ text, draft }),
    });
    if (!response.ok) return mergeDraft(draft, rules);
    const payload = await response.json() as { intent?: unknown; data?: unknown };
    return mergeDraft(draft, normalizeIntentPayload(payload.intent ?? payload.data, text));
  } catch { return mergeDraft(draft, rules); }
  finally { window.clearTimeout(timeout); }
}

function ParticleField({ variant = "orb", className = "" }: { variant?: "orb" | "listen" | "ambient" | "rings" | "badge"; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const context = canvas.getContext("2d"); if (!context) return;
    let frame = 0; let raf = 0;
    const particles = Array.from({ length: variant === "ambient" ? 54 : variant === "badge" ? 64 : 180 }, (_, i) => ({
      a: i * 2.3999632297,
      z: 1 - 2 * (i + .5) / (variant === "badge" ? 64 : 180),
      size: .75 + (i % 5) * .1,
      alpha: .35 + (i % 7) * .07,
      drift: (i % 9) * .13,
    }));
    const resize = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      // Drawing coordinates must use layout pixels, not the scaled phone preview bounds.
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio)); canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const drawDot = (x: number, y: number, radius: number, alpha: number) => {
      context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${radius > 1.05 ? "127,224,178" : "49,194,124"},${alpha})`; context.fill();
    };
    const draw = () => {
      frame += .008; const width = canvas.clientWidth; const height = canvas.clientHeight; const cx = width / 2; const cy = height / 2;
      context.clearRect(0, 0, width, height);
      if (variant === "ambient") {
        particles.forEach((p, i) => drawDot((i * 71 % Math.max(width, 1)) + Math.sin(frame + p.a) * 8, (i * 97 % Math.max(height, 1)) + Math.cos(frame * .7 + p.a) * 6, p.size, .12 + .12 * Math.sin(frame * 2 + p.drift)));
      } else if (variant === "badge") {
        particles.forEach((p, i) => { const a = p.a + frame * (i % 2 ? .8 : -.55); const r = 43 + Math.sin(frame * 2 + p.drift) * 2; drawDot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, p.size, p.alpha); });
      } else if (variant === "listen") {
        particles.slice(0, 112).forEach((p, i) => { const a = p.a + frame * (i % 3 ? .5 : -.35); const r = 82 + Math.sin(frame * 3 + p.drift) * 5; drawDot(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .96, p.size, p.alpha); });
      } else if (variant === "rings") {
        [58, 82, 108].forEach((radius, ring) => particles.slice(ring * 48, ring * 48 + 48).forEach((p, i) => { const a = p.a + frame * (.65 - ring * .18); drawDot(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, p.size, (.66 - ring * .18) * (.65 + .3 * Math.sin(frame * 2 + i))); }));
      } else {
        const radius = Math.min(width, height) * .245;
        particles.forEach((p) => {
          const a = p.a + frame * .55; const rr = Math.sqrt(1 - p.z * p.z) * radius; const depth = Math.sin(a) * Math.sqrt(1 - p.z * p.z);
          drawDot(cx + Math.cos(a) * rr, cy + p.z * radius, p.size * (.86 + (depth + 1) * .12), p.alpha * (.54 + (depth + 1) * .22));
        });
        [radius * 1.24, radius * 1.52, radius * 1.8].forEach((r, ring) => particles.slice(ring * 36, ring * 36 + 36).forEach((p, i) => { const a = p.a + frame * (.45 - ring * .12); drawDot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, .8, (.34 - ring * .08) * (.6 + .4 * Math.sin(frame * 2 + i))); }));
      }
      raf = window.requestAnimationFrame(draw);
    };
    resize(); window.addEventListener("resize", resize); draw();
    return () => { window.cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [variant]);
  return <canvas ref={ref} className={`particle-field ${className}`} aria-hidden="true" />;
}

function FlowingVoiceParticles({ listening }: { listening: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const size = 310;
    canvas.width = size * ratio; canvas.height = size * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const time = reduced.matches ? 0 : (now - start) / 1000 * (listening ? 1.35 : 1);
      context.clearRect(0, 0, size, size);
      // Six staggered wave fronts; each dot travels along its own curved trajectory.
      for (let layer = 0; layer < 6; layer++) {
        const progress = (time / 5.8 + layer / 6) % 1;
        const envelope = Math.sin(progress * Math.PI);
        for (let dot = 0; dot < 304; dot++) {
          const seed = dot * 2.399963 + layer * .71;
          const angle = dot / 304 * Math.PI * 2 + layer * .13 + time * .035 + Math.sin(seed + time * .4) * .015;
          const wave = Math.sin(angle * 3 - time * 1.25 + layer * .46) * 3.5 + Math.sin(angle * 5 + time * .7) * 1.5;
          const radius = 97 + progress * 46 + wave + Math.sin(seed) * 2.5;
          const alpha = envelope * (.3 + (dot % 7) * .045) * (1 - progress * .35);
          context.beginPath();
          context.arc(155 + Math.cos(angle) * radius, 155 + Math.sin(angle) * radius, .65 + (dot % 4) * .18, 0, Math.PI * 2);
          context.fillStyle = `rgba(49,194,124,${alpha})`; context.fill();
        }
      }
      if (!reduced.matches) raf = requestAnimationFrame(draw);
    };
    draw(start);
    return () => cancelAnimationFrame(raf);
  }, [listening]);
  return <canvas ref={ref} className="voice-flow-particles" aria-hidden="true" />;
}

// Keep the previous voice core available via ?voiceCore=classic for visual comparison.
function DiffuseVoiceCore({ listening }: { listening: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = 310 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const start = performance.now(); let frame = 0;
    const draw = (now: number) => {
      const t = reduced.matches ? 0 : (now - start) / 1000 * (listening ? 1.35 : 1);
      ctx.clearRect(0, 0, 310, 310);
      const x = 155 + Math.sin(t * .5) * 3, y = 155 + Math.cos(t * .4) * 2;
      const gradient = ctx.createRadialGradient(x - 12, y - 16, 3, x, y, 103);
      gradient.addColorStop(0, "rgba(137,231,174,.98)");
      gradient.addColorStop(.38, "rgba(54,193,128,.98)");
      gradient.addColorStop(.52, "rgba(66,197,139,.9)");
      gradient.addColorStop(.75, "rgba(110,217,169,.3)");
      gradient.addColorStop(1, "rgba(151,231,187,0)");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 310, 310);
      // Inner particles follow the same staggered curved waves as the original.
      for (let layer = 0; layer < 10; layer++) {
        const progress = (t / 5.8 + layer / 10) % 1;
        const envelope = Math.sin(progress * Math.PI);
        const count = Math.round(300 - progress * 155);
        for (let dot = 0; dot < count; dot++) {
          const seed = dot * 2.399963 + layer * .71;
          const a = dot / count * Math.PI * 2 + layer * .13 + t * .035 + Math.sin(seed + t * .4) * .015;
          const wave = Math.sin(a * 3 - t * 1.25 + layer * .46) * 3.5 + Math.sin(a * 5 + t * .7) * 1.5;
          const r = 42 + progress * 63 + wave + Math.sin(seed) * 2.5;
          const opacity = envelope * (.48 + (dot % 7) * .035) * (1 - progress * .48);
          ctx.beginPath(); ctx.arc(155 + Math.cos(a) * r, 155 + Math.sin(a) * r, .75 + (dot % 4) * .18, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(49,194,124,${opacity})`; ctx.fill();
        }
      }
      if (!reduced.matches) frame = requestAnimationFrame(draw);
    };
    draw(start); return () => cancelAnimationFrame(frame);
  }, [listening]);
  return <><canvas ref={ref} className="voice-flow-particles" aria-hidden="true" /><FlowingVoiceParticles listening={listening} /><svg className="diffuse-core-mic" viewBox="0 0 140 100" fill="none" aria-hidden="true"><rect x="59" y="14" width="22" height="43" rx="11" fill="white" /><path d="M48 45v5a22 22 0 0 0 44 0v-5M70 72v13M62 85h16" stroke="white" strokeWidth="4" strokeLinecap="round" /><path d="M16 42v15M26 33v32M36 43v13M104 43v13M114 33v32M124 42v15" stroke="white" strokeWidth="4" strokeLinecap="round" /></svg></>;
}

function MarqueeBackdrop({ subdued = false }: { subdued?: boolean }) {
  const rows = Array.from({ length: 7 }, (_, i) => i);
  return <div className={`marquee-backdrop ${subdued ? "subdued" : ""}`} aria-hidden="true">
    {rows.map((row) => <div className="marquee-line" key={row}><span>说出你的今日训练计划</span><span className={row === 3 ? "green" : ""}>说出你的今日训练计划</span><span>说出你的今日训练计划</span></div>)}
  </div>;
}

function AppHeader({ title, eyebrow, action, onAction }: { title: string; eyebrow?: string; action?: React.ReactNode; onAction?: () => void }) {
  return <header className="app-header"><div><span>{eyebrow}</span><h1>{title}</h1></div>{action && <button aria-label="页面操作" onClick={onAction}>{action}</button>}</header>;
}

function StageTrack({ plan, labels = true }: { plan: Plan; labels?: boolean }) {
  return <div className="stage-track-wrap"><div className="stage-track">{plan.stages.map((stage, index) => <i key={`${stage.name}-${index}`} style={{ flex: stage.minutes }} />)}</div>{labels && <div className="stage-track-labels">{plan.stages.map((stage, index) => <span key={`${stage.name}-${index}`} style={{ flex: stage.minutes }}><b>{stage.minutes}′</b>{stage.speed} km/h</span>)}</div>}</div>;
}

function ArrangePage({ plan, onPlan, onChat, onShuffle }: { plan: Plan; onPlan: () => void; onChat: () => void; onShuffle: () => void }) {
  return <div className="standard-screen"><MobileScroll className="standard-scroll"><main className="page-content arrange-page">
    <AppHeader title="今日训练" eyebrow="跟着节拍，跑对速度" action={<PlusIcon />} onAction={onChat} />
    <section className="hero-plan-card" onClick={onPlan}>
      <ParticleField variant="ambient" />
      <div className="hero-kicker"><span>今日推荐</span><b>{plan.level}</b></div>
      <h2>{plan.title}</h2><p>{plan.activity} · {plan.minutes} 分钟 · {languageLabel(plan.musicLanguage)}</p>
      <StageTrack plan={plan} />
      <div className="cover-stack">{plan.songs.slice(0, 3).map((song) => <img key={song.id} src={song.cover} alt="" />)}<span>{plan.songs.length} 首</span></div>
      <button className="green-button">查看方案 <ChevronRightIcon /></button>
    </section>
    <section className="quick-adjust"><div className="section-title"><div><span>QUICK ADJUST</span><h3>一句话调整</h3></div><MagicWandIcon /></div><button onClick={onChat}>想轻松一点</button><button onClick={onChat}>全部英文歌</button></section>
    <section className="recent-section"><div className="section-title"><div><span>RECENT</span><h3>最近训练</h3></div><button onClick={onShuffle}><ReloadIcon /> 换一个</button></div><div className="history-mini"><i><CheckIcon /></i><div><b>跑步 · 30 分钟</b><span>昨天 · 已完成</span></div><strong>30′</strong></div></section>
  </main></MobileScroll></div>;
}

function RequirementSummary({ draft }: { draft: TrainingDraft }) {
  const rows = [
    ["训练时长", draft.minutes ? `${draft.minutes} 分钟` : "待确认", !!draft.minutes],
    ["运动类型", draft.activity || "待确认", !!draft.activity],
    [draft.intensity === "custom" ? "训练配速" : "训练强度", draft.intensity === "custom" ? draft.customStages?.map((stage) => `${stage.minutes}′ ${stage.speed}km/h`).join(" · ") || "待确认" : intensityLabel(draft.intensity), !!draft.intensity],
    ["音乐语言", languageLabel(draft.language), true],
  ] as const;
  return <div className="requirement-summary">{rows.map(([label, value, done]) => <div className={done ? "done" : "missing"} key={label}><span>{done ? <CheckIcon /> : "○"}</span><b>{label}</b><em>{value}</em></div>)}</div>;
}

function ChatPage({ plan, profile, onBack, onDone, onNavigate }: { plan: Plan; profile: CadenceProfile; onBack: () => void; onDone: (plan: Plan) => void; onNavigate: (screen: Screen) => void }) {
  const keyboard = useKeyboard(); const { bottomInset } = useKeyboardInsets();
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [phase, setPhase] = useState<ChatPhase>("input");
  const [value, setValue] = useState(""); const [lastInput, setLastInput] = useState("");
  const [draft, setDraft] = useState<TrainingDraft>(emptyDraft);
  const [question, setQuestion] = useState("把今天想怎么练告诉我，我来整理成明确的训练方案。");
  const recognition = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => () => recognition.current?.stop(), []);
  const switchMode = (next: "voice" | "text") => { recognition.current?.stop(); setMode(next); if (phase === "listening") setPhase("input"); if (next === "voice") keyboard.hide(); };
  const submit = async (preset?: string) => {
    const text = (preset ?? value).trim(); if (!text) return;
    setLastInput(text); setValue(""); keyboard.hide(); setPhase("analyzing");
    const next = await understandRequest(text, draft); setDraft(next);
    const conflict = detectPlanConflicts(next)[0];
    if (conflict) { setQuestion(conflict.message); setPhase("conflict"); return; }
    setQuestion(questionFor(next)); setPhase(nextMissing(next) ? "clarify" : "ready");
  };
  const startVoice = async () => {
    if (phase === "listening") { recognition.current?.stop(); setPhase("input"); if (value.trim()) void submit(value); return; }
    try {
      const voiceWindow = window as typeof window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
      const Recognition = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
      if (!Recognition) { setQuestion("当前环境不支持语音识别，打字也一样好使。"); setPhase("error"); return; }
      await navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => stream.getTracks().forEach((track) => track.stop()));
      const instance = new Recognition(); instance.lang = "zh-CN"; instance.continuous = true; instance.interimResults = true;
      instance.onresult = (event: any) => { let text = ""; for (let i = 0; i < event.results.length; i += 1) text += event.results[i][0].transcript; setValue(text); };
      instance.onerror = () => { setQuestion("没有听清，原来的条件都还保留着。可以再说一次或改用打字。"); setPhase("error"); };
      instance.onend = () => setPhase((current) => current === "listening" ? "input" : current);
      recognition.current = instance; setPhase("listening"); instance.start();
    } catch { setQuestion("麦克风没有开启。可以授权后重试，或者直接打字告诉我。"); setPhase("error"); }
  };
  const answer = (text: string) => { void submit(text); };
  const resolveConflict = (kind: "sum" | "extend") => {
    if (!draft.customStages?.length) return;
    const sum = draft.customStages.reduce((total, stage) => total + stage.minutes, 0); const remaining = draft.minutes - sum;
    const stages = kind === "extend" && remaining > 0 ? draft.customStages.map((stage, i) => i === draft.customStages!.length - 1 ? { ...stage, minutes: stage.minutes + remaining } : stage) : draft.customStages;
    const next = { ...draft, minutes: kind === "sum" ? sum : draft.minutes, customStages: stages };
    setDraft(next); setQuestion(questionFor(next)); setPhase("ready");
  };
  const generate = () => {
    setPhase("generating"); setQuestion("正在生成速度阶段、匹配步频并校准时间轴");
    window.setTimeout(() => { const result = buildPlan(draft, Date.now() % 97, profile); if (!result.ok) { setQuestion(result.error.message); setPhase("error"); return; } onDone(result.plan); }, 1450);
  };
  const missing = nextMissing(draft);
  const isConversation = !["input", "listening"].includes(phase);
  const recommendations = useMemo(() => [
    { title: "轻松起跑", minutes: 20, activity: "跑步" as const, intensity: "easy" as const, caption: "给今天一个轻快的开始" },
    { title: "坡上漫步", minutes: 30, activity: "跑步机爬坡" as const, intensity: "easy" as const, caption: "稳稳走，跟着节拍上坡" },
    { title: "稳定巡航", minutes: 40, activity: "跑步" as const, intensity: "medium" as const, caption: "让音乐陪你保持节奏" },
  ].map((item, index) => ({ ...item, result: buildPlan({ minutes: item.minutes, activity: item.activity, intensity: item.intensity, language: "mixed" }, index + 12, profile) })), [profile]);
  return <div className={`chat-page phase-${phase} mode-${mode}`}>
    <ParticleField variant="ambient" />
    <header className="qq-feature-header"><button aria-label="返回 QQ 音乐" onClick={() => { recognition.current?.stop(); keyboard.hide(); onBack(); }}><ArrowLeftIcon /></button><b>运动音乐</b><button aria-label="更多运动音乐功能" onClick={() => onNavigate("mine")}><DotsHorizontalIcon /></button></header>
    <AnimatePresence mode="wait">
      {!isConversation ? <MobileScroll className={`creator-scroll ${mode}`} key={`${mode}-${phase}`}><motion.main className="input-stage" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}>
        <header className="creator-heading"><h1>今天想怎么练？</h1><p>时长、速度和音乐偏好</p></header>
        {mode === "voice" ? <>
          <div className="voice-input-cluster"><button className={`voice-orb ${phase === "listening" ? "listening" : ""}`} onClick={startVoice} aria-label={phase === "listening" ? "结束表达" : "开始语音输入"}><span className="voice-orb-visual" aria-hidden="true">{new URLSearchParams(window.location.search).get("voiceCore") !== "experimental" ? <><img className="voice-orb-art" src="/ui/pacemix-clean-core.png" alt="" /><FlowingVoiceParticles listening={phase === "listening"} /></> : <DiffuseVoiceCore listening={phase === "listening"} />}</span></button><button className="inline-input-switch keyboard" aria-label="切换到打字输入" onClick={() => switchMode("text")}><KeyboardIcon /></button></div>
          <p className="input-hint">{phase === "listening" ? "正在聆听，再次点击结束" : "点击说话"}</p>
          {phase === "listening" && <div className="voice-transcript live">{value || "说出你的训练计划…"}<span className="transcript-bars"><i /><i /><i /><i /><i /></span></div>}
        </> : <>
          <div className="text-input-cluster"><div className="particle-input"><KeyboardTextarea autoFocus value={value} onClick={(event) => keyboard.show(event.currentTarget)} onChange={(event) => setValue(event.target.value)} onBlur={() => keyboard.hide()} placeholder="输入你的今日训练计划" /><button aria-label="发送" onClick={() => void submit()}><ChevronRightIcon /></button></div><button className="inline-input-switch microphone" aria-label="切换到语音输入" onClick={() => switchMode("voice")}><span /></button></div>
        </>}
        {mode === "voice" && <section className="creator-discovery"><button className="creator-recent" onClick={() => onNavigate("plan")}><span>上次训练</span><div><b>{plan.minutes}′</b><em>总时长</em></div><div className="recent-speed"><b>{plan.stages.map((stage) => stage.speed).join(" → ")} <small>km/h</small></b><em>速度安排</em></div><div className="recent-covers">{plan.songs.slice(0, 3).map((song) => <img key={song.id} src={song.cover} alt={song.title} />)}</div><ChevronRightIcon /></button>
          <div className="discovery-heading"><h2>跟着音乐，开始训练</h2><p>选一份计划，听听今天的节奏</p></div>
          <Carousel ariaLabel="推荐训练与歌单" className="training-recommendations">{recommendations.map((item) => { const next = item.result.ok ? item.result.plan : null; return <button className="training-recommendation" key={item.title} disabled={!next} onClick={() => { if (next) { keyboard.hide(); onDone(next); } }}><div className="recommendation-art">{next?.songs.slice(0, 4).map((song, i) => <img key={`${song.id}-${i}`} src={song.cover} alt="" />)}<span>{item.minutes} MIN</span></div><b>{item.title}</b><small>{item.activity} · {item.minutes} 分钟</small><p>{item.caption}</p><span className="recommendation-link">查看训练与歌单 <ChevronRightIcon /></span></button>; })}</Carousel>
        </section>}
      </motion.main></MobileScroll> : <motion.main className="dialog-stage" key={phase} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className={`mini-orb ${phase === "analyzing" || phase === "generating" ? "processing" : ""}`}><ParticleField variant={phase === "analyzing" || phase === "generating" ? "listen" : "orb"} /></div>
        {lastInput && <blockquote>“{lastInput}”</blockquote>}
        <section className="ai-dialog-card"><span className="ai-label">训练需求</span><h2>{question}</h2><RequirementSummary draft={draft} /></section>
        {phase === "analyzing" && <div className="processing-copy"><i /><span>正在整理训练条件</span></div>}
        {phase === "clarify" && <div className="answer-grid">
          {missing === "minutes" && [20, 30, 40, 45].map((n) => <button key={n} onClick={() => answer(`${n} 分钟`)}>{n} 分钟</button>)}
          {missing === "activity" && ["跑步", "跑步机快走", "跑步机爬坡"].map((item) => <button key={item} onClick={() => answer(item)}>{item}</button>)}
          {missing === "intensity" && [["轻松", "轻松"], ["中等", "中等"], ["挑战", "挑战"], ["帮我安排", "AI 安排"]].map(([label, command]) => <button key={label} className={label === "帮我安排" ? "featured" : ""} onClick={() => answer(command)}>{label}</button>)}
        </div>}
        {phase === "conflict" && <div className="answer-grid conflict-grid"><button onClick={() => resolveConflict("sum")}>以分段合计为准</button><button onClick={() => resolveConflict("extend")}>剩余时间沿用最后配速</button></div>}
        {phase === "ready" && <div className="ready-actions"><button className="green-button" onClick={generate}>生成我的训练 <ChevronRightIcon /></button><button onClick={() => { setPhase("input"); setMode("text"); }}>继续补充</button></div>}
        {phase === "generating" && <div className="generation-list"><span className="done"><CheckIcon />计算速度阶段</span><span><i />匹配目标 SPM</span><span><i />校准严格时间轴</span></div>}
        {phase === "error" && <div className="ready-actions"><button className="green-button" onClick={() => { setPhase("input"); setMode("voice"); }}>再试一次</button><button onClick={() => { setPhase("input"); setMode("text"); }}>打字告诉我</button></div>}
      </motion.main>}
    </AnimatePresence>
    {isConversation && !["analyzing", "generating"].includes(phase) && <div className="followup-composer" style={{ bottom: Math.max(18, bottomInset + 10) }}><KeyboardTextarea value={value} onClick={(event) => keyboard.show(event.currentTarget)} onChange={(event) => setValue(event.target.value)} onBlur={() => keyboard.hide()} placeholder="继续补充或修改…" /><button aria-label="发送补充" onClick={() => void submit()}><ChevronRightIcon /></button></div>}
    {!isConversation && <button className="qq-mini-player" onClick={() => onNavigate("plan")} aria-label="打开当前播放"><img src={plan.songs[0]?.cover} alt="" /><span><b>{plan.songs[0]?.title || "训练歌单"}</b><small>{plan.songs[0]?.artist || "PaceMix"}</small></span><PlayIcon /><TrackNextIcon /></button>}
  </div>;
}

function PlanPage({ plan, onStart, onChat, onCadenceChange, onNavigate }: { plan: Plan; onStart: () => void; onChat: () => void; onCadenceChange: (profile: CadenceProfile) => void; onNavigate: (screen: Screen) => void }) {
  const preview = useRef<HTMLAudioElement | null>(null); const timer = useRef<number | null>(null); const [previewStage, setPreviewStage] = useState<number | null>(null);
  const stop = () => { preview.current?.pause(); preview.current = null; if (timer.current) window.clearTimeout(timer.current); timer.current = null; setPreviewStage(null); };
  useEffect(() => () => { preview.current?.pause(); if (timer.current) window.clearTimeout(timer.current); }, []);
  const togglePreview = (stageIndex: number) => {
    if (previewStage === stageIndex) { stop(); return; } stop(); const item = plan.schedule.find((track) => track.stageIndex === stageIndex); if (!item) return;
    const audio = new Audio(item.song.file); audio.volume = .55; audio.playbackRate = item.playbackRate; audio.currentTime = item.song.firstBeatOffsetSeconds || 0; preview.current = audio; setPreviewStage(stageIndex);
    void audio.play().catch(stop); timer.current = window.setTimeout(stop, 10_000);
  };
  return <div className="standard-screen plan-screen"><MobileScroll className="standard-scroll"><main className="page-content plan-page">
    <AppHeader title="本次训练" eyebrow={`${plan.activity} · ${plan.minutes} 分钟`} action={<MagicWandIcon />} onAction={onChat} />
    <div className="condition-strip"><span>{plan.minutes} 分钟</span><span>{intensityLabel(plan.intensity)}</span><span className="green">{languageLabel(plan.musicLanguage)}</span></div>
    <section className="plan-heading"><div><b>{plan.minutes}</b><span>分钟</span></div><h2>{plan.title}</h2><p>速度处方已按你的目标步频排好</p></section>
    <StageTrack plan={plan} />
    <section className="stage-cards">{plan.stages.map((stage, index) => <article key={stage.name} className={index === 1 ? "main-stage" : ""}><span>{stage.name}</span><strong>{stage.speed}<small>km/h</small></strong><p>{stage.minutes} 分钟</p><b>{stage.targetSpm} SPM</b><button onClick={() => togglePreview(index)}>{previewStage === index ? <PauseIcon /> : <PlayIcon />}{previewStage === index ? "停止" : "试听"}</button></article>)}</section>
    <section className="calibration-card"><div><span>简单步频校准</span><small>按你的自然步幅重排 SPM 与歌曲</small></div><div>{([["short", "步幅偏小"], ["standard", "标准"], ["long", "步幅偏大"]] as const).map(([id, label]) => <button key={id} className={plan.cadenceProfile === id ? "active" : ""} onClick={() => { stop(); onCadenceChange(id); }}>{label}</button>)}</div></section>
    <section className="music-section"><div className="section-title"><div><span>MUSIC ROUTE</span><h3>节奏歌单</h3></div><b>{plan.schedule.length} 段</b></div>{plan.notices.map((notice) => <p className="notice" key={notice}>{notice}</p>)}
      <div className="song-list">{plan.schedule.map((item, index) => <div className="song-row" key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><img src={item.song.cover} alt="" /><div><b>{item.song.title}</b><small>{item.song.artist}</small><em>{item.song.bpm} → {item.adjustedMusicBpm} BPM · {item.playbackRate.toFixed(2)}×{item.clipped ? " · 渐弱切段" : ""}</em></div><strong>{formatTime(item.playSeconds)}</strong></div>)}</div>
    </section><button className="text-action" onClick={onChat}>用一句话修改方案</button>
  </main></MobileScroll><div className="plan-footer"><div><small>{plan.minutes} 分钟</small><b>首段 {plan.stages[0].speed} km/h</b></div><button className="green-button" onClick={() => { stop(); onStart(); }}><PlayIcon />开始训练</button></div></div>;
}

function SessionPage({ plan, onExit, onComplete }: { plan: Plan; onExit: () => void; onComplete: () => void }) {
  const audio = useRef<HTMLAudioElement>(null); const cue = useRef<AudioContext | null>(null); const clock = useRef({ anchor: 0, started: 0 }); const lastCount = useRef<number | null>(null); const previousStage = useRef(0);
  const [playing, setPlaying] = useState(false); const [elapsed, setElapsed] = useState(0); const [index, setIndex] = useState(0); const [confirmEnd, setConfirmEnd] = useState(false); const [showZero, setShowZero] = useState(false);
  const current = plan.schedule[index]; const stage = plan.stages[current.stageIndex]; const stageEnd = plan.schedule.filter((item) => item.stageIndex === current.stageIndex).at(-1)?.endsAt ?? current.endsAt;
  const remaining = Math.max(0, stageEnd - elapsed); const total = plan.minutes * 60; const nextStage = plan.stages[current.stageIndex + 1];
  const countdown = playing && nextStage && remaining > 0 && remaining <= 5 ? Math.ceil(remaining) : null;
  const context = () => { const Ctx = window.AudioContext || (window as any).webkitAudioContext; if (!Ctx) return null; cue.current ||= new Ctx(); if (cue.current.state === "suspended") void cue.current.resume(); return cue.current; };
  const beep = (zero = false) => { const ctx = context(); if (!ctx) return; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = "sine"; osc.frequency.value = zero ? 880 : 700; gain.gain.setValueAtTime(.5, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .16); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .17); };
  useEffect(() => {
    const el = audio.current; if (!el) return; const begin = () => { el.currentTime = current.song.firstBeatOffsetSeconds || 0; if (playing) void el.play().catch(() => setPlaying(false)); };
    el.pause(); el.src = current.song.file; el.playbackRate = current.playbackRate; el.volume = .55; el.load(); el.addEventListener("canplay", begin, { once: true }); if (el.readyState >= 3) begin(); return () => el.removeEventListener("canplay", begin);
  }, [index, current.song.file, current.playbackRate]);
  useEffect(() => { if (!playing) return; const timer = window.setInterval(() => { const next = Math.min(total, clock.current.anchor + (performance.now() - clock.current.started) / 1000); setElapsed(next); setIndex(currentScheduleIndex(plan.schedule, next)); if (next >= total) { audio.current?.pause(); setPlaying(false); onComplete(); } }, 250); return () => window.clearInterval(timer); }, [playing, total, plan, onComplete]);
  useEffect(() => { if (countdown !== null && countdown !== lastCount.current) { lastCount.current = countdown; beep(); } if (countdown === null) lastCount.current = null; }, [countdown]);
  useEffect(() => { if (current.stageIndex !== previousStage.current) { previousStage.current = current.stageIndex; setShowZero(true); beep(true); const timer = window.setTimeout(() => setShowZero(false), 650); return () => window.clearTimeout(timer); } }, [current.stageIndex]);
  useEffect(() => { const el = audio.current; if (!el) return; const trackRemaining = current.endsAt - elapsed; const base = countdown ? .26 : .55; el.volume = current.clipped && trackRemaining <= 4 ? Math.max(0, base * trackRemaining / 4) : base; }, [elapsed, current, countdown]);
  const toggle = () => { const el = audio.current; if (!el) return; if (playing) { clock.current.anchor = elapsed; el.pause(); setPlaying(false); return; } context(); clock.current = { anchor: elapsed, started: performance.now() }; void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); };
  const skip = () => { const next = Math.min(stageEnd - .01, current.endsAt); clock.current = { anchor: next, started: performance.now() }; setElapsed(next); setIndex(currentScheduleIndex(plan.schedule, next)); };
  const stageProgress = 1 - remaining / (stage.minutes * 60); const totalProgress = elapsed / total;
  return <div className={`session-page ${playing ? "playing" : "paused"}`}>
    <ParticleField variant="ambient" /><header><button onClick={() => setConfirmEnd(true)}>结束</button><div><span>{stage.name}</span><b>{formatTime(remaining)}</b></div></header>
    <main><div className="tempo-orbit" style={{ "--stage-progress": `${stageProgress * 360}deg`, "--total-progress": `${totalProgress * 360}deg` } as React.CSSProperties}><ParticleField variant="rings" /><div className="speed-readout"><strong>{stage.speed}</strong><span>km/h</span><small>{stage.targetSpm} SPM</small></div></div>
      <p className="session-instruction">{playing ? `${stage.name} · 保持当前速度` : "已暂停 · 计时和音乐同步暂停"}</p>
      <section className="now-playing"><img src={current.song.cover} alt="" /><div><b>{current.song.title}</b><span>{current.song.artist}</span><small>{current.adjustedMusicBpm} BPM · {current.playbackRate.toFixed(2)}×</small></div></section>
      <div className="session-timeline"><i style={{ width: `${totalProgress * 100}%` }} /></div><div className="session-controls"><span>{formatTime(elapsed)} / {formatTime(total)}</span><button aria-label={playing ? "暂停" : "播放"} onClick={toggle}>{playing ? <PauseIcon /> : <PlayIcon />}</button><button aria-label="下一首" onClick={skip}><TrackNextIcon /></button></div>
    </main>
    {(countdown !== null || showZero) && <div className="countdown-overlay"><span>{showZero ? 0 : countdown}</span><small>{showZero ? `${stage.name} 开始` : `即将进入 ${nextStage?.speed} km/h`}</small></div>}
    <audio ref={audio} preload="auto" />
    <BottomSheet open={confirmEnd} onOpenChange={setConfirmEnd} title="结束本次训练？" description={`已完成 ${formatTime(elapsed)}，结束后本次时间会保存在本地。`} snap={.35}><div className="sheet-actions"><button onClick={() => setConfirmEnd(false)}>继续训练</button><button onClick={() => { audio.current?.pause(); setPlaying(false); setConfirmEnd(false); onExit(); }}>结束训练</button></div></BottomSheet>
  </div>;
}

function MinePage({ plan, onPlan, onChat }: { plan: Plan; onPlan: () => void; onChat: () => void }) {
  return <div className="standard-screen"><MobileScroll className="standard-scroll"><main className="page-content mine-page"><AppHeader title="我的训练" eyebrow="仅保存在此设备" />
    <section className="stats-row"><div><b>03</b><span>完成次数</span></div><div><b>92</b><span>累计分钟</span></div><div><b>{plan.stages[1]?.targetSpm ?? 136}</b><span>常用 SPM</span></div></section>
    <section className="saved-card" onClick={onPlan}><span>最近创建</span><h2>{plan.title}</h2><p>{plan.activity} · {plan.minutes} 分钟 · {plan.schedule.length} 段音乐</p><StageTrack plan={plan} labels={false} /><button>查看方案 <ChevronRightIcon /></button></section>
    <section className="history-section"><div className="section-title"><div><span>LOCAL HISTORY</span><h3>训练记录</h3></div></div>{[["今天", plan.activity, `${plan.minutes} 分钟`, "已创建"], ["昨天", "跑步", "30 分钟", "已完成"], ["周一", "跑步机爬坡", "22 分钟", "18 分钟"]].map((row, index) => <article key={row[0]}><i className={index ? "complete" : "planned"}>{index ? <CheckIcon /> : <SpeakerLoudIcon />}</i><div><small>{row[0]}</small><b>{row[1]} · {row[2]}</b><StageTrack plan={plan} labels={false} /></div><span>{row[3]}</span></article>)}</section>
    <button className="green-button create-again" onClick={onChat}><PlusIcon />创建新的训练</button>
  </main></MobileScroll></div>;
}

function AchievementPage({ plan, onPlan, onAgain, onNavigate }: { plan: Plan; onPlan: () => void; onAgain: () => void; onNavigate: (screen: Screen) => void }) {
  const [toast, setToast] = useState(""); const [exporting, setExporting] = useState(false);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 1800); };
  const save = async () => {
    if (exporting) return; setExporting(true);
    try { const blob = await renderShareCard(plan); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `PaceMix-${shareDate().replaceAll(".", "-")}.png`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); notify("图片已保存到本地"); }
    catch { notify("图片生成失败，请重试"); } finally { setExporting(false); }
  };
  const share = async () => {
    if (exporting) return; setExporting(true);
    try {
      const blob = await renderShareCard(plan); const file = new File([blob], `PaceMix-${shareDate().replaceAll(".", "-")}.png`, { type: "image/png" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ files: [file], title: "PaceMix 训练成绩" });
      else { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = file.name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); notify("当前环境不支持分享，已保存图片"); }
    } catch (error) { if ((error as DOMException).name !== "AbortError") notify("分享没有完成，请重试"); } finally { setExporting(false); }
  };
  const covers = shareCovers(plan); const fastest = Math.max(...plan.stages.map((stage) => stage.speed));
  return <div className="achievement-page"><button className="close-button" aria-label="返回方案" onClick={onPlan}><Cross2Icon /></button><MobileScroll className="achievement-scroll"><main>
    <section className="share-poster" aria-label="训练成绩卡预览">
      <header><span className="share-logo"><i>♪</i><b>PaceMix · QQ音乐</b></span><time>{shareDate()}</time></header>
      <strong className="share-duration">{plan.minutes}:00</strong><h1>{plan.activity === "跑步" ? "节奏跑" : plan.activity}完成</h1>
      <div className="share-chart"><SpeedCurve plan={plan} /><div className="share-stage-labels">{plan.stages.map((stage) => <span className={stage.speed === fastest ? "active" : ""} style={{ flex: stage.minutes }} key={`${stage.name}-${stage.minutes}`}>{stage.name} {stage.minutes}′</span>)}</div></div>
      <div className="share-stats"><div><b>{averageSpm(plan)}<small>SPM</small></b><span>平均步频</span></div><div><b>{fastest}<small>km/h</small></b><span>最高速度</span></div><div><b>{plan.schedule.length}<small>首</small></b><span>节奏歌曲</span></div></div>
      <div className="share-stage-bar">{plan.stages.map((stage, index) => <i className={index === 1 || plan.stages.length === 1 ? "active" : ""} style={{ flex: stage.minutes }} key={`${stage.name}-bar`} />)}</div>
      <div className="share-stage-bar-labels">{plan.stages.map((stage) => <span className={stage.speed === fastest ? "active" : ""} style={{ flex: stage.minutes }} key={`${stage.name}-label`}>{stage.name} {stage.minutes}′</span>)}</div>
      <div className="share-footer"><div className="share-covers">{covers.map((song) => <span key={song.id}><img src={song.cover} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /></span>)}</div><img className="share-calligraphy" src="/ui/pacemix-calligraphy.png" alt="音乐跟上每一步" /></div>
    </section>
    <p className="share-note">图片只在点击保存时生成，不会存入应用</p>
    <div className="achievement-actions"><button disabled={exporting} onClick={() => void save()}><DownloadIcon />{exporting ? "生成中…" : "保存图片"}</button><button disabled={exporting} onClick={() => void share()}><Share1Icon />分享</button></div><button className="again-link" onClick={onAgain}>再来一次</button>
  </main></MobileScroll>{toast && <div className="toast">{toast}</div>}</div>;
}

function Splash() { return <div className="splash"><ParticleField variant="orb" /><motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><b>PaceMix</b><span>让音乐跟上你的节奏</span></motion.div></div>; }

export default function Prototype() {
  const keyboard = useKeyboard(); const [booting, setBooting] = useState(true); const [screen, setScreen] = useState<Screen>("chat"); const [seed, setSeed] = useState(1); const [profile, setProfile] = useState<CadenceProfile>(readCadence);
  const defaultPlan = (nextSeed: number, cadence = profile) => { const result = buildPlan({ minutes: 30, activity: "跑步机爬坡", language: "mixed", intensity: "ai" }, nextSeed, cadence); if (!result.ok) throw new Error(result.error.message); return result.plan; };
  const [plan, setPlan] = useState<Plan>(() => defaultPlan(1, readCadence()));
  useEffect(() => { const timer = window.setTimeout(() => setBooting(false), 900); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { try { const saved = localStorage.getItem("pacemix:v1:plan"); if (!saved) return; const parsed = JSON.parse(saved) as Plan; if (parsed.version === 1 && parsed.schedule?.length) setPlan(refreshCatalogAssets({ ...parsed, cadenceProfile: parsed.cadenceProfile || "standard", stages: parsed.stages.map((stage) => ({ ...stage, baseSpm: stage.baseSpm ?? stage.targetSpm })) })); } catch { /* optional */ } }, []);
  useEffect(() => { try { localStorage.setItem("pacemix:v1:plan", JSON.stringify(plan)); localStorage.setItem("pacemix:v1:cadence", profile); } catch { /* optional */ } }, [plan, profile]);
  const resetViewport = () => {
    window.scrollTo(0, 0);
    const deviceScreen = document.querySelector('[data-testid="device-screen"]');
    if (deviceScreen instanceof HTMLElement) deviceScreen.scrollTop = 0;
  };
  const nav = (next: Screen) => {
    keyboard.hide(); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); resetViewport(); setScreen(next);
    window.requestAnimationFrame(resetViewport); window.setTimeout(resetViewport, 320);
  };
  const navigateTab = (next: Screen) => { if (["arrange", "plan", "mine"].includes(next)) nav(next); };
  if (booting) return <Splash />;
  if (screen === "chat") return <ChatPage plan={plan} profile={profile} onBack={() => nav("arrange")} onDone={(next) => { setPlan(next); nav("plan"); }} onNavigate={navigateTab} />;
  if (screen === "session") return <SessionPage plan={plan} onExit={() => nav("achievement")} onComplete={() => nav("achievement")} />;
  if (screen === "achievement") return <AchievementPage plan={plan} onPlan={() => nav("plan")} onAgain={() => nav("session")} onNavigate={navigateTab} />;
  return <div className="app-shell"><AnimatePresence mode="wait"><motion.div className="screen-layer" key={screen} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: .25 }}>
    {screen === "arrange" && <ArrangePage plan={plan} onPlan={() => nav("plan")} onChat={() => nav("chat")} onShuffle={() => { const next = seed + 1; setSeed(next); setPlan(defaultPlan(next)); }} />}
    {screen === "plan" && <PlanPage plan={plan} onStart={() => nav("session")} onChat={() => nav("chat")} onCadenceChange={(cadence) => { setProfile(cadence); setPlan(retunePlanCadence(plan, cadence, seed)); }} onNavigate={navigateTab} />}
    {screen === "mine" && <MinePage plan={plan} onPlan={() => nav("plan")} onChat={() => nav("chat")} />}
  </motion.div></AnimatePresence></div>;
}
