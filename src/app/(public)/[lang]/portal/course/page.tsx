"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle2, Circle, Play, Loader2, ShoppingCart, GraduationCap, ChevronLeft, ChevronDown, BookOpen, ArrowRight, Rocket } from "lucide-react";
import { BunnyEmbed } from "../../../../../components/BunnyEmbed";
import { YouTubeEmbed } from "../../../../../components/YouTubeEmbed";
import { MemberLogin } from "../../../../../components/MemberLogin";
import { TRAININGS, DISCOUNTED_TRAINING_PRICE, trainingPoster, trainingText, lessonTitle, type Training } from "../../../../../lib/trainings";
import { VIDEOS } from "../../../../../lib/videos";
import { useMember, getProgress, saveProgress, tagInterest } from "../../../../../lib/member";
import { useHref, useLang, useT } from "../../../../../lib/i18n-client";
import { fill } from "../../../../../lib/i18n";

export default function CoursePortal() {
  const { member, loading, hasAccess } = useMember();
  const lang = useLang();
  const t = useT().portal;
  const href = useHref();
  const email = member?.email || "";

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (!email) return;
    setCompleted(getProgress(email).completed);
  }, [email]);

  const progressFor = (t: Training) => {
    const ids = t.lessons.map((l) => l.id);
    const done = completed.filter((c) => ids.includes(c)).length;
    return { done, total: ids.length, pct: ids.length ? Math.round((done / ids.length) * 100) : 0 };
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!member) {
    return <MemberLogin />;
  }

  const owned = TRAININGS.filter((t) => hasAccess(t.id));
  const notOwned = TRAININGS.filter((t) => !hasAccess(t.id));
  const ownsEbook = hasAccess("ebook_13_steps");
  // Sunum dosyası eğitim alanlara da açık; kart ikisinde de görünsün.
  const dosyasiVar = ownsEbook || owned.length > 0;

  const openTraining = (id: string, lessonId?: string) => {
    setActiveId(id);
    const t = TRAININGS.find((x) => x.id === id);
    if (t && hasAccess(id)) {
      if (lessonId) {
        setActiveLessonId(lessonId);
        saveProgress(email, { completed, last: lessonId });
      } else {
        const p = getProgress(email);
        const last = t.lessons.find((l) => l.id === p.last) || t.lessons[0];
        setActiveLessonId(last?.id || null);
      }
    } else {
      setActiveLessonId(null); // tanıtım modu
    }
  };

  const selectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    saveProgress(email, { completed, last: lessonId });
  };

  const toggleComplete = (lessonId: string) => {
    const next = completed.includes(lessonId) ? completed.filter((id) => id !== lessonId) : [...completed, lessonId];
    setCompleted(next);
    saveProgress(email, { completed: next, last: lessonId });
  };

  // ─── ÜCRETSİZ EĞİTİM GÖRÜNÜMÜ ───
  if (activeId === "free") {
    return (
      <div className="space-y-6">
        <button onClick={() => setActiveId(null)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" /> {t.myTrainings}
        </button>
        <div>
          <span className="text-emerald-400 text-xs font-bold font-mono tracking-widest uppercase">{t.freeEyebrow}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{t.freeHeading}</h1>
        </div>
        <div className="aspect-video rounded-2xl border border-border/60 bg-black/40 overflow-hidden shadow-2xl max-w-4xl">
          <YouTubeEmbed
            videoId={VIDEOS.freeTraining12min}
            title={t.freeVideoTitle}
            label={t.freeVideoLabel}
            poster={{ badge: t.freePosterBadge, title: t.freeHeading, accent: "emerald" }}
          />
        </div>

        {/* Videonun altında: yatırımcı ağına giriş — kayıtlı herkese açık */}
        <Link href={href("/portal/startup")}
          className="block max-w-4xl glass-panel rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] to-accent/[0.05] hover:border-primary/50 transition-all p-6 group">
          <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <Rocket className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-foreground text-lg">
                {lang === "en" ? "Start meeting hundreds of investors in our network" : "Sistemimize kayıtlı yüzlerce yatırımcıyla görüşmeye hemen başla"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {lang === "en"
                  ? "Create your startup profile step by step — we'll match you with the right investors."
                  : "Girişim profilini adım adım oluştur — sana uygun yatırımcılarla eşleştirelim."}
              </p>
            </div>
            <span className="btn btn-primary shrink-0 pointer-events-none">
              {lang === "en" ? "Get started" : "Hemen başla"} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </div>
    );
  }

  // ─── EĞİTİM GÖRÜNÜMÜ (bir kart açıldığında) ───
  if (activeId) {
    const tr = TRAININGS.find((x) => x.id === activeId)!;
    const text = trainingText(tr, lang);
    const ownsT = hasAccess(tr.id);
    const lesson = ownsT ? tr.lessons.find((l) => l.id === activeLessonId) : null;

    return (
      <div className="space-y-6">
        <button onClick={() => setActiveId(null)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" /> {t.myTrainings}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Player */}
          <div className="lg:col-span-8 order-1">
            <div className="aspect-video rounded-2xl border border-border/60 bg-black/40 overflow-hidden shadow-2xl">
              {lesson ? (
                <BunnyEmbed videoId={lesson.bunnyId} title={lessonTitle(lesson, lang)} />
              ) : tr.previewYouTube ? (
                <YouTubeEmbed videoId={tr.previewYouTube} title={`${text.title} — ${t.previewSuffix}`} label={t.watchPreview} onPlay={() => tagInterest(email, tr.id)} poster={trainingPoster(tr.id, lang)} />
              ) : (
                <BunnyEmbed videoId={tr.previewVideo} title={`${text.title} — ${t.previewSuffix}`} label={t.watchPreview} onPlay={() => tagInterest(email, tr.id)} poster={trainingPoster(tr.id, lang)} />
              )}
            </div>

            {lesson ? (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{text.title}</p>
                  <h2 className="text-lg font-bold">{lessonTitle(lesson, lang)}</h2>
                </div>
                <button onClick={() => toggleComplete(lesson.id)} className={`btn ${completed.includes(lesson.id) ? "btn-secondary" : "btn-primary"} shrink-0`}>
                  {completed.includes(lesson.id) ? (<><CheckCircle2 className="h-4 w-4" /> {t.completed}</>) : (<><Circle className="h-4 w-4" /> {t.markCompleted}</>)}
                </button>
              </div>
            ) : (
              <div className="mt-4 glass-panel rounded-2xl border border-primary/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{text.title}</h2>
                  <p className="text-sm text-muted-foreground">{text.tagline}</p>
                </div>
                <Link href={href("/egitimler")} className="btn btn-primary shrink-0">
                  <ShoppingCart className="h-4 w-4" /> {lang === "en" ? `$${tr.price}` : `${tr.price} $`} <span className="text-xs opacity-80">{fill(t.withEbook, { price: DISCOUNTED_TRAINING_PRICE })}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Ders listesi (sahipse) */}
          {ownsT && (
            <div className="lg:col-span-4 order-2">
              <div className="glass-panel rounded-2xl border border-border/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 text-sm font-bold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> {t.sections}
                </div>
                <div className="p-2">
                  {tr.lessons.map((l) => {
                    const active = activeLessonId === l.id;
                    const done = completed.includes(l.id);
                    return (
                      <button key={l.id} onClick={() => selectLesson(l.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-xs transition-all ${active ? "bg-primary/15 text-foreground" : "hover:bg-secondary/40 text-muted-foreground"}`}>
                        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Play className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <span className="flex-1">{lessonTitle(l, lang)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PANO (kart görünümü) ───
  return (
    <div className="space-y-10">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">{t.dashboardEyebrow}</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{t.welcome}</h1>
      </div>

      {/* Yatırıma hazırlan CTA — girişimini yatırımcılara aç */}
      <Link href={href("/portal/startup")}
        className="block glass-panel rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] to-accent/[0.05] hover:border-primary/50 transition-all p-6 group">
        <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <Rocket className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-foreground text-lg">
              {lang === "en" ? "Ready to raise? Open your startup to investors" : "Yatırım almak ister misin? Girişimini yatırımcılara aç"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "en"
                ? "Add your elevator pitch, value proposition and team step by step — we'll match you with the right investors."
                : "Asansör konuşmanı, değer önerini ve ekibini adım adım gir — sana uygun yatırımcılarla eşleştirelim."}
            </p>
          </div>
          <span className="btn btn-primary shrink-0 pointer-events-none">
            {lang === "en" ? "Get started" : "Hemen başla"} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </Link>

      {/* Eğitimlerim */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{t.myTrainings}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Ücretsiz eğitim — her üyeye açık */}
            <button onClick={() => setActiveId("free")} className="glass-panel rounded-2xl border border-border/40 hover:border-emerald-500/40 transition-all p-5 text-left flex flex-col group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><Play className="h-5 w-5 fill-current" /></div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t.freeBadge}</span>
              </div>
              <h3 className="font-bold text-foreground mb-1 group-hover:text-emerald-400 transition-colors">{t.freeCardTitle}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">{t.freeCardDesc}</p>
              <span className="mt-4 text-sm font-bold text-emerald-400 inline-flex items-center gap-1">{t.watch} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></span>
            </button>

            {owned.map((tr) => {
              const text = trainingText(tr, lang);
              const pr = progressFor(tr);
              const isOpen = expanded === tr.id;
              return (
                <div key={tr.id} className="glass-panel rounded-2xl border border-border/40 hover:border-primary/40 transition-all p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><GraduationCap className="h-5 w-5" /></div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t.owned}</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{text.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">{text.tagline}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-muted-foreground">{t.progress}</span>
                      <span className="font-bold text-primary">%{pr.pct} · {pr.done}/{pr.total}</span>
                    </div>
                    <div className="w-full bg-secondary/40 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pr.pct}%` }} />
                    </div>
                  </div>

                  {/* Açılır bölüm menüsü */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : tr.id)}
                    className="mt-4 flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <span>{t.sections} ({tr.lessons.length})</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-1 space-y-0.5 border-t border-border/20 pt-2">
                      {tr.lessons.map((l) => {
                        const done = completed.includes(l.id);
                        return (
                          <button key={l.id} onClick={() => openTraining(tr.id, l.id)}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all">
                            {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <Play className="h-3 w-3 text-primary shrink-0" />}
                            <span className="flex-1">{lessonTitle(l, lang)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={() => openTraining(tr.id)} className="mt-4 btn btn-primary btn-sm w-full">
                    {pr.done > 0 ? t.continue : t.startWatching} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {dosyasiVar && (
              <Link href={href("/portal/ebook")} className="glass-panel rounded-2xl border border-border/40 hover:border-accent/40 transition-all p-5 flex flex-col group">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent"><BookOpen className="h-5 w-5" /></div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t.owned}</span>
                </div>
                <h3 className="font-bold text-foreground mb-1 group-hover:text-accent transition-colors">{t.ebookCardTitle}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{t.ebookCardDesc}</p>
                <span className="mt-4 text-sm font-bold text-accent inline-flex items-center gap-1">{t.read} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></span>
              </Link>
            )}
          </div>
        </div>

      {/* Diğer eğitimler (sahip olunmayan) */}
      {notOwned.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            {owned.length > 0 ? t.otherTrainings : t.trainings}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {notOwned.map((tr) => (
              <div key={tr.id} className="glass-panel rounded-2xl border border-border/40 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-center text-muted-foreground"><Lock className="h-5 w-5" /></div>
                  <span className="text-sm font-extrabold font-mono text-primary">{lang === "en" ? `$${tr.price}` : `${tr.price} $`}</span>
                </div>
                <h3 className="font-bold text-foreground mb-1">{trainingText(tr, lang).title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">{trainingText(tr, lang).tagline}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openTraining(tr.id)} className="btn btn-secondary btn-sm flex-1">
                    <Play className="h-3.5 w-3.5" /> {t.preview}
                  </button>
                  <Link href={href("/egitimler")} className="btn btn-primary btn-sm flex-1">
                    <ShoppingCart className="h-3.5 w-3.5" /> {t.buy}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">{fill(t.discountNote, { price: DISCOUNTED_TRAINING_PRICE })}</p>
        </div>
      )}
    </div>
  );
}
