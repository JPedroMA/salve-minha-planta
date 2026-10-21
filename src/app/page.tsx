"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { DiagnoseResponse, Lang, Severity, HealthStatus } from "@/lib/types";

type Phase = "idle" | "scanning" | "done" | "error";

const MAX_DIM = 1280;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

async function fileToResizedBase64(file: File): Promise<{ image: string; mimeType: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { image: dataUrl.split(",")[1], mimeType: "image/jpeg" };
}

const healthStyles: Record<HealthStatus, string> = {
  healthy: "bg-accent/10 text-accent border-accent/30",
  attention: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  critical: "bg-red-400/10 text-red-300 border-red-400/30",
};

const severityStyles: Record<Severity, string> = {
  low: "bg-accent/10 text-accent border-accent/30",
  medium: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  high: "bg-red-400/10 text-red-300 border-red-400/30",
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("pt");
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const [stats, setStats] = useState<{ analyses: number; issuesFound: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const d = t(lang);

  useEffect(() => {
    const saved = window.localStorage.getItem("smp-lang");
    if (saved === "en" || saved === "pt") setLang(saved);
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "scanning") return;
    setScanStep(0);
    const timer = setInterval(() => {
      setScanStep((s) => Math.min(s + 1, d.scanMessages.length - 1));
    }, 1400);
    return () => clearInterval(timer);
  }, [phase, d.scanMessages.length]);

  const switchLang = () => {
    const next: Lang = lang === "pt" ? "en" : "pt";
    setLang(next);
    window.localStorage.setItem("smp-lang", next);
  };

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      if (!ALLOWED.includes(file.type)) {
        setErrorMsg(d.error.invalid);
        setPhase("error");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      setPhase("idle");
      setResult(null);
    },
    [d.error.invalid],
  );

  const analyze = async () => {
    if (!preview) return;
    setPhase("scanning");
    setErrorMsg("");
    try {
      const file = await fetch(preview).then((r) => r.blob());
      const { image, mimeType } = await fileToResizedBase64(new File([file], "p.jpg", { type: file.type }));
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mimeType, symptoms, lang }),
      });
      if (res.status === 429) {
        setErrorMsg(d.error.rate);
        setPhase("error");
        return;
      }
      if (res.status === 400) {
        setErrorMsg(d.error.invalid);
        setPhase("error");
        return;
      }
      if (!res.ok) {
        setErrorMsg(d.error.generic);
        setPhase("error");
        return;
      }
      const data: DiagnoseResponse = await res.json();
      setResult(data);
      setPhase("done");
      setStats((s) =>
        s
          ? {
              analyses: s.analyses + 1,
              issuesFound: s.issuesFound + data.result.issues.length,
            }
          : s,
      );
    } catch {
      setErrorMsg(d.error.generic);
      setPhase("error");
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setSymptoms("");
    setPhase("idle");
    setErrorMsg("");
  };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-16">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">🌱</span>
          <span className="text-sm font-semibold tracking-tight">
            salve<span className="text-accent">·</span>minha<span className="text-accent">·</span>planta
          </span>
        </div>
        <button
          onClick={switchLang}
          className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-fog transition-colors hover:border-accent/40 hover:text-zinc-100"
        >
          {lang === "pt" ? "EN" : "PT-BR"}
        </button>
      </header>

      <main className="flex flex-1 flex-col">
        {phase === "done" && result ? (
          <ResultView
            d={d}
            preview={preview}
            data={result}
            onReset={reset}
          />
        ) : phase === "scanning" ? (
          <ScanningView d={d} preview={preview} step={scanStep} />
        ) : (
          <IdleView
            d={d}
            lang={lang}
            phase={phase}
            errorMsg={errorMsg}
            preview={preview}
            symptoms={symptoms}
            dragOver={dragOver}
            inputRef={inputRef}
            onPick={() => inputRef.current?.click()}
            onFile={handleFile}
            onSymptoms={setSymptoms}
            onAnalyze={analyze}
            onDragOver={(v) => setDragOver(v)}
          />
        )}
      </main>

      <footer className="mt-12 border-t border-line pt-6">
        {stats && (
          <div className="mb-4 flex items-center justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-semibold tabular-nums text-accent">
                {stats.analyses.toLocaleString()}
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-widest text-fog">
                {d.stats.analyses}
              </div>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <div className="text-2xl font-semibold tabular-nums text-zinc-100">
                {stats.issuesFound.toLocaleString()}
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-widest text-fog">
                {d.stats.issuesFound}
              </div>
            </div>
          </div>
        )}
        <p className="text-center text-xs leading-relaxed text-fog/70">{d.footer}</p>
      </footer>
    </div>
  );
}

function IdleView({
  d,
  lang,
  phase,
  errorMsg,
  preview,
  symptoms,
  dragOver,
  inputRef,
  onPick,
  onFile,
  onSymptoms,
  onAnalyze,
  onDragOver,
}: {
  d: ReturnType<typeof t>;
  lang: Lang;
  phase: Phase;
  errorMsg: string;
  preview: string | null;
  symptoms: string;
  dragOver: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: () => void;
  onFile: (f: File | undefined | null) => void;
  onSymptoms: (v: string) => void;
  onAnalyze: () => void;
  onDragOver: (v: boolean) => void;
}) {
  return (
    <>
      <section className="pt-10 pb-8 text-center sm:pt-16">
        <p className="mb-4 inline-block rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-widest text-fog">
          {d.tagline}
        </p>
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          {d.heading1}
          <br />
          <span className="text-accent">{d.heading2}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-fog">{d.sub}</p>
      </section>

      <section className="animate-fade-up">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        {preview ? (
          <div className="relative overflow-hidden rounded-2xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-80 w-full object-cover" />
            <button
              onClick={onPick}
              className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-zinc-100 backdrop-blur transition-colors hover:bg-black/80"
            >
              {d.changePhoto}
            </button>
          </div>
        ) : (
          <button
            onClick={onPick}
            onDragOver={(e) => {
              e.preventDefault();
              onDragOver(true);
            }}
            onDragLeave={() => onDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              onDragOver(false);
              onFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 transition-all duration-300 ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-line bg-surface hover:border-accent/40 hover:bg-surface-2"
            }`}
          >
            <span className="text-3xl">📷</span>
            <span className="text-sm font-medium text-zinc-100">
              <span className="sm:hidden">{d.uploadMobile}</span>
              <span className="hidden sm:inline">{d.uploadTitle}</span>
            </span>
            <span className="hidden text-xs text-fog sm:block">{d.uploadHint}</span>
          </button>
        )}

        <div className="mt-5">
          <label htmlFor="symptoms" className="mb-2 block text-xs uppercase tracking-widest text-fog">
            {d.symptomsLabel}
          </label>
          <textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => onSymptoms(e.target.value)}
            placeholder={d.symptomsPlaceholder}
            rows={2}
            className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-zinc-100 placeholder:text-fog/50 focus:border-accent/50 focus:outline-none"
          />
        </div>

        {phase === "error" && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {errorMsg}
          </p>
        )}

        <button
          onClick={onAnalyze}
          disabled={!preview}
          className="mt-6 w-full rounded-xl bg-accent px-6 py-4 text-sm font-semibold text-zinc-950 transition-all duration-300 hover:enabled:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {d.analyze}
        </button>
      </section>
    </>
  );
}

function ScanningView({
  d,
  preview,
  step,
}: {
  d: ReturnType<typeof t>;
  preview: string | null;
  step: number;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-16">
      <div className="relative h-64 w-64 overflow-hidden rounded-2xl border border-line">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover opacity-80" />
        )}
        <div className="absolute inset-x-0 h-0.5 animate-scanline bg-accent shadow-[0_0_24px_4px_rgba(74,222,128,0.45)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent" />
      </div>
      <div className="h-6 text-center text-sm font-medium text-zinc-100">
        <span key={step} className="inline-block animate-fade-up">
          {d.scanMessages[step]}
        </span>
      </div>
      <p className="text-xs text-fog">{d.analyzingSub}</p>
    </div>
  );
}

function ResultView({
  d,
  preview,
  data,
  onReset,
}: {
  d: ReturnType<typeof t>;
  preview: string | null;
  data: DiagnoseResponse;
  onReset: () => void;
}) {
  const r = data.result;
  return (
    <div className="pt-4">
      {data.demo && (
        <p className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-2.5 text-center text-xs text-amber-300">
          {d.demoBadge}
        </p>
      )}

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="h-40 w-40 shrink-0 rounded-2xl border border-line object-cover"
          />
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] uppercase tracking-widest text-fog">{d.plantLabel}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{r.plant_name}</h2>
          <p className="mt-0.5 text-sm italic text-fog">{r.scientific_name}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${healthStyles[r.health_status]}`}
            >
              {d.health[r.health_status]}
            </span>
            <span className="rounded-full border border-line px-3 py-1 text-xs text-fog">
              {r.confidence}% {d.confidence}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 animate-fade-up rounded-2xl border border-line bg-surface p-5">
        <p className="text-[11px] uppercase tracking-widest text-fog">{d.summaryLabel}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-200">{r.summary}</p>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-fog">
          {d.issuesLabel}
        </h3>
        {r.issues.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-accent/20 bg-accent/5 p-5 text-sm text-accent">
            {d.noIssues}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {r.issues.map((issue, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 120}ms` }}
                className="animate-fade-up rounded-2xl border border-line bg-surface p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-medium text-zinc-100">{issue.title}</h4>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${severityStyles[issue.severity]}`}
                  >
                    {d.severity[issue.severity]}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-fog">{d.cause}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">{issue.cause}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-fog">{d.solution}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">{issue.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-fog">{d.careLabel}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["💧", d.care.water, r.care.water],
              ["☀️", d.care.light, r.care.light],
              ["🪴", d.care.soil, r.care.soil],
              ["✨", d.care.tip, r.care.tip],
            ] as const
          ).map(([icon, label, text], i) => (
            <div
              key={label}
              style={{ animationDelay: `${i * 120}ms` }}
              className="animate-fade-up rounded-2xl border border-line bg-surface p-5"
            >
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <p className="text-xs font-semibold uppercase tracking-widest text-fog">{label}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-10 w-full rounded-xl border border-line px-6 py-3.5 text-sm font-medium text-zinc-100 transition-colors hover:border-accent/40 hover:bg-surface"
      >
        {d.analyzeAnother}
      </button>
    </div>
  );
}
