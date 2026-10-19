// ---------- どこからでも つかう 道具：合図・保存・ドット絵・音 ----------
// warpix-link の script.js・extras.js から ひっこして きた もの（v0.1）。
// ARCADE の ほかの ファイルは ぜんぶ これより あとに よむ。

// 合図（ゲームが おわった などを、受付の ピクセに しらせる）
const bus = new EventTarget();
const emit = (type, detail = {}) => bus.dispatchEvent(new CustomEvent(type, { detail }));
const on = (type, fn) => bus.addEventListener(type, (e) => fn(e.detail));

// ブラウザに のこす（きろくが よめない・かけない ときも こわれない）
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

const PALETTE = {
  o: "var(--shadow)",
  w: "var(--fg)",
  p: "var(--accent)",
  c: "var(--accent-2)",
  y: "var(--gold)",
  v: "var(--muted)",
  b: "var(--btn)",
};

// ピクセ（16x16）。目を とじた コマと 2 まい（warpix-link と おなじ）
const NPC = {
  idle: [
    ".......pp.......",
    ".......ww.......",
    ".......ww.......",
    ".....oooooo.....",
    "...oowwwwwwoo...",
    "..owwwwwwwwwwo..",
    ".owwwwwwwwwwwwo.",
    ".owwcowwwwcowwo.",
    ".owwoowwwwoowwo.",
    ".owppwwwwwwppwo.",
    ".owwwwwoowwwwwo.",
    ".owwwwwwwwwwwwo.",
    "..owwwwwwwwwwo..",
    "...oowwwwwwoo...",
    "....oo....oo....",
    "................",
  ],
  blink: [
    ".......pp.......",
    ".......ww.......",
    ".......ww.......",
    ".....oooooo.....",
    "...oowwwwwwoo...",
    "..owwwwwwwwwwo..",
    ".owwwwwwwwwwwwo.",
    ".owwwwwwwwwwwwo.",
    ".owwoowwwwoowwo.",
    ".owppwwwwwwppwo.",
    ".owwwwwoowwwwwo.",
    ".owwwwwwwwwwwwo.",
    "..owwwwwwwwwwo..",
    "...oowwwwwwoo...",
    "....oo....oo....",
    "................",
  ],
};

// 同じ色が 横に ならんだ マスは 1 本の 線に まとめ、色ごとに 1 つの <path> にする
function pixelSvg(rows, palette = PALETTE) {
  const paths = new Map(); // 色 → d
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const fill = palette[ch];
      if (fill) paths.set(fill, `${paths.get(fill) ?? ""}M${x} ${y}h${end - x}v1h${x - end}z`);
      x = end;
    }
  });
  const body = [...paths].map(([fill, d]) => `<path d="${d}" style="fill:${fill}"/>`).join("");
  return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
}

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ゲームの 点数を うけとる ところ（warpix-link では 画面の スコアに たす。ARCADE では 台ごとの ランキングだけ）
const score = { add() {} };

// ---------- サウンド（Web Audio API で 8bit ふうに ならす。warpix-link と おなじ しくみ） ----------
const sound = (() => {
  let ctx = null;
  let bgmGain = null;
  let sfxGain = null;
  let noiseBuffer = null;

  // ブラウザの 自動再生の きまりが あるので、さいしょの タップの あとに つくる。裏に いる ページは 音を おこさない
  function ensure() {
    if (document.hidden) return false;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      bgmGain = ctx.createGain();
      bgmGain.gain.value = 0;
      bgmGain.connect(ctx.destination);
      sfxGain = ctx.createGain();
      sfxGain.connect(ctx.destination);
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    // iPhone には「suspended」の ほかに「interrupted」も ある。どちらでも おこす
    if (ctx.state !== "running") ctx.resume().catch(() => {});
    return true;
  }

  const midi = (n) => 440 * 2 ** ((n - 69) / 12);

  // pan：-1 で 左、1 で 右から きこえる（PIXE QUEST の ボスの あいず）
  function tone({ freq, start, dur, type = "square", vol = 0.08, slideTo, dest, pan = 0 }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    let out = gain;
    if (pan && ctx.createStereoPanner) {
      out = ctx.createStereoPanner();
      out.pan.value = pan;
      gain.connect(out);
    }
    osc.connect(gain);
    out.connect(dest ?? sfxGain);
    osc.start(start);
    osc.stop(start + dur);
  }

  function noise(start, dur, vol, dest) {
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = noiseBuffer;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.connect(gain).connect(dest);
    src.start(start, Math.random() * 0.5);
    src.stop(start + dur);
  }

  const sfx = {
    hover() {
      if (ctx) tone({ freq: 880, start: ctx.currentTime, dur: 0.05 });
    },
    select() {
      if (ensure()) tone({ freq: 440, start: ctx.currentTime, dur: 0.15, slideTo: 1760 });
    },
    // 起動ジングル（ド・ミ・ソ・ド〜）
    start() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [72, 76, 79].forEach((n, i) => tone({ freq: midi(n), start: t + i * 0.08, dur: 0.08 }));
      tone({ freq: midi(84), start: t + 0.24, dur: 0.4 });
      tone({ freq: midi(48), start: t + 0.24, dur: 0.4, type: "triangle", vol: 0.15 });
    },
    // コイン（シ→ミ）
    coin() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      tone({ freq: midi(83), start: t, dur: 0.07, vol: 0.06 });
      tone({ freq: midi(88), start: t + 0.07, dur: 0.25, vol: 0.06 });
    },
    // 会話の 文字送り
    text() {
      if (ctx) tone({ freq: 1200, start: ctx.currentTime, dur: 0.02, vol: 0.02 });
    },
    boom() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      noise(t, 0.4, 0.15, sfxGain);
      tone({ freq: 220, start: t, dur: 0.4, type: "triangle", vol: 0.2, slideTo: 40 });
    },
    powerup() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [60, 64, 67, 72, 76, 79, 84, 88].forEach((n, i) => tone({ freq: midi(n), start: t + i * 0.05, dur: 0.1, vol: 0.06 }));
    },
    shoot() {
      if (ctx) tone({ freq: 1400, start: ctx.currentTime, dur: 0.08, vol: 0.03, slideTo: 500 });
    },
    hit() {
      if (ctx) noise(ctx.currentTime, 0.12, 0.08, sfxGain);
    },
    damage() {
      if (!ctx) return;
      const t = ctx.currentTime;
      noise(t, 0.5, 0.12, sfxGain);
      tone({ freq: 440, start: t, dur: 0.5, vol: 0.06, slideTo: 55 });
    },
    // ファンファーレ（ソ・ソ・ソ・ド〜）
    fanfare() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [79, 79, 79].forEach((n, i) => tone({ freq: midi(n), start: t + i * 0.09, dur: 0.07, vol: 0.05 }));
      tone({ freq: midi(84), start: t + 0.27, dur: 0.5, vol: 0.06 });
      tone({ freq: midi(88), start: t + 0.27, dur: 0.5, vol: 0.04 });
    },
    gameover() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [72, 67, 64, 60].forEach((n, i) => tone({ freq: midi(n), start: t + i * 0.18, dur: 0.17, vol: 0.06 }));
      tone({ freq: midi(36), start: t + 0.72, dur: 0.6, type: "triangle", vol: 0.15 });
    },
  };

  // 店内 BGM：C → Am → F → G の 4 小節ループ（8分音符きざみ、null は 休符）。リンク集とは べつの 曲
  // PIXE QUEST の ボスの 曲も おなじ かたち（{ bpm, lead, bass }）で、songPlay で いれかえる
  const LEAD = [
    72, 76, 79, 76, 84, null, 79, null,
    81, null, 76, 72, 76, 81, 79, 76,
    77, 81, 84, 81, 77, null, 72, 74,
    79, null, 83, 79, 86, 84, 83, 79,
  ];
  const BASS = [48, 45, 41, 43];
  const SHOP = { bpm: 150, lead: LEAD, bass: BASS };
  let song = SHOP;
  const stepLen = () => 60 / song.bpm / 2;

  let timer = null;
  let step = 0;
  let nextTime = 0;

  function scheduleStep(i, t) {
    const STEP = stepLen();
    const n = song.lead[i];
    if (n) tone({ freq: midi(n), start: t, dur: STEP * 0.9, vol: 0.035, dest: bgmGain });
    const root = song.bass[Math.floor(i / 8) % song.bass.length] + (i % 2 ? 12 : 0);
    tone({ freq: midi(root), start: t, dur: STEP * 0.9, type: "triangle", vol: 0.12, dest: bgmGain });
    if (i % 2 === 1) noise(t, 0.03, 0.03, bgmGain);
    if (song.kick && i % 4 === 0) tone({ freq: 110, start: t, dur: 0.08, type: "triangle", vol: 0.2, slideTo: 40, dest: bgmGain });
  }

  function bgmPlay(delay = 0) {
    if (!ensure() || timer) return;
    step = 0;
    nextTime = ctx.currentTime + delay;
    bgmGain.gain.setValueAtTime(1, ctx.currentTime);
    timer = setInterval(() => {
      if (!ctx) return;
      // 裏に まわって おくれた ときは、まとめて ならさず いまから
      if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
      while (nextTime < ctx.currentTime + 0.12) {
        scheduleStep(step, nextTime);
        nextTime += stepLen();
        step = (step + 1) % song.lead.length;
      }
    }, 25);
  }

  function bgmStop() {
    clearInterval(timer);
    timer = null;
    if (ctx) bgmGain.gain.setValueAtTime(0, ctx.currentTime);
  }

  // 裏に いる あいだは とめる。もどったら 音の そうちを つくりなおす
  // （iPhone では ほかの アプリが 音を つかうと、もどった あとの 音が くずれる ことが ある。warpix-link v1.47.2）
  const pause = () => ctx?.suspend().catch(() => {});
  function resume() {
    if (!ctx) return;
    const old = ctx;
    ctx = null;
    old.close().catch(() => {});
    if (!ensure()) return;
    nextTime = ctx.currentTime + 0.05;
    if (timer) bgmGain.gain.setValueAtTime(1, ctx.currentTime);
    if (ctx.state !== "running") addEventListener("pointerdown", () => ctx?.state !== "running" && ctx?.resume().catch(() => {}), { once: true, capture: true });
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : resume()));

  // 曲を いれかえる（BGM が オフなら ならさない。あとで オンに すれば その 曲から）。songPlay() で 店内 BGM に もどす
  function songPlay(next = SHOP) {
    song = next;
    step = 0;
    if (timer && ctx) nextTime = ctx.currentTime + 0.05;
  }

  // 左右から きこえる みじかい 音（ボスの あいず）
  function cue(freq, pan = 0, dur = 0.12) {
    if (ensure()) tone({ freq, start: ctx.currentTime, dur, vol: 0.07, pan, type: "square" });
  }

  return { sfx, bgmPlay, bgmStop, songPlay, cue, playing: () => !!timer };
})();
