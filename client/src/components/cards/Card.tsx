import type { Card as CardModel } from '@skull-king/shared';

/*
 * Card faces styled after the physical Skull King deck: a white card base, a
 * torn/ragged colored frame per suit, painted-style vector art inside, and gold
 * coin medallions in the corners (number for suit cards, an emblem for specials).
 */

// ---------- deterministic ragged-edge geometry ----------

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jaggedRectPoints(x: number, y: number, w: number, h: number, step: number, rough: number, rnd: () => number): string {
  const pts: string[] = [];
  const edge = (x1: number, y1: number, x2: number, y2: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(len / step));
    const ox = (y2 - y1) / len;
    const oy = -(x2 - x1) / len;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const off = (rnd() * 2 - 1) * rough;
      pts.push(`${(x1 + (x2 - x1) * t + ox * off).toFixed(1)},${(y1 + (y2 - y1) * t + oy * off).toFixed(1)}`);
    }
  };
  edge(x, y, x + w, y);
  edge(x + w, y, x + w, y + h);
  edge(x + w, y + h, x, y + h);
  edge(x, y + h, x, y);
  return pts.join(' ');
}

// ---------- per-kind palette ----------

interface KindStyle {
  frame: string;
  frameDark: string;
  artTop: string;
  artBottom: string;
  label?: string;
}

function styleFor(card: CardModel): KindStyle {
  if (card.kind === 'suit') {
    switch (card.suit) {
      case 'parrots':
        return { frame: '#4c9440', frameDark: '#2e6626', artTop: '#9fd3ee', artBottom: '#e3f2fa' };
      case 'chests':
        return { frame: '#e3aa38', frameDark: '#b17e1e', artTop: '#f4dfae', artBottom: '#cfa869' };
      case 'maps':
        return { frame: '#8c66aa', frameDark: '#64477e', artTop: '#ecdcba', artBottom: '#cbb185' };
      case 'jolly_roger':
        return { frame: '#191410', frameDark: '#050403', artTop: '#45596c', artBottom: '#131a22' };
    }
  }
  switch (card.kind) {
    case 'pirate':
      return { frame: '#c02330', frameDark: '#8c1620', artTop: '#6b4527', artBottom: '#2a190e', label: 'Pirate' };
    case 'escape':
      return { frame: '#4271a8', frameDark: '#2c4f7c', artTop: '#5a86bb', artBottom: '#1e3c60', label: 'Escape' };
    case 'mermaid':
      return { frame: '#2f9a94', frameDark: '#1e6e6a', artTop: '#66c2bb', artBottom: '#175058', label: 'Mermaid' };
    case 'skull_king':
      return { frame: '#1a1410', frameDark: '#050403', artTop: '#7c2317', artBottom: '#180c08', label: 'Skull King' };
  }
}

// ---------- corner medallions ----------

function CoinMedallion({ cx, cy, r, uid, children }: { cx: number; cy: number; r: number; uid: string; children?: React.ReactNode }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}-coin)`} stroke="#6e5212" strokeWidth="1.1" />
      <circle cx={cx} cy={cy} r={r - 1.8} fill="none" stroke="#8a6a1c" strokeWidth="0.5" opacity="0.8" />
      {children}
    </g>
  );
}

// High-contrast dark badge (not the gold coin gradient) so the number reads clearly
// against every frame color, at small sizes, on any screen.
function NumberMedallion({ cx, cy, r, value, fontSize }: { cx: number; cy: number; r: number; value: number; fontSize: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#15110d" stroke="#d9b64c" strokeWidth="1.8" />
      <circle cx={cx} cy={cy} r={r - 2.6} fill="none" stroke="#d9b64c" strokeWidth="0.6" opacity="0.5" />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize={fontSize}
        fill="#fbf6e6"
      >
        {value}
      </text>
    </g>
  );
}

function EmblemMedallion({ cx, cy, uid, kind }: { cx: number; cy: number; uid: string; kind: CardModel['kind'] }) {
  return (
    <CoinMedallion cx={cx} cy={cy} r={11} uid={uid}>
      <g transform={`translate(${cx} ${cy})`}>
        {kind === 'pirate' && (
          // cutlass
          <g>
            <path d="M-4.5,4.5 Q-1,-3 4.5,-5 Q2,1 -2.5,5.5 Z" fill="#a01c28" stroke="#701018" strokeWidth="0.4" />
            <path d="M-5.5,3 L-3,5.5" stroke="#3a2410" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M-6,5.8 Q-4,7.5 -1.8,5.6" stroke="#3a2410" strokeWidth="1" fill="none" />
          </g>
        )}
        {kind === 'escape' && (
          // white flag
          <g>
            <path d="M-2.5,-5.5 V6" stroke="#3a2410" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M-2.5,-5 Q1.5,-6.5 5,-4.5 Q3.5,-2.5 5,0 Q1,1.5 -2.5,0 Z" fill="#f5f0e2" stroke="#8a7a5a" strokeWidth="0.4" />
          </g>
        )}
        {kind === 'mermaid' && (
          // trident
          <g stroke="#1c5a56" strokeWidth="1.2" strokeLinecap="round" fill="none">
            <path d="M0,-5.5 V6" />
            <path d="M-3.5,-5 Q-3.5,-1.5 0,-1.5 Q3.5,-1.5 3.5,-5" />
            <path d="M-3.5,-5 L-3.5,-3.5 M3.5,-5 L3.5,-3.5" />
          </g>
        )}
        {kind === 'skull_king' && (
          // skull & crossbones
          <g>
            <path d="M-5,-3.5 L5,3.5 M5,-3.5 L-5,3.5" stroke="#3a2410" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="0" cy="-0.5" r="3.6" fill="#3a2410" />
            <circle cx="-1.4" cy="-1.2" r="0.9" fill={`url(#${uid}-coin)`} />
            <circle cx="1.4" cy="-1.2" r="0.9" fill={`url(#${uid}-coin)`} />
            <rect x="-1.8" y="1.6" width="3.6" height="1.4" fill="#3a2410" />
          </g>
        )}
      </g>
    </CoinMedallion>
  );
}

// ---------- card art scenes ----------

function ParrotArt() {
  return (
    <g>
      {/* foliage */}
      <ellipse cx="14" cy="126" rx="20" ry="12" fill="#2e6626" opacity="0.7" />
      <ellipse cx="86" cy="128" rx="22" ry="13" fill="#2e6626" opacity="0.7" />
      {/* branch */}
      <path d="M14,98 Q45,92 86,100" stroke="#6b4a2a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      {/* tail */}
      <path d="M46,84 Q38,104 44,120 Q49,106 52,88 Z" fill="#c22532" />
      <path d="M50,86 Q46,104 51,118 Q55,104 56,90 Z" fill="#3a6ea5" />
      {/* body */}
      <ellipse cx="50" cy="68" rx="14" ry="21" fill="#d03a28" transform="rotate(-12 50 68)" />
      {/* wing */}
      <path d="M44,54 Q26,70 36,90 Q41,94 46,90 Q38,74 50,60 Z" fill="#e8b23a" />
      <path d="M42,60 Q32,72 38,86 Q42,88 45,85 Q39,74 48,63 Z" fill="#3a6ea5" opacity="0.9" />
      {/* head */}
      <circle cx="58" cy="42" r="10.5" fill="#d03a28" />
      <circle cx="61" cy="41" r="5.6" fill="#f2ede0" />
      <circle cx="62.5" cy="40" r="1.5" fill="#1c1410" />
      {/* beak */}
      <path d="M66,36 Q74,38 72,45 Q70,50 64,48 Q68,43 66,36 Z" fill="#4a3b2a" />
      {/* feet grip */}
      <path d="M46,88 L44,97 M52,88 L52,97" stroke="#4a3b2a" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

function ChestArt({ uid }: { uid: string }) {
  return (
    <g>
      {/* treasure glow */}
      <circle cx="50" cy="70" r="30" fill={`url(#${uid}-glow)`} />
      {/* sand */}
      <ellipse cx="50" cy="122" rx="42" ry="14" fill="#b8924e" opacity="0.8" />
      {/* lid */}
      <path d="M28,68 Q50,42 72,68 L72,74 L28,74 Z" fill="#8a5a32" stroke="#4a2d14" strokeWidth="1.4" />
      <path d="M28,68 Q50,42 72,68" fill="none" stroke="#4a2d14" strokeWidth="1.4" />
      {/* body */}
      <rect x="28" y="74" width="44" height="30" rx="2" fill="#7a4e2a" stroke="#4a2d14" strokeWidth="1.4" />
      {/* straps */}
      <rect x="45.4" y="52" width="9" height="52" fill="#c89a2e" stroke="#7a5a14" strokeWidth="0.9" />
      <path d="M28,86 h44 M28,96 h44" stroke="#4a2d14" strokeWidth="1.1" />
      {/* lock */}
      <circle cx="50" cy="80" r="4.4" fill="#e8c860" stroke="#7a5a14" strokeWidth="1" />
      <rect x="48.6" y="80" width="2.8" height="4.4" fill="#7a5a14" />
      {/* spilling coins */}
      {[
        [34, 106], [42, 110], [52, 112], [61, 109], [68, 105], [46, 116], [57, 117],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.4" fill="#e8c860" stroke="#a37b1c" strokeWidth="0.8" />
      ))}
    </g>
  );
}

function MapArt() {
  return (
    <g>
      {/* map sheet */}
      <path d="M22,40 L38,34 L58,39 L78,33 L78,96 L60,102 L40,97 L22,102 Z" fill="#f6ecd2" stroke="#b09a6a" strokeWidth="1.2" />
      <path d="M38,34 V97 M58,39 V102" stroke="#c9b284" strokeWidth="0.9" strokeDasharray="1.5 1.8" />
      {/* coastline */}
      <path d="M27,58 Q36,52 44,58 Q52,64 62,58 Q70,53 75,57" stroke="#8a9a6a" strokeWidth="1.3" fill="none" />
      {/* dotted route */}
      <path d="M28,84 Q40,68 52,80 Q62,88 70,70" stroke="#c22532" strokeWidth="1.6" fill="none" strokeDasharray="3 2.4" strokeLinecap="round" />
      {/* X marks the spot */}
      <path d="M66,64 L74,74 M74,64 L66,74" stroke="#c22532" strokeWidth="2.6" strokeLinecap="round" />
      {/* compass */}
      <g transform="translate(31 90)">
        <circle r="6.5" fill="none" stroke="#6a5136" strokeWidth="1" />
        <path d="M0,-5 L1.6,0 L0,5 L-1.6,0 Z" fill="#6a5136" />
      </g>
      {/* rolled bottom */}
      <path d="M22,102 Q30,108 40,103 M60,102 Q68,109 78,102" stroke="#b09a6a" strokeWidth="1.1" fill="none" />
    </g>
  );
}

function JollyRogerArt() {
  return (
    <g>
      {/* lightning */}
      <path d="M70,12 L62,34 L69,33 L58,54" stroke="#e8e4c8" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.9" />
      <path d="M24,16 L29,30 L24,29 L30,44" stroke="#c8d4dc" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* sea */}
      <path d="M11,116 Q30,110 50,116 Q70,122 89,115 L89,129 L11,129 Z" fill="#0c1218" />
      <path d="M14,118 Q30,113 48,118 M52,120 Q68,116 84,119" stroke="#3d5163" strokeWidth="0.9" fill="none" />
      {/* pole */}
      <path d="M32,20 V118" stroke="#5a4028" strokeWidth="3" strokeLinecap="round" />
      {/* flag */}
      <path d="M33,26 Q54,18 74,26 L72,62 Q52,70 33,60 Z" fill="#0a0908" stroke="#241e18" strokeWidth="1" />
      {/* skull with red bandana */}
      <circle cx="52" cy="43" r="8.4" fill="#f2ede0" />
      <path d="M43.6,41 Q44,34 52,33.6 Q60,34 60.4,41 Q56,38.6 52,38.8 Q48,38.6 43.6,41 Z" fill="#c22532" />
      <path d="M44,40 Q40,44 39,49 L43,47 Z" fill="#c22532" />
      <circle cx="48.8" cy="43.5" r="1.9" fill="#0a0908" />
      <circle cx="55.2" cy="43.5" r="1.9" fill="#0a0908" />
      <path d="M49,48.6 h6" stroke="#0a0908" strokeWidth="1.2" strokeLinecap="round" />
      {/* crossbones */}
      <path d="M42,54 L62,60 M62,54 L42,60" stroke="#f2ede0" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
}

function PirateArt() {
  return (
    <g>
      {/* lantern glow */}
      <circle cx="76" cy="26" r="10" fill="#e8b23a" opacity="0.25" />
      <circle cx="76" cy="26" r="4" fill="#e8c860" opacity="0.5" />
      {/* shoulders / coat */}
      <path d="M22,129 Q26,98 50,98 Q74,98 78,129 Z" fill="#2e2318" />
      <path d="M40,102 L50,129 L60,102 Q50,110 40,102 Z" fill="#e8dcc4" />
      <path d="M43,104 L57,104" stroke="#8a2a1e" strokeWidth="2.4" />
      {/* neck + face */}
      <rect x="45" y="88" width="10" height="10" fill="#d9b183" />
      <circle cx="50" cy="76" r="14" fill="#e8c9a0" />
      {/* bandana */}
      <path d="M35.5,72 Q36,58 50,57.5 Q64,58 64.5,72 Q57,66 50,66.5 Q43,66 35.5,72 Z" fill="#c22532" />
      <path d="M63,68 Q70,70 73,78 Q68,76 64,73 Z" fill="#c22532" />
      <circle cx="39" cy="61" r="1.1" fill="#f2ede0" opacity="0.85" />
      <circle cx="46" cy="58.4" r="1.1" fill="#f2ede0" opacity="0.85" />
      {/* face details */}
      <circle cx="44.6" cy="75" r="1.9" fill="#241a10" />
      <circle cx="55.4" cy="75" r="1.9" fill="#241a10" />
      <path d="M43,71.4 L47,72.6 M57,71.4 L53,72.6" stroke="#241a10" strokeWidth="1" strokeLinecap="round" />
      <path d="M46,84 Q50,86.6 55,84.4" stroke="#241a10" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* stubble shading */}
      <path d="M41,81 Q44,88 50,88.6 Q57,88 59.6,80" stroke="#b08a5e" strokeWidth="1" fill="none" opacity="0.7" />
      {/* gold earring */}
      <circle cx="63.6" cy="80" r="2.6" fill="none" stroke="#e8c860" strokeWidth="1.2" />
      {/* scar */}
      <path d="M56,68 L59,64" stroke="#a8764a" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

function EscapeArt() {
  return (
    <g>
      {/* moon + stars */}
      <circle cx="72" cy="26" r="7.6" fill="#eee8d2" opacity="0.9" />
      <circle cx="69.4" cy="24" r="6.4" fill="#5a86bb" opacity="0.55" />
      {[[22, 20], [34, 30], [58, 16], [84, 42], [16, 40]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.9" fill="#eee8d2" opacity="0.8" />
      ))}
      {/* sea */}
      <path d="M11,102 Q30,96 50,102 Q70,108 89,101 L89,129 L11,129 Z" fill="#152c46" />
      <path d="M16,108 Q28,104 40,108 M48,112 Q62,107 78,111" stroke="#8db0d4" strokeWidth="0.9" fill="none" opacity="0.6" />
      {/* hull */}
      <path d="M26,92 Q50,102 74,92 L68,106 Q50,113 32,106 Z" fill="#4a3423" stroke="#2c1e12" strokeWidth="1" />
      {/* masts */}
      <path d="M42,44 V94 M60,52 V94" stroke="#3a2c1c" strokeWidth="1.8" />
      {/* sails */}
      <path d="M42,48 Q30,62 42,78 L42,48 Z" fill="#f2ede0" />
      <path d="M42,48 Q56,62 42,78" fill="#e4dcc4" />
      <path d="M60,56 Q50,66 60,80 L60,56 Z" fill="#f2ede0" />
      <path d="M60,56 Q70,66 60,80" fill="#e4dcc4" />
      {/* white flag — the escape motif */}
      <path d="M42,44 Q49,41 54,44 Q51,46.5 54,49 Q48,51 42,48 Z" fill="#ffffff" stroke="#c8c0a8" strokeWidth="0.5" />
    </g>
  );
}

function MermaidArt() {
  return (
    <g>
      {/* light rays */}
      <path d="M30,11 L20,60 L38,60 Z" fill="#ffffff" opacity="0.10" />
      <path d="M62,11 L52,64 L74,62 Z" fill="#ffffff" opacity="0.08" />
      {/* bubbles */}
      {[[24, 40], [30, 28], [72, 50], [78, 36], [68, 22]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4 + (i % 3) * 0.7} fill="none" stroke="#d8f0ec" strokeWidth="0.7" opacity="0.7" />
      ))}
      {/* rock */}
      <ellipse cx="38" cy="124" rx="26" ry="10" fill="#1e4a50" />
      {/* tail */}
      <path d="M36,122 Q28,104 44,92 Q58,82 56,70 L64,74 Q68,90 52,102 Q40,111 46,122 Z" fill="#2a8a80" />
      <path d="M36,124 Q28,128 22,124 Q26,120 30,116 Q33,120 36,124 Z" fill="#2a8a80" />
      <path d="M46,98 Q52,92 56,86" stroke="#1e6e66" strokeWidth="1" fill="none" />
      <path d="M42,108 Q48,102 53,96" stroke="#1e6e66" strokeWidth="1" fill="none" />
      {/* torso */}
      <path d="M56,70 Q54,58 58,52 L66,54 Q66,64 64,74 Z" fill="#e8c9a0" />
      {/* arm */}
      <path d="M58,58 Q48,60 42,54" stroke="#e8c9a0" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      {/* head */}
      <circle cx="62" cy="45" r="7.6" fill="#e8c9a0" />
      {/* flowing hair */}
      <path d="M56,40 Q52,30 62,28 Q74,28 72,42 Q74,56 68,66 Q70,54 66,48 Q70,38 62,35 Q56,36 56,44 Q54,52 57,60 Q52,52 56,40 Z" fill="#8a3a2a" />
      <circle cx="60" cy="45" r="1.3" fill="#24343a" />
      {/* shell top strap */}
      <path d="M57,55 Q61,57 65,55" stroke="#2a8a80" strokeWidth="1.6" fill="none" />
    </g>
  );
}

function SkullKingArt() {
  return (
    <g>
      {/* embers */}
      {[[20, 30], [30, 18], [72, 24], [82, 40], [78, 14]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#e86a2a" opacity="0.8" />
      ))}
      {/* crossed swords behind */}
      <path d="M22,38 L78,96 M78,38 L22,96" stroke="#8a7440" strokeWidth="2.6" strokeLinecap="round" opacity="0.65" />
      {/* shoulders */}
      <path d="M20,129 Q25,100 50,100 Q75,100 80,129 Z" fill="#14100c" />
      <path d="M24,108 L38,102 M76,108 L62,102" stroke="#c89a2e" strokeWidth="2.2" strokeLinecap="round" />
      {/* skull face */}
      <circle cx="50" cy="78" r="14.5" fill="#e8dcc0" />
      <path d="M38,84 Q40,94 50,94.6 Q60,94 62,84 L62,88 Q58,97 50,97.4 Q42,97 38,88 Z" fill="#c8b894" />
      {/* eye sockets w/ ember glow */}
      <circle cx="44" cy="76" r="3.6" fill="#0c0806" />
      <circle cx="56" cy="76" r="3.6" fill="#0c0806" />
      <circle cx="44" cy="76" r="1.2" fill="#e86a2a" />
      <circle cx="56" cy="76" r="1.2" fill="#e86a2a" />
      {/* nose + teeth */}
      <path d="M50,80 L48,85 L52,85 Z" fill="#0c0806" />
      <g fill="#0c0806">
        <rect x="43.5" y="88" width="2" height="4.6" rx="0.6" />
        <rect x="47" y="88.6" width="2" height="4.8" rx="0.6" />
        <rect x="50.6" y="88.6" width="2" height="4.8" rx="0.6" />
        <rect x="54.2" y="88" width="2" height="4.6" rx="0.6" />
      </g>
      {/* tricorn hat */}
      <path d="M26,64 Q34,38 50,38 Q66,38 74,64 Q64,58 50,58 Q36,58 26,64 Z" fill="#0e0a06" stroke="#c89a2e" strokeWidth="0.9" />
      <path d="M26,64 Q22,60 20,54 Q26,56 30,58 Z" fill="#0e0a06" />
      <path d="M74,64 Q78,60 80,54 Q74,56 70,58 Z" fill="#0e0a06" />
      {/* hat emblem */}
      <circle cx="50" cy="49" r="3.8" fill="#c89a2e" />
      <circle cx="48.8" cy="48.4" r="0.9" fill="#0e0a06" />
      <circle cx="51.2" cy="48.4" r="0.9" fill="#0e0a06" />
      <rect x="48.6" y="50.4" width="2.8" height="1.1" fill="#0e0a06" />
    </g>
  );
}

// ---------- banner ribbon for special cards ----------

function NameBanner({ label }: { label: string }) {
  return (
    <g>
      <path d="M12,111 L20,117.5 L12,124 L18,124 L18,111 Z" fill="#c9b284" stroke="#6e5a34" strokeWidth="0.7" />
      <path d="M88,111 L80,117.5 L88,124 L82,124 L82,111 Z" fill="#c9b284" stroke="#6e5a34" strokeWidth="0.7" />
      <path d="M17,110 Q50,106.5 83,110 L83,125 Q50,128.5 17,125 Z" fill="#efe3c2" stroke="#8a6a3a" strokeWidth="0.9" />
      <text
        x="50"
        y="118.4"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily='"Pirata One", cursive'
        fontSize="9.5"
        fill="#3a2410"
        letterSpacing="0.4"
      >
        {label}
      </text>
    </g>
  );
}

// ---------- the assembled card ----------

function CardArt({ card }: { card: CardModel }) {
  const uid = card.id.replace(/[^a-zA-Z0-9]/g, '');
  const rnd = mulberry32(hashSeed(card.id));
  const style = styleFor(card);
  const framePts = jaggedRectPoints(3.2, 3.2, 93.6, 133.6, 6, 1.7, rnd);
  const innerPts = jaggedRectPoints(10.5, 10.5, 79, 119, 6, 1.3, rnd);
  const isSpecial = card.kind !== 'suit';

  return (
    <svg viewBox="0 0 100 140" className="w-full h-full block" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-art`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={style.artTop} />
          <stop offset="100%" stopColor={style.artBottom} />
        </linearGradient>
        <radialGradient id={`${uid}-coin`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#f8e8a8" />
          <stop offset="55%" stopColor="#dcb64c" />
          <stop offset="100%" stopColor="#b8912a" />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#f8e8a8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f8e8a8" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <polygon points={innerPts} />
        </clipPath>
      </defs>

      {/* white card base */}
      <rect x="0.6" y="0.6" width="98.8" height="138.8" rx="6" fill="#f9f4e7" stroke="#cfc4a8" strokeWidth="1" />
      {/* ragged colored frame */}
      <polygon points={framePts} fill={style.frame} stroke={style.frameDark} strokeWidth="1" />
      {card.kind === 'skull_king' && <polygon points={framePts} fill="none" stroke="#c89a2e" strokeWidth="0.7" opacity="0.8" />}

      {/* art window */}
      <g clipPath={`url(#${uid}-clip)`}>
        <rect x="9" y="9" width="82" height="122" fill={`url(#${uid}-art)`} />
        {card.kind === 'suit' && card.suit === 'parrots' && <ParrotArt />}
        {card.kind === 'suit' && card.suit === 'chests' && <ChestArt uid={uid} />}
        {card.kind === 'suit' && card.suit === 'maps' && <MapArt />}
        {card.kind === 'suit' && card.suit === 'jolly_roger' && <JollyRogerArt />}
        {card.kind === 'pirate' && <PirateArt />}
        {card.kind === 'escape' && <EscapeArt />}
        {card.kind === 'mermaid' && <MermaidArt />}
        {card.kind === 'skull_king' && <SkullKingArt />}
        {isSpecial && style.label && <NameBanner label={style.label} />}
      </g>

      {/* corner medallions */}
      {card.kind === 'suit' ? (
        <>
          <NumberMedallion cx={16} cy={17} r={13} value={card.value} fontSize={card.value >= 10 ? 13 : 15.5} />
          <g transform="rotate(180 84 123)">
            <NumberMedallion cx={84} cy={123} r={11} value={card.value} fontSize={card.value >= 10 ? 11 : 13} />
          </g>
        </>
      ) : (
        <>
          <EmblemMedallion cx={15.5} cy={16.5} uid={uid} kind={card.kind} />
          <g transform="rotate(180 84.5 123.5)">
            <EmblemMedallion cx={84.5} cy={123.5} uid={uid} kind={card.kind} />
          </g>
        </>
      )}
    </svg>
  );
}

// ---------- public components ----------

export interface CardFaceProps {
  card: CardModel;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'w-12',
  md: 'w-16',
  lg: 'w-[5.4rem]',
};

export function CardFace({ card, size = 'md', selected, disabled, onClick, className = '' }: CardFaceProps) {
  const label = card.kind === 'suit' ? `${card.suit.replace('_', ' ')} ${card.value}` : card.kind.replace('_', ' ');
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-label={label}
      className={`relative flex-shrink-0 ${SIZE_CLASSES[size]} aspect-[5/7] rounded-md ${
        selected ? '-translate-y-3 drop-shadow-[0_0_10px_rgba(200,154,46,0.8)]' : 'drop-shadow-[0_3px_5px_rgba(40,24,8,0.5)]'
      } ${onClick && !disabled ? 'active:scale-95 active:-translate-y-1 cursor-pointer' : ''} ${
        disabled ? 'opacity-45 saturate-50' : ''
      } transition-all duration-150 select-none ${className}`}
    >
      <CardArt card={card} />
    </button>
  );
}

export function CardBack({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <div className={`flex-shrink-0 ${SIZE_CLASSES[size]} aspect-[5/7] drop-shadow-[0_3px_5px_rgba(40,24,8,0.5)] ${className}`}>
      <svg viewBox="0 0 100 140" className="w-full h-full block" aria-hidden="true">
        <defs>
          <radialGradient id="ckback-coin" cx="40%" cy="34%" r="75%">
            <stop offset="0%" stopColor="#f2d888" />
            <stop offset="55%" stopColor="#cfa63c" />
            <stop offset="100%" stopColor="#96751e" />
          </radialGradient>
        </defs>
        <rect x="0.6" y="0.6" width="98.8" height="138.8" rx="6" fill="#0e0b08" stroke="#3a2e1c" strokeWidth="1" />
        <rect x="5" y="5" width="90" height="130" rx="4" fill="none" stroke="#a3812c" strokeWidth="1.2" />
        <rect x="8.5" y="8.5" width="83" height="123" rx="3" fill="none" stroke="#6e5212" strokeWidth="0.7" />
        <text x="50" y="30" textAnchor="middle" fontFamily='"Pirata One", cursive' fontSize="17" fill="#cfa63c" letterSpacing="1.5">
          SKULL
        </text>
        <text x="50" y="122" textAnchor="middle" fontFamily='"Pirata One", cursive' fontSize="17" fill="#cfa63c" letterSpacing="2.5">
          KING
        </text>
        {/* gold doubloon */}
        <circle cx="50" cy="70" r="26" fill="url(#ckback-coin)" stroke="#6e5212" strokeWidth="1.6" />
        <circle cx="50" cy="70" r="22" fill="none" stroke="#7a5c16" strokeWidth="0.8" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * Math.PI) / 12;
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * 23}
              y1={70 + Math.sin(a) * 23}
              x2={50 + Math.cos(a) * 25.5}
              y2={70 + Math.sin(a) * 25.5}
              stroke="#6e5212"
              strokeWidth="1"
            />
          );
        })}
        {/* embossed skull with crown */}
        <path d="M40,56 L44,60 L47,55 L50,60 L53,55 L56,60 L60,56 L59,63 L41,63 Z" fill="#6e5212" />
        <circle cx="50" cy="72" r="10.5" fill="#6e5212" />
        <circle cx="46" cy="70.5" r="2.6" fill="url(#ckback-coin)" />
        <circle cx="54" cy="70.5" r="2.6" fill="url(#ckback-coin)" />
        <path d="M48.6,76 L50,79 L51.4,76 Z" fill="url(#ckback-coin)" />
        <path d="M38,85 L62,93 M62,85 L38,93" stroke="#6e5212" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
