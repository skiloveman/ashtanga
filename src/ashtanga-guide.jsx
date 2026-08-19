import React, { useState, useMemo, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────
   아쉬탕가 가이드 — 심야 수련 톤
   · 3개 레벨 전체 시퀀스 (초급/중급/상급)
   · 자세 상세 모달 (진입 단계 · 흔한 실수)
   · 호흡 타이머 수련 모드 (자동 진행)
   ───────────────────────────────────────────── */

const C = {
  bg: "#12171E", card: "#1A212B", cardEdge: "#242E3A",
  ink: "#E9E6DC", sub: "#8B95A0",
  amber: "#D9A05B", amberDim: "rgba(217,160,91,0.12)",
  jade: "#9DBBAA", line: "#2A3441", danger: "#C97B6B",
};

/* ── 플랫 일러스트 피겨 SVG ── */
const FIG_C = {
  skin: "#EFE8D8", skin2: "#DCD2BC",
  pants: "#7FABA6", pants2: "#699693",
  top: "#D9A05B", hair: "#8A7360",
};
const Fig = ({ d, size = 96, glow = false }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
    <line x1="8" y1="90" x2="92" y2="90" stroke={C.line} strokeWidth="2" />
    <g style={glow ? { filter: "drop-shadow(0 0 7px rgba(217,160,91,0.4))" } : undefined}>
      {d.map((el, i) => {
        if (el.c) return <circle key={i} cx={el.c[0]} cy={el.c[1]} r={el.c[2]} fill={FIG_C[el.k]} />;
        const common = { key: i, stroke: FIG_C[el.k], strokeWidth: el.w, strokeLinecap: "round", fill: "none" };
        if (el.l) return <line {...common} x1={el.l[0]} y1={el.l[1]} x2={el.l[2]} y2={el.l[3]} />;
        if (el.p) return <path {...common} d={el.p} />;
        return null;
      })}
    </g>
  </svg>
);

/* ── 사진 우선, 없으면 스틱 피겨 ──
   자세 데이터에 photo: "https://..." 필드를 추가하면 사진이 표시되고,
   photo가 없거나 로딩에 실패하면 자동으로 스틱 피겨로 대체됩니다.
   예) { fig: F.trikonasana, photo: "https://images.unsplash.com/...", sk: "...", ... } */
const PoseVisual = ({ pose, size = 96, glow = false }) => {
  const [failed, setFailed] = useState(false);
  if (pose.photo && !failed) {
    return (
      <img
        src={pose.photo}
        alt={pose.ko || pose.name || ""}
        onError={() => setFailed(true)}
        loading="lazy"
        style={{
          width: size, height: size, objectFit: "cover", borderRadius: 12,
          border: `1px solid ${C.cardEdge}`, flexShrink: 0,
          ...(glow ? { boxShadow: "0 0 14px rgba(157,187,170,0.35)" } : {}),
        }}
      />
    );
  }
  return <Fig d={pose.fig} size={size} glow={glow} />;
};

/* 자세별 피겨 정의 — 플랫 일러스트 (k: 부위 색, w: 선 굵기) */
const F = {
  samasthiti: [{ l: [53, 50, 53, 68], k: "pants2", w: 9 }, { l: [53, 68, 53, 88], k: "skin2", w: 7 }, { l: [50, 30, 50, 52], k: "top", w: 11 }, { l: [48, 50, 48, 68], k: "pants", w: 9 }, { l: [48, 68, 48, 88], k: "skin", w: 7 }, { l: [51, 35, 56, 58], k: "skin2", w: 6.5 }, { l: [49, 35, 44, 58], k: "skin", w: 6.5 }, { c: [50, 21, 7], k: "skin" }, { c: [56, 18, 4], k: "hair" }],
  urdhvaHasta: [{ l: [53, 52, 53, 69], k: "pants2", w: 9 }, { l: [53, 69, 53, 88], k: "skin2", w: 7 }, { l: [50, 33, 50, 54], k: "top", w: 11 }, { l: [48, 52, 48, 69], k: "pants", w: 9 }, { l: [48, 69, 48, 88], k: "skin", w: 7 }, { l: [52, 38, 58, 13], k: "skin2", w: 6.5 }, { l: [49, 38, 42, 13], k: "skin", w: 6.5 }, { c: [50, 24, 7], k: "skin" }, { c: [56, 21, 4], k: "hair" }],
  uttanasana: [{ l: [58, 47, 58, 68], k: "pants2", w: 9 }, { l: [58, 68, 58, 88], k: "skin2", w: 7 }, { l: [53, 60, 52, 87], k: "skin2", w: 6.5 }, { p: "M56 46 Q46 52 42 64", k: "top", w: 11 }, { l: [54, 47, 54, 68], k: "pants", w: 9 }, { l: [54, 68, 54, 88], k: "skin", w: 7 }, { l: [51, 58, 49, 87], k: "skin", w: 6.5 }, { c: [41, 75, 6.5], k: "skin" }, { c: [37, 80, 3.5], k: "hair" }],
  chaturanga: [{ l: [58, 62, 72, 63], k: "pants", w: 9 }, { l: [72, 63, 86, 69], k: "skin", w: 7 }, { p: "M44 62 L39 74 L37 86", k: "skin2", w: 6.5 }, { l: [38, 60, 58, 62], k: "top", w: 11 }, { p: "M40 62 L34 74 L33 86", k: "skin", w: 6.5 }, { c: [29, 57, 6.5], k: "skin" }, { c: [25, 52, 3.5], k: "hair" }],
  upDog: [{ l: [58, 66, 72, 70], k: "pants", w: 9 }, { l: [72, 70, 86, 74], k: "skin", w: 7 }, { l: [40, 50, 39, 74], k: "skin2", w: 6.5 }, { p: "M58 66 Q46 58 37 47", k: "top", w: 11 }, { l: [37, 48, 34, 73], k: "skin", w: 6.5 }, { c: [35, 39, 7], k: "skin" }, { c: [41, 36, 4], k: "hair" }],
  downDog: [{ l: [54, 38, 45, 60], k: "pants2", w: 9 }, { l: [45, 60, 31, 86], k: "skin2", w: 7 }, { l: [64, 60, 79, 84], k: "skin2", w: 6.5 }, { l: [52, 36, 41, 59], k: "pants", w: 9 }, { l: [41, 59, 26, 85], k: "skin", w: 7 }, { l: [52, 36, 66, 58], k: "top", w: 11 }, { l: [66, 58, 82, 83], k: "skin", w: 6.5 }, { c: [61, 71, 7], k: "skin" }, { c: [67, 76, 4], k: "hair" }],
  trikonasana: [{ l: [52, 51, 64, 68], k: "pants2", w: 9 }, { l: [64, 68, 73, 88], k: "skin2", w: 7 }, { l: [50, 50, 38, 68], k: "pants", w: 9 }, { l: [38, 68, 29, 88], k: "skin", w: 7 }, { l: [50, 50, 34, 43], k: "top", w: 11 }, { l: [34, 43, 29, 67], k: "skin", w: 6.5 }, { l: [34, 43, 39, 17], k: "skin", w: 6.5 }, { c: [29, 36, 7], k: "skin" }, { c: [23, 39, 4], k: "hair" }],
  parivrttaTrik: [{ l: [52, 51, 64, 68], k: "pants2", w: 9 }, { l: [64, 68, 73, 88], k: "skin2", w: 7 }, { l: [50, 50, 38, 68], k: "pants", w: 9 }, { l: [38, 68, 29, 88], k: "skin", w: 7 }, { l: [50, 50, 34, 44], k: "top", w: 11 }, { l: [34, 44, 37, 68], k: "skin2", w: 6.5 }, { l: [34, 44, 27, 19], k: "skin", w: 6.5 }, { c: [30, 37, 7], k: "skin" }, { c: [36, 34, 4], k: "hair" }],
  parsvakonasana: [{ l: [52, 53, 66, 66], k: "pants2", w: 9 }, { l: [66, 66, 78, 88], k: "skin2", w: 7 }, { l: [50, 52, 32, 62], k: "pants", w: 9 }, { l: [32, 62, 31, 88], k: "skin", w: 7 }, { l: [50, 52, 34, 42], k: "top", w: 11 }, { l: [36, 44, 32, 62], k: "skin2", w: 6.5 }, { l: [34, 42, 15, 25], k: "skin", w: 6.5 }, { c: [28, 36, 6.5], k: "skin" }, { c: [22, 39, 3.5], k: "hair" }],
  prasarita: [{ l: [50, 46, 64, 64], k: "pants2", w: 9 }, { l: [64, 64, 73, 88], k: "skin2", w: 7 }, { l: [50, 46, 36, 64], k: "pants", w: 9 }, { l: [36, 64, 27, 88], k: "skin", w: 7 }, { l: [50, 46, 50, 63], k: "top", w: 11 }, { l: [50, 56, 57, 85], k: "skin2", w: 6.5 }, { l: [50, 56, 43, 85], k: "skin", w: 6.5 }, { c: [50, 77, 6.5], k: "skin" }, { c: [50, 84, 3.5], k: "hair" }],
  parsvottanasana: [{ l: [53, 50, 62, 66], k: "pants2", w: 9 }, { l: [62, 66, 70, 88], k: "skin2", w: 7 }, { l: [52, 50, 42, 68], k: "pants", w: 9 }, { l: [42, 68, 34, 88], k: "skin", w: 7 }, { p: "M52 50 Q42 50 34 60", k: "top", w: 11 }, { l: [42, 54, 35, 82], k: "skin", w: 6.5 }, { c: [31, 64, 6.5], k: "skin" }, { c: [27, 69, 3.5], k: "hair" }],
  utthitaHasta: [{ l: [48, 50, 48, 68], k: "pants2", w: 9 }, { l: [48, 68, 48, 88], k: "skin2", w: 7 }, { l: [48, 31, 48, 52], k: "top", w: 11 }, { l: [48, 50, 64, 50], k: "pants", w: 9 }, { l: [64, 50, 78, 51], k: "skin", w: 7 }, { l: [48, 36, 44, 52], k: "skin2", w: 6.5 }, { l: [48, 36, 77, 49], k: "skin", w: 6.5 }, { c: [48, 22, 7], k: "skin" }, { c: [54, 19, 4], k: "hair" }],
  ardhaBaddhaStand: [{ p: "M53 50 L64 58", k: "pants2", w: 9 }, { p: "M64 58 L53 63", k: "skin2", w: 7 }, { l: [53, 50, 53, 68], k: "pants", w: 9 }, { l: [53, 68, 53, 88], k: "skin", w: 7 }, { p: "M53 50 Q45 58 41 74", k: "top", w: 11 }, { l: [47, 62, 42, 88], k: "skin", w: 6.5 }, { c: [40, 79, 6.5], k: "skin" }, { c: [36, 84, 3.5], k: "hair" }],
  utkatasana: [{ l: [58, 56, 46, 70], k: "pants2", w: 9 }, { l: [46, 70, 50, 88], k: "skin2", w: 7 }, { l: [44, 32, 56, 54], k: "top", w: 11 }, { l: [56, 54, 42, 68], k: "pants", w: 9 }, { l: [42, 68, 46, 88], k: "skin", w: 7 }, { l: [47, 37, 37, 11], k: "skin2", w: 6.5 }, { l: [45, 36, 31, 13], k: "skin", w: 6.5 }, { c: [42, 25, 7], k: "skin" }, { c: [48, 21, 4], k: "hair" }],
  warrior: [{ l: [52, 52, 64, 68], k: "pants2", w: 9 }, { l: [64, 68, 74, 88], k: "skin2", w: 7 }, { l: [50, 32, 50, 53], k: "top", w: 11 }, { l: [50, 52, 33, 63], k: "pants", w: 9 }, { l: [33, 63, 33, 88], k: "skin", w: 7 }, { l: [50, 36, 56, 12], k: "skin2", w: 6.5 }, { l: [50, 36, 44, 12], k: "skin", w: 6.5 }, { c: [50, 24, 7], k: "skin" }, { c: [56, 22, 4], k: "hair" }],
  warriorB: [{ l: [52, 52, 66, 68], k: "pants2", w: 9 }, { l: [66, 68, 77, 88], k: "skin2", w: 7 }, { l: [50, 52, 33, 64], k: "pants", w: 9 }, { l: [33, 64, 33, 88], k: "skin", w: 7 }, { l: [50, 52, 50, 32], k: "top", w: 11 }, { l: [50, 37, 25, 39], k: "skin", w: 6.5 }, { l: [50, 37, 75, 39], k: "skin2", w: 6.5 }, { c: [50, 23, 7], k: "skin" }, { c: [57, 21, 4], k: "hair" }],
  dandasana: [{ l: [38, 80, 58, 79], k: "pants", w: 9 }, { l: [58, 79, 80, 78], k: "skin", w: 7 }, { l: [38, 56, 38, 80], k: "top", w: 11 }, { l: [38, 64, 41, 82], k: "skin", w: 6.5 }, { c: [38, 48, 7], k: "skin" }, { c: [44, 45, 4], k: "hair" }],
  paschimottanasana: [{ l: [37, 81, 58, 79], k: "pants", w: 9 }, { l: [58, 79, 80, 78], k: "skin", w: 7 }, { p: "M37 80 Q47 60 61 68", k: "top", w: 11 }, { l: [54, 70, 77, 75], k: "skin", w: 6.5 }, { c: [66, 72, 6.5], k: "skin" }, { c: [71, 66, 3.5], k: "hair" }],
  purvottanasana: [{ l: [32, 52, 52, 66], k: "top", w: 11 }, { l: [52, 66, 65, 74], k: "pants", w: 9 }, { l: [65, 74, 78, 84], k: "skin", w: 7 }, { l: [32, 52, 30, 84], k: "skin", w: 6.5 }, { c: [30, 45, 7], k: "skin" }, { c: [24, 44, 4], k: "hair" }],
  januSirsasana: [{ p: "M38 80 L30 71", k: "pants2", w: 9 }, { p: "M30 71 L25 82", k: "skin2", w: 7 }, { l: [38, 80, 56, 79], k: "pants", w: 9 }, { l: [56, 79, 78, 77], k: "skin", w: 7 }, { p: "M38 80 Q48 62 60 68", k: "top", w: 11 }, { l: [54, 70, 76, 74], k: "skin", w: 6.5 }, { c: [65, 71, 6.5], k: "skin" }, { c: [70, 66, 3.5], k: "hair" }],
  marichyasana: [{ l: [40, 80, 58, 79], k: "pants2", w: 9 }, { l: [58, 79, 78, 78], k: "skin2", w: 7 }, { p: "M40 80 L52 58", k: "pants", w: 9 }, { p: "M52 58 L55 80", k: "skin", w: 7 }, { l: [42, 56, 40, 80], k: "top", w: 11 }, { l: [42, 60, 55, 63], k: "skin", w: 6.5 }, { c: [43, 49, 6.5], k: "skin" }, { c: [38, 46, 3.5], k: "hair" }],
  marichyC: [{ l: [42, 80, 58, 79], k: "pants2", w: 9 }, { l: [58, 79, 78, 78], k: "skin2", w: 7 }, { p: "M42 80 L54 58", k: "pants", w: 9 }, { p: "M54 58 L57 80", k: "skin", w: 7 }, { l: [43, 56, 42, 80], k: "top", w: 11 }, { l: [43, 60, 29, 68], k: "skin2", w: 6.5 }, { l: [43, 60, 59, 62], k: "skin", w: 6.5 }, { c: [45, 49, 6.5], k: "skin" }, { c: [51, 47, 3.5], k: "hair" }],
  navasana: [{ l: [50, 74, 62, 56], k: "pants", w: 9 }, { l: [62, 56, 72, 44], k: "skin", w: 7 }, { l: [50, 74, 38, 48], k: "top", w: 11 }, { l: [42, 56, 62, 52], k: "skin", w: 6.5 }, { c: [36, 41, 6.5], k: "skin" }, { c: [30, 40, 3.5], k: "hair" }],
  bhujapidasana: [{ l: [58, 58, 60, 86], k: "skin2", w: 6.5 }, { l: [50, 44, 50, 58], k: "top", w: 10 }, { p: "M50 56 Q68 52 68 64", k: "pants2", w: 9 }, { p: "M68 64 L64 76", k: "skin2", w: 7 }, { p: "M50 56 Q32 52 32 64", k: "pants", w: 9 }, { p: "M32 64 L36 76", k: "skin", w: 7 }, { l: [44, 58, 42, 86], k: "skin", w: 6.5 }, { c: [50, 37, 6.5], k: "skin" }, { c: [50, 30, 3.5], k: "hair" }],
  kurmasana: [{ l: [56, 76, 68, 72], k: "pants2", w: 9 }, { l: [68, 72, 84, 68], k: "skin2", w: 7 }, { l: [38, 78, 15, 83], k: "skin2", w: 6.5 }, { p: "M32 78 Q44 70 54 76", k: "top", w: 10 }, { l: [54, 77, 67, 74], k: "pants", w: 9 }, { l: [67, 74, 83, 71], k: "skin", w: 7 }, { l: [36, 77, 13, 80], k: "skin", w: 6.5 }, { c: [26, 74, 6], k: "skin" }, { c: [21, 70, 3.5], k: "hair" }],
  garbha: [{ p: "M46 48 Q34 62 46 76 Q58 84 62 66", k: "top", w: 11 }, { p: "M50 58 Q62 56 58 70", k: "pants", w: 9 }, { l: [46, 63, 56, 61], k: "skin", w: 6.5 }, { c: [50, 40, 7], k: "skin" }, { c: [56, 37, 4], k: "hair" }],
  baddhaKonasana: [{ p: "M50 76 L68 68", k: "pants2", w: 9 }, { p: "M68 68 L54 84", k: "skin2", w: 7 }, { l: [50, 50, 50, 76], k: "top", w: 11 }, { p: "M50 76 L32 68", k: "pants", w: 9 }, { p: "M32 68 L46 84", k: "skin", w: 7 }, { l: [50, 60, 49, 82], k: "skin", w: 6.5 }, { c: [50, 42, 7], k: "skin" }, { c: [56, 39, 4], k: "hair" }],
  upavistha: [{ l: [50, 76, 68, 81], k: "pants2", w: 9 }, { l: [68, 81, 82, 85], k: "skin2", w: 7 }, { l: [50, 76, 32, 81], k: "pants", w: 9 }, { l: [32, 81, 18, 85], k: "skin", w: 7 }, { l: [50, 76, 50, 58], k: "top", w: 11 }, { l: [50, 64, 78, 83], k: "skin2", w: 6.5 }, { l: [50, 64, 22, 83], k: "skin", w: 6.5 }, { c: [50, 50, 6.5], k: "skin" }, { c: [50, 43, 3.5], k: "hair" }],
  suptaPada: [{ l: [44, 82, 60, 82], k: "pants2", w: 9 }, { l: [60, 82, 76, 82], k: "skin2", w: 7 }, { l: [22, 82, 44, 82], k: "top", w: 11 }, { l: [44, 82, 50, 58], k: "pants", w: 9 }, { l: [50, 58, 54, 38], k: "skin", w: 7 }, { l: [30, 78, 52, 42], k: "skin", w: 6.5 }, { c: [15, 80, 6.5], k: "skin" }, { c: [10, 76, 3.5], k: "hair" }],
  setuBandha: [{ p: "M32 84 Q46 62 60 72", k: "top", w: 11 }, { p: "M60 72 L68 78", k: "pants", w: 9 }, { l: [68, 78, 72, 88], k: "skin", w: 7 }, { l: [36, 85, 52, 86], k: "skin", w: 6.5 }, { c: [26, 84, 6.5], k: "skin" }, { c: [21, 87, 3.5], k: "hair" }],
  utpluthih: [{ l: [62, 54, 62, 84], k: "skin2", w: 6.5 }, { l: [50, 36, 50, 56], k: "top", w: 11 }, { p: "M38 62 L50 55 L62 62", k: "pants", w: 8 }, { p: "M62 62 L50 68 L38 62", k: "skin", w: 6 }, { l: [38, 54, 38, 84], k: "skin", w: 6.5 }, { c: [50, 28, 7], k: "skin" }, { c: [56, 25, 4], k: "hair" }],
  wheel: [{ p: "M40 74 Q52 52 64 70", k: "top", w: 11 }, { l: [64, 70, 70, 78], k: "pants", w: 9 }, { l: [70, 78, 74, 88], k: "skin", w: 7 }, { l: [40, 74, 31, 87], k: "skin", w: 6.5 }, { c: [34, 81, 6.5], k: "skin" }, { c: [29, 85, 3.5], k: "hair" }],
  sarvangasana: [{ l: [50, 55, 52, 36], k: "pants2", w: 9 }, { l: [52, 36, 53, 16], k: "skin2", w: 7 }, { l: [46, 81, 49, 55], k: "top", w: 11 }, { l: [49, 55, 50, 36], k: "pants", w: 9 }, { l: [50, 36, 50, 16], k: "skin", w: 7 }, { l: [45, 84, 55, 66], k: "skin", w: 6.5 }, { c: [36, 85, 6.5], k: "skin" }, { c: [30, 87, 3.5], k: "hair" }],
  halasana: [{ l: [46, 82, 52, 62], k: "top", w: 11 }, { p: "M52 62 L38 70", k: "pants", w: 9 }, { p: "M38 70 L26 84", k: "skin", w: 7 }, { l: [47, 84, 64, 84], k: "skin", w: 6.5 }, { c: [37, 84, 6.5], k: "skin" }, { c: [31, 86, 3.5], k: "hair" }],
  matsyasana: [{ l: [54, 80, 66, 80], k: "pants", w: 9 }, { l: [66, 80, 80, 80], k: "skin", w: 7 }, { p: "M30 82 Q42 64 54 80", k: "top", w: 11 }, { l: [40, 82, 56, 84], k: "skin", w: 6.5 }, { c: [25, 82, 6.5], k: "skin" }, { c: [20, 86, 3.5], k: "hair" }],
  sirsasana: [{ l: [50, 48, 52, 30], k: "pants2", w: 9 }, { l: [52, 30, 53, 12], k: "skin2", w: 7 }, { l: [50, 76, 50, 48], k: "top", w: 11 }, { l: [50, 48, 49, 30], k: "pants", w: 9 }, { l: [49, 30, 48, 12], k: "skin", w: 7 }, { l: [37, 87, 63, 87], k: "skin", w: 6.5 }, { c: [50, 82, 6.5], k: "skin" }, { c: [44, 86, 3.5], k: "hair" }],
  padmasana: [{ l: [50, 42, 50, 66], k: "top", w: 11 }, { p: "M36 74 L50 66 L64 74", k: "pants", w: 8 }, { p: "M64 74 L50 80 L36 74", k: "skin", w: 6 }, { l: [50, 52, 62, 72], k: "skin2", w: 6.5 }, { l: [50, 52, 38, 72], k: "skin", w: 6.5 }, { c: [50, 34, 7], k: "skin" }, { c: [56, 31, 4], k: "hair" }],
  savasana: [{ l: [52, 82, 64, 82], k: "pants", w: 9 }, { l: [64, 82, 78, 83], k: "skin", w: 7 }, { l: [30, 82, 52, 82], k: "top", w: 11 }, { l: [38, 84, 49, 87], k: "skin", w: 6.5 }, { c: [22, 81, 6.5], k: "skin" }, { c: [17, 78, 3.5], k: "hair" }],
  pasasana: [{ p: "M58 74 L44 70", k: "pants2", w: 9 }, { l: [44, 70, 50, 88], k: "skin2", w: 7 }, { l: [48, 48, 56, 72], k: "top", w: 11 }, { p: "M56 72 L40 68", k: "pants", w: 9 }, { l: [40, 68, 46, 88], k: "skin", w: 7 }, { l: [48, 52, 62, 58], k: "skin2", w: 6.5 }, { p: "M48 52 Q34 58 42 70", k: "skin", w: 6.5 }, { c: [46, 41, 6.5], k: "skin" }, { c: [52, 38, 3.5], k: "hair" }],
  krounchasana: [{ p: "M44 80 L34 74", k: "pants2", w: 9 }, { p: "M34 74 L28 83", k: "skin2", w: 7 }, { l: [42, 50, 44, 80], k: "top", w: 11 }, { l: [44, 80, 54, 58], k: "pants", w: 9 }, { l: [54, 58, 62, 38], k: "skin", w: 7 }, { l: [42, 56, 58, 44], k: "skin", w: 6.5 }, { c: [41, 43, 6.5], k: "skin" }, { c: [35, 41, 3.5], k: "hair" }],
  shalabhasana: [{ p: "M24 70 Q36 74 48 76", k: "top", w: 11 }, { p: "M48 76 Q60 74 66 70", k: "pants", w: 9 }, { l: [66, 70, 80, 64], k: "skin", w: 7 }, { l: [30, 74, 46, 79], k: "skin", w: 6.5 }, { c: [18, 66, 6], k: "skin" }, { c: [13, 62, 3.5], k: "hair" }],
  dhanurasana: [{ p: "M28 68 Q42 82 56 80", k: "top", w: 11 }, { p: "M56 80 L66 70", k: "pants", w: 9 }, { p: "M66 70 L64 58", k: "skin", w: 7 }, { l: [30, 68, 63, 61], k: "skin", w: 6.5 }, { c: [24, 62, 6.5], k: "skin" }, { c: [19, 58, 3.5], k: "hair" }],
  ustrasana: [{ l: [46, 66, 46, 88], k: "pants", w: 9 }, { l: [46, 88, 64, 88], k: "skin", w: 7 }, { p: "M46 66 Q52 50 60 46", k: "top", w: 11 }, { l: [54, 56, 63, 84], k: "skin", w: 6.5 }, { c: [63, 41, 6.5], k: "skin" }, { c: [68, 45, 3.5], k: "hair" }],
  kapotasana: [{ l: [38, 64, 40, 88], k: "pants", w: 9 }, { l: [40, 88, 60, 88], k: "skin", w: 7 }, { p: "M38 64 Q50 34 66 74", k: "top", w: 11 }, { l: [46, 50, 62, 82], k: "skin", w: 6.5 }, { c: [64, 80, 6.5], k: "skin" }, { c: [69, 84, 3.5], k: "hair" }],
  bakasana: [{ l: [56, 58, 58, 88], k: "skin2", w: 6.5 }, { p: "M64 52 L56 62", k: "pants2", w: 9 }, { p: "M56 62 L62 68", k: "skin2", w: 7 }, { p: "M42 54 Q54 38 66 52", k: "top", w: 11 }, { p: "M68 54 L60 66", k: "pants", w: 9 }, { p: "M60 66 L66 72", k: "skin", w: 7 }, { l: [44, 58, 42, 88], k: "skin", w: 6.5 }, { c: [36, 52, 6.5], k: "skin" }, { c: [31, 48, 3.5], k: "hair" }],
  ekaPadaSirsa: [{ l: [46, 78, 62, 78], k: "pants2", w: 9 }, { l: [62, 78, 80, 78], k: "skin2", w: 7 }, { p: "M46 78 Q26 46 44 38", k: "pants", w: 9 }, { p: "M44 38 L54 41", k: "skin", w: 7 }, { l: [46, 52, 46, 78], k: "top", w: 11 }, { l: [41, 61, 52, 61], k: "skin", w: 6.5 }, { c: [47, 45, 6.5], k: "skin" }, { c: [53, 43, 3.5], k: "hair" }],
  yoganidra: [{ p: "M58 80 Q72 50 42 60", k: "pants2", w: 9 }, { p: "M42 60 Q32 64 38 72", k: "skin2", w: 7 }, { l: [34, 80, 58, 80], k: "top", w: 11 }, { p: "M56 82 Q70 58 44 66", k: "pants", w: 9 }, { p: "M44 66 Q36 70 40 76", k: "skin", w: 7 }, { l: [40, 84, 54, 84], k: "skin", w: 6.5 }, { c: [28, 78, 6.5], k: "skin" }, { c: [23, 74, 3.5], k: "hair" }],
  tittibhasana: [{ l: [56, 58, 58, 86], k: "skin2", w: 6.5 }, { l: [54, 56, 72, 50], k: "pants2", w: 9 }, { l: [72, 50, 86, 46], k: "skin2", w: 7 }, { l: [50, 46, 50, 58], k: "top", w: 10 }, { l: [48, 56, 30, 50], k: "pants", w: 9 }, { l: [30, 50, 14, 46], k: "skin", w: 7 }, { l: [44, 58, 42, 86], k: "skin", w: 6.5 }, { c: [50, 39, 6.5], k: "skin" }, { c: [50, 32, 3.5], k: "hair" }],
  pincha: [{ l: [50, 38, 54, 22], k: "pants2", w: 9 }, { l: [54, 22, 57, 11], k: "skin2", w: 7 }, { l: [47, 66, 50, 38], k: "top", w: 11 }, { l: [50, 38, 48, 22], k: "pants", w: 9 }, { l: [48, 22, 46, 10], k: "skin", w: 7 }, { l: [32, 87, 52, 87], k: "skin", w: 6.5 }, { l: [44, 87, 47, 66], k: "skin", w: 6.5 }, { c: [38, 78, 6.5], k: "skin" }, { c: [33, 82, 3.5], k: "hair" }],
  mayurasana: [{ l: [52, 58, 66, 58], k: "pants", w: 9 }, { l: [66, 58, 82, 58], k: "skin", w: 7 }, { l: [24, 58, 52, 58], k: "top", w: 11 }, { l: [44, 58, 44, 86], k: "skin", w: 6.5 }, { c: [18, 54, 6], k: "skin" }, { c: [13, 50, 3.5], k: "hair" }],
  gomukhasana: [{ p: "M48 78 L62 72", k: "pants2", w: 9 }, { p: "M62 72 L52 84", k: "skin2", w: 7 }, { l: [48, 44, 48, 76], k: "top", w: 11 }, { p: "M48 78 L34 72", k: "pants", w: 9 }, { p: "M34 72 L44 84", k: "skin", w: 7 }, { p: "M48 50 L58 43", k: "skin2", w: 6.5 }, { p: "M48 68 L57 58", k: "skin", w: 6.5 }, { c: [48, 36, 7], k: "skin" }, { c: [54, 33, 4], k: "hair" }],
  vasistha: [{ l: [26, 86, 38, 74], k: "skin2", w: 7 }, { l: [38, 74, 50, 62], k: "pants", w: 9 }, { l: [50, 62, 66, 46], k: "top", w: 11 }, { l: [66, 46, 59, 86], k: "skin", w: 6.5 }, { l: [66, 46, 72, 25], k: "skin", w: 6.5 }, { c: [72, 40, 6.5], k: "skin" }, { c: [78, 38, 3.5], k: "hair" }],
  koundinya: [{ l: [54, 58, 56, 86], k: "skin2", w: 6.5 }, { l: [42, 52, 58, 54], k: "top", w: 10 }, { l: [58, 54, 72, 50], k: "pants", w: 9 }, { l: [72, 50, 86, 48], k: "skin", w: 7 }, { l: [44, 56, 42, 86], k: "skin", w: 6.5 }, { c: [36, 47, 6.5], k: "skin" }, { c: [31, 43, 3.5], k: "hair" }],
  astavakra: [{ l: [54, 58, 56, 86], k: "skin2", w: 6.5 }, { l: [56, 56, 70, 61], k: "pants2", w: 9 }, { l: [70, 61, 82, 67], k: "skin2", w: 7 }, { l: [42, 50, 56, 54], k: "top", w: 10 }, { l: [56, 53, 72, 57], k: "pants", w: 9 }, { l: [72, 57, 84, 62], k: "skin", w: 7 }, { l: [44, 56, 42, 86], k: "skin", w: 6.5 }, { c: [36, 45, 6.5], k: "skin" }, { c: [31, 41, 3.5], k: "hair" }],
  viparitaDanda: [{ p: "M40 70 Q50 40 66 70", k: "top", w: 11 }, { l: [66, 70, 74, 78], k: "pants", w: 9 }, { l: [74, 78, 80, 88], k: "skin", w: 7 }, { l: [24, 87, 42, 87], k: "skin", w: 6.5 }, { l: [36, 87, 40, 70], k: "skin", w: 6.5 }, { c: [30, 80, 6.5], k: "skin" }, { c: [25, 84, 3.5], k: "hair" }],
  hanumanasana: [{ l: [50, 74, 66, 80], k: "pants2", w: 9 }, { l: [66, 80, 84, 84], k: "skin2", w: 7 }, { l: [50, 42, 50, 74], k: "top", w: 11 }, { l: [50, 74, 32, 80], k: "pants", w: 9 }, { l: [32, 80, 16, 84], k: "skin", w: 7 }, { l: [50, 48, 56, 24], k: "skin2", w: 6.5 }, { l: [50, 48, 44, 24], k: "skin", w: 6.5 }, { c: [50, 34, 7], k: "skin" }, { c: [56, 31, 4], k: "hair" }],
  natarajasana: [{ p: "M48 52 Q62 60 66 48", k: "pants2", w: 9 }, { p: "M66 48 Q68 38 64 32", k: "skin2", w: 7 }, { l: [46, 30, 48, 52], k: "top", w: 11 }, { l: [48, 52, 48, 70], k: "pants", w: 9 }, { l: [48, 70, 48, 88], k: "skin", w: 7 }, { p: "M46 34 Q58 40 64 34", k: "skin2", w: 6.5 }, { l: [46, 34, 30, 26], k: "skin", w: 6.5 }, { c: [45, 22, 7], k: "skin" }, { c: [51, 19, 4], k: "hair" }],
  rajaKapota: [{ p: "M42 84 Q60 82 68 62", k: "pants2", w: 9 }, { p: "M68 62 Q68 50 60 46", k: "skin2", w: 7 }, { p: "M42 84 L28 78", k: "pants", w: 9 }, { p: "M28 78 L20 86", k: "skin", w: 7 }, { p: "M42 84 Q42 56 48 50", k: "top", w: 11 }, { p: "M46 54 Q58 42 62 48", k: "skin", w: 6.5 }, { c: [50, 44, 6.5], k: "skin" }, { c: [56, 46, 3.5], k: "hair" }],
};

/* ═══════════ 다국어 (i18n) ═══════════
   lang: "ko" | "en" — 언어 추가 시 STR/META/EN에 항목을 더하면 됩니다. */
const STR = {
  ko: {
    heroT1: "해 뜨기 전의 고요 속에서,", heroT2: "호흡을 따라가는 수련",
    heroDesc: "아쉬탕가는 매번 같은 순서로 수련합니다. 그래서 혼자서도 할 수 있습니다. 자세를 눌러 진입 단계와 흔한 실수를 확인하고, 준비되면 수련 모드로 호흡을 따라가 보세요.",
    pillars: [
      ["우자이 호흡", "코로 마시고 내쉬며, 목 뒤에서 파도 소리를 냅니다. 호흡이 수련의 메트로놈입니다."],
      ["드리쉬티", "자세마다 정해진 응시점이 있습니다. 시선이 고정되면 마음도 고정됩니다."],
      ["반다", "아랫배(웃디야나)와 골반저(물라)를 가볍게 조여 몸의 중심을 지킵니다."],
    ],
    startPractice: "🕯 수련 모드 시작", helpOn: "🌙 도움말 켜짐", helpOff: "도움말 꺼짐",
    suryaNav: "태양경배", suryaTitle: "수리야 나마스카라 A",
    suryaDesc: "어느 레벨이든 수련은 태양경배로 시작합니다. A를 5회, B를 3~5회. 동작 하나에 호흡 하나 — 이것이 빈야사입니다.",
    suryaBeg: " (처음엔 3회부터 시작해도 좋아요)",
    breaths: (n) => `호흡 ${n}회`, drishtiChip: (d) => `응시점 · ${d}`, detailChip: "상세 보기 →",
    stepsH: "진입 단계", mistakesH: "흔한 실수", closeL: "닫기",
    progress: (tab, a, b) => `${tab} 수련 ${a} / ${b}`,
    finishBtn: "수련 마치기 ✕", ofPractice: (tab) => `${tab} 수련`,
    breathing: "호흡", pausedTxt: "일시 정지", nextPrefix: "다음 · ",
    prevB: "← 이전", pauseB: "❚❚ 정지", resumeB: "▶ 재개", nextB: "다음 →",
    paceL: "호흡 속도",
    paceOpts: [[4, "빠르게 · 4초"], [5, "보통 · 5초"], [6, "느리게 · 6초"], [8, "아주 느리게 · 8초"]],
    finishedMsg: "수련을 마쳤습니다. 사바사나로 쉬세요.", sunSal: "태양경배",
    footT: "혼자 수련하는 분께",
    footB: "아쉬탕가는 다음 자세로 '진도를 나가는' 수련이 아니라, 지금 자세에서 호흡이 편안해지는 수련입니다. 통증이 있으면 멈추는 것도 수련입니다. 매일 전체를 다 할 필요 없이, 태양경배만으로 시작해 몸이 순서를 기억하면 자세를 하나씩 더해 가세요. 전통적으로 토요일과 문데이(보름·그믐)는 쉽니다.",
    medNote: "본 사이트의 모든 내용은 일반적인 정보 제공을 위한 것으로, 의학적 조언을 대신하지 않습니다. 새로운 운동을 시작하기 전에는 의사와 상담하세요.",
    cookieMsg: "이 사이트는 서비스 개선과 광고 게재(Google AdSense)를 위해 쿠키를 사용합니다. 계속 이용하시면 쿠키 사용에 동의하는 것으로 간주됩니다.",
    okL: "확인", langLabel: "언어 선택", langWord: "언어",
    pageNav: { about: "소개", privacy: "개인정보처리방침", terms: "이용약관", contact: "문의" },
  },
  en: {
    heroT1: "In the stillness before sunrise,", heroT2: "a practice that follows the breath",
    heroDesc: "Ashtanga is practiced in the same sequence every time — which is exactly why you can practice it alone. Tap any pose for entry steps and common mistakes, and when you're ready, let Practice Mode pace your breath.",
    pillars: [
      ["Ujjayi Breath", "Breathe through the nose with a soft ocean sound at the back of the throat. The breath is the metronome of the practice."],
      ["Drishti", "Each pose has a fixed gazing point. When the gaze steadies, the mind steadies."],
      ["Bandha", "Gently engage the lower belly (uddiyana) and pelvic floor (mula) to protect your center."],
    ],
    startPractice: "🕯 Start Practice Mode", helpOn: "🌙 Tips on", helpOff: "Tips off",
    suryaNav: "Sun Salutation", suryaTitle: "Surya Namaskara A",
    suryaDesc: "Every level begins with Sun Salutations — five rounds of A, three to five of B. One movement, one breath: this is vinyasa.",
    suryaBeg: " (Three rounds is a fine start.)",
    breaths: (n) => `${n} breaths`, drishtiChip: (d) => `Gaze · ${d}`, detailChip: "Details →",
    stepsH: "How to Enter", mistakesH: "Common Mistakes", closeL: "Close",
    progress: (tab, a, b) => `${tab} practice ${a} / ${b}`,
    finishBtn: "End practice ✕", ofPractice: (tab) => `${tab} practice`,
    breathing: "Breathe", pausedTxt: "Paused", nextPrefix: "Next · ",
    prevB: "← Prev", pauseB: "❚❚ Pause", resumeB: "▶ Resume", nextB: "Next →",
    paceL: "Breath pace",
    paceOpts: [[4, "Fast · 4s"], [5, "Normal · 5s"], [6, "Slow · 6s"], [8, "Very slow · 8s"]],
    finishedMsg: "Practice complete. Rest in savasana.", sunSal: "Sun Salutation",
    footT: "For those who practice alone",
    footB: "Ashtanga is not about advancing to the next pose — it is about breathing comfortably in this one. Stopping when something hurts is also practice. You don't need the full series every day: begin with Sun Salutations, and add poses one by one as your body memorizes the order. Traditionally, Saturdays and moon days are rest days.",
    medNote: "All content on this site is for general information only and is not a substitute for medical advice. Consult a physician before beginning any new exercise program.",
    cookieMsg: "This site uses cookies to improve the service and to serve ads via Google AdSense. By continuing to use the site, you consent to the use of cookies.",
    okL: "OK", langLabel: "Select language", langWord: "Language",
    pageNav: { about: "About", privacy: "Privacy Policy", terms: "Terms of Use", contact: "Contact" },
  },
  es: {
    heroT1: "En la quietud antes del amanecer,", heroT2: "una práctica que sigue la respiración",
    heroDesc: "El Ashtanga se practica siempre en la misma secuencia — por eso puedes practicarlo solo. Toca una postura para ver los pasos de entrada y los errores comunes y, cuando estés listo, deja que el Modo Práctica marque tu respiración.",
    pillars: [
      ["Respiración Ujjayi", "Respira por la nariz con un suave sonido de océano en la garganta. La respiración es el metrónomo de la práctica."],
      ["Drishti", "Cada postura tiene un punto de mirada fijo. Cuando la mirada se aquieta, la mente se aquieta."],
      ["Bandha", "Activa suavemente el bajo vientre (uddiyana) y el suelo pélvico (mula) para proteger tu centro."],
    ],
    startPractice: "🕯 Iniciar práctica", helpOn: "🌙 Consejos activados", helpOff: "Consejos desactivados",
    suryaNav: "Saludo al sol", suryaTitle: "Surya Namaskara A",
    suryaDesc: "Cada nivel comienza con saludos al sol: cinco rondas de A, de tres a cinco de B. Un movimiento, una respiración: esto es vinyasa.",
    suryaBeg: " (Tres rondas es un buen comienzo.)",
    breaths: (n) => `${n} respiraciones`, drishtiChip: (d) => `Mirada · ${d}`, detailChip: "Detalles →",
    stepsH: "Cómo entrar", mistakesH: "Errores comunes", closeL: "Cerrar",
    progress: (tab, a, b) => `Práctica ${tab} ${a} / ${b}`,
    finishBtn: "Terminar ✕", ofPractice: (tab) => `Práctica ${tab}`,
    breathing: "Respira", pausedTxt: "En pausa", nextPrefix: "Siguiente · ",
    prevB: "← Anterior", pauseB: "❚❚ Pausa", resumeB: "▶ Continuar", nextB: "Siguiente →",
    paceL: "Ritmo", paceOpts: [[4, "Rápido · 4s"], [5, "Normal · 5s"], [6, "Lento · 6s"], [8, "Muy lento · 8s"]],
    finishedMsg: "Práctica completada. Descansa en savasana.", sunSal: "Saludo al sol",
    footT: "Para quien practica en solitario",
    footB: "El Ashtanga no consiste en avanzar a la siguiente postura, sino en respirar con comodidad en esta. Detenerse ante el dolor también es práctica. No necesitas la serie completa cada día: empieza con los saludos al sol y añade posturas una a una. Tradicionalmente se descansa los sábados y los días de luna.",
    medNote: "Todo el contenido de este sitio es informativo y no sustituye el consejo médico. Consulta a un médico antes de comenzar un nuevo programa de ejercicio.",
    cookieMsg: "Este sitio utiliza cookies para mejorar el servicio y mostrar anuncios de Google AdSense. Al continuar navegando, aceptas su uso.",
    okL: "Aceptar", langLabel: "Seleccionar idioma", langWord: "Idioma",
    tabs: { primary: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" },
    pageNav: { about: "Acerca de", privacy: "Política de privacidad", terms: "Términos de uso", contact: "Contacto" },
  },
  ja: {
    heroT1: "夜明け前の静けさの中で、", heroT2: "呼吸に導かれる練習",
    heroDesc: "アシュタンガは毎回同じ順序で練習します。だからこそ一人でも続けられます。ポーズをタップして入り方とよくある間違いを確認し、準備ができたら練習モードで呼吸に合わせて進みましょう。",
    pillars: [
      ["ウジャイ呼吸", "鼻から吸って吐き、喉の奥で波のような音を響かせます。呼吸が練習のメトロノームです。"],
      ["ドリシュティ", "ポーズごとに決められた視点があります。視線が定まると、心も定まります。"],
      ["バンダ", "下腹部（ウディヤナ）と骨盤底（ムーラ）を軽く引き締め、体の中心を守ります。"],
    ],
    startPractice: "🕯 練習モードを開始", helpOn: "🌙 ヒント表示中", helpOff: "ヒント非表示",
    suryaNav: "太陽礼拝", suryaTitle: "スーリヤ・ナマスカーラ A",
    suryaDesc: "どのレベルも練習は太陽礼拝から始まります。Aを5回、Bを3〜5回。ひとつの動きにひとつの呼吸 — これがヴィンヤサです。",
    suryaBeg: "（最初は3回からでも大丈夫です）",
    breaths: (n) => `呼吸${n}回`, drishtiChip: (d) => `視点 · ${d}`, detailChip: "詳細 →",
    stepsH: "入り方", mistakesH: "よくある間違い", closeL: "閉じる",
    progress: (tab, a, b) => `${tab}の練習 ${a} / ${b}`,
    finishBtn: "練習を終える ✕", ofPractice: (tab) => `${tab}の練習`,
    breathing: "呼吸", pausedTxt: "一時停止", nextPrefix: "次 · ",
    prevB: "← 前へ", pauseB: "❚❚ 停止", resumeB: "▶ 再開", nextB: "次へ →",
    paceL: "呼吸の速さ", paceOpts: [[4, "速い · 4秒"], [5, "普通 · 5秒"], [6, "ゆっくり · 6秒"], [8, "とてもゆっくり · 8秒"]],
    finishedMsg: "練習が終わりました。シャヴァーサナで休みましょう。", sunSal: "太陽礼拝",
    footT: "一人で練習する方へ",
    footB: "アシュタンガは次のポーズへ進む練習ではなく、今のポーズで呼吸が楽になる練習です。痛みがあれば止まることも練習のうち。毎日すべてを行う必要はありません。太陽礼拝から始めて、体が順序を覚えたらポーズをひとつずつ足していきましょう。伝統的に土曜日と満月・新月の日は休みます。",
    medNote: "本サイトの内容は一般的な情報提供を目的としており、医学的助言に代わるものではありません。新しい運動を始める前に医師にご相談ください。",
    cookieMsg: "本サイトはサービス向上と広告配信（Google AdSense）のためにCookieを使用します。継続してご利用いただくことで、Cookieの使用に同意したものとみなされます。",
    okL: "OK", langLabel: "言語を選択", langWord: "言語",
    tabs: { primary: "初級", intermediate: "中級", advanced: "上級" },
    pageNav: { about: "サイトについて", privacy: "プライバシーポリシー", terms: "利用規約", contact: "お問い合わせ" },
  },
  de: {
    heroT1: "In der Stille vor Sonnenaufgang,", heroT2: "eine Praxis, die dem Atem folgt",
    heroDesc: "Ashtanga wird immer in derselben Reihenfolge geübt — genau deshalb kannst du allein üben. Tippe auf eine Haltung für Einstiegsschritte und häufige Fehler, und lass den Übungsmodus deinen Atem führen, wenn du bereit bist.",
    pillars: [
      ["Ujjayi-Atmung", "Atme durch die Nase mit einem sanften Meeresrauschen im Rachen. Der Atem ist das Metronom der Praxis."],
      ["Drishti", "Jede Haltung hat einen festen Blickpunkt. Wird der Blick ruhig, wird auch der Geist ruhig."],
      ["Bandha", "Aktiviere sanft den Unterbauch (Uddiyana) und den Beckenboden (Mula), um deine Mitte zu schützen."],
    ],
    startPractice: "🕯 Übungsmodus starten", helpOn: "🌙 Hinweise an", helpOff: "Hinweise aus",
    suryaNav: "Sonnengruß", suryaTitle: "Surya Namaskara A",
    suryaDesc: "Jede Stufe beginnt mit Sonnengrüßen — fünf Runden A, drei bis fünf Runden B. Eine Bewegung, ein Atemzug: das ist Vinyasa.",
    suryaBeg: " (Drei Runden sind ein guter Anfang.)",
    breaths: (n) => `${n} Atemzüge`, drishtiChip: (d) => `Blick · ${d}`, detailChip: "Details →",
    stepsH: "Der Einstieg", mistakesH: "Häufige Fehler", closeL: "Schließen",
    progress: (tab, a, b) => `${tab}-Praxis ${a} / ${b}`,
    finishBtn: "Beenden ✕", ofPractice: (tab) => `${tab}-Praxis`,
    breathing: "Atmen", pausedTxt: "Pausiert", nextPrefix: "Weiter · ",
    prevB: "← Zurück", pauseB: "❚❚ Pause", resumeB: "▶ Weiter", nextB: "Weiter →",
    paceL: "Atemtempo", paceOpts: [[4, "Schnell · 4s"], [5, "Normal · 5s"], [6, "Langsam · 6s"], [8, "Sehr langsam · 8s"]],
    finishedMsg: "Praxis beendet. Ruhe in Savasana.", sunSal: "Sonnengruß",
    footT: "Für alle, die allein üben",
    footB: "Bei Ashtanga geht es nicht darum, zur nächsten Haltung voranzukommen, sondern in der jetzigen ruhig zu atmen. Bei Schmerz aufzuhören ist auch Praxis. Du musst nicht täglich die ganze Serie üben: Beginne mit den Sonnengrüßen und füge Haltungen einzeln hinzu. Traditionell wird an Samstagen und Mondtagen pausiert.",
    medNote: "Alle Inhalte dienen nur der allgemeinen Information und ersetzen keinen ärztlichen Rat. Sprich vor Beginn eines neuen Trainings mit einem Arzt.",
    cookieMsg: "Diese Website verwendet Cookies zur Verbesserung des Dienstes und zur Anzeigenschaltung über Google AdSense. Durch die weitere Nutzung stimmst du der Verwendung von Cookies zu.",
    okL: "OK", langLabel: "Sprache wählen", langWord: "Sprache",
    tabs: { primary: "Anfänger", intermediate: "Mittelstufe", advanced: "Fortgeschritten" },
    pageNav: { about: "Über uns", privacy: "Datenschutzerklärung", terms: "Nutzungsbedingungen", contact: "Kontakt" },
  },
  fr: {
    heroT1: "Dans le calme d'avant l'aube,", heroT2: "une pratique guidée par le souffle",
    heroDesc: "L'Ashtanga se pratique toujours dans le même ordre — c'est pourquoi on peut le pratiquer seul. Touchez une posture pour voir les étapes d'entrée et les erreurs fréquentes, puis laissez le mode pratique rythmer votre respiration.",
    pillars: [
      ["Respiration Ujjayi", "Inspirez et expirez par le nez avec un doux son d'océan dans la gorge. Le souffle est le métronome de la pratique."],
      ["Drishti", "Chaque posture a un point de regard fixe. Quand le regard se pose, l'esprit se pose."],
      ["Bandha", "Engagez doucement le bas-ventre (uddiyana) et le périnée (mula) pour protéger votre centre."],
    ],
    startPractice: "🕯 Lancer la pratique", helpOn: "🌙 Conseils activés", helpOff: "Conseils masqués",
    suryaNav: "Salutation au soleil", suryaTitle: "Surya Namaskara A",
    suryaDesc: "Chaque niveau commence par les salutations au soleil : cinq tours de A, trois à cinq de B. Un mouvement, une respiration : c'est le vinyasa.",
    suryaBeg: " (Trois tours suffisent pour commencer.)",
    breaths: (n) => `${n} respirations`, drishtiChip: (d) => `Regard · ${d}`, detailChip: "Détails →",
    stepsH: "Comment entrer", mistakesH: "Erreurs fréquentes", closeL: "Fermer",
    progress: (tab, a, b) => `Pratique ${tab} ${a} / ${b}`,
    finishBtn: "Terminer ✕", ofPractice: (tab) => `Pratique ${tab}`,
    breathing: "Respirez", pausedTxt: "En pause", nextPrefix: "Suivant · ",
    prevB: "← Précédent", pauseB: "❚❚ Pause", resumeB: "▶ Reprendre", nextB: "Suivant →",
    paceL: "Rythme", paceOpts: [[4, "Rapide · 4s"], [5, "Normal · 5s"], [6, "Lent · 6s"], [8, "Très lent · 8s"]],
    finishedMsg: "Pratique terminée. Reposez-vous en savasana.", sunSal: "Salutation au soleil",
    footT: "À ceux qui pratiquent seuls",
    footB: "L'Ashtanga ne consiste pas à passer à la posture suivante, mais à respirer avec aisance dans celle-ci. S'arrêter quand on a mal fait aussi partie de la pratique. Inutile de faire toute la série chaque jour : commencez par les salutations au soleil, puis ajoutez les postures une à une. Traditionnellement, on se repose le samedi et les jours de lune.",
    medNote: "Le contenu de ce site est fourni à titre informatif et ne remplace pas un avis médical. Consultez un médecin avant de commencer un nouveau programme d'exercice.",
    cookieMsg: "Ce site utilise des cookies pour améliorer le service et diffuser des annonces via Google AdSense. En poursuivant votre navigation, vous acceptez l'utilisation des cookies.",
    okL: "OK", langLabel: "Choisir la langue", langWord: "Langue",
    tabs: { primary: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" },
    pageNav: { about: "À propos", privacy: "Politique de confidentialité", terms: "Conditions d'utilisation", contact: "Contact" },
  },
  zh: {
    heroT1: "在日出前的宁静中，", heroT2: "跟随呼吸的练习",
    heroDesc: "阿斯汤加每次都按同样的顺序练习——正因如此，你可以独自练习。点击体式查看进入步骤和常见错误，准备好后，让练习模式带领你的呼吸。",
    pillars: [
      ["乌加依呼吸", "用鼻子吸气呼气，喉咙后部发出轻柔的海浪声。呼吸是练习的节拍器。"],
      ["凝视点", "每个体式都有固定的凝视点。目光安定，心也随之安定。"],
      ["收束法", "轻轻收紧下腹（乌迪亚纳）与盆底（穆拉），守护身体的中心。"],
    ],
    startPractice: "🕯 开始练习模式", helpOn: "🌙 提示已开启", helpOff: "提示已关闭",
    suryaNav: "拜日式", suryaTitle: "拜日式 A（Surya Namaskara A）",
    suryaDesc: "无论哪个级别，练习都从拜日式开始。A做5遍，B做3到5遍。一个动作一次呼吸——这就是串联（vinyasa）。",
    suryaBeg: "（初学者从3遍开始也很好）",
    breaths: (n) => `呼吸${n}次`, drishtiChip: (d) => `凝视 · ${d}`, detailChip: "详情 →",
    stepsH: "进入步骤", mistakesH: "常见错误", closeL: "关闭",
    progress: (tab, a, b) => `${tab}练习 ${a} / ${b}`,
    finishBtn: "结束练习 ✕", ofPractice: (tab) => `${tab}练习`,
    breathing: "呼吸", pausedTxt: "已暂停", nextPrefix: "下一个 · ",
    prevB: "← 上一个", pauseB: "❚❚ 暂停", resumeB: "▶ 继续", nextB: "下一个 →",
    paceL: "呼吸节奏", paceOpts: [[4, "快 · 4秒"], [5, "正常 · 5秒"], [6, "慢 · 6秒"], [8, "很慢 · 8秒"]],
    finishedMsg: "练习结束。在摊尸式中休息吧。", sunSal: "拜日式",
    footT: "写给独自练习的你",
    footB: "阿斯汤加不是向下一个体式推进的练习，而是在当下体式中让呼吸变得舒适的练习。疼痛时停下来也是练习。不必每天完成整个序列：从拜日式开始，等身体记住顺序后再逐一增加体式。传统上，周六和月相日休息。",
    medNote: "本站所有内容仅供一般信息参考，不能替代医疗建议。开始新的运动计划前请咨询医生。",
    cookieMsg: "本站使用 Cookie 以改进服务并通过 Google AdSense 投放广告。继续使用即表示您同意使用 Cookie。",
    okL: "确定", langLabel: "选择语言", langWord: "语言",
    tabs: { primary: "初级", intermediate: "中级", advanced: "高级" },
    pageNav: { about: "关于本站", privacy: "隐私政策", terms: "使用条款", contact: "联系我们" },
  },
  pt: {
    heroT1: "Na quietude antes do amanhecer,", heroT2: "uma prática que segue a respiração",
    heroDesc: "O Ashtanga é praticado sempre na mesma sequência — por isso você pode praticar sozinho. Toque numa postura para ver os passos de entrada e os erros comuns e, quando estiver pronto, deixe o Modo Prática guiar sua respiração.",
    pillars: [
      ["Respiração Ujjayi", "Inspire e expire pelo nariz com um suave som de oceano na garganta. A respiração é o metrônomo da prática."],
      ["Drishti", "Cada postura tem um ponto de olhar fixo. Quando o olhar se firma, a mente se firma."],
      ["Bandha", "Ative suavemente o baixo ventre (uddiyana) e o assoalho pélvico (mula) para proteger seu centro."],
    ],
    startPractice: "🕯 Iniciar prática", helpOn: "🌙 Dicas ativadas", helpOff: "Dicas desativadas",
    suryaNav: "Saudação ao sol", suryaTitle: "Surya Namaskara A",
    suryaDesc: "Todo nível começa com saudações ao sol: cinco voltas de A, três a cinco de B. Um movimento, uma respiração: isto é vinyasa.",
    suryaBeg: " (Três voltas já é um bom começo.)",
    breaths: (n) => `${n} respirações`, drishtiChip: (d) => `Olhar · ${d}`, detailChip: "Detalhes →",
    stepsH: "Como entrar", mistakesH: "Erros comuns", closeL: "Fechar",
    progress: (tab, a, b) => `Prática ${tab} ${a} / ${b}`,
    finishBtn: "Encerrar ✕", ofPractice: (tab) => `Prática ${tab}`,
    breathing: "Respire", pausedTxt: "Pausado", nextPrefix: "Próxima · ",
    prevB: "← Anterior", pauseB: "❚❚ Pausar", resumeB: "▶ Retomar", nextB: "Próxima →",
    paceL: "Ritmo", paceOpts: [[4, "Rápido · 4s"], [5, "Normal · 5s"], [6, "Lento · 6s"], [8, "Muito lento · 8s"]],
    finishedMsg: "Prática concluída. Descanse em savasana.", sunSal: "Saudação ao sol",
    footT: "Para quem pratica sozinho",
    footB: "O Ashtanga não é sobre avançar para a próxima postura, mas sobre respirar com conforto nesta. Parar quando dói também é prática. Não é preciso fazer a série inteira todos os dias: comece pelas saudações ao sol e acrescente posturas uma a uma. Tradicionalmente, descansa-se aos sábados e nos dias de lua.",
    medNote: "Todo o conteúdo deste site é apenas informativo e não substitui aconselhamento médico. Consulte um médico antes de iniciar um novo programa de exercícios.",
    cookieMsg: "Este site usa cookies para melhorar o serviço e exibir anúncios via Google AdSense. Ao continuar navegando, você concorda com o uso de cookies.",
    okL: "OK", langLabel: "Selecionar idioma", langWord: "Idioma",
    tabs: { primary: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" },
    pageNav: { about: "Sobre", privacy: "Política de Privacidade", terms: "Termos de Uso", contact: "Contato" },
  },
  hi: {
    heroT1: "सूर्योदय से पहले की शांति में,", heroT2: "सांस के साथ चलने वाला अभ्यास",
    heroDesc: "अष्टांग हर बार एक ही क्रम में किया जाता है — इसीलिए इसे अकेले भी किया जा सकता है। किसी आसन पर टैप करके प्रवेश के चरण और सामान्य गलतियाँ देखें, और तैयार होने पर अभ्यास मोड को अपनी सांस की गति तय करने दें।",
    pillars: [
      ["उज्जायी श्वास", "नाक से सांस लें और छोड़ें, गले के पीछे समुद्र जैसी हल्की ध्वनि के साथ। सांस ही अभ्यास का मेट्रोनोम है।"],
      ["दृष्टि", "हर आसन का एक निश्चित दृष्टि-बिंदु होता है। दृष्टि स्थिर होती है तो मन भी स्थिर होता है।"],
      ["बंध", "निचले पेट (उड्डीयान) और श्रोणि तल (मूल) को हल्के से सक्रिय रखें ताकि शरीर का केंद्र सुरक्षित रहे।"],
    ],
    startPractice: "🕯 अभ्यास मोड शुरू करें", helpOn: "🌙 सुझाव चालू", helpOff: "सुझाव बंद",
    suryaNav: "सूर्य नमस्कार", suryaTitle: "सूर्य नमस्कार A",
    suryaDesc: "हर स्तर का अभ्यास सूर्य नमस्कार से शुरू होता है — A के पाँच चक्र, B के तीन से पाँच। एक गति, एक सांस: यही विन्यास है।",
    suryaBeg: " (शुरुआत में तीन चक्र भी पर्याप्त हैं।)",
    breaths: (n) => `${n} सांसें`, drishtiChip: (d) => `दृष्टि · ${d}`, detailChip: "विवरण →",
    stepsH: "प्रवेश के चरण", mistakesH: "सामान्य गलतियाँ", closeL: "बंद करें",
    progress: (tab, a, b) => `${tab} अभ्यास ${a} / ${b}`,
    finishBtn: "अभ्यास समाप्त ✕", ofPractice: (tab) => `${tab} अभ्यास`,
    breathing: "सांस लें", pausedTxt: "रुका हुआ", nextPrefix: "अगला · ",
    prevB: "← पिछला", pauseB: "❚❚ रोकें", resumeB: "▶ जारी रखें", nextB: "अगला →",
    paceL: "सांस की गति", paceOpts: [[4, "तेज़ · 4 से."], [5, "सामान्य · 5 से."], [6, "धीमी · 6 से."], [8, "बहुत धीमी · 8 से."]],
    finishedMsg: "अभ्यास पूर्ण हुआ। शवासन में विश्राम करें।", sunSal: "सूर्य नमस्कार",
    footT: "अकेले अभ्यास करने वालों के लिए",
    footB: "अष्टांग अगले आसन की ओर बढ़ने का अभ्यास नहीं, बल्कि इसी आसन में सांस को सहज बनाने का अभ्यास है। दर्द होने पर रुक जाना भी अभ्यास है। रोज़ पूरी श्रृंखला ज़रूरी नहीं: सूर्य नमस्कार से शुरू करें और शरीर को क्रम याद होने पर आसन एक-एक कर जोड़ें। परंपरा में शनिवार और चंद्र-दिवसों पर विश्राम होता है।",
    medNote: "इस साइट की सभी सामग्री केवल सामान्य जानकारी के लिए है और चिकित्सीय सलाह का विकल्प नहीं है। कोई नया व्यायाम शुरू करने से पहले चिकित्सक से परामर्श करें।",
    cookieMsg: "यह साइट सेवा सुधार और Google AdSense के माध्यम से विज्ञापन दिखाने के लिए कुकीज़ का उपयोग करती है। साइट का उपयोग जारी रखकर आप कुकीज़ के उपयोग से सहमत होते हैं।",
    okL: "ठीक है", langLabel: "भाषा चुनें", langWord: "भाषा",
    tabs: { primary: "प्रारंभिक", intermediate: "मध्यम", advanced: "उन्नत" },
    pageNav: { about: "परिचय", privacy: "गोपनीयता नीति", terms: "उपयोग की शर्तें", contact: "संपर्क" },
  },
  ar: {
    heroT1: "في سكون ما قبل الفجر،", heroT2: "ممارسة تتبع النَّفَس",
    heroDesc: "تُمارَس الأشتانغا بالتسلسل نفسه في كل مرة — ولهذا يمكنك ممارستها وحدك. اضغط على أي وضعية لترى خطوات الدخول والأخطاء الشائعة، وعندما تكون جاهزًا دَع وضع التمرين يضبط إيقاع تنفسك.",
    pillars: [
      ["تنفس أوجايي", "تنفَّس من الأنف مع صوت خفيف يشبه المحيط في مؤخرة الحلق. النَّفَس هو إيقاع الممارسة."],
      ["دريشتي", "لكل وضعية نقطة نظر ثابتة. حين يستقر النظر، يستقر الذهن."],
      ["باندا", "شدّ برفق أسفل البطن (أوديانا) وقاع الحوض (مولا) لحماية مركز الجسم."],
    ],
    startPractice: "🕯 بدء وضع التمرين", helpOn: "🌙 النصائح مفعّلة", helpOff: "النصائح متوقفة",
    suryaNav: "تحية الشمس", suryaTitle: "سوريا ناماسكارا A",
    suryaDesc: "تبدأ الممارسة في كل مستوى بتحية الشمس: خمس جولات من A وثلاث إلى خمس من B. حركة واحدة، نَفَس واحد — هذا هو الفينياسا.",
    suryaBeg: " (ثلاث جولات بداية جيدة.)",
    breaths: (n) => `${n} أنفاس`, drishtiChip: (d) => `النظر · ${d}`, detailChip: "التفاصيل ←",
    stepsH: "خطوات الدخول", mistakesH: "أخطاء شائعة", closeL: "إغلاق",
    progress: (tab, a, b) => `تمرين ${tab} ${a} / ${b}`,
    finishBtn: "إنهاء التمرين ✕", ofPractice: (tab) => `تمرين ${tab}`,
    breathing: "تنفَّس", pausedTxt: "متوقف مؤقتًا", nextPrefix: "التالي · ",
    prevB: "السابق", pauseB: "❚❚ إيقاف", resumeB: "▶ متابعة", nextB: "التالي",
    paceL: "إيقاع التنفس", paceOpts: [[4, "سريع · 4ث"], [5, "عادي · 5ث"], [6, "بطيء · 6ث"], [8, "بطيء جدًا · 8ث"]],
    finishedMsg: "اكتمل التمرين. استرِح في شافاسانا.", sunSal: "تحية الشمس",
    footT: "لمن يمارس وحده",
    footB: "الأشتانغا ليست تقدّمًا نحو الوضعية التالية، بل أن يصبح تنفسك مريحًا في هذه الوضعية. التوقف عند الألم ممارسة أيضًا. لا حاجة للسلسلة كاملة كل يوم: ابدأ بتحية الشمس وأضف الوضعيات واحدة تلو الأخرى. تقليديًا، يوم السبت وأيام القمر للراحة.",
    medNote: "جميع محتويات هذا الموقع لأغراض المعلومات العامة فقط ولا تُغني عن الاستشارة الطبية. استشر طبيبًا قبل بدء أي برنامج رياضي جديد.",
    cookieMsg: "يستخدم هذا الموقع ملفات تعريف الارتباط لتحسين الخدمة وعرض إعلانات Google AdSense. باستمرارك في الاستخدام فإنك توافق على ذلك.",
    okL: "موافق", langLabel: "اختر اللغة", langWord: "اللغة",
    tabs: { primary: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" },
    pageNav: { about: "حول الموقع", privacy: "سياسة الخصوصية", terms: "شروط الاستخدام", contact: "اتصل بنا" },
  },
};

/* 언어 목록 (드롭다운) */
const LANGS = [
  { c: "en", cc: "US", n: "English" },
  { c: "ko", cc: "KR", n: "한국어" },
  { c: "es", cc: "ES", n: "Español" },
  { c: "ja", cc: "JP", n: "日本語" },
  { c: "de", cc: "DE", n: "Deutsch" },
  { c: "fr", cc: "FR", n: "Français" },
  { c: "zh", cc: "CN", n: "中文" },
  { c: "pt", cc: "BR", n: "Português" },
  { c: "hi", cc: "IN", n: "हिन्दी" },
  { c: "ar", cc: "SA", n: "العربية" },
];

/* 응시점 영문 매핑 (ko 외 언어에서 사용) */
const DRISHTI_EN = {
  "코끝": "nose tip", "미간": "third eye", "배꼽": "navel", "위": "upward", "앞": "forward",
  "손끝": "fingertips", "앞 손끝": "front hand", "위쪽 손끝": "top hand", "발끝": "toes",
  "엄지손가락": "thumbs", "측면": "side", "발끝·측면": "toes · side", "위·발끝": "up · toes",
  "코끝·위": "nose · up", "코끝(뒤로)": "nose tip (back)", "—": "—",
};
const drishtiLoc = (d, lang) => (lang === "ko" ? d : DRISHTI_EN[d] || d);

/* 레벨·섹션 메타 영문 */
const META = {
  levels: {
    primary: { tab: "Beginner", series: "Primary Series · Yoga Chikitsa (Yoga Therapy)", intro: "The foundational series that purifies and aligns the body. Every Ashtanga practitioner begins here.", caution: null },
    intermediate: { tab: "Intermediate", series: "Intermediate Series · Nadi Shodhana (Nerve Cleansing)", intro: "Deep backbends, leg-behind-head poses, and arm balances. Approach only after the full Primary Series is stable.", caution: "Traditionally, Intermediate poses are added one at a time under a teacher's guidance. If you practice alone, do not attempt deep poses like Kapotasana or Eka Pada Sirsasana without thorough preparation." },
    advanced: { tab: "Advanced", series: "Advanced Series · Sthira Bhaga (Strength & Grace)", intro: "Signature poses from Advanced A (3rd) and B (4th) — territory reached over many years. Presented here as landmarks, not instructions.", caution: "Practice these poses only with a qualified teacher. Attempting them alone can cause serious injury to the wrists, shoulders, and spine. The notes below are for reference only." },
  },
  sections: {
    "p-standing": { t: "Standing Sequence", n: "Standing poses that build strength and balance. Begin after Sun Salutation A ×5 and B ×3–5." },
    "p-seated": { t: "Seated Sequence", n: "Seated poses, linked by vinyasa (jump-backs) between each." },
    "p-finishing": { t: "Finishing Sequence", n: "Shared by every level — settling the body and breath." },
    "i-twist": { t: "Twists & Folds", n: "The poses that open the gate to the series." },
    "i-backbend": { t: "Backbend Sequence", n: "The heart of Intermediate — bending the spine progressively deeper." },
    "i-leg-arm": { t: "Leg-Behind-Head & Arm Balances", n: "The latter half calls on hips, shoulders, and core all at once." },
    "a-armbalance": { t: "Arm Balances", n: "Moving the body freely over the hands." },
    "a-backbend": { t: "Deep Backbends", n: "The deepest curves the spine can draw." },
    "a-etc": { t: "Flexibility & Balance", n: "" },
  },
};

/* 자세 영문 번역 (키: sk) — n 이름 / d 설명 / t 팁 / s 진입 단계 / m 흔한 실수 */
const EN = {
  "Padangusthasana": { n: "Big Toe Pose", d: "Fold forward from the hips and hook the big toes with the first two fingers.", t: "Bend the knees slightly, or hold the shins instead.", s: ["Feet hip-width, hands on the waist", "Inhale, lengthen the spine", "Exhale, fold and hook the big toes", "Inhale look up and lengthen, exhale fold deeper"], m: ["Rounding the back and only dropping the head", "Locking the knees hard backward", "Shoulders creeping toward the ears"] },
  "Padahastasana": { n: "Hand Under Foot Pose", d: "Slide the palms under the soles and fold — a wrist stretch as well.", t: "Just holding the tops of the feet is fine.", s: ["Bend the knees within the fold", "Slide the palms under, facing up", "Toes to the wrists, then fold"], m: ["Forcing the hands under with straight knees", "Weight falling back into the heels"] },
  "Utthita Trikonasana": { n: "Extended Triangle", d: "From a wide stance, tilt sideways and reach for the foot, torso in one plane.", t: "Rest the hand on the shin or a block.", s: ["Step wide, arms out", "Front foot 90°, back foot slightly in", "Exhale, reach long to the side", "Lower hand to the toes, top arm skyward"], m: ["Hips drifting back, torso collapsing forward", "Leaning weight into the bottom hand", "Cranking the neck to look up"] },
  "Parivrtta Trikonasana": { n: "Revolved Triangle", d: "Twist the torso and place the opposite hand outside the front foot — balance plus rotation.", t: "Keep the hand inside the foot or on the shin at first.", s: ["Take a slightly shorter stance", "Square the hips toward the front leg", "Exhale, twist and place the opposite hand down", "Extend the top arm vertically"], m: ["Twisting only the shoulders while the hips stay open", "The back heel lifting", "Rushing the gaze up and losing balance"] },
  "Utthita Parsvakonasana": { n: "Extended Side Angle", d: "Bend the front knee and stretch one diagonal line from foot-edge to fingertips.", t: "Resting the elbow on the thigh is plenty.", s: ["Wide stance, front foot 90°", "Exhale, bend the knee to a right angle", "Hand to the floor outside the foot", "Top arm over the ear"], m: ["The knee collapsing inward", "The chest turning down toward the floor", "The back leg bending, breaking the line"] },
  "Parivrtta Parsvakonasana": { n: "Revolved Side Angle", d: "From side angle, twist and hook the opposite elbow outside the knee.", t: "Lower the back knee to the floor to begin.", s: ["Start from warrior-one legs", "Exhale, hook the elbow outside the knee", "Press the palms, turn the chest skyward", "Optionally take the lower hand to the floor"], m: ["The front knee wobbling as you twist", "Holding the breath and forcing the twist"] },
  "Prasarita Padottanasana A–D": { n: "Wide-Legged Forward Fold A–D", d: "Fold forward in a wide stance through four hand variations.", t: "The crown needn't touch the floor — feel the spine lengthen.", s: ["Feet twice shoulder-width apart", "Inhale lengthen, exhale fold", "A: hands down → B: waist → C: clasp behind → D: toes"], m: ["Weight sinking back into the heels", "Rounding and pushing the head toward the floor"] },
  "Parsvottanasana": { n: "Pyramid Pose", d: "Fold over the front leg with the hands in reverse prayer, hips square.", t: "Hold opposite elbows if reverse prayer is far.", s: ["Reverse prayer (or hold the elbows) behind the back", "Step the feet apart, hips square", "Inhale open the chest, exhale fold over the front leg"], m: ["Folding with the pelvis twisted sideways", "Rounding the spine to force chin to shin"] },
  "Utthita Hasta Padangusthasana": { n: "Extended Hand-to-Big-Toe", d: "Standing on one leg, extend the other forward, then to the side, then hold it unaided.", t: "Bend the knee to catch the toe, or use a strap. A wall nearby helps.", s: ["Left hand to the waist, catch the right big toe", "Inhale, extend the leg forward (5 breaths)", "Open the leg to the side (5 breaths)", "Return to center, release, hold the leg up"], m: ["The standing hip jutting sideways", "Rounding the back for leg height", "Staring at the floor and tensing the neck"] },
  "Ardha Baddha Padmottanasana": { n: "Half-Bound Lotus Forward Fold (standing)", d: "One foot in half lotus, bound behind the back, folding on one leg.", t: "Knee pain means release immediately — balance without the bind first.", s: ["Right foot to half lotus on the left thigh", "Reach the right arm behind to bind the foot", "Exhale, fold slowly, left hand to the floor"], m: ["Pushing through knee pain (release at once)", "Wrenching the shoulder to chase the bind"] },
  "Utkatasana": { n: "Chair Pose", d: "Sit low as into a chair, arms reaching up.", t: "Knees behind the toes, weight in the heels.", s: ["Feet together, inhale the arms up", "Exhale, sit down as into a chair", "Tuck the tailbone slightly to protect the low back"], m: ["Ribs flaring with an over-arched lower back", "Knees traveling far past the toes"] },
  "Virabhadrasana A": { n: "Warrior I", d: "Front knee to 90°, arms overhead, back foot-edge pressing down.", t: "Shorten the stance so the knee stays over the ankle.", s: ["Long stance, back foot at 45°", "Square the hips forward", "Exhale bend the knee, inhale reach up"], m: ["The back foot-edge lifting, twisting the knee", "Bracing by over-arching the lower back"] },
  "Virabhadrasana B": { n: "Warrior II", d: "Open the hips sideways, arms wide, gaze over the front hand.", t: "Lower the arms slightly if the shoulders grip.", s: ["From warrior I, open the hips and chest", "Arms to shoulder height", "Gaze past the front fingers, torso centered"], m: ["The torso leaning over the front leg", "The front knee caving inward"] },
  "Dandasana": { n: "Staff Pose", d: "Legs extended, spine tall — the baseline of every seated pose.", t: "Sit on a blanket if the pelvis tucks under.", s: ["Legs together, extended forward", "Press the floor, lift the spine", "Flex the feet, draw the chin slightly in"], m: ["The pelvis tucking, lower back rounding", "Shoulders lifting, neck shortening"] },
  "Paschimottanasana A·D": { n: "Seated Forward Fold A·D", d: "Inhale to lengthen, exhale to fold over the legs — two grips in turn.", t: "Bend the knees and bring belly to thighs first.", s: ["From staff pose, inhale the arms up", "Exhale, hinge from the hips and hold the feet", "Inhale lengthen, exhale fold belly, chest, head"], m: ["Rounding only the upper back", "Yanking on the feet with the shoulders"] },
  "Purvottanasana": { n: "Reverse Plank", d: "The counter-pose: press hands and feet, lift the entire front body.", t: "A table-top lift is a fine substitute.", s: ["Hands one palm-length behind the hips", "Exhale, lift the pelvis as high as you can", "Reach the soles toward the floor, head back"], m: ["The hips sagging mid-line", "Dropping the head back with no control"] },
  "Ardha Baddha Padma Paschimottanasana": { n: "Half-Bound Lotus Forward Fold", d: "One foot in half lotus bound behind, folding over the straight leg.", t: "If the knee floats or hurts, tuck the foot under the thigh instead.", s: ["Right foot to half lotus", "Bind the foot behind the back", "Exhale, fold over the left leg"], m: ["Ignoring knee pain (release immediately)", "Chasing the bind with a twisted torso"] },
  "Triang Mukha Eka Pada Paschimottanasana": { n: "Three-Limbed Forward Fold", d: "One leg folded back, shin on the floor, folding forward evenly.", t: "A blanket under the tilting hip evens you out.", s: ["Fold the right leg back, foot beside the hip", "Ground both sitting bones evenly", "Exhale, fold over the straight leg"], m: ["The folded-side hip lifting, body tilting", "The folded knee splaying wide"] },
  "Janu Sirsasana A–C": { n: "Head-to-Knee A–C", d: "Foot to the inner thigh, folding over the straight leg through three foot positions.", t: "Support a floating knee with a blanket; save C for supple ankles.", s: ["Bend the knee, foot to the inner thigh", "Square the torso over the straight leg", "Exhale, fold and hold the foot"], m: ["The straight leg rolling outward", "Forcing the C ankle through pain"] },
  "Marichyasana A·B": { n: "Marichi's Pose A·B (fold)", d: "Knee up, wrap the arm around the shin, clasp behind, fold. B adds half lotus.", t: "Use a strap, or simply hug the knee.", s: ["Right knee up, heel close to the hip", "Wrap the shin with the right arm", "Clasp behind the back, exhale, fold"], m: ["Rounding hard just to make the bind", "The standing foot too far away to wrap"] },
  "Marichyasana C·D": { n: "Marichi's Pose C·D (twist)", d: "Hook the opposite arm outside the raised knee, twist deeply, clasp behind. D adds half lotus.", t: "An elbow-press twist without the bind is plenty.", s: ["Knee up, inhale and lengthen the spine", "Exhale, hook the elbow outside the knee", "Deepen with each exhale, clasp behind"], m: ["Twisting from a slumped spine", "Squeezing into the twist while holding the breath"] },
  "Navasana": { n: "Boat Pose", d: "Balance on the sit bones in a V-shape — five rounds with lift-ups between.", t: "Bent knees with shins level is a full version of the work.", s: ["Begin with the shins parallel to the floor", "Chest lifted, spine long, extend the legs", "Arms level with the floor; five breaths, five rounds"], m: ["The back rounding, straining the lower back", "Tension pooling in the neck and shoulders"] },
  "Bhujapidasana": { n: "Shoulder-Pressing Pose", d: "Thighs hooked high on the upper arms — the first arm balance of the series.", t: "The feet don't need to lift yet; learn to load the hands.", s: ["Squat, hands flat behind the feet", "Hook the thighs high on the arms", "Shift weight to the hands, cross the ankles"], m: ["Thighs hooked too low and slipping", "Dropping the head into a forward roll"] },
  "Kurmasana · Supta Kurmasana": { n: "Tortoise · Sleeping Tortoise", d: "Arms extended beneath the legs, chest low; supta adds binds behind.", t: "Take supta kurmasana with a teacher, not alone.", s: ["Legs wide, knees soft", "Slide the arms out beneath the thighs", "Lower the chest, straighten the legs"], m: ["Cranking the shoulders under by force", "Forcing the legs behind the head alone"] },
  "Garbha Pindasana · Kukkutasana": { n: "Embryo · Rooster", d: "Arms threaded through the lotus, curl into a ball, roll nine times, rise.", t: "No lotus? Hug crossed legs and just practice the roll.", s: ["Thread the arms through the lotus calves", "Cup the cheeks, curl the body round", "Roll nine times, plant the hands, rise"], m: ["Skin scraping on the thread-through (water helps)", "Rolling off the neck for momentum"] },
  "Baddha Konasana A·B": { n: "Bound Angle A·B", d: "Soles together, knees wide, then folding forward.", t: "Never press the knees down — let breath do the opening.", s: ["Soles together, heels drawn close", "Open the feet like a book", "Inhale lengthen, exhale fold"], m: ["Pressing the knees down with the hands", "Rounding and leading with the head"] },
  "Upavistha Konasana": { n: "Wide-Angle Seated Fold", d: "Legs wide, folding forward, then a lifted balance variation.", t: "A blanket under the pelvis transforms this fold.", s: ["Open the legs to an honest width", "Knees and toes pointing skyward", "Exhale, hinge forward from the pelvis"], m: ["The legs rolling in, kneecaps facing down", "Chasing width through inner-knee pain"] },
  "Supta Konasana": { n: "Reclining Angle", d: "Legs over the head and wide, catch the toes, roll up to balance.", t: "Nervous about the roll? Stop at legs-overhead.", s: ["Roll the legs overhead", "Widen the legs, catch the toes", "Inhale, roll up to a wide balance"], m: ["Turning the head sideways (cervical risk)", "Pure momentum, crashing onto the back"] },
  "Supta Padangusthasana": { n: "Reclining Hand-to-Big-Toe", d: "Lying down, one leg vertical, opened to the side and returned.", t: "A strap around the foot keeps the leg straight.", s: ["Lie down, catch the right big toe", "Ground the left leg strongly", "Open the leg sideways, opposite hip stays down"], m: ["The floor leg bending or lifting", "The whole body rolling after the leg"] },
  "Ubhaya Padangusthasana · Urdhva Mukha Paschimottanasana": { n: "Both Big Toes · Upward-Facing Fold", d: "Roll up to balance holding both toes, then draw chest and legs together.", t: "Find the balance with bent knees, then straighten.", s: ["Roll back, then roll up", "Hold the toes, straighten the legs", "Draw chest and legs toward each other"], m: ["Rounding and tumbling backward again", "Pulling with hiked shoulders"] },
  "Setu Bandhasana": { n: "Bridge (Ashtanga)", d: "An arch supported on head and feet — the final pose of Primary.", t: "Heavy on the neck: substitute a shoulder-supported bridge.", s: ["Feet together in a diamond", "Crown to the floor, chest lifted", "Press the feet and arch up"], m: ["Full weight on an unengaged neck", "Feet slipping and straining the knees"] },
  "Urdhva Dhanurasana": { n: "Upward Bow (Wheel)", d: "Press hands and feet to lift into a full arch, three times.", t: "A shoulder bridge is plenty to begin with.", s: ["Feet near the hips, hands by the ears", "Inhale, come to the crown briefly", "Press arms and legs to full lift"], m: ["Elbows splaying outward", "Only the lower back bending, chest closed", "Descending chin-first"] },
  "Salamba Sarvangasana": { n: "Supported Shoulderstand", d: "Standing on the shoulders, legs vertical, neck free.", t: "A blanket under the shoulders spares the neck; legs-up-the-wall substitutes.", s: ["Take the legs overhead", "Support the back, extend the legs up", "Draw the elbows shoulder-width"], m: ["A compressed neck (hard to swallow = warning)", "Turning the head sideways", "Drifting diagonal and loading the neck"] },
  "Halasana · Karnapidasana": { n: "Plow · Ear-Pressure", d: "Legs over to the floor behind, then knees wrapping the ears.", t: "Feet not reaching? Bend the knees toward the forehead.", s: ["Lower the legs slowly behind", "Toes to the floor, legs straight", "Bend the knees beside the ears"], m: ["Dropping the legs with momentum", "Releasing the back support too soon"] },
  "Matsyasana": { n: "Fish", d: "The counter to shoulderstand — chest lifted, throat open.", t: "Back of the head down with a small lift is fine.", s: ["Slide the hands beneath the hips", "Press the elbows, lift the chest", "Rest the crown lightly on the floor"], m: ["All the weight on the head", "Jaw open, neck simply cranked"] },
  "Sirsasana": { n: "Headstand", d: "Inverting on a forearm tripod — the 'king of asanas'.", t: "Practice at a wall; dolphin pose substitutes.", s: ["Build the forearm tripod, crown down", "Straighten the legs, walk the feet in", "Draw the knees up, then extend"], m: ["All the weight on the head (forearms take 70%)", "Kicking up with an arched back", "Fighting a fall — learn to roll out first"] },
  "Baddha Padmasana · Padmasana": { n: "Bound Lotus · Lotus", d: "Lotus with a behind-the-back bind and fold (yoga mudra), then upright breathing.", t: "Half lotus or easy cross-legs substitute; knee pain is a signal.", s: ["Right foot up, rotating from the hip", "Left foot up to complete the lotus", "Cross-bind behind, fold forward"], m: ["Pressing the knees down by force", "Enduring a collapsed, painful ankle"] },
  "Utpluthih": { n: "Uprooting", d: "Still in lotus, press the floor and lift the whole body for ten breaths.", t: "Not lifting yet is fine — this builds the press.", s: ["Hands firm beside the thighs", "Exhale, engage the bandhas, press up", "Ten breaths, then vinyasa to finish"], m: ["Shoulders glued to the ears", "Muscling up on a held breath"] },
  "Savasana": { n: "Corpse Pose", d: "Complete release to close the practice — five minutes minimum, never skipped.", t: "The easiest-looking pose, and the most important one.", s: ["Limbs comfortably apart, lying back", "Release the body from the toes upward", "Watch the breath without steering it"], m: ["Getting up after thirty seconds", "Lying there planning the rest of the day"] },
  "Pasasana": { n: "Noose Pose", d: "Squat, twist, and bind the arms around both legs — the gate to Intermediate.", t: "Blanket under the heels; hook the elbow before chasing the bind.", s: ["Squat with the feet together", "Exhale, take the elbow outside both knees", "Wrap the legs, clasp behind"], m: ["Heels lifting, tipping forward", "Knees splitting apart, the twist leaking away"] },
  "Krounchasana": { n: "Heron", d: "One leg folded back, the other vertical and drawn toward the face.", t: "A lower leg with a bent knee is fine.", s: ["Fold one leg back as in triang mukha", "Catch the other foot, extend it up", "Exhale, draw the leg closer"], m: ["Rounding and tipping backward", "The folded-side hip lifting"] },
  "Bharadvajasana · Ardha Matsyendrasana": { n: "Bharadvaja's & Half Lord-of-the-Fishes Twists", d: "Two deep seated twists at the series' midpoint.", t: "Blanket under a floating pelvis; deepen only on the exhale.", s: ["Set the leg shape, fix the pelvis", "Inhale, grow tall through the spine", "Exhale, twist from the belly upward"], m: ["Only whipping the head around", "The pelvis following, dissolving the twist"] },
  "Shalabhasana A·B": { n: "Locust A·B", d: "Prone, lifting chest and legs — the foundation of the backbends.", t: "Back strength matters more than height.", s: ["Lie prone, arms alongside", "Inhale, lift chest and legs together", "Press the pubic bone down and hold"], m: ["Bending the knees for fake height", "Cranking the neck to look up"] },
  "Bhekasana": { n: "Frog", d: "Prone, pressing the feet toward the floor beside the hips.", t: "Ardha bhekasana — one side at a time — comes first.", s: ["Prone, bend the knees, hold the feet", "Rotate the hands to point forward", "Lift the chest, press the feet down"], m: ["The knees drifting wide of the body", "Pressing through knee pain"] },
  "Dhanurasana · Parsva Dhanurasana": { n: "Bow · Side Bow", d: "Holding the ankles, drawing the body into a bow, then rolling to each side.", t: "A strap around the feet extends your reach.", s: ["Bend the knees, catch the ankles", "Kick the shins back, chest lifts", "Weight on the belly, allow the sway"], m: ["Knees splaying wider than the shoulders", "Arm-only pulling that jams the shoulders"] },
  "Ustrasana": { n: "Camel", d: "Kneeling, arching back to the heels with the thighs vertical.", t: "Tuck the toes to raise the heels, or keep hands on the waist.", s: ["Kneel hip-width apart", "Hands to the waist, arch from the chest", "One hand at a time to the heels, hips pressing forward"], m: ["Hinging from the lower back first", "The pelvis drifting back, thighs tilting"] },
  "Laghu Vajrasana": { n: "Little Thunderbolt", d: "From camel, lowering the crown to the feet and rising by thigh strength alone.", t: "The rise comes first — practice going halfway down.", s: ["From camel, hold the lower legs", "Exhale, lower the crown toward the feet", "Inhale, let the thighs bring you up"], m: ["Descending with no strength left to rise", "Hanging off the arms on the way down"] },
  "Kapotasana A·B": { n: "King Pigeon (kneeling)", d: "Kneeling and arching back until the hands hold the heels — the deepest backbend of the series.", t: "Alone, go only as far as wall-supported descents; the rest belongs with a teacher.", s: ["Kneel tall, arms up, hips pressing forward", "Arch back, walk the hands toward the feet", "Lower the elbows, hold the heels, breathe"], m: ["Collapsing into the lower back unprepared", "The breath stopping — keep it thin but alive"] },
  "Supta Vajrasana": { n: "Reclining Thunderbolt", d: "In bound lotus, lowering back and rising — traditionally with a partner pinning the knees.", t: "Without a partner, skip it.", s: ["Bound lotus, holding the feet", "A partner anchors the knees", "Exhale back, inhale up, three times"], m: ["Solo attempts that lose the feet mid-descent", "Leading the descent with the neck"] },
  "Bakasana A·B": { n: "Crane A·B", d: "Knees perched on the upper arms; B enters from a jump.", t: "A cushion in front dissolves the fear.", s: ["Squat, hands shoulder-width", "Knees high toward the armpits", "Gaze forward, shift the weight, lift"], m: ["Looking at the feet and somersaulting", "The elbows winging outward"] },
  "Eka Pada Sirsasana": { n: "One Leg Behind the Head", d: "One leg behind the head, sitting tall, then folding.", t: "Practice to shoulder height only; the neck must not carry the leg.", s: ["Cradle the leg to warm the hip", "Work the shoulder deep inside the knee", "Set the leg on the shoulder and upper back, not the neck"], m: ["Straining the neck against the leg", "Cranking the knee with a closed hip"] },
  "Dwi Pada Sirsasana · Yoganidrasana": { n: "Both Legs Behind · Yogic Sleep", d: "Both legs behind the head — seated, then lying down.", t: "Only after eka pada is easy on both sides.", s: ["Hook the second leg over the first", "Lying: hook the legs one by one", "Cross the ankles, clasp behind the back"], m: ["Locking the ankles before the spine is ready", "Rushing the exit"] },
  "Tittibhasana A–C": { n: "Firefly A–C", d: "Legs over the arms, extended forward, with a walking variation.", t: "The depth of the hook matters more than leg height.", s: ["Shoulders deep between the legs", "Hands down, hips settle back, legs forward", "Straighten the arms as the legs extend"], m: ["Thighs near the elbows, slipping off", "The hips dropping too low, sitting down"] },
  "Pincha Mayurasana": { n: "Forearm Stand", d: "Balancing inverted on the forearms.", t: "At the wall, with a block bracing the hands into a frame.", s: ["Forearms parallel on the floor", "Hips high, walk the feet in", "Kick one leg to vertical"], m: ["The elbows sliding apart", "Holding a banana-back arch"] },
  "Karandavasana": { n: "Duck Pose", d: "From forearm stand, fold a lotus in the air, lower it to the arms, and return.", t: "Fold the lotus in pincha only; lower at the wall.", s: ["In pincha, fold the lotus mid-air", "Lower the knees slowly to the upper arms", "The bandhas lift you back up"], m: ["An uncontrolled descent", "Rebounding up with a whipped, arched back"] },
  "Mayurasana · Nakrasana": { n: "Peacock · Crocodile", d: "Body horizontal on the elbows, then the jumping crocodile.", t: "Finding the elbow placement at the navel is half the pose.", s: ["Kneel wide, fingers pointing back", "Draw the elbows into the navel", "Lower the head, let the legs float level"], m: ["The elbows slipping off the belly", "Landing face-first — protect the forehead"] },
  "Gomukhasana A·B": { n: "Cow Face A·B", d: "Knees stacked, hands clasped behind the back, chest open.", t: "A strap bridges hands that don't meet.", s: ["Stack the knees one over the other", "One arm from above, one from below", "Clasp behind, open the chest"], m: ["Flaring the ribs to fake the clasp", "The top elbow crushing the head"] },
  "Seven Headstands": { n: "Seven Headstands", d: "Seven arm variations of headstand to close the series.", t: "Only after a free-standing minute of basic sirsasana.", s: ["Mukta hasta: palms open in front", "Baddha hasta: folded-arm variations", "Re-find the center in each"], m: ["Loading the neck in the weaker-arm variants", "Rushing transitions and losing the center"] },
  "Vasisthasana": { n: "Full Side Plank", d: "Side plank with the top leg vertical, toe held.", t: "Bottom knee down builds the shoulder first.", s: ["Roll onto one hand and foot-edge", "Lift the hips into one line", "Catch the top toe and extend"], m: ["Hips sagging, loading the wrist", "The supporting hand ahead of the shoulder"] },
  "Vishvamitrasana · Kasyapasana": { n: "Sage Balances", d: "Side-plank shapes combined with leg-over-shoulder and half-lotus binds.", t: "Master each ingredient separately first.", s: ["Prepare the leg over the shoulder", "Roll sideways onto the supporting arm", "Open the chest toward the sky"], m: ["A shallow leg hook that slips", "Ignoring wrist alignment to hold on"] },
  "Urdhva Kukkutasana · Galavasana": { n: "Upward Rooster · Flying Pigeon", d: "A folded lotus stacked on the arms, or one shin shelved for balance.", t: "Side crow without lotus is the preparation.", s: ["Fold the lotus, plant the hands", "Set the knees high on the arms", "Shift forward and float"], m: ["A loose lotus sliding down the arms", "Ignoring wrist pain signals"] },
  "Koundinyasana A·B": { n: "Sage Koundinya A·B", d: "A twisted body floating horizontally on bent arms.", t: "A solid chaturanga is what builds the shelf.", s: ["Twist the thigh onto the opposite arm", "Bend the elbows into a shelf", "Send the weight forward, legs float"], m: ["The chest too low, landing face-first", "One arm doing all the carrying"] },
  "Astavakrasana": { n: "Eight-Angle Pose", d: "Legs wrapped around one arm, body floating sideways.", t: "Build the shape seated first — floating comes later.", s: ["Leg over the shoulder, ankles crossed", "Plant the hands, bend, and tilt", "Squeeze the legs and extend sideways"], m: ["The ankle lock slipping open", "Shoulders swallowing the neck"] },
  "Viparita Dandasana": { n: "Inverted Staff", d: "A deep arch supported on forearms and feet.", t: "From wheel, lower one forearm at a time to explore.", s: ["From wheel, lower to the forearms", "Interlace the fingers behind the head", "Straighten the legs, press the chest forward"], m: ["Elbows splaying, shoulders collapsing", "The head bearing the body's weight"] },
  "Viparita Shalabhasana": { n: "Inverted Locust", d: "Legs swept past vertical, balanced on chest and chin.", t: "Never without a teacher — the cervical load is serious.", s: ["Prone, arms beneath the body", "Sweep the legs up and over", "Balance on the chest, breathing"], m: ["Weight jamming into the chin and cervicals", "Swinging the legs over with momentum"] },
  "Raja Kapotasana": { n: "King Pigeon", d: "The back foot drawn overhead until foot and head meet.", t: "Long, separate preparation of hips and backbend comes first.", s: ["Settle into pigeon legs", "Bend the back knee, hook it with the elbow", "Both hands overhead to the foot"], m: ["A twisted pelvis bending only the lumbar", "Cranking the arms back with stiff shoulders"] },
  "Natarajasana": { n: "Lord of the Dance", d: "Standing, the back foot drawn overhead — balance meeting backbend.", t: "A strap on the foot gives the same curve, safely.", s: ["Stand on one leg, catch the back foot", "Rotate the elbow toward the sky", "Kick into the hand and lift the chest"], m: ["A locked, wobbling standing knee", "The hip opening, tipping you sideways"] },
  "Hanumanasana": { n: "Front Splits", d: "The legs extended fully forward and back.", t: "Stack blocks under the front leg and lower slowly. Never bounce.", s: ["From a lunge, slide the front leg forward", "Keep the pelvis square as you descend", "Once seated, join the palms overhead"], m: ["Forcing down with the hips split open", "Bouncing into the hamstring"] },
  "Durvasasana": { n: "Sage Durvasa", d: "Standing up with one leg behind the head.", t: "Distant even after the seated version is easy.", s: ["Set the leg from eka pada sirsasana", "Plant the hands, rise slowly on the other leg", "Join the palms, lengthen the spine"], m: ["The leg choking the breath at the throat", "The knee twisting on the way up"] },
  "Ganda Bherundasana": { n: "Formidable Face Pose", d: "Balanced on chin and chest, legs swept overhead.", t: "Reference only — always with a teacher.", s: ["Lower chest and chin to the floor", "Kick the legs past vertical", "Draw the feet toward the head"], m: ["The chin bearing everything, no cervical line", "Entering with no exit plan"] },
};

/* 로컬라이즈 헬퍼 — 자세 본문은 ko/en 원문 제공, 그 외 언어는 영문을 표시합니다.
   추가 언어의 자세 번역이 준비되면 EN처럼 언어별 딕셔너리를 만들어 여기서 분기하세요. */
const loc = (p, lang) => {
  if (lang === "ko" || !EN[p.sk]) return { name: p.ko, desc: p.desc, tip: p.tip, steps: p.steps, mistakes: p.mistakes };
  const e = EN[p.sk];
  return { name: e.n, desc: e.d, tip: e.t, steps: e.s, mistakes: e.m };
};
const lvMeta = (l, lang) => {
  if (lang === "ko") return l;
  const m = META.levels[l.id];
  const tab = STR[lang].tabs?.[l.id] || m.tab;
  return { ...m, tab };
};
const secMeta = (s, lang) => (lang !== "ko" && META.sections[s.id] ? { title: META.sections[s.id].t, note: META.sections[s.id].n } : { title: s.title, note: s.note });

/* ── 수리야 나마스카라 A ── */
const SURYA_A = [
  { fig: F.samasthiti, name: "사마스티티", nameEn: "Samasthiti", breath: "준비", breathEn: "Ready", n: 1 },
  { fig: F.urdhvaHasta, name: "우르드바 하스타사나", nameEn: "Urdhva Hastasana", breath: "마시며", breathEn: "Inhale", n: 1 },
  { fig: F.uttanasana, name: "우타나사나", nameEn: "Uttanasana", breath: "내쉬며", breathEn: "Exhale", n: 1 },
  { fig: F.chaturanga, name: "차투랑가", nameEn: "Chaturanga", breath: "내쉬며", breathEn: "Exhale", n: 1 },
  { fig: F.upDog, name: "업독", nameEn: "Upward Dog", breath: "마시며", breathEn: "Inhale", n: 1 },
  { fig: F.downDog, name: "다운독", nameEn: "Downward Dog", breath: "호흡 5회", breathEn: "5 breaths", n: 5 },
  { fig: F.uttanasana, name: "우타나사나", nameEn: "Uttanasana", breath: "내쉬며", breathEn: "Exhale", n: 1 },
  { fig: F.samasthiti, name: "사마스티티", nameEn: "Samasthiti", breath: "내쉬며", breathEn: "Exhale", n: 1 },
];

/* ── 레벨별 시퀀스 데이터 ──
   steps: 진입 단계 / mistakes: 흔한 실수
   photo: (선택) 저작권 없는 사진 URL — 있으면 사진, 없으면 스틱 피겨 표시 */
const LEVELS = [
  {
    id: "primary", tab: "초급",
    series: "프라이머리 시리즈 · Yoga Chikitsa (요가 치료)",
    intro: "몸을 정화하고 정렬하는 기초 시리즈. 아쉬탕가의 모든 수련자는 여기서 시작합니다.",
    caution: null,
    sections: [
      {
        id: "p-standing", title: "스탠딩 시퀀스",
        note: "서서 하는 자세들. 태양경배 A 5회, B 3~5회 후에 시작합니다.",
        poses: [
          { fig: F.uttanasana, sk: "Padangusthasana", ko: "파당구쉬타사나 · 엄지발가락 잡기", breath: 5, drishti: "코끝", desc: "다리를 골반 너비로 벌리고 상체를 접어 엄지발가락을 잡습니다.", tip: "무릎을 살짝 굽혀도 좋아요. 발가락이 안 잡히면 정강이를 잡으세요.",
            steps: ["발을 골반 너비로 벌리고 손을 허리에", "마시며 척추를 길게 늘이기", "내쉬며 접어 검지·중지로 엄지발가락 걸기", "마시며 고개 들어 척추 펴고, 내쉬며 깊이 접기"],
            mistakes: ["등을 둥글게 말고 머리만 내리기", "무릎을 과도하게 잠가 뒤로 밀기", "어깨가 귀 쪽으로 솟기"] },
          { fig: F.uttanasana, sk: "Padahastasana", ko: "파다하스타사나 · 손 위에 서기", breath: 5, drishti: "코끝", desc: "손바닥을 발바닥 아래에 넣고 전굴합니다. 손목 스트레칭 효과가 있습니다.", tip: "손이 안 들어가면 발등만 잡아도 됩니다.",
            steps: ["전굴 상태에서 무릎을 살짝 굽히기", "손바닥이 위를 보게 발 밑에 넣기", "발가락이 손목에 닿게 하고 접기"],
            mistakes: ["무릎을 편 채 억지로 손 넣기", "체중이 뒤꿈치로 쏠리기"] },
          { fig: F.trikonasana, sk: "Utthita Trikonasana", ko: "웃티타 트리코나사나 · 삼각 자세", breath: 5, drishti: "위쪽 손끝", desc: "다리를 넓게 벌리고 옆으로 기울여 손을 발 쪽으로 뻗습니다.", tip: "손이 바닥에 안 닿으면 정강이나 블록 위에 두세요.",
            steps: ["점프해 다리를 1m 정도 벌리고 팔 벌리기", "오른발 90도, 왼발 살짝 안으로", "내쉬며 몸통을 오른쪽으로 길게 기울이기", "오른손은 발가락, 왼팔은 하늘로"],
            mistakes: ["엉덩이가 뒤로 빠지며 몸이 앞으로 굽기", "아래 손에 체중을 실어 기대기", "목을 꺾어 무리하게 위 보기"] },
          { fig: F.parivrttaTrik, sk: "Parivrtta Trikonasana", ko: "파리브르타 트리코나사나 · 회전 삼각", breath: 5, drishti: "위쪽 손끝", desc: "삼각 자세에서 몸통을 반대로 비틀어 반대 손을 바깥 발 옆에 둡니다.", tip: "손을 발 안쪽이나 정강이에 두고 비틀기의 감각부터 익히세요.",
            steps: ["보폭을 삼각보다 약간 좁게", "골반을 앞발 쪽으로 정면 맞추기", "내쉬며 비틀어 반대 손을 발 바깥 바닥에", "위 팔을 수직으로 뻗기"],
            mistakes: ["골반이 열린 채 어깨만 비틀기", "뒷발 뒤꿈치가 들리기", "균형 잃을 만큼 시선부터 위로"] },
          { fig: F.parsvakonasana, sk: "Utthita Parsvakonasana", ko: "웃티타 파르스바코나사나 · 측면각", breath: 5, drishti: "위쪽 손끝", desc: "앞 무릎을 굽히고 옆구리를 늘여 발날부터 손끝까지 사선을 만듭니다.", tip: "팔꿈치를 무릎 위에 올려 지지해도 충분합니다.",
            steps: ["다리를 넓게 벌리고 오른발 90도", "내쉬며 오른 무릎을 직각으로 굽히기", "오른손을 발 바깥 바닥에 내리기", "왼팔을 귀 옆으로 길게 뻗기"],
            mistakes: ["무릎이 안쪽으로 무너지기", "가슴이 바닥을 보며 닫히기", "뒷다리가 굽어 사선이 끊기기"] },
          { fig: F.parsvakonasana, sk: "Parivrtta Parsvakonasana", ko: "파리브르타 파르스바코나사나 · 회전 측면각", breath: 5, drishti: "위쪽 손끝", desc: "측면각에서 몸통을 비틀어 반대 팔꿈치를 무릎 바깥에 겁니다.", tip: "뒷무릎을 바닥에 내려놓고 시작해도 좋아요.",
            steps: ["전사 1 다리 모양에서 시작", "내쉬며 반대 팔꿈치를 무릎 바깥에 걸기", "합장하며 가슴을 하늘로 비틀기", "가능하면 아래 손을 바닥으로"],
            mistakes: ["비틀기 위해 앞 무릎이 흔들리기", "숨을 참으며 쥐어짜듯 비틀기"] },
          { fig: F.prasarita, sk: "Prasarita Padottanasana A–D", ko: "프라사리타 파도타나사나 · 다리 넓게 전굴", breath: "5×4", drishti: "코끝", desc: "다리를 넓게 벌리고 전굴합니다. 손 위치가 다른 A·B·C·D를 진행합니다.", tip: "정수리가 바닥에 안 닿아도 괜찮아요.",
            steps: ["다리를 어깨 두 배 너비로 벌리기", "마시며 척추 늘이고 내쉬며 접기", "A: 손 바닥 → B: 허리 → C: 등 뒤 깍지 → D: 발가락"],
            mistakes: ["체중이 뒤꿈치로 쏠려 뒤로 넘어질 듯한 자세", "등이 말린 채 머리만 바닥으로 밀기"] },
          { fig: F.parsvottanasana, sk: "Parsvottanasana", ko: "파르스보타나사나 · 측면 전굴", breath: 5, drishti: "코끝", desc: "다리를 앞뒤로 벌리고 앞다리 위로 상체를 접습니다. 등 뒤에서 합장합니다.", tip: "등 뒤 합장이 어려우면 팔꿈치를 잡으세요.",
            steps: ["등 뒤에서 합장(또는 팔꿈치 잡기)", "다리를 앞뒤로 벌리고 골반 정면", "마시며 가슴 열고, 내쉬며 앞다리 위로 접기"],
            mistakes: ["골반이 옆으로 틀어진 채 접기", "턱을 다리에 대려고 등 말기"] },
          { fig: F.utthitaHasta, sk: "Utthita Hasta Padangusthasana", ko: "웃티타 하스타 파당구쉬타사나 · 선 다리 들기", breath: "5×4", drishti: "발끝·측면", desc: "한 다리로 서서 반대 다리를 들어 잡고, 앞·옆으로 뻗은 뒤 손 없이 유지합니다.", tip: "무릎을 굽혀 잡거나 스트랩을 쓰세요.",
            steps: ["왼손 허리, 오른손으로 오른 엄지발가락", "마시며 다리를 앞으로 뻗기 (5호흡)", "다리를 옆으로 열기 (5호흡)", "다시 앞으로, 손 놓고 다리만 유지"],
            mistakes: ["서 있는 다리 골반이 옆으로 빠지기", "다리 높이 욕심에 등이 말리기", "바닥 응시로 균형 대신 목 긴장"] },
          { fig: F.ardhaBaddhaStand, sk: "Ardha Baddha Padmottanasana", ko: "아르다 받다 파드모타나사나 · 반연꽃 선 전굴", breath: 5, drishti: "코끝", desc: "한 발을 반연꽃으로 접어 뒤로 잡고, 한 다리로 서서 전굴합니다.", tip: "무릎이 아프면 발을 잡지 말고 무릎만 접어 균형부터.",
            steps: ["오른발을 왼 허벅지 위 반연꽃으로", "오른팔을 등 뒤로 돌려 발 잡기", "내쉬며 천천히 전굴, 왼손 바닥"],
            mistakes: ["무릎 통증을 참고 계속하기 (바로 풀 것)", "발을 잡으려 어깨를 과도하게 꺾기"] },
          { fig: F.utkatasana, sk: "Utkatasana", ko: "웃카타사나 · 의자 자세", breath: 5, drishti: "엄지손가락", desc: "무릎을 굽혀 앉듯이 내려가며 팔을 위로 뻗습니다.", tip: "무릎이 발끝을 넘지 않게, 체중은 뒤꿈치에.",
            steps: ["발을 모으고 마시며 팔 위로", "내쉬며 의자에 앉듯 무릎 굽히기", "꼬리뼈를 살짝 말아 허리 보호"],
            mistakes: ["허리가 과하게 꺾여 갈비뼈가 튀어나오기", "무릎이 발끝보다 훨씬 앞으로"] },
          { fig: F.warrior, sk: "Virabhadrasana A", ko: "비라바드라사나 A · 전사 1", breath: 5, drishti: "엄지손가락", desc: "앞 무릎을 90도로 굽히고 팔을 위로 뻗습니다.", tip: "무릎이 발목보다 앞으로 나가지 않게 보폭을 조절하세요.",
            steps: ["다리를 앞뒤로 넓게, 뒷발 45도", "골반을 정면으로 맞추기", "내쉬며 앞 무릎 직각, 마시며 팔 위로"],
            mistakes: ["뒷발 날이 들려 무릎에 비틀림", "허리를 꺾어 젖히며 버티기"] },
          { fig: F.warriorB, sk: "Virabhadrasana B", ko: "비라바드라사나 B · 전사 2", breath: 5, drishti: "앞 손끝", desc: "골반을 옆으로 열고 팔을 양옆으로 뻗습니다.", tip: "어깨에 힘이 들어가면 팔을 살짝 내려도 됩니다.",
            steps: ["전사 1에서 골반과 가슴을 옆으로 열기", "팔을 어깨높이로 양옆에 뻗기", "시선은 앞 손끝, 몸통은 중앙에"],
            mistakes: ["몸통이 앞다리 쪽으로 기울기", "앞 무릎이 안쪽으로 무너지기"] },
        ],
      },
      {
        id: "p-seated", title: "시티드 시퀀스",
        note: "앉은 자세들. 각 자세 사이에 빈야사(점프백)가 들어갑니다.",
        poses: [
          { fig: F.dandasana, sk: "Dandasana", ko: "단다사나 · 지팡이 자세", breath: 5, drishti: "코끝", desc: "다리를 뻗고 척추를 곧게 세워 앉습니다. 모든 앉은 자세의 기준입니다.", tip: "골반이 뒤로 말리면 담요를 깔고 앉으세요.",
            steps: ["다리를 모아 앞으로 뻗기", "손바닥으로 바닥을 눌러 척추 세우기", "발끝을 몸 쪽으로 당기고 턱 살짝 당기기"],
            mistakes: ["골반이 뒤로 말려 허리가 굽기", "어깨가 솟아 목이 짧아지기"] },
          { fig: F.paschimottanasana, sk: "Paschimottanasana A·D", ko: "파스치모타나사나 · 앉은 전굴", breath: "5×2", drishti: "발끝", desc: "마시며 척추를 늘이고, 내쉬며 다리 위로 상체를 접습니다.", tip: "무릎을 굽히고 배와 허벅지를 먼저 붙이는 연습부터.",
            steps: ["단다사나에서 마시며 팔 위로", "내쉬며 골반부터 접어 발 잡기", "마시며 척추 펴고, 내쉬며 배→가슴→머리 순으로"],
            mistakes: ["허리 대신 등만 둥글게 말기", "어깨로 발을 당기며 힘으로 누르기"] },
          { fig: F.purvottanasana, sk: "Purvottanasana", ko: "푸르보타나사나 · 몸 앞면 늘이기", breath: 5, drishti: "코끝(뒤로)", desc: "전굴의 반대 자세. 손과 발로 밀어 몸 앞면 전체를 들어 올립니다.", tip: "골반만 드는 테이블탑으로 대체 가능합니다.",
            steps: ["손을 엉덩이 뒤 한 뼘에 두기", "내쉬며 골반을 최대한 위로", "발바닥을 바닥에 붙이려 뻗고 고개 뒤로"],
            mistakes: ["엉덩이가 처져 몸이 꺾이기", "목을 힘없이 완전히 떨어뜨리기"] },
          { fig: F.januSirsasana, sk: "Ardha Baddha Padma Paschimottanasana", ko: "아르다 받다 파드마 파스치모타나사나", breath: 5, drishti: "발끝", desc: "한 발을 반연꽃으로 접어 등 뒤로 잡고 전굴합니다.", tip: "무릎이 뜨거나 아프면 발을 허벅지 아래에 두세요.",
            steps: ["오른발을 왼 허벅지 위 반연꽃으로", "오른팔 등 뒤로 돌려 발 잡기", "내쉬며 왼다리 위로 전굴"],
            mistakes: ["무릎 통증 무시 (즉시 풀 것)", "묶기에 집착해 몸통이 비틀린 채 접기"] },
          { fig: F.januSirsasana, sk: "Triang Mukha Eka Pada Paschimottanasana", ko: "트리앙 무카 에카파다 파스치모타나사나", breath: 5, drishti: "발끝", desc: "한 다리를 뒤로 접어 정강이를 바닥에 대고 전굴합니다.", tip: "기우는 쪽 엉덩이 밑에 담요를 받치세요.",
            steps: ["오른다리를 뒤로 접어 발등 바닥에", "양 엉덩이를 바닥에 고르게 내리기", "내쉬며 뻗은 다리 위로 접기"],
            mistakes: ["접은 쪽 엉덩이가 들려 몸이 기울기", "접은 무릎이 옆으로 크게 벌어지기"] },
          { fig: F.januSirsasana, sk: "Janu Sirsasana A–C", ko: "자누 시르사사나 · 무릎-머리 자세", breath: "5×3", drishti: "발끝", desc: "무릎을 접어 발을 허벅지 안쪽에 대고 전굴합니다. A·B·C를 진행합니다.", tip: "접은 무릎이 뜨면 담요로 받쳐 주세요. C는 발목이 유연해진 후에.",
            steps: ["오른 무릎을 접어 발바닥을 허벅지 안쪽에", "몸통을 뻗은 다리 쪽으로 정렬", "내쉬며 전굴해 발 잡기"],
            mistakes: ["뻗은 다리 무릎이 바깥으로 돌아가기", "C에서 발목을 억지로 세워 통증 참기"] },
          { fig: F.marichyasana, sk: "Marichyasana A·B", ko: "마리챠사나 A·B · 현인 자세 (전굴)", breath: "5×2", drishti: "발끝", desc: "한 무릎을 세우고 팔로 감아 등 뒤에서 손을 잡은 뒤 전굴합니다.", tip: "손이 안 잡히면 스트랩을 쓰거나 무릎만 감싸세요.",
            steps: ["오른 무릎 세우고 발을 엉덩이 가까이", "오른팔로 정강이를 앞에서 감기", "등 뒤에서 왼손 잡고 내쉬며 전굴"],
            mistakes: ["묶으려고 등을 잔뜩 말기", "세운 발이 멀어 감을 공간이 없어지기"] },
          { fig: F.marichyC, sk: "Marichyasana C·D", ko: "마리챠사나 C·D · 현인 자세 (비틀기)", breath: "5×2", drishti: "측면", desc: "세운 무릎 바깥으로 반대 팔을 걸어 깊게 비틀고 등 뒤에서 손을 잡습니다.", tip: "팔꿈치로 무릎을 밀며 비틀기만 해도 충분해요.",
            steps: ["오른 무릎 세우고 마시며 척추 늘이기", "내쉬며 왼 팔꿈치를 무릎 바깥에 걸기", "숨을 내쉴 때마다 조금씩 깊게, 등 뒤 손 잡기"],
            mistakes: ["척추를 세우지 않고 구부정하게 비틀기", "호흡을 참아가며 쥐어짜기"] },
          { fig: F.navasana, sk: "Navasana", ko: "나바사나 · 보트 자세", breath: "5×5", drishti: "발끝", desc: "꼬리뼈로 균형을 잡고 V자를 만들어 5회 반복합니다.", tip: "무릎을 굽혀 정강이를 바닥과 평행하게 해도 좋아요.",
            steps: ["무릎 굽혀 정강이 평행부터", "가슴을 들어 척추 편 채 다리 뻗기", "팔은 바닥과 평행, 5호흡 후 내렸다 반복"],
            mistakes: ["등이 말려 허리로 버티기", "목과 어깨에 힘이 몰리기"] },
          { fig: F.bhujapidasana, sk: "Bhujapidasana", ko: "부자피다사나 · 어깨 압박 자세", breath: 5, drishti: "코끝", desc: "허벅지를 팔 위에 걸고 손으로 균형을 잡는 첫 번째 암밸런스입니다.", tip: "발이 안 떠도 괜찮아요. 손에 체중 싣는 감각부터.",
            steps: ["쪼그려 앉아 손을 발 뒤 바닥에", "허벅지를 팔 위쪽에 깊이 걸기", "체중을 손으로 옮기며 발 교차해 들기"],
            mistakes: ["허벅지를 얕게 걸어 미끄러지기", "고개를 숙여 앞으로 구르기"] },
          { fig: F.kurmasana, sk: "Kurmasana · Supta Kurmasana", ko: "쿠르마사나 · 거북이 자세", breath: "5×2", drishti: "코끝", desc: "다리 아래로 팔을 뻗어 몸을 낮게 접습니다.", tip: "숩타 쿠르마사나는 지도자와 함께 진행하는 게 안전합니다.",
            steps: ["다리를 벌리고 무릎 살짝 굽히기", "팔을 허벅지 아래로 옆으로 뻗기", "가슴을 바닥으로 낮추며 다리 펴기"],
            mistakes: ["어깨를 무리하게 눌러 넣기", "숩타에서 혼자 다리를 목 뒤로 강제하기"] },
          { fig: F.garbha, sk: "Garbha Pindasana · Kukkutasana", ko: "가르바 핀다사나 · 태아 자세", breath: "5×2", drishti: "코끝", desc: "연꽃에서 팔을 다리 사이로 넣어 공처럼 말고 9회 구른 뒤 올라옵니다.", tip: "연꽃이 안 되면 책상다리로 몸을 안고 구르기만.",
            steps: ["연꽃 자세에서 팔을 종아리 사이로", "손으로 뺨 받치고 몸 둥글게", "등으로 9회 구르고 손 짚어 올라오기"],
            mistakes: ["팔을 억지로 밀어 넣어 피부 쓸리기 (물 뿌리면 수월)", "구를 때 목으로 반동 주기"] },
          { fig: F.baddhaKonasana, sk: "Baddha Konasana A·B", ko: "받다 코나사나 · 나비 자세", breath: "5×2", drishti: "코끝", desc: "발바닥을 마주 붙이고 무릎을 열어 앉은 뒤 전굴합니다.", tip: "무릎이 높이 뜨면 억지로 누르지 말고 호흡으로 기다리세요.",
            steps: ["발바닥 붙이고 뒤꿈치를 몸 가까이", "발을 책처럼 펼쳐 잡기", "마시며 척추 늘이고 내쉬며 전굴"],
            mistakes: ["무릎을 손으로 눌러 강제하기", "등부터 말며 머리만 내리기"] },
          { fig: F.upavistha, sk: "Upavistha Konasana", ko: "우파비스타 코나사나 · 다리 벌려 전굴", breath: "5×2", drishti: "코끝·위", desc: "다리를 넓게 벌리고 전굴한 뒤, 다리를 들어 균형 변형으로 이어집니다.", tip: "골반 밑에 담요를 깔면 전굴이 훨씬 수월해요.",
            steps: ["다리를 무리 없는 폭으로 벌리기", "무릎과 발끝은 하늘 방향 유지", "내쉬며 골반부터 앞으로 접기"],
            mistakes: ["다리가 안으로 굴러 무릎이 바닥 보기", "폭 욕심에 무릎 안쪽 통증 참기"] },
          { fig: F.halasana, sk: "Supta Konasana", ko: "숩타 코나사나 · 누운 각 자세", breath: 5, drishti: "코끝", desc: "누워 다리를 머리 뒤로 넘겨 벌리고 잡았다가, 굴러 올라와 균형을 잡습니다.", tip: "구르기가 무서우면 다리 넘기기까지만.",
            steps: ["누워서 다리를 머리 뒤로 넘기기", "다리 벌려 발가락 잡기", "마시며 굴러 올라와 V자 균형"],
            mistakes: ["목을 좌우로 돌리기 (경추 위험)", "반동만으로 굴러 등부터 떨어지기"] },
          { fig: F.suptaPada, sk: "Supta Padangusthasana", ko: "숩타 파당구쉬타사나 · 누운 다리 들기", breath: "5×4", drishti: "발끝·측면", desc: "누워 한 다리를 수직으로 들어 잡고, 옆으로 열었다가 돌아옵니다.", tip: "스트랩을 걸면 다리를 편 채로 할 수 있어요.",
            steps: ["누워서 오른다리 들어 발가락 잡기", "왼다리는 바닥에 강하게 뻗기", "다리를 옆으로 열기, 반대 골반은 바닥에"],
            mistakes: ["바닥 다리가 굽거나 뜨기", "다리를 여는 쪽으로 몸 전체가 따라가기"] },
          { fig: F.navasana, sk: "Ubhaya Padangusthasana · Urdhva Mukha Paschimottanasana", ko: "우바야 파당구쉬타사나 · 위를 향한 전굴", breath: "5×2", drishti: "위·발끝", desc: "굴러 올라와 발가락을 잡고 균형, 이어 다리에 몸을 붙이는 V자 전굴.", tip: "무릎을 굽혀 균형부터 잡고 천천히 펴세요.",
            steps: ["누워 다리 넘겼다 굴러 올라오기", "발가락(또는 발날) 잡고 다리 펴기", "가슴과 다리를 서로 가깝게"],
            mistakes: ["올라온 뒤 등이 말려 뒤로 다시 구르기", "어깨가 솟은 채 팔로만 당기기"] },
          { fig: F.setuBandha, sk: "Setu Bandhasana", ko: "세투 반다사나 · 다리(橋) 자세", breath: 5, drishti: "코끝", desc: "머리와 발로 지지하며 몸을 아치로 드는 프라이머리의 마지막 자세입니다.", tip: "목 부담이 크니 어깨로 지지하는 일반 브릿지로 대체하세요.",
            steps: ["누워 발을 마름모로 모으기", "정수리를 바닥에 대고 가슴 들기", "발로 밀며 골반을 들어 아치"],
            mistakes: ["목 힘 없이 머리에 체중 싣기", "발이 미끄러지며 무릎에 무리"] },
        ],
      },
      {
        id: "p-finishing", title: "피니싱 시퀀스",
        note: "모든 레벨이 공유하는 마무리. 몸과 호흡을 가라앉힙니다.",
        poses: [
          { fig: F.wheel, sk: "Urdhva Dhanurasana", ko: "우르드바 다누라사나 · 아치 자세", breath: "5×3", drishti: "코끝", desc: "손과 발로 바닥을 밀어 몸을 아치로 들어 올립니다. 3회 반복합니다.", tip: "브릿지(어깨만 들기)부터 시작해도 충분합니다.",
            steps: ["누워 발을 엉덩이 가까이, 손은 귀 옆", "마시며 정수리로 살짝 올라오기", "팔다리를 펴며 완전히 들어 올리기"],
            mistakes: ["팔꿈치가 바깥으로 벌어지기", "허리만 꺾이고 가슴·어깨가 안 열리기", "내려올 때 턱부터 떨어지기"] },
          { fig: F.sarvangasana, sk: "Salamba Sarvangasana", ko: "살람바 사르방가사나 · 어깨서기", breath: 10, drishti: "코끝", desc: "어깨로 서서 다리를 수직으로 뻗습니다.", tip: "담요를 어깨 밑에 깔면 목이 편해요.",
            steps: ["누워 다리를 머리 뒤로 넘기기", "손으로 등을 받치고 다리 수직으로", "팔꿈치를 어깨너비로 모으기"],
            mistakes: ["목이 눌린 채 버티기 (침 삼키기 어려우면 위험 신호)", "고개를 옆으로 돌리기", "몸이 사선으로 기울어 목에 하중"] },
          { fig: F.halasana, sk: "Halasana · Karnapidasana", ko: "할라사나 · 쟁기 자세", breath: "8×2", drishti: "코끝", desc: "다리를 머리 뒤로 넘기고, 이어서 무릎으로 귀를 감쌉니다.", tip: "발이 안 닿으면 무릎을 굽혀 이마 가까이 두세요.",
            steps: ["어깨서기에서 다리를 천천히 뒤로", "발끝을 바닥에 대고 다리 펴기", "무릎 굽혀 귀 옆으로 (카르나피다)"],
            mistakes: ["다리를 반동으로 툭 떨어뜨리기", "등 받친 손을 일찍 풀기"] },
          { fig: F.matsyasana, sk: "Matsyasana", ko: "마츠야사나 · 물고기 자세", breath: 8, drishti: "미간", desc: "어깨서기의 반대 자세. 가슴을 들어 목 앞면을 엽니다.", tip: "정수리 대신 뒤통수를 대고 가슴만 살짝 들어도 됩니다.",
            steps: ["누워 손을 엉덩이 아래에 넣기", "팔꿈치로 밀며 가슴 들어 올리기", "정수리를 가볍게 바닥에 대기"],
            mistakes: ["머리에 체중을 전부 싣기", "입을 벌린 채 목만 꺾기"] },
          { fig: F.sirsasana, sk: "Sirsasana", ko: "시르사사나 · 머리서기", breath: "10+", drishti: "코끝", desc: "전완으로 삼각대를 만들어 거꾸로 섭니다.", tip: "혼자서는 벽 앞에서 연습하세요. 돌고래 자세로 대체 가능.",
            steps: ["전완 삼각대 만들고 정수리 바닥에", "다리 펴고 발끝으로 걸어 들어오기", "무릎 접어 올린 뒤 천천히 다리 펴기"],
            mistakes: ["체중이 머리에만 실리기 (전완이 70%)", "점프로 차올리며 등 꺾기", "무너질 때 버티기 (구르는 법 먼저 배우기)"] },
          { fig: F.padmasana, sk: "Baddha Padmasana · Padmasana", ko: "받다 파드마사나 · 연꽃 자세", breath: "10×2", drishti: "코끝", desc: "연꽃으로 앉아 등 뒤에서 발을 잡고 전굴한 뒤, 바로 앉아 호흡합니다.", tip: "반연꽃이나 책상다리로 대체하세요. 무릎 통증은 신호입니다.",
            steps: ["오른발을 왼 허벅지 위로 (고관절부터 접기)", "왼발을 오른 허벅지 위로", "등 뒤로 팔을 교차해 발 잡고 전굴"],
            mistakes: ["무릎을 눌러 강제로 내리기", "발목이 꺾인 채 통증 참기"] },
          { fig: F.utpluthih, sk: "Utpluthih", ko: "우트플루티히 · 들어 올리기", breath: 10, drishti: "코끝", desc: "연꽃 자세 그대로 손으로 바닥을 밀어 몸 전체를 들고 10회 호흡합니다.", tip: "엉덩이가 안 떠도 괜찮아요. 미는 힘을 기르는 과정입니다.",
            steps: ["손을 허벅지 옆 바닥에 단단히", "내쉬며 반다를 조이고 밀어 올리기", "10호흡 유지 후 빈야사로 마무리"],
            mistakes: ["어깨가 귀에 붙은 채 버티기", "호흡을 멈추고 힘만 쓰기"] },
          { fig: F.savasana, sk: "Savasana", ko: "사바사나 · 송장 자세", breath: "5분+", drishti: "—", desc: "완전히 이완하며 수련을 마칩니다. 최소 5분, 건너뛰지 마세요.", tip: "가장 쉬워 보이지만 가장 중요한 자세입니다.",
            steps: ["팔다리를 편안히 벌리고 눕기", "몸의 힘을 발끝부터 차례로 풀기", "호흡을 통제하지 않고 그저 바라보기"],
            mistakes: ["시간이 아까워 30초 만에 일어나기", "다음 할 일을 계획하며 눕기"] },
        ],
      },
    ],
  },
  {
    id: "intermediate", tab: "중급",
    series: "인터미디엇 시리즈 · Nadi Shodhana (신경 정화)",
    intro: "깊은 후굴과 다리를 머리 뒤로 넘기는 자세, 암밸런스가 더해집니다. 프라이머리 전체를 안정적으로 수련한 뒤에 진행합니다.",
    caution: "인터미디엇은 전통적으로 지도자의 허락 아래 한 자세씩 더해 갑니다. 혼자 수련한다면 카포타사나·에카파다 시르사사나 같은 깊은 자세는 충분한 준비 없이 시도하지 마세요.",
    sections: [
      {
        id: "i-twist", title: "비틀기와 전굴",
        note: "시리즈의 문을 여는 자세들입니다.",
        poses: [
          { fig: F.pasasana, sk: "Pasasana", ko: "파사사나 · 올가미 자세", breath: 5, drishti: "측면", desc: "쪼그려 앉아 무릎 바깥으로 팔을 감아 등 뒤에서 손을 잡습니다.", tip: "뒤꿈치 밑에 담요를 받치고, 손 대신 팔꿈치 걸기부터.",
            steps: ["발을 모아 쪼그려 앉기", "내쉬며 몸통을 비틀어 팔꿈치를 무릎 밖에", "팔로 다리를 감아 등 뒤에서 손 잡기"],
            mistakes: ["뒤꿈치가 들린 채 앞으로 넘어지기", "무릎이 좌우로 벌어지며 비틀림이 새기"] },
          { fig: F.krounchasana, sk: "Krounchasana", ko: "크라운차사나 · 왜가리 자세", breath: 5, drishti: "발끝", desc: "한 다리를 뒤로 접고 반대 다리를 수직으로 들어 얼굴 쪽으로 당깁니다.", tip: "다리를 덜 세우고 무릎을 굽혀도 됩니다.",
            steps: ["트리앙 무카처럼 한 다리 뒤로 접기", "반대 발을 잡아 다리 수직으로 펴기", "내쉬며 다리를 얼굴 쪽으로 당기기"],
            mistakes: ["등이 말리며 뒤로 눕듯 기울기", "접은 쪽 엉덩이가 들리기"] },
          { fig: F.marichyC, sk: "Bharadvajasana · Ardha Matsyendrasana", ko: "바라드바자사나 · 아르다 마첸드라사나", breath: "5×2", drishti: "측면", desc: "시리즈 중반의 깊은 앉은 비틀기 두 자세입니다.", tip: "골반이 뜨면 담요를 깔고, 비틀기는 내쉴 때만 깊어지세요.",
            steps: ["다리 모양을 만들고 골반 고정", "마시며 척추를 위로 늘이기", "내쉬며 아랫배부터 차례로 비틀기"],
            mistakes: ["목만 홱 돌려 비튼 척하기", "골반까지 따라 돌아 비틀림이 사라지기"] },
        ],
      },
      {
        id: "i-backbend", title: "후굴 시퀀스",
        note: "인터미디엇의 심장. 척추를 단계적으로 깊게 젖힙니다.",
        poses: [
          { fig: F.shalabhasana, sk: "Shalabhasana A·B", ko: "샬라바사나 · 메뚜기 자세", breath: "5×2", drishti: "코끝", desc: "엎드려 다리와 가슴을 들어 올립니다. 후굴의 기초를 다집니다.", tip: "높이보다 등의 힘으로 드는 감각이 중요해요.",
            steps: ["엎드려 팔을 몸 옆에", "마시며 가슴과 다리를 동시에 들기", "치골로 바닥을 누르며 유지"],
            mistakes: ["무릎을 굽혀 높이만 올리기", "목을 꺾어 하늘 보기"] },
          { fig: F.shalabhasana, sk: "Bhekasana", ko: "베카사나 · 개구리 자세", breath: 5, drishti: "코끝", desc: "엎드린 채 발을 잡아 엉덩이 옆 바닥 쪽으로 누릅니다.", tip: "한 발씩 하는 아르다 베카사나부터.",
            steps: ["엎드려 무릎을 굽히고 발등 잡기", "손끝이 앞을 보게 손 방향 돌리기", "가슴 들며 발을 바닥 쪽으로 누르기"],
            mistakes: ["무릎이 몸에서 멀리 벌어지기", "무릎 통증을 참으며 누르기"] },
          { fig: F.dhanurasana, sk: "Dhanurasana · Parsva Dhanurasana", ko: "다누라사나 · 활 자세", breath: "5×3", drishti: "코끝", desc: "발목을 잡고 몸을 활처럼 당깁니다. 좌우로 구르는 파르스바로 이어집니다.", tip: "발목이 안 잡히면 스트랩을 발에 걸어 당기세요.",
            steps: ["엎드려 무릎 굽히고 발목 잡기", "마시며 정강이를 뒤로 차 가슴 들기", "체중을 배에 두고 흔들림 허용"],
            mistakes: ["무릎이 어깨보다 넓게 벌어지기", "팔 힘으로만 당겨 어깨 조이기"] },
          { fig: F.ustrasana, sk: "Ustrasana", ko: "우스트라사나 · 낙타 자세", breath: 5, drishti: "미간", desc: "무릎으로 서서 뒤로 젖혀 뒤꿈치를 잡습니다. 허벅지는 수직 유지.", tip: "발끝을 세워 뒤꿈치를 높이거나, 손을 허리에 두고 젖히기만.",
            steps: ["무릎 서기, 골반 너비로", "손으로 허리 받치고 가슴부터 젖히기", "한 손씩 뒤꿈치로, 골반은 계속 앞으로"],
            mistakes: ["허리부터 꺾어 통증 만들기", "골반이 뒤로 빠지며 허벅지가 기울기"] },
          { fig: F.ustrasana, sk: "Laghu Vajrasana", ko: "라구 바즈라사나 · 작은 벼락 자세", breath: 5, drishti: "미간", desc: "낙타에서 더 깊게 — 정수리가 발에 닿을 때까지 젖혔다 올라옵니다.", tip: "올라오는 힘이 먼저입니다. 절반만 내려가는 연습부터.",
            steps: ["낙타 자세에서 무릎 아래 잡기", "내쉬며 정수리를 발 쪽으로 내리기", "허벅지 힘으로 마시며 올라오기"],
            mistakes: ["내려간 뒤 올라올 힘이 없어 무너지기", "팔에 매달려 내려가기"] },
          { fig: F.kapotasana, sk: "Kapotasana A·B", ko: "카포타사나 · 비둘기 자세", breath: "5×2", drishti: "코끝", desc: "무릎으로 서서 뒤로 깊게 젖혀 손으로 뒤꿈치를 잡는 가장 깊은 후굴입니다.", tip: "혼자서는 벽 짚고 내려가는 연습까지만. 지도자와 함께가 안전합니다.",
            steps: ["무릎 서서 팔을 위로, 골반 앞으로", "뒤로 젖혀 손을 바닥 → 발 쪽으로 걷기", "팔꿈치 내려 뒤꿈치 잡고 호흡"],
            mistakes: ["준비 없이 허리로 털썩 떨어지기", "호흡이 끊긴 채 버티기 (얕아도 잇기)"] },
          { fig: F.ustrasana, sk: "Supta Vajrasana", ko: "숩타 바즈라사나 · 누운 벼락 자세", breath: 5, drishti: "미간", desc: "받다 파드마사나로 발을 잡은 채 뒤로 누웠다 올라오기를 반복합니다.", tip: "전통적으로 보조자가 필요한 자세 — 혼자라면 생략하세요.",
            steps: ["받다 파드마사나로 발 잡기", "보조자가 무릎 고정", "내쉬며 뒤로, 마시며 올라오기 3회"],
            mistakes: ["혼자 시도하다 발을 놓쳐 뒤로 쾅", "목부터 젖혀 내려가기"] },
        ],
      },
      {
        id: "i-leg-arm", title: "다리 뒤로 & 암밸런스·역자세",
        note: "고관절과 어깨, 코어가 총동원되는 후반부입니다.",
        poses: [
          { fig: F.bakasana, sk: "Bakasana A·B", ko: "바카사나 · 두루미 자세", breath: "5×2", drishti: "코끝", desc: "무릎을 팔 위에 얹고 손으로 균형을 잡습니다. B는 점프 진입.", tip: "이마 앞에 쿠션을 두면 두려움이 줄어요.",
            steps: ["쪼그려 손을 어깨너비로 짚기", "무릎을 겨드랑이 가까이 얹기", "시선 앞으로, 체중을 앞으로 옮겨 발 들기"],
            mistakes: ["시선이 발밑을 향해 앞구르기", "팔꿈치가 옆으로 벌어지기"] },
          { fig: F.ekaPadaSirsa, sk: "Eka Pada Sirsasana", ko: "에카파다 시르사사나 · 한 다리 머리 뒤로", breath: 5, drishti: "발끝", desc: "한 다리를 머리 뒤에 걸고 앉아 전굴합니다.", tip: "다리를 어깨까지만 올리는 연습부터. 목으로 버티지 마세요.",
            steps: ["다리를 요람처럼 안고 고관절 데우기", "어깨를 다리 안쪽으로 깊이 넣기", "다리를 목이 아닌 어깨·등 위에 걸기"],
            mistakes: ["목 힘으로 다리를 밀어 버티기", "고관절이 안 열린 채 무릎만 꺾기"] },
          { fig: F.yoganidra, sk: "Dwi Pada Sirsasana · Yoganidrasana", ko: "드위파다 시르사사나 · 요가니드라사나", breath: "5×2", drishti: "코끝", desc: "두 다리를 모두 머리 뒤로 — 앉아서, 그리고 누워서.", tip: "에카파다가 양쪽 모두 편안해진 뒤에만.",
            steps: ["에카파다에서 반대 다리도 걸기", "(누운 버전) 등을 대고 다리를 차례로", "발목 교차하고 손은 등 뒤 잡기"],
            mistakes: ["척추가 감당 못 하는데 발목부터 걸기", "빠져나올 때 급하게 풀기"] },
          { fig: F.tittibhasana, sk: "Tittibhasana A–C", ko: "티티바사나 · 반딧불이 자세", breath: "5×3", drishti: "코끝", desc: "다리를 팔 위에 걸어 앞으로 뻗는 암밸런스입니다.", tip: "높이보다 어깨 뒤로 허벅지를 깊이 거는 게 핵심.",
            steps: ["다리 사이로 어깨를 깊이 넣기", "손 짚고 엉덩이 내리며 다리 앞으로", "팔을 펴며 다리도 펴기"],
            mistakes: ["허벅지가 팔꿈치 근처라 미끄러지기", "엉덩이가 너무 낮아 주저앉기"] },
          { fig: F.pincha, sk: "Pincha Mayurasana", ko: "핀차 마유라사나 · 공작 깃털 자세", breath: 5, drishti: "코끝", desc: "전완으로 서는 역자세입니다.", tip: "벽 앞에서 연습하고, 블록으로 전완 삼각형을 만드세요.",
            steps: ["전완을 평행하게 바닥에", "엉덩이 들어 발로 걸어 들어오기", "한 다리씩 차올려 수직 찾기"],
            mistakes: ["팔꿈치가 벌어지며 무너지기", "허리를 꺾어 바나나 모양으로 버티기"] },
          { fig: F.pincha, sk: "Karandavasana", ko: "카란다바사나 · 히말라야 거위 자세", breath: 5, drishti: "코끝", desc: "핀차에서 연꽃을 틀어 팔 위로 내렸다가 다시 올라갑니다.", tip: "핀차에서 연꽃 틀기만, 내리기는 벽과 함께.",
            steps: ["핀차에서 공중 연꽃 틀기", "천천히 무릎을 위팔로 내리기", "반다로 다시 들어 올리기"],
            mistakes: ["내리는 속도를 통제 못해 추락", "올릴 때 반동으로 허리 꺾기"] },
          { fig: F.mayurasana, sk: "Mayurasana · Nakrasana", ko: "마유라사나 · 공작 자세", breath: "5×2", drishti: "코끝", desc: "팔꿈치 위에 몸을 수평으로 띄우는 공작, 이어 점프 이동하는 악어.", tip: "팔꿈치를 배꼽에 정확히 대는 위치 찾기가 절반입니다.",
            steps: ["무릎 벌려 앉아 손끝이 뒤를 보게 짚기", "팔꿈치를 모아 배꼽에 대기", "머리를 낮추며 다리를 띄워 수평"],
            mistakes: ["팔꿈치가 배에서 미끄러지기", "머리부터 떨어지기 (턱 아님 이마 조심)"] },
          { fig: F.gomukhasana, sk: "Gomukhasana A·B", ko: "고무카사나 · 소 얼굴 자세", breath: "5×2", drishti: "코끝·위", desc: "무릎을 포개고 등 뒤에서 손을 잡아 어깨를 엽니다.", tip: "손이 안 닿으면 스트랩으로 연결하세요.",
            steps: ["무릎을 위아래로 포개 앉기", "한 팔은 위에서, 한 팔은 아래에서 등 뒤로", "등 뒤에서 손 잡고 가슴 펴기"],
            mistakes: ["갈비뼈를 내밀며 잡은 척하기", "위 팔꿈치가 얼굴을 누르기"] },
          { fig: F.sirsasana, sk: "Seven Headstands", ko: "일곱 가지 머리서기", breath: "5×7", drishti: "코끝", desc: "팔 위치가 다른 일곱 가지 머리서기로 시리즈를 마칩니다.", tip: "기본 시르사사나가 벽 없이 1분 이상 안정된 뒤의 이야기입니다.",
            steps: ["묵타 하스타: 손을 앞에 펴 짚기", "받다 하스타: 팔짱·합장 변형", "각 변형에서 중심 재조정"],
            mistakes: ["팔 지지가 약한 변형에서 목에 하중", "변형 전환을 서두르다 균형 상실"] },
        ],
      },
    ],
  },
  {
    id: "advanced", tab: "상급",
    series: "어드밴스드 시리즈 · Sthira Bhaga (힘과 우아함)",
    intro: "어드밴스드 A(3rd)·B(4th)의 대표 자세들입니다. 오랜 세월에 걸쳐 도달하는 영역으로, 방향을 보여주는 이정표로 소개합니다.",
    caution: "이 레벨의 자세들은 반드시 자격 있는 지도자와 함께 진행하세요. 혼자 시도하면 손목·어깨·척추에 심각한 부상을 입을 수 있습니다. 아래 설명은 참고용입니다.",
    sections: [
      {
        id: "a-armbalance", title: "암밸런스",
        note: "손 위에서 몸을 자유롭게 다루는 자세들.",
        poses: [
          { fig: F.vasistha, sk: "Vasisthasana", ko: "바시스타사나 · 현자 바시스타 자세", breath: 5, drishti: "손끝", desc: "옆 판자에서 위쪽 다리를 수직으로 들어 발가락을 잡습니다.", tip: "아래 무릎을 바닥에 대는 변형으로 어깨 안정성부터.",
            steps: ["판자에서 한 손·한 발날로 옆 돌기", "골반을 위로 들어 몸 일직선", "위 다리를 들어 발가락 잡고 펴기"],
            mistakes: ["골반이 처져 손목에 하중 집중", "지지 손이 어깨보다 앞에 있기"] },
          { fig: F.vasistha, sk: "Vishvamitrasana · Kasyapasana", ko: "비슈바미트라사나 · 카샤파사나", breath: "5×2", drishti: "위", desc: "옆 판자에 다리 걸기와 반연꽃 묶기가 결합된 현자 시리즈입니다.", tip: "각 요소를 따로 익힌 뒤에.",
            steps: ["다리를 어깨 위에 거는 준비 자세", "옆으로 돌며 팔에 다리 걸기", "가슴을 하늘로 열며 뻗기"],
            mistakes: ["어깨에 다리를 얕게 걸어 미끄러지기", "손목 정렬 무시하고 버티기"] },
          { fig: F.bakasana, sk: "Urdhva Kukkutasana · Galavasana", ko: "우르드바 쿠쿠타사나 · 갈라바사나", breath: "5×2", drishti: "코끝", desc: "연꽃을 튼 채 팔 위에 얹거나 정강이를 걸어 균형을 잡습니다.", tip: "연꽃 없이 하는 사이드 크로우가 준비 단계입니다.",
            steps: ["연꽃을 틀고 손 짚기", "무릎을 위팔에 깊이 얹기", "체중 앞으로 옮겨 띄우기"],
            mistakes: ["연꽃이 느슨해 무릎이 흘러내리기", "손목 통증 신호 무시"] },
          { fig: F.koundinya, sk: "Koundinyasana A·B", ko: "카운딘야사나 · 현자 카운딘야 자세", breath: "5×2", drishti: "코끝", desc: "비틀어진 몸을 팔 위에 수평으로 띄웁니다.", tip: "차투랑가 팔이 안정적이어야 몸을 얹을 선반이 생깁니다.",
            steps: ["비틀어 허벅지를 반대 팔에 걸기", "팔꿈치를 굽혀 선반 만들기", "체중을 앞으로 보내 다리 띄우기"],
            mistakes: ["가슴이 낮아 이마부터 떨어지기", "다리를 걸친 팔만으로 지탱하기"] },
          { fig: F.astavakra, sk: "Astavakrasana", ko: "아쉬타바크라사나 · 여덟 굽이 자세", breath: 5, drishti: "코끝", desc: "다리를 팔에 감아 꼬은 채 몸을 옆으로 띄웁니다.", tip: "앉아서 다리 거는 모양부터 — 뜨는 건 그다음.",
            steps: ["한 다리를 어깨에 걸고 발목 교차", "손 짚고 팔꿈치 굽히며 기울이기", "다리를 옆으로 뻗어 조이기"],
            mistakes: ["발목 교차가 풀려 무너지기", "어깨를 웅크려 목이 사라지기"] },
        ],
      },
      {
        id: "a-backbend", title: "깊은 후굴",
        note: "척추가 그리는 가장 깊은 곡선들.",
        poses: [
          { fig: F.viparitaDanda, sk: "Viparita Dandasana", ko: "비파리타 단다사나 · 뒤집힌 지팡이", breath: 5, drishti: "코끝", desc: "전완과 발로 지지하는 깊은 아치입니다.", tip: "우르드바 다누라사나에서 전완만 내려 보는 연습부터.",
            steps: ["아치에서 한 팔씩 전완으로 내리기", "깍지 껴 머리 뒤 삼각대 만들기", "다리를 펴며 가슴을 앞으로 밀기"],
            mistakes: ["팔꿈치가 벌어져 어깨가 무너지기", "머리로 체중을 받아 목 압박"] },
          { fig: F.shalabhasana, sk: "Viparita Shalabhasana", ko: "비파리타 샬라바사나 · 뒤집힌 메뚜기", breath: 5, drishti: "코끝", desc: "가슴과 턱으로 지지하며 다리를 수직 너머로 넘깁니다.", tip: "목과 경추에 큰 부하 — 지도 없이는 시도하지 마세요.",
            steps: ["엎드려 팔을 몸 아래로", "다리를 들어 수직 너머로 보내기", "가슴 지지 유지하며 균형"],
            mistakes: ["턱에 체중이 쏠려 경추 압박", "다리를 반동으로 넘기기"] },
          { fig: F.rajaKapota, sk: "Raja Kapotasana", ko: "라자 카포타사나 · 왕 비둘기 자세", breath: 5, drishti: "미간", desc: "뒷다리를 머리 위로 당겨 발과 머리가 만나는 깊은 후굴입니다.", tip: "고관절 열기와 후굴을 각각 오래 준비한 뒤의 자세입니다.",
            steps: ["비둘기 다리 모양으로 앉기", "뒷무릎 굽혀 발을 팔꿈치로 걸기", "두 손을 머리 위로 넘겨 발 잡기"],
            mistakes: ["골반이 틀어진 채 허리로만 젖히기", "어깨 회전 없이 팔만 뒤로 꺾기"] },
          { fig: F.natarajasana, sk: "Natarajasana", ko: "나타라자사나 · 춤의 왕 자세", breath: 5, drishti: "앞", desc: "한 다리로 서서 뒷발을 머리 위로 당기는 균형·후굴의 결합입니다.", tip: "스트랩을 발에 걸면 같은 곡선을 안전하게 연습할 수 있어요.",
            steps: ["한 다리 서기, 뒷발 잡기", "팔꿈치를 하늘로 돌려 잡기 전환", "발을 차올리며 가슴 들기"],
            mistakes: ["서 있는 무릎이 잠긴 채 흔들리기", "골반이 열리며 옆으로 기울기"] },
        ],
      },
      {
        id: "a-etc", title: "유연성과 균형",
        note: "",
        poses: [
          { fig: F.hanumanasana, sk: "Hanumanasana", ko: "하누마나사나 · 원숭이 신 자세", breath: 5, drishti: "위", desc: "다리를 앞뒤로 완전히 벌려 앉는 스플릿입니다.", tip: "앞다리 밑에 블록을 쌓고 천천히 낮추세요. 반동은 금물.",
            steps: ["런지에서 앞다리를 천천히 앞으로", "골반을 정면으로 유지하며 내려가기", "완전히 앉으면 팔을 위로 합장"],
            mistakes: ["골반이 옆으로 열린 채 억지로 내리기", "반동을 주며 햄스트링 찢기"] },
          { fig: F.ekaPadaSirsa, sk: "Durvasasana", ko: "두르바사사나 · 현자 두르바사 자세", breath: 5, drishti: "앞", desc: "다리를 머리 뒤에 건 채로 일어서는 자세입니다.", tip: "앉은 에카파다 시르사사나가 완전히 편안해진 뒤에도 먼 자세입니다.",
            steps: ["에카파다 시르사사나로 다리 걸기", "손 짚고 반대 다리로 서서히 일어서기", "합장하고 척추 세우기"],
            mistakes: ["다리가 목을 눌러 호흡이 막히기", "일어서다 무릎이 비틀리기"] },
          { fig: F.pincha, sk: "Ganda Bherundasana", ko: "간다 베룬다사나 · 무서운 얼굴 자세", breath: 5, drishti: "코끝", desc: "턱과 가슴으로 바닥을 지지하고 다리를 넘기는 자세입니다.", tip: "참고용으로만 — 반드시 지도자와 함께.",
            steps: ["가슴과 턱을 바닥에 내리기", "다리를 차올려 수직 너머로", "발을 머리 쪽으로 내려 균형"],
            mistakes: ["경추 정렬 없이 턱으로 버티기", "빠져나오는 경로 없이 진입부터"] },
        ],
      },
    ],
  },
];

/* 호흡 수 파싱: 5, "5×4", "10+", "5분+" 등 → 타이머용 숫자 */
const parseBreaths = (b) => {
  if (typeof b === "number") return b;
  const m = String(b).match(/\d+/);
  if (String(b).includes("분")) return 10;
  return m ? Math.min(parseInt(m[0], 10), 10) : 5;
};

/* ── 수련 모드 (호흡 타이머) ── */
function PracticeMode({ level, lang, onExit }) {
  const T = STR[lang];
  const seq = useMemo(() => {
    const surya = SURYA_A.map((s) => ({
      fig: s.fig, photo: s.photo,
      ko: `${T.sunSal} · ${lang !== "ko" ? s.nameEn : s.name}`,
      sk: lang !== "ko" ? s.breathEn : s.breath, target: s.n, drishti: drishtiLoc("코끝", lang),
    }));
    const poses = level.sections.flatMap((sec) =>
      sec.poses.map((p) => {
        const L = loc(p, lang);
        return { fig: p.fig, photo: p.photo, ko: L.name, sk: p.sk, target: parseBreaths(p.breath), drishti: drishtiLoc(p.drishti, lang) };
      })
    );
    return [...surya, ...poses];
  }, [level, lang, T]);

  const [idx, setIdx] = useState(0);
  const [breath, setBreath] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [pace, setPace] = useState(5); // 초/호흡

  const cur = seq[idx];
  const next = seq[idx + 1];

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setBreath((b) => {
        if (b + 1 >= cur.target) {
          setIdx((i) => {
            if (i + 1 >= seq.length) { setPlaying(false); return i; }
            return i + 1;
          });
          return 0;
        }
        return b + 1;
      });
    }, pace * 1000);
    return () => clearInterval(t);
  }, [playing, pace, cur, seq.length]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onExit(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  const goPrev = () => { setIdx((i) => Math.max(0, i - 1)); setBreath(0); };
  const goNext = () => { setIdx((i) => Math.min(seq.length - 1, i + 1)); setBreath(0); };
  const finished = idx === seq.length - 1 && !playing && breath === 0;

  return (
    <div role="dialog" aria-modal="true" aria-label="수련 모드" style={{
      position: "fixed", inset: 0, zIndex: 60, background: "#0C1015",
      display: "flex", flexDirection: "column", color: C.ink,
    }}>
      {/* 진행 바 */}
      <div style={{ height: 4, background: C.line }}>
        <div style={{ height: "100%", width: `${((idx + breath / cur.target) / seq.length) * 100}%`, background: C.amber, transition: "width .5s" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
        <p style={{ fontSize: 13, color: C.sub }}>{idx + 1} / {seq.length} · {T.ofPractice(lvMeta(level, lang).tab)}</p>
        <button onClick={onExit} className="pbtn" style={{ fontSize: 13 }}>{T.finishBtn}</button>
      </div>

      {/* 중앙 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        {/* 호흡 원 + 피겨 */}
        <div style={{ position: "relative", width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className={playing ? "breathe" : ""} style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(217,160,91,0.16) 0%, rgba(217,160,91,0.03) 60%, transparent 75%)",
            border: "1px solid rgba(217,160,91,0.25)",
            animationDuration: `${pace}s`,
          }} />
          <PoseVisual pose={cur} size={170} glow />
        </div>

        <h2 className="display" style={{ fontSize: "clamp(20px, 4vw, 30px)", marginTop: 20, fontWeight: 400 }}>{cur.ko}</h2>
        <p style={{ color: C.sub, fontSize: 13, fontStyle: "italic", marginTop: 4 }}>{cur.sk} · {T.drishtiChip(cur.drishti)}</p>

        <p className="display" style={{ fontSize: 44, color: C.amber, marginTop: 18, fontWeight: 400 }}>
          {finished ? "🙏" : `${breath + 1} / ${cur.target}`}
        </p>
        <p style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>
          {finished ? T.finishedMsg : playing ? T.breathing : T.pausedTxt}
        </p>

        {next && !finished && (
          <p style={{ color: C.sub, fontSize: 12.5, marginTop: 22, opacity: 0.7 }}>{T.nextPrefix}{next.ko}</p>
        )}
      </div>

      {/* 컨트롤 */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", padding: "0 24px 28px", flexWrap: "wrap" }}>
        <button className="pbtn" onClick={goPrev} aria-label={T.prevB}>{T.prevB}</button>
        <button className="pbtn big" onClick={() => setPlaying((p) => !p)} aria-label={playing ? T.pauseB : T.resumeB}>
          {playing ? T.pauseB : T.resumeB}
        </button>
        <button className="pbtn" onClick={goNext} aria-label={T.nextB}>{T.nextB}</button>
        <span style={{ width: 12 }} />
        <label style={{ fontSize: 12.5, color: C.sub, display: "flex", alignItems: "center", gap: 8 }}>
          {T.paceL}
          <select value={pace} onChange={(e) => setPace(Number(e.target.value))}
            style={{ background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 8px", font: "inherit", fontSize: 12.5 }}>
            {T.paceOpts.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

/* ── 자세 상세 모달 ── */
function PoseDetail({ pose, onClose, beginner, lang }) {
  const T = STR[lang];
  const L = loc(pose, lang);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 50, background: "rgba(8,11,15,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div role="dialog" aria-modal="true" aria-label={pose.ko} onClick={(e) => e.stopPropagation()} style={{
        background: C.card, border: `1px solid ${C.cardEdge}`, borderRadius: 18,
        maxWidth: 640, width: "100%", maxHeight: "86vh", overflowY: "auto", padding: 28, position: "relative",
      }}>
        <button onClick={onClose} aria-label={T.closeL} style={{
          position: "absolute", top: 14, right: 14, background: "none", border: "none",
          color: C.sub, fontSize: 20, cursor: "pointer", padding: 6,
        }}>✕</button>

        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ background: C.bg, borderRadius: 14, padding: 8 }}>
            <PoseVisual pose={pose} size={130} glow />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 className="display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4 }}>{L.name}</h3>
            <p style={{ fontSize: 13, color: C.sub, fontStyle: "italic", marginTop: 4 }}>{pose.sk}</p>
            <div style={{ marginTop: 10 }}>
              <span className="chip b">{T.breaths(pose.breath)}</span>
              <span className="chip">{T.drishtiChip(drishtiLoc(pose.drishti, lang))}</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.8, fontWeight: 300, marginTop: 18 }}>{L.desc}</p>

        {L.steps && (
          <div style={{ marginTop: 22 }}>
            <p className="display" style={{ fontSize: 15, color: C.amber, marginBottom: 10 }}>{T.stepsH}</p>
            <ol style={{ paddingLeft: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {L.steps.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 12, fontSize: 13.5, lineHeight: 1.7, fontWeight: 300 }}>
                  <span className="display" style={{ color: C.amber, flexShrink: 0, width: 18, textAlign: "right" }}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {L.mistakes && (
          <div style={{ marginTop: 22 }}>
            <p className="display" style={{ fontSize: 15, color: C.danger, marginBottom: 10 }}>{T.mistakesH}</p>
            <ul style={{ paddingLeft: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {L.mistakes.map((m, i) => (
                <li key={i} style={{ display: "flex", gap: 12, fontSize: 13.5, lineHeight: 1.7, fontWeight: 300, color: "#C9A79B" }}>
                  <span style={{ color: C.danger, flexShrink: 0 }}>✕</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {beginner && L.tip && (
          <p style={{
            fontSize: 13.5, lineHeight: 1.7, marginTop: 22, padding: "12px 16px",
            background: C.amberDim, borderLeft: `2px solid rgba(217,160,91,0.5)`,
            borderRadius: "0 8px 8px 0", color: "#CBB289", fontWeight: 300,
          }}>
            🌙 {L.tip}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── 정보 페이지 (애드센스 승인 필수: 소개·개인정보처리방침·이용약관·문의) ──
   배포 시 각 페이지는 별도 URL(/about, /privacy, /terms, /contact)로 라우팅하는 것을 권장합니다.
   [사이트명]·[이메일]·[날짜] 플레이스홀더는 배포 전에 실제 값으로 교체하세요. */
const PAGES = {
  ko: {
    about: { t: "소개", ps: [
      "이 사이트는 아쉬탕가 빈야사 요가를 혼자서도 안전하게 수련할 수 있도록 돕는 무료 가이드입니다. 프라이머리·인터미디엇·어드밴스드 시리즈의 전체 시퀀스를 자세별 진입 단계, 흔한 실수, 초보자를 위한 변형과 함께 정리했습니다.",
      "아쉬탕가는 매번 같은 순서로 수련하는 전통 덕분에 독학이 가능한 몇 안 되는 요가 체계입니다. 다만 이 사이트는 자격 있는 지도자의 직접 지도를 대체하지 않으며, 특히 중급 이상의 자세는 반드시 지도자와 함께 수련하시길 권합니다.",
      "모든 콘텐츠는 직접 작성·제작되었습니다. 오류를 발견하시면 문의 페이지를 통해 알려 주세요.",
    ]},
    privacy: { t: "개인정보처리방침", ps: [
      "시행일: [날짜]. 본 방침은 [사이트명](이하 '사이트')의 개인정보 처리에 관한 내용을 담고 있습니다.",
      "1. 수집하는 정보 — 사이트는 회원가입 없이 이용할 수 있으며, 이름·이메일 등 개인 식별 정보를 직접 수집하지 않습니다. 서비스 이용 과정에서 접속 기록, 브라우저 종류, 기기 정보가 자동으로 수집될 수 있습니다.",
      "2. 쿠키와 광고 — 사이트는 Google AdSense를 통해 광고를 게재합니다. Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 이전 방문 기록을 바탕으로 광고를 게재할 수 있습니다. Google의 광고 쿠키 사용으로 이용자에게 맞춤형 광고가 표시될 수 있으며, 이용자는 Google 광고 설정(adssettings.google.com)에서 맞춤 광고를 해제할 수 있습니다. 또한 www.aboutads.info 에서 제3자 광고 사업자의 쿠키 사용을 일괄 거부할 수 있습니다.",
      "3. 분석 도구 — 서비스 개선을 위해 방문자 통계 도구(예: Google Analytics)를 사용할 수 있으며, 이 과정에서 익명화된 이용 데이터가 수집됩니다.",
      "4. 아동의 개인정보 — 사이트는 만 14세 미만 아동의 개인정보를 고의로 수집하지 않습니다.",
      "5. 문의 — 개인정보 관련 문의는 [이메일]로 연락해 주세요. 본 방침은 법령이나 서비스 변경에 따라 개정될 수 있으며, 개정 시 본 페이지에 게시합니다.",
    ]},
    terms: { t: "이용약관", ps: [
      "1. 목적 — 본 약관은 [사이트명]이 제공하는 콘텐츠 이용 조건을 규정합니다. 사이트를 이용함으로써 본 약관에 동의하는 것으로 간주됩니다.",
      "2. 의료 면책 — 사이트의 모든 내용은 일반적인 정보 제공 목적이며 의학적 조언, 진단, 치료를 대신하지 않습니다. 요가 수련은 신체적 부상의 위험을 수반합니다. 새로운 운동을 시작하기 전 반드시 의사와 상담하시고, 수련 중 통증이나 이상을 느끼면 즉시 중단하세요. 사이트 이용으로 발생한 부상에 대해 운영자는 책임을 지지 않습니다.",
      "3. 지식재산권 — 사이트의 텍스트, 일러스트, 디자인 등 모든 콘텐츠의 저작권은 운영자에게 있으며, 사전 동의 없는 복제·배포를 금합니다.",
      "4. 광고 — 사이트에는 제3자(Google AdSense) 광고가 게재됩니다. 광고를 통해 연결되는 외부 사이트의 콘텐츠에 대해 운영자는 책임을 지지 않습니다.",
      "5. 약관 변경 — 본 약관은 사전 고지 후 변경될 수 있습니다.",
    ]},
    contact: { t: "문의", ps: [
      "콘텐츠 오류 제보, 제휴 제안, 개인정보 관련 문의는 아래 이메일로 보내 주세요.",
      "이메일: [이메일] — 영업일 기준 3일 이내에 답변드리도록 하겠습니다.",
      "광고 및 제휴 관련 문의도 같은 주소로 받고 있습니다.",
    ]},
  },
  en: {
    about: { t: "About", ps: [
      "This site is a free guide to practicing Ashtanga Vinyasa Yoga safely on your own. It covers the complete Primary, Intermediate, and Advanced series, with entry steps, common mistakes, and beginner-friendly modifications for every pose.",
      "Because Ashtanga follows the same sequence every time, it is one of the few yoga systems suited to self-practice. This site does not, however, replace the direct guidance of a qualified teacher — Intermediate poses and beyond should always be learned with one.",
      "All content is originally written and produced. If you spot an error, please let us know via the Contact page.",
    ]},
    privacy: { t: "Privacy Policy", ps: [
      "Effective date: [DATE]. This policy describes how [SITE NAME] ('the Site') handles information.",
      "1. Information we collect — The Site requires no registration and does not directly collect personally identifying information such as names or email addresses. Standard technical data (access logs, browser type, device information) may be collected automatically.",
      "2. Cookies and advertising — The Site displays ads through Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve personalized ads. You may opt out of personalized advertising by visiting Google Ads Settings (adssettings.google.com), and opt out of some third-party vendors' cookie use at www.aboutads.info.",
      "3. Analytics — We may use visitor analytics tools (e.g., Google Analytics), which collect anonymized usage data to help improve the service.",
      "4. Children's privacy — The Site does not knowingly collect personal information from children under 13 (or the applicable age in your jurisdiction).",
      "5. Contact — For privacy inquiries, email [EMAIL]. This policy may be updated as laws or the service change; revisions will be posted on this page.",
    ]},
    terms: { t: "Terms of Use", ps: [
      "1. Purpose — These terms govern the use of content provided by [SITE NAME]. By using the Site you agree to these terms.",
      "2. Medical disclaimer — All content is for general information only and is not medical advice, diagnosis, or treatment. Yoga practice carries a risk of physical injury. Consult a physician before beginning any new exercise program, and stop immediately if you feel pain or discomfort. The operator accepts no liability for injuries arising from use of the Site.",
      "3. Intellectual property — All text, illustrations, and design on the Site are the property of the operator. Reproduction or distribution without prior consent is prohibited.",
      "4. Advertising — The Site displays third-party (Google AdSense) advertisements. The operator is not responsible for the content of external sites reached through ads.",
      "5. Changes — These terms may be revised with notice posted on this page.",
    ]},
    contact: { t: "Contact", ps: [
      "For content corrections, partnership proposals, or privacy inquiries, please email us.",
      "Email: [EMAIL] — we aim to reply within three business days.",
      "Advertising and partnership inquiries are welcome at the same address.",
    ]},
  },
};

function InfoPage({ pageKey, lang, onClose }) {
  const T = STR[lang];
  const page = (PAGES[lang] || PAGES.en)[pageKey];
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 55, background: "rgba(8,11,15,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div role="dialog" aria-modal="true" aria-label={page.t} onClick={(e) => e.stopPropagation()} style={{
        background: C.card, border: `1px solid ${C.cardEdge}`, borderRadius: 18,
        maxWidth: 680, width: "100%", maxHeight: "86vh", overflowY: "auto", padding: 32, position: "relative",
      }}>
        <button onClick={onClose} aria-label={T.closeL} style={{
          position: "absolute", top: 14, right: 14, background: "none", border: "none",
          color: C.sub, fontSize: 20, cursor: "pointer", padding: 6,
        }}>✕</button>
        <h3 className="display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 18 }}>{page.t}</h3>
        <div style={{ display: "grid", gap: 14 }}>
          {page.ps.map((p, i) => (
            <p key={i} style={{ fontSize: 13.5, lineHeight: 1.9, fontWeight: 300, color: C.ink }}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 쿠키 안내 배너 — 프리뷰에서는 상태로만 유지됩니다.
   배포 시 동의 여부를 localStorage/쿠키에 저장해 재방문 시 숨기고,
   EU 트래픽 대상이면 Google CMP 등 정식 동의 관리 플랫폼 연동을 권장합니다. */
function CookieBar({ lang, onOk }) {
  const T = STR[lang];
  return (
    <div role="region" aria-label="cookie notice" style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 45,
      background: "rgba(18,23,30,0.97)", borderTop: `1px solid ${C.cardEdge}`,
      padding: "14px 20px", display: "flex", gap: 14, alignItems: "center",
      justifyContent: "center", flexWrap: "wrap",
    }}>
      <p style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6, maxWidth: 640 }}>{T.cookieMsg}</p>
      <button className="pbtn" onClick={onOk} style={{ fontSize: 13, padding: "8px 20px" }}>{T.okL}</button>
    </div>
  );
}

export default function AshtangaGuide() {
  const [lang, setLang] = useState("en");
  const [beginner, setBeginner] = useState(true);
  const [done, setDone] = useState({});
  const [levelId, setLevelId] = useState("primary");
  const [active, setActive] = useState("surya");
  const [detail, setDetail] = useState(null);
  const [practice, setPractice] = useState(false);
  const [page, setPage] = useState(null);
  const [cookieOk, setCookieOk] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const T = STR[lang];
  const level = LEVELS.find((l) => l.id === levelId);
  const LV = lvMeta(level, lang);
  const levelTotal = level.sections.reduce((n, s) => n + s.poses.length, 0);
  const doneCount = useMemo(
    () => level.sections.reduce((n, s) => n + s.poses.filter((p) => done[`${s.id}-${p.sk}`]).length, 0),
    [done, level]
  );
  const toggle = (k) => setDone((d) => ({ ...d, [k]: !d[k] }));
  const changeLevel = (id) => { setLevelId(id); setActive("surya"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const go = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ background: C.bg, color: C.ink, minHeight: "100vh", fontFamily: "'IBM Plex Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        .display { font-family: 'Gowun Batang', serif; }
        .navbtn { background:none; border:none; cursor:pointer; text-align:left; width:100%;
          padding:10px 14px; border-radius:8px; font:inherit; color:${C.sub}; font-size:14px; }
        .navbtn:hover { background:${C.card}; color:${C.ink}; }
        .navbtn.on { background:${C.card}; color:${C.ink}; font-weight:600;
          box-shadow: inset 3px 0 0 ${C.amber}; }
        .navbtn:focus-visible, .chk:focus-visible, .mode:focus-visible, .lvl:focus-visible, .pbtn:focus-visible, .cardbtn:focus-visible { outline:2px solid ${C.amber}; outline-offset:2px; }
        .lvl { border:1px solid ${C.line}; background:transparent; color:${C.sub}; cursor:pointer;
          font:inherit; font-size:14px; font-weight:500; padding:10px 22px; border-radius:999px; transition: all .2s; }
        .lvl:hover { color:${C.ink}; border-color:${C.sub}; }
        .langopt { display:flex; align-items:center; gap:10px; width:100%; padding:10px 16px; background:none; border:none; color:${C.ink}; cursor:pointer; font:inherit; font-weight:300; }
        .langopt:hover { background:rgba(217,160,91,0.08); }
        .langopt:focus-visible { outline:2px solid ${C.amber}; outline-offset:-2px; }
        .lvl.on { background:${C.amberDim}; border-color: rgba(217,160,91,0.55); color:${C.amber}; font-weight:600; }
        .card { background:${C.card}; border:1px solid ${C.cardEdge}; border-radius:14px; padding:22px;
          display:flex; gap:20px; align-items:flex-start; transition: border-color .25s; }
        .card:hover { border-color: rgba(217,160,91,0.35); }
        .cardbtn { all:unset; cursor:pointer; display:flex; gap:20px; align-items:flex-start; flex:1; }
        .chip { display:inline-block; font-size:12px; padding:3px 10px; border-radius:999px;
          border:1px solid ${C.line}; color:${C.sub}; margin-right:6px; }
        .chip.b { border-color: rgba(217,160,91,0.5); color:${C.amber}; font-weight:600; background:${C.amberDim}; }
        .candle { display:inline-block; width:8px; height:8px; border-radius:50%;
          background:${C.amber}; box-shadow: 0 0 14px 3px rgba(217,160,91,0.55); }
        .pbtn { border:1px solid ${C.line}; background:${C.card}; color:${C.ink}; cursor:pointer;
          font:inherit; font-size:14px; padding:10px 18px; border-radius:999px; }
        .pbtn:hover { border-color: rgba(217,160,91,0.5); }
        .pbtn.big { background:${C.amberDim}; border-color: rgba(217,160,91,0.55); color:${C.amber}; font-weight:600; padding:12px 26px; }
        @keyframes flicker { 0%,100%{opacity:1} 50%{opacity:.65} }
        .candle.live { animation: flicker 3.2s ease-in-out infinite; }
        @keyframes breatheAnim { 0%,100%{ transform: scale(0.82); opacity:.75 } 50%{ transform: scale(1.06); opacity:1 } }
        .breathe { animation-name: breatheAnim; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        @media (max-width: 760px) {
          .layout { flex-direction:column; }
          .rail { position:static !important; width:100% !important; display:flex; overflow-x:auto; gap:4px; padding-bottom:8px; }
          .navbtn { white-space:nowrap; width:auto; }
          .card, .cardbtn { flex-direction:column; align-items:center; text-align:center; }
          .surya { overflow-x:auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior:auto; }
          .candle.live, .breathe { animation:none; }
        }
      `}</style>

      {/* 헤더 */}
      <header style={{ maxWidth: 1040, margin: "0 auto", padding: "64px 24px 8px", position: "relative" }}>
        <div aria-hidden="true" style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 520, height: 320, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(ellipse, rgba(217,160,91,0.09) 0%, transparent 65%)",
        }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <p style={{ color: C.amber, fontWeight: 600, letterSpacing: "0.22em", fontSize: 12.5 }}>
            <span className="candle live" style={{ marginRight: 10, verticalAlign: "middle" }} />
            ASHTANGA VINYASA YOGA
          </p>
          <div style={{ position: "relative" }}>
            <button className="lvl" onClick={() => setLangOpen((o) => !o)}
              aria-haspopup="listbox" aria-expanded={langOpen} aria-label={T.langLabel}
              style={{ padding: "7px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 7 }}>
              <span aria-hidden="true">🌐</span>
              {LANGS.find((x) => x.c === lang)?.n}
              <span aria-hidden="true" style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
            </button>
            {langOpen && (
              <>
                <div onClick={() => setLangOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 58 }} />
                <div role="listbox" aria-label={T.langLabel} style={{
                  position: "absolute", top: "calc(100% + 8px)", insetInlineEnd: 0, zIndex: 59,
                  background: C.card, border: `1px solid ${C.cardEdge}`, borderRadius: 14,
                  minWidth: 205, padding: "6px 0 8px",
                  boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
                }}>
                  <p style={{
                    padding: "9px 16px 11px", fontSize: 12, color: C.sub,
                    borderBottom: `1px solid ${C.line}`, marginBottom: 6,
                    display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.04em",
                  }}>
                    <span aria-hidden="true">🌐</span>{T.langWord}
                  </p>
                  {LANGS.map((x) => (
                    <button key={x.c} role="option" aria-selected={lang === x.c} className="langopt"
                      onClick={() => { setLang(x.c); setLangOpen(false); }}>
                      <span style={{ fontSize: 10.5, color: C.sub, width: 24, letterSpacing: "0.05em", flexShrink: 0 }}>{x.cc}</span>
                      <span style={{ flex: 1, textAlign: "start", fontSize: 14 }}>{x.n}</span>
                      {lang === x.c && <span aria-hidden="true" style={{ color: C.amber, fontWeight: 700 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <h1 className="display" style={{ fontSize: "clamp(30px, 5vw, 50px)", lineHeight: 1.3, margin: "16px 0 16px", fontWeight: 400 }}>
          {T.heroT1}<br />{T.heroT2}
        </h1>
        <p style={{ color: C.sub, maxWidth: 560, lineHeight: 1.8, fontWeight: 300 }}>
          {T.heroDesc}
        </p>

        {/* 수련 기본 3요소 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "32px 0" }}>
          {T.pillars.map(([t, d]) => (
            <div key={t} style={{ background: C.card, border: `1px solid ${C.cardEdge}`, borderRadius: 12, padding: "18px 20px" }}>
              <p className="display" style={{ fontWeight: 700, marginBottom: 8, color: C.amber, fontSize: 15 }}>{t}</p>
              <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.7, fontWeight: 300 }}>{d}</p>
            </div>
          ))}
        </div>

        {/* 레벨 탭 */}
        <div role="tablist" aria-label={lang !== "ko" ? "Practice level" : "수련 레벨"} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {LEVELS.map((l) => (
            <button key={l.id} role="tab" aria-selected={levelId === l.id}
              className={`lvl ${levelId === l.id ? "on" : ""}`} onClick={() => changeLevel(l.id)}>
              {lvMeta(l, lang).tab}
            </button>
          ))}
        </div>
        <p className="display" style={{ fontSize: 17, color: C.ink, marginBottom: 4 }}>{LV.series}</p>
        <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.8, fontWeight: 300, maxWidth: 640, marginBottom: 18 }}>{LV.intro}</p>

        {LV.caution && (
          <div role="note" style={{
            border: `1px solid rgba(201,123,107,0.45)`, background: "rgba(201,123,107,0.08)",
            borderRadius: 12, padding: "14px 18px", maxWidth: 640, marginBottom: 18,
            color: C.danger, fontSize: 13.5, lineHeight: 1.7,
          }}>
            ⚠︎ {LV.caution}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="pbtn big" onClick={() => setPractice(true)}>{T.startPractice}</button>
          <button
            className="mode pbtn"
            onClick={() => setBeginner((b) => !b)}
            style={{
              borderColor: beginner ? "rgba(217,160,91,0.5)" : C.line,
              background: beginner ? C.amberDim : C.card,
              color: beginner ? C.amber : C.sub,
            }}
          >
            {beginner ? T.helpOn : T.helpOff}
          </button>
        </div>
      </header>

      {/* 본문 */}
      <div className="layout" style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 80px", display: "flex", gap: 40 }}>
        {/* 사이드 레일 */}
        <nav className="rail" style={{ width: 210, flexShrink: 0, position: "sticky", top: 24, alignSelf: "flex-start" }}>
          <button className={`navbtn ${active === "surya" ? "on" : ""}`} onClick={() => go("surya")}>{T.suryaNav}</button>
          {level.sections.map((s) => (
            <button key={s.id} className={`navbtn ${active === s.id ? "on" : ""}`} onClick={() => go(s.id)}>{secMeta(s, lang).title}</button>
          ))}
          <div style={{ padding: "18px 14px 0" }}>
            <div style={{ height: 5, background: C.line, borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${(doneCount / levelTotal) * 100}%`, background: C.amber,
                boxShadow: doneCount > 0 ? "0 0 8px rgba(217,160,91,0.6)" : "none", transition: "width .3s",
              }} />
            </div>
            <p style={{ fontSize: 12, color: C.sub, marginTop: 10 }}>{T.progress(LV.tab, doneCount, levelTotal)}</p>
          </div>
        </nav>

        {/* 콘텐츠 */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* 태양경배 */}
          <section id="surya" style={{ marginBottom: 64 }}>
            <h2 className="display" style={{ fontSize: 26, marginBottom: 6, fontWeight: 400 }}>{T.suryaTitle}</h2>
            <p style={{ color: C.sub, fontSize: 14, marginBottom: 22, fontWeight: 300, lineHeight: 1.7 }}>
              {T.suryaDesc}
              {beginner && <span style={{ color: C.amber }}>{T.suryaBeg}</span>}
            </p>
            <div className="surya" style={{ background: C.card, border: `1px solid ${C.cardEdge}`, borderRadius: 14, padding: "20px 12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", minWidth: 640 }}>
                {SURYA_A.map((s, i) => (
                  <React.Fragment key={i}>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <PoseVisual pose={s} size={72} glow />
                      <p style={{ fontSize: 11.5, fontWeight: 500, marginTop: 4 }}>{lang !== "ko" ? s.nameEn : s.name}</p>
                      <p style={{ fontSize: 11, color: s.n > 1 ? C.amber : C.sub, fontWeight: s.n > 1 ? 700 : 300 }}>{lang !== "ko" ? s.breathEn : s.breath}</p>
                    </div>
                    {i < SURYA_A.length - 1 && (
                      <span aria-hidden="true" style={{ color: C.line, alignSelf: "center", fontSize: 18, padding: "0 2px" }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* 시퀀스 섹션들 */}
          {level.sections.map((sec) => {
            const SM = secMeta(sec, lang);
            return (
            <section key={sec.id} id={sec.id} style={{ marginBottom: 64 }}>
              <h2 className="display" style={{ fontSize: 26, marginBottom: 6, fontWeight: 400 }}>{SM.title}</h2>
              {SM.note && <p style={{ color: C.sub, fontSize: 14, marginBottom: 22, fontWeight: 300 }}>{SM.note}</p>}
              <div style={{ display: "grid", gap: 14, marginTop: SM.note ? 0 : 22 }}>
                {sec.poses.map((p) => {
                  const k = `${sec.id}-${p.sk}`;
                  const L = loc(p, lang);
                  return (
                    <article key={k} className="card">
                      <button className="cardbtn" onClick={() => setDetail(p)} aria-label={L.name}>
                        <PoseVisual pose={p} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                            <h3 className="display" style={{ fontSize: 19, fontWeight: 700 }}>{L.name}</h3>
                            <span style={{ fontSize: 12.5, color: C.sub, fontStyle: "italic" }}>{p.sk}</span>
                          </div>
                          <div style={{ margin: "10px 0 12px" }}>
                            <span className="chip b">{T.breaths(p.breath)}</span>
                            <span className="chip">{T.drishtiChip(drishtiLoc(p.drishti, lang))}</span>
                            <span className="chip" style={{ borderStyle: "dashed" }}>{T.detailChip}</span>
                          </div>
                          <p style={{ fontSize: 14, lineHeight: 1.8, fontWeight: 300 }}>{L.desc}</p>
                          {beginner && (
                            <p style={{
                              fontSize: 13.5, lineHeight: 1.7, marginTop: 10, padding: "10px 14px",
                              background: C.amberDim, borderLeft: `2px solid rgba(217,160,91,0.5)`,
                              borderRadius: "0 8px 8px 0", color: "#CBB289", fontWeight: 300,
                            }}>
                              🌙 {L.tip}
                            </p>
                          )}
                        </div>
                      </button>
                      <button
                        className="chk"
                        onClick={() => toggle(k)}
                        aria-pressed={!!done[k]}
                        aria-label={lang !== "ko" ? `Mark ${L.name} done` : `${L.name} 완료 표시`}
                        style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                          border: `2px solid ${done[k] ? C.amber : C.line}`,
                          background: done[k] ? C.amber : "transparent",
                          boxShadow: done[k] ? "0 0 10px rgba(217,160,91,0.5)" : "none",
                          color: C.bg, fontSize: 16, lineHeight: 1, fontWeight: 700,
                        }}
                      >
                        {done[k] ? "✓" : ""}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          );})}

          <footer style={{ borderTop: `1px solid ${C.line}`, paddingTop: 28, paddingBottom: 56, color: C.sub, fontSize: 13, lineHeight: 1.8, fontWeight: 300 }}>
            <p className="display" style={{ fontSize: 16, color: C.ink, marginBottom: 8 }}>{T.footT}</p>
            <p>{T.footB}</p>
            <nav aria-label={lang !== "ko" ? "Site pages" : "사이트 페이지"} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 22 }}>
              {["about", "privacy", "terms", "contact"].map((k) => (
                <button key={k} className="navbtn" style={{ width: "auto", padding: "8px 14px", fontSize: 12.5 }}
                  onClick={() => setPage(k)}>
                  {T.pageNav[k]}
                </button>
              ))}
            </nav>
            <p style={{ fontSize: 12, marginTop: 18, opacity: 0.75 }}>{T.medNote}</p>
            <p style={{ fontSize: 12, marginTop: 6, opacity: 0.6 }}>© {new Date().getFullYear()} [사이트명 / SITE NAME]. All rights reserved.</p>
          </footer>
        </main>
      </div>

      {detail && <PoseDetail pose={detail} beginner={beginner} lang={lang} onClose={() => setDetail(null)} />}
      {practice && <PracticeMode level={level} lang={lang} onExit={() => setPractice(false)} />}
      {page && <InfoPage pageKey={page} lang={lang} onClose={() => setPage(null)} />}
      {!cookieOk && <CookieBar lang={lang} onOk={() => setCookieOk(true)} />}
    </div>
  );
}
