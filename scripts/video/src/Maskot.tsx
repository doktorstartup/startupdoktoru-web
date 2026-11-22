// Kapsül maskot animasyonları. Kurallar: docs/maskot-animasyon-rehberi.md
// Geometri public/brand/kapsul-ikon.svg ile birebir (100'lük tuval, −14° eğim).
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily } = loadFont("normal", { weights: ["600"], subsets: ["latin", "latin-ext"] });

const TEAL = "#1BA1C4", NAVY = "#26304A", WHITE = "#FFFFFF";
export const MASKOT_FPS = 30;

export type Zemin = "seffaf" | "lacivert" | "beyaz";
export type MaskotProps = { zemin: Zemin };

type Goz = "normal" | "kapali" | "mutlu" | "saskin" | "endise" | "kararli";

type Poz = {
  x?: number; y?: number;        // gövde kayması (100'lük birim)
  egim?: number;                  // derece, varsayılan −14
  sx?: number; sy?: number;       // esneme/yassılma, alt kenar sabit
  goz?: Goz; gozSag?: Goz;        // gozSag verilirse sağ göz farklı (göz kırpma)
  bakX?: number; bakY?: number;   // göz grubunun kayması (±3 / ±2.5)
  kapak?: number;                 // 0 kapalı … 1 açık
  parilti?: number;               // 0 … 1 parıltı ilerlemesi
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ara = (f: number, giris: number[], cikis: number[], easing = Easing.inOut(Easing.cubic)) =>
  interpolate(f, giris, cikis, { ...clamp, easing });

function Goz1({ x, y, tip, sol }: { x: number; y: number; tip: Goz; sol: boolean }) {
  if (tip === "mutlu")
    return <path d={`M${x - 3.8} ${y + 2.3}Q${x} ${y - 5.4} ${x + 3.8} ${y + 2.3}`} fill="none" stroke={WHITE} strokeWidth={3.1} strokeLinecap="round" />;
  if (tip === "kapali") return <rect x={x - 3.3} y={y - 1.5} width={6.6} height={3} rx={1.5} fill={WHITE} />;
  if (tip === "saskin") return <ellipse cx={x} cy={y} rx={4} ry={8} fill={WHITE} />;
  if (tip === "kararli") return <rect x={x - 2.9} y={y - 3.5} width={5.8} height={9} rx={2.9} fill={WHITE} />;
  const don = tip === "endise" ? (sol ? 12 : -12) : 0;
  const dy = tip === "endise" ? 1 : 0;
  return <rect x={x - 2.9} y={y - 6.8 + dy} width={5.8} height={13.6} rx={2.9} fill={WHITE} transform={`rotate(${don} ${x} ${y + dy})`} />;
}

function Yildiz({ cx, cy, r, op }: { cx: number; cy: number; r: number; op: number }) {
  const k = r * 0.28;
  return <path opacity={op} fill={TEAL} d={`M${cx} ${cy - r}L${cx + k} ${cy - k}L${cx + r} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + r}L${cx - k} ${cy + k}L${cx - r} ${cy}L${cx - k} ${cy - k}Z`} />;
}

function Parilti({ p }: { p: number }) {
  if (p <= 0 || p >= 1) return null;
  const yildizlar = [[24, 12, 5, 0], [76, 4, 4, 0.15], [84, 30, 3.2, 0.3], [16, 34, 3, 0.4]];
  return (
    <g>
      {yildizlar.map(([cx, cy, r, gec], i) => {
        const t = interpolate(p, [gec, gec + 0.5], [0, 1], clamp);
        const s = Math.sin(t * Math.PI);
        return <Yildiz key={i} cx={cx} cy={cy - t * 6} r={r * s} op={s} />;
      })}
    </g>
  );
}

// Tek kapsül. Dış SVG viewBox'ı −10 −15 120 120: zıplama ve kapak için pay.
export function Kapsul({ poz, kontur }: { poz: Poz; kontur: boolean }) {
  const { x = 0, y = 0, egim = -14, sx = 1, sy = 1, goz = "normal", gozSag, bakX = 0, bakY = 0, kapak = 0, parilti = 0 } = poz;
  const kapakT = `translate(${2 * kapak} ${-9 * kapak}) rotate(${-14 * kapak} 67 50)`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Parilti p={parilti} />
      <g transform={`rotate(${egim} 50 50) translate(50 86) scale(${sx} ${sy}) translate(-50 -86)`}>
        <path d="M33 50V69A17 17 0 0 0 67 69V50Z" fill={WHITE} />
        {kontur && <path d="M33 50V69A17 17 0 0 0 67 69V50Z" fill="none" stroke={NAVY} strokeWidth={2.4} strokeLinejoin="round" />}
        <g transform={kapakT}>
          <path d="M33 50V31A17 17 0 0 1 67 31V50Z" fill={TEAL} />
          {kontur && <path d="M33 50V31A17 17 0 0 1 67 31V50Z" fill="none" stroke={NAVY} strokeWidth={2.4} strokeLinejoin="round" />}
          <path d="M36.6 33A14 14 0 0 1 41.5 22.6" fill="none" stroke={WHITE} strokeWidth={2.4} strokeLinecap="round" opacity={0.5} />
          <g transform={`translate(${bakX} ${bakY})`}>
            <Goz1 x={44} y={37} tip={goz} sol />
            <Goz1 x={56} y={37} tip={gozSag ?? goz} sol={false} />
          </g>
        </g>
      </g>
    </g>
  );
}

function Sahne({ zemin, poz, children }: MaskotProps & { poz: Poz; children?: React.ReactNode }) {
  const bg = zemin === "lacivert" ? NAVY : zemin === "beyaz" ? WHITE : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <svg viewBox="-10 -15 120 120" width="100%" height="100%">
        <Kapsul poz={poz} kontur={zemin === "beyaz"} />
      </svg>
      {children}
    </AbsoluteFill>
  );
}

// Kırpma: [başlangıç karesi, süre] listesinde mi?
const kirpiyor = (f: number, anlar: number[], sure = 4) => anlar.some((a) => f >= a && f < a + sure);

// Zıplama eğrisi: hazırlık çökmesi → yükselme → iniş yassılması → oturma.
function zipla(f: number, bas: number, yuk = 12) {
  const t = f - bas;
  const y = t < 4 ? 0 : t < 12 ? -yuk * Easing.out(Easing.quad)((t - 4) / 8) : t < 18 ? -yuk * (1 - Easing.in(Easing.quad)((t - 12) / 6)) : 0;
  const sy = ara(t, [0, 4, 6, 12, 18, 20, 24], [1, 0.93, 1.06, 1.02, 1, 0.93, 1]);
  return { y, sy, sx: 2 - sy };
}

// ---- 1. idle: 4 sn kusursuz döngü ----
export function MaskotIdle(p: MaskotProps) {
  const f = useCurrentFrame();
  const sy = 1 + 0.02 * Math.sin((f / 60) * 2 * Math.PI);
  const bakX = ara(f, [48, 54, 76, 82], [0, 3, 3, 0]);
  const goz: Goz = kirpiyor(f, [30, 98]) ? "kapali" : "normal";
  return <Sahne {...p} poz={{ sy, sx: 2 - sy, bakX, goz }} />;
}

// ---- 2. selam: düşüp oturma → zıplama → göz kırpma ----
export function MaskotSelam(p: MaskotProps) {
  const f = useCurrentFrame();
  const dus = ara(f, [0, 10], [-130, 0], Easing.in(Easing.quad));
  const otur = ara(f, [10, 13, 17], [1, 0.9, 1]);
  const z = f >= 18 ? zipla(f, 18, 10) : { y: 0, sy: otur, sx: 2 - otur };
  const goz: Goz = f < 14 ? "kapali" : "normal";
  const gozSag: Goz | undefined = f >= 40 && f < 52 ? "mutlu" : undefined;
  return <Sahne {...p} poz={{ y: dus + z.y, sy: z.sy, sx: z.sx, goz, gozSag }} />;
}

// ---- 3. kutlama: zıplar, kapak açılır, parıltı, kapanır ----
export function MaskotKutlama(p: MaskotProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = zipla(f, 0, 10);
  const ac = spring({ frame: f - 8, fps, config: { damping: 9, stiffness: 160 } });
  const kapan = ara(f, [32, 40], [0, 1]);
  const kapak = Math.max(0, ac * (1 - kapan));
  const goz: Goz = f >= 5 && f < 42 ? "mutlu" : "normal";
  const parilti = interpolate(f, [10, 34], [0, 1], clamp);
  return <Sahne {...p} poz={{ ...z, goz, kapak, parilti }} />;
}

// ---- 4. düşünüyor: 2 sn döngü ----
export function MaskotDusunuyor(p: MaskotProps) {
  const f = useCurrentFrame();
  const egim = -14 + 3 * Math.sin((f / 60) * 2 * Math.PI);
  return <Sahne {...p} poz={{ egim, goz: "kapali", bakX: 3, bakY: -2.5 }} />;
}

// ---- 5. şaşkın ----
export function MaskotSaskin(p: MaskotProps) {
  const f = useCurrentFrame();
  const t = f - 3;
  const y = t < 0 ? 0 : t < 5 ? -6 * Easing.out(Easing.quad)(t / 5) : t < 9 ? -6 * (1 - Easing.in(Easing.quad)((t - 5) / 4)) : 0;
  const sy = ara(f, [3, 5, 12, 14, 18], [1, 1.07, 1, 0.94, 1]);
  return <Sahne {...p} poz={{ y, sy, sx: 2 - sy, goz: f < 3 ? "normal" : "saskin" }} />;
}

// ---- 6. onay: mutlu gözler + iki kez baş sallama ----
export function MaskotOnay(p: MaskotProps) {
  const f = useCurrentFrame();
  const egim = ara(f, [2, 8, 14, 20, 26], [-14, -6, -14, -6, -14]);
  const y = ara(f, [2, 8, 14, 20, 26], [0, 1.5, 0, 1.5, 0]);
  return <Sahne {...p} poz={{ egim, y, goz: f < 2 ? "normal" : "mutlu" }} />;
}

// ---- 7. endişe: içe dönük gözler + titreme ----
export function MaskotEndise(p: MaskotProps) {
  const f = useCurrentFrame();
  const x = f >= 4 && f < 13 ? 1.5 * Math.sin(((f - 4) / 3) * 2 * Math.PI) : 0;
  const sy = ara(f, [0, 6], [1, 0.97]);
  return <Sahne {...p} poz={{ x, sy, sx: 2 - sy, goz: "endise", y: ara(f, [0, 6], [0, 0.6]) }} />;
}

// ---- 8. logo açılışı (1920×1080): kapsül düşer, oturur, gözler açılır, yazı belirir ----
export function MaskotLogoAcilis({ zemin }: MaskotProps) {
  const f = useCurrentFrame();
  const bg = zemin === "lacivert" ? NAVY : zemin === "beyaz" ? WHITE : undefined;
  const yazi = zemin === "beyaz" ? NAVY : WHITE;
  const dus = ara(f, [0, 10], [-140, 0], Easing.in(Easing.quad));
  const sy = ara(f, [10, 13, 18], [1, 0.9, 1]);
  const goz: Goz = f < 16 || kirpiyor(f, [44]) ? "kapali" : "normal";
  const satir = (gec: number) => ({
    opacity: ara(f, [gec, gec + 10], [0, 1]),
    transform: `translateX(${ara(f, [gec, gec + 12], [-40, 0], Easing.out(Easing.cubic))}px)`,
  });
  const harf: React.CSSProperties = { fontFamily, fontWeight: 600, fontSize: 150, lineHeight: 1, letterSpacing: 8, color: yazi };
  return (
    <AbsoluteFill style={{ backgroundColor: bg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 56 }}>
      <svg viewBox="22 -5 56 110" width={340} height={668} style={{ overflow: "visible" }}>
        <Kapsul poz={{ y: dus, sy, sx: 2 - sy, goz }} kontur={zemin === "beyaz"} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 34, overflow: "hidden", padding: "0 0 0 8px" }}>
        <div style={{ ...harf, ...satir(20) }}>START<span style={{ color: TEAL }}>UP</span></div>
        <div style={{ ...harf, ...satir(26) }}>DOKTORU</div>
      </div>
    </AbsoluteFill>
  );
}

export const MASKOT_ANIMASYONLAR = [
  { id: "Maskot-idle", component: MaskotIdle, kare: 120 },
  { id: "Maskot-selam", component: MaskotSelam, kare: 54 },
  { id: "Maskot-kutlama", component: MaskotKutlama, kare: 48 },
  { id: "Maskot-dusunuyor", component: MaskotDusunuyor, kare: 60 },
  { id: "Maskot-saskin", component: MaskotSaskin, kare: 30 },
  { id: "Maskot-onay", component: MaskotOnay, kare: 30 },
  { id: "Maskot-endise", component: MaskotEndise, kare: 30 },
] as const;
