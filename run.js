// ---------- 3 だいめ「PIXE RUN」（v0.5） ----------
// マリオみたいな ステージクリア。1-1〜1-4 を はしって とんで、はたに タッチ。
// - GAME A（ふつう）・GAME B（はやい）・TIME ATTACK（タイムを きそう。まえの ベストの じぶんが ゴーストで はしる、区間タイムの さ）
// - ゲームオーバーは ない。おちたり ぶつかったら、さいごに さわった はた（中間地点）から すぐ もういちど
// - さいしょの ステージは、せつめい なしで あそびかたが わかる ように（はじめの 敵・はじめの ？ブロック）
// 160x144 で 描いて、CSS で 整数倍に（インベーダーと おなじ）
const run = (() => {
  const W = 160;
  const H = 144;
  const T = 8; // タイルの 大きさ
  const ROWS = 18;
  const GROUND = 15; // 地面の いちばん 上の 行
  const STEP_MS = 1000 / 60;
  const KEY = "warpix-arcade-run";

  const overlay = document.getElementById("run");
  const canvas = document.getElementById("run-canvas");
  const closeBtn = document.getElementById("run-close");
  const modesEl = document.getElementById("run-modes");
  const modeBtns = [...modesEl.querySelectorAll("[data-mode]")];
  const padEl = document.getElementById("run-pad");
  const headMode = document.getElementById("run-head-mode");
  const c = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;
  // さわれる 画面なら ◀ ▶ JUMP を だす
  overlay.classList.toggle("touch", navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches);

  // ---------- ステージ ----------
  // 文字：# 地面・ブロック、B れんが、? コインの はいった ブロック（たたくと U）、T/P 土管（上・からだ）、W ワープ土管の 上、o コイン
  function build(w, fn) {
    const g = Array.from({ length: ROWS }, () => Array(w).fill("."));
    const lv = { w, g, enemies: [], checks: [], goal: w - 10, warp: null };
    const set = (x, y, ch) => x >= 0 && x < w && y >= 0 && y < ROWS && (g[y][x] = ch);
    const api = {
      ground(a, b) {
        for (let x = a; x <= b; x++) for (let y = GROUND; y < ROWS; y++) set(x, y, "#");
      },
      row(a, b, y, ch) {
        for (let x = a; x <= b; x++) set(x, y, ch);
      },
      pipe(x, h, top = "T") {
        for (let y = GROUND - h; y < GROUND; y++) {
          set(x, y, y === GROUND - h ? top : "P");
          set(x + 1, y, y === GROUND - h ? top : "P");
        }
      },
      stairs(x, n, down = false) {
        for (let i = 0; i < n; i++) {
          const hgt = down ? n - i : i + 1;
          for (let y = GROUND - hgt; y < GROUND; y++) set(x + i, y, "#");
        }
      },
      coins(a, b, y) {
        api.row(a, b, y, "o");
      },
      enemy(x, y = GROUND - 1) {
        lv.enemies.push({ x: x * T, y: y * T });
      },
      check(x) {
        lv.checks.push(x);
      },
      goal(x) {
        lv.goal = x;
      },
      warp(from, to) {
        lv.warp = { from, to };
      },
    };
    fn(api);
    return lv;
  }

  const STAGES = [
    // 1-1：たいらな みち。はじめの 敵は ひとりで ゆっくり、はじめの ？ブロックは 真上に
    () =>
      build(150, (s) => {
        s.ground(0, 39);
        s.ground(42, 79);
        s.ground(83, 149);
        s.row(10, 10, 11, "?");
        s.row(16, 20, 11, "B");
        s.row(18, 18, 11, "?");
        s.coins(17, 19, 8);
        s.enemy(26);
        s.coins(39, 42, 12);
        s.pipe(50, 2);
        s.enemy(57);
        s.pipe(64, 3);
        s.enemy(70);
        s.check(74);
        s.coins(79, 83, 12);
        s.row(90, 93, 11, "B");
        s.row(91, 92, 11, "?");
        s.enemy(98);
        s.enemy(104);
        s.coins(108, 112, 12);
        s.stairs(118, 4);
        s.stairs(124, 4, true);
        s.enemy(132);
        s.goal(140);
      }),
    // 1-2：土管と あな。（ひみつ：2 ばんめの 土管の 上で ↓ → ずっと さきへ）
    () =>
      build(170, (s) => {
        s.ground(0, 29);
        s.ground(33, 59);
        s.ground(63, 99);
        s.ground(104, 169);
        s.pipe(12, 2);
        s.enemy(18);
        s.pipe(22, 3, "W");
        s.warp(22, 104);
        s.coins(29, 33, 11);
        s.row(38, 42, 11, "B");
        s.row(40, 40, 11, "?");
        s.coins(38, 42, 8);
        s.enemy(44);
        s.enemy(48);
        s.pipe(52, 4);
        s.check(66);
        s.row(70, 72, 11, "?");
        s.enemy(76);
        s.pipe(82, 2);
        s.enemy(88);
        s.pipe(92, 3);
        s.coins(100, 103, 11);
        s.enemy(112);
        s.enemy(118);
        s.row(124, 128, 11, "B");
        s.row(126, 126, 7, "?");
        s.enemy(134);
        s.stairs(142, 5);
        s.goal(158);
        s.ground(150, 169);
      }),
    // 1-3：そらの しま。うかぶ ブロックを わたる
    () =>
      build(170, (s) => {
        s.ground(0, 14);
        s.row(18, 22, 12, "B");
        s.coins(18, 22, 9);
        s.ground(26, 36);
        s.enemy(31);
        s.row(40, 43, 11, "B");
        s.row(47, 50, 9, "B");
        s.coins(47, 50, 6);
        s.ground(53, 66);
        s.enemy(58);
        s.enemy(62);
        s.check(55);
        s.row(70, 72, 12, "B");
        s.row(76, 78, 10, "B");
        s.row(76, 76, 6, "?");
        s.ground(82, 96);
        s.pipe(88, 2);
        s.enemy(93);
        s.row(100, 103, 12, "B");
        s.coins(100, 103, 9);
        s.row(107, 110, 11, "B");
        s.ground(114, 128);
        s.check(116);
        s.enemy(121);
        s.enemy(125);
        s.row(132, 134, 12, "B");
        s.ground(138, 169);
        s.stairs(146, 3);
        s.goal(158);
      }),
    // 1-4：さいごの みち。かいだんと 敵が おおい
    () =>
      build(180, (s) => {
        s.ground(0, 24);
        s.enemy(14);
        s.enemy(19);
        s.stairs(22, 3);
        s.ground(28, 48);
        s.coins(25, 27, 10);
        s.row(32, 36, 11, "B");
        s.row(34, 34, 11, "?");
        s.enemy(38);
        s.enemy(42);
        s.enemy(46);
        s.ground(52, 80);
        s.check(54);
        s.pipe(60, 3);
        s.enemy(64);
        s.pipe(68, 4);
        s.coins(69, 73, 8);
        s.ground(84, 118);
        s.coins(81, 83, 11);
        s.row(90, 96, 10, "B");
        s.row(93, 93, 10, "?");
        s.enemy(92);
        s.enemy(98);
        s.enemy(104);
        s.check(108);
        s.stairs(112, 4);
        s.ground(122, 179);
        s.stairs(122, 3, true);
        s.enemy(130);
        s.enemy(136);
        s.enemy(142);
        s.stairs(150, 6);
        s.goal(168);
      }),
  ];
  const NAMES = ["1-1", "1-2", "1-3", "1-4"];

  // ---------- ドット絵 ----------
  const PIXE = [
    ["...pp...", "...ww...", ".wwwwww.", "wwowwoww", "wpwwwwpw", "wwwwwwww", ".wwwwww.", ".w....w."],
    ["...pp...", "...ww...", ".wwwwww.", "wwowwoww", "wpwwwwpw", "wwwwwwww", ".wwwwww.", "..w..w.."],
  ];
  const PIXE_JUMP = ["...pp...", "...ww...", ".wwwwww.", "wwowwoww", "wpwwwwpw", "wwwwwwww", ".wwwwww.", "w......w"];
  const KORO = [
    ["........", "..cccc..", ".cccccc.", "cwocwocc", "cccccccc", "ccc..ccc", ".cccccc.", "c.c..c.c"],
    ["........", "..cccc..", ".cccccc.", "cwocwocc", "cccccccc", "ccc..ccc", ".cccccc.", ".c.cc.c."],
  ];
  const KORO_FLAT = ["........", "........", "........", "........", "........", ".cccccc.", "cwwccwwc", "cccccccc"];
  const COIN = ["..yy..", ".yyyy.", "yywyyy", "yywyyy", ".yyyy.", "..yy.."];

  let sprites = {};
  let colors = {};
  function buildSprites() {
    const css = getComputedStyle(document.body);
    const v = (name) => css.getPropertyValue(name).trim();
    colors = { o: v("--shadow"), w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), bg: v("--bg"), muted: v("--muted"), btn: v("--btn") };
    const make = (rows) => {
      const cv = document.createElement("canvas");
      cv.width = rows[0].length;
      cv.height = rows.length;
      const cx = cv.getContext("2d");
      rows.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (!colors[ch]) return;
          cx.fillStyle = colors[ch];
          cx.fillRect(x, y, 1, 1);
        })
      );
      return cv;
    };
    sprites = { pixe: PIXE.map(make), jump: make(PIXE_JUMP), koro: KORO.map(make), flat: make(KORO_FLAT), coin: make(COIN) };
  }

  // ---------- きろく ----------
  // { clears: ぜんぶ クリアした かず, best: TIME ATTACK の ベスト（フレーム）, splits: ステージごとの ベスト, ghosts: ステージごとの ベストの はしり }
  function load() {
    const s = store.get(KEY, null) ?? {};
    const nums = (a) => (Array.isArray(a) ? a.slice(0, STAGES.length).map((n) => (Number.isFinite(n) && n > 0 ? n : null)) : []);
    return {
      clears: Number.isInteger(s.clears) && s.clears > 0 ? s.clears : 0,
      best: Number.isFinite(s.best) && s.best > 0 ? s.best : null,
      splits: nums(s.splits),
      ghosts: Array.isArray(s.ghosts) ? s.ghosts.slice(0, STAGES.length).map((g) => (Array.isArray(g) ? g : null)) : [],
    };
  }
  let save = load();
  const persist = () => store.set(KEY, save);

  // 1/60 びょう → 「01:23.45」
  const fmt = (f) => {
    if (!f) return "--:--.--";
    const cs = Math.round((f * 100) / 60);
    return `${String(Math.floor(cs / 6000)).padStart(2, "0")}:${String(Math.floor(cs / 100) % 60).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
  };
  const fmtDiff = (f) => `${f < 0 ? "-" : "+"}${(Math.abs(f) / 60).toFixed(2)}`;

  // ---------- じょうたい ----------
  const keys = new Set();
  let jumpBuf = 0;
  let st = null;
  let running = false;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let mode = "a";

  function reset(m, phase = "title") {
    st = { mode: m, phase, stage: 0, total: 0, coins: 0, misses: 0, t: 0, splits: [], lv: null, p: null, banner: 0 };
    if (phase !== "title") loadStage(0);
  }

  function loadStage(i) {
    const lv = STAGES[i]();
    st.stage = i;
    st.lv = lv;
    st.frames = 0;
    st.check = 2; // さいごに さわった はた（タイルの x）
    st.enemies = lv.enemies.map((e) => ({ ...e, vx: -1, vy: 0, dead: 0 }));
    st.pops = [];
    st.ghost = st.mode === "ta" ? save.ghosts[i] ?? null : null;
    st.rec = [];
    st.phase = "ready";
    st.banner = 90;
    spawn();
  }

  function spawn() {
    st.p = { x: st.check * T, y: (GROUND - 1) * T, vx: 0, vy: 0, ground: false, coyote: 0, face: 1, anim: 0 };
    st.cam = Math.max(0, Math.min(st.lv.w * T - W, st.p.x - 72));
  }

  const speed = () => (st.mode === "b" ? 1.25 : 1);
  const tileAt = (px, py) => {
    const x = Math.floor(px / T);
    const y = Math.floor(py / T);
    if (y < 0 || x < 0 || x >= st.lv.w) return y < 0 ? "." : "#";
    if (y >= ROWS) return ".";
    return st.lv.g[y][x];
  };
  const SOLID = new Set(["#", "B", "?", "U", "T", "P", "W"]);
  const solidAt = (px, py) => SOLID.has(tileAt(px, py));

  // ---------- うごき ----------
  function update() {
    st.t++;
    if (st.phase === "title") return;
    if (st.phase === "ready") {
      if (--st.banner <= 0) st.phase = "play";
      return;
    }
    if (st.phase === "miss") {
      if (--st.banner <= 0) {
        spawn();
        st.phase = "play";
      }
      return;
    }
    if (st.phase === "clear") {
      if (--st.banner <= 0) nextStage();
      return;
    }
    if (st.phase === "done") return;

    st.frames++;
    const p = st.p;
    const sp = speed();
    const max = 1.5 * sp;
    // よこ
    if (keys.has("left")) (p.vx -= 0.15 * sp), (p.face = -1);
    else if (keys.has("right")) (p.vx += 0.15 * sp), (p.face = 1);
    else p.vx *= 0.8;
    p.vx = Math.max(-max, Math.min(max, p.vx));
    if (Math.abs(p.vx) < 0.05) p.vx = 0;
    // ジャンプ（さきに おしても、足場から おちた すぐ あとでも とべる）
    if (jumpBuf > 0) jumpBuf--;
    if (p.ground) p.coyote = 6;
    else if (p.coyote > 0) p.coyote--;
    if (jumpBuf > 0 && p.coyote > 0) {
      p.vy = -4.0;
      p.coyote = 0;
      jumpBuf = 0;
      p.ground = false;
      sound.sfx.select();
    }
    if (!keys.has("jump") && p.vy < -1.6) p.vy = -1.6;
    p.vy = Math.min(4, p.vy + 0.22);

    moveX(p);
    moveY(p);
    if (p.vx) p.anim++;

    // コイン
    for (const [dx, dy] of [[1, 1], [6, 1], [1, 7], [6, 7]]) {
      const tx = Math.floor((p.x + dx) / T);
      const ty = Math.floor((p.y + dy) / T);
      if (st.lv.g[ty]?.[tx] === "o") {
        st.lv.g[ty][tx] = ".";
        st.coins++;
        sound.sfx.coin();
      }
    }
    // ワープ土管：上で ↓
    const wp = st.lv.warp;
    if (wp && p.ground && keys.has("down") && Math.floor((p.x + 4) / T) >= wp.from && Math.floor((p.x + 4) / T) <= wp.from + 1) {
      p.x = wp.to * T;
      p.y = (GROUND - 1) * T;
      p.vx = 0;
      sound.sfx.powerup();
    }
    // はた（中間地点）
    for (const cx of st.lv.checks) {
      if (cx > st.check && p.x + 4 >= cx * T) {
        st.check = cx;
        sound.sfx.powerup();
      }
    }
    // 敵
    for (const e of st.enemies) {
      if (e.dead) {
        e.dead++;
        continue;
      }
      if (Math.abs(e.x - p.x) > 200) continue; // 画面の そとは とまって まつ
      e.vx = Math.sign(e.vx) * 0.4 * sp;
      e.vy = Math.min(4, e.vy + 0.22);
      const nx = e.x + e.vx;
      if (solidAt(e.vx < 0 ? nx : nx + 7, e.y + 4)) e.vx *= -1;
      else e.x = nx;
      e.y += e.vy;
      if (solidAt(e.x + 1, e.y + 8) || solidAt(e.x + 6, e.y + 8)) {
        e.y = Math.floor((e.y + 8) / T) * T - 8;
        e.vy = 0;
      }
      if (e.y > H) e.dead = 999;
      // ピクセと ぶつかる
      if (p.x + 7 > e.x + 1 && p.x + 1 < e.x + 7 && p.y + 8 > e.y + 2 && p.y < e.y + 8) {
        if (p.vy > 0 && p.y + 8 - e.y < 6) {
          e.dead = 1;
          p.vy = -2.8;
          sound.sfx.hit();
        } else return miss();
      }
    }
    st.pops = st.pops.filter((q) => --q.t > 0);

    if (p.y > H + 8) return miss();
    st.cam = Math.max(0, Math.min(st.lv.w * T - W, p.x - 72));
    if (st.mode === "ta" && st.frames % 2 === 0) st.rec.push(Math.round(p.x), Math.round(p.y));
    // ゴール
    if (p.x + 4 >= st.lv.goal * T) clear();
  }

  function moveX(p) {
    p.x += p.vx;
    if (p.x < 0) (p.x = 0), (p.vx = 0);
    const top = p.y + 1;
    const bot = p.y + 7;
    if (p.vx > 0 && (solidAt(p.x + 7, top) || solidAt(p.x + 7, bot))) {
      p.x = Math.floor((p.x + 7) / T) * T - 8;
      p.vx = 0;
    } else if (p.vx < 0 && (solidAt(p.x, top) || solidAt(p.x, bot))) {
      p.x = Math.floor(p.x / T) * T + T;
      p.vx = 0;
    }
  }

  function moveY(p) {
    p.y += p.vy;
    p.ground = false;
    if (p.vy >= 0 && (solidAt(p.x + 1, p.y + 8) || solidAt(p.x + 6, p.y + 8))) {
      p.y = Math.floor((p.y + 8) / T) * T - 8;
      p.vy = 0;
      p.ground = true;
    } else if (p.vy < 0 && (solidAt(p.x + 1, p.y) || solidAt(p.x + 6, p.y))) {
      // あたまで たたく：？ブロックから コイン
      const tx = Math.floor((p.x + 4) / T);
      const ty = Math.floor(p.y / T);
      if (st.lv.g[ty]?.[tx] === "?") {
        st.lv.g[ty][tx] = "U";
        st.coins++;
        st.pops.push({ x: tx * T + 1, y: ty * T - 8, t: 24 });
        sound.sfx.coin();
      } else sound.sfx.hover();
      p.y = Math.floor(p.y / T) * T + T;
      p.vy = 0.5;
    }
  }

  function miss() {
    st.misses++;
    st.phase = "miss";
    st.banner = 50;
    keys.delete("left");
    keys.delete("right");
    sound.sfx.damage();
  }

  function clear() {
    st.phase = "clear";
    st.banner = 150;
    st.total += st.frames;
    st.splits.push(st.frames);
    sound.sfx.fanfare();
    if (st.mode === "ta") {
      const prev = save.splits[st.stage];
      st.diff = prev ? st.frames - prev : null;
      if (!prev || st.frames < prev) {
        save.splits[st.stage] = st.frames;
        save.ghosts[st.stage] = st.rec;
        persist();
      }
    }
    emit("run-stage", { stage: NAMES[st.stage], frames: st.frames, mode: st.mode });
  }

  function nextStage() {
    if (st.stage + 1 < STAGES.length) return loadStage(st.stage + 1);
    st.phase = "done";
    st.newBest = false;
    save.clears++;
    if (st.mode === "ta" && (!save.best || st.total < save.best)) {
      st.newBest = true;
      save.best = st.total;
    }
    persist();
    emit("run-clear", { mode: st.mode, frames: st.total, coins: st.coins, misses: st.misses, best: st.newBest });
  }

  // ---------- えがく ----------
  function text(str, x, y, color = colors.w, align = "left") {
    c.font = '8px "Press Start 2P", monospace';
    c.textAlign = align;
    c.textBaseline = "top";
    c.fillStyle = colors.o;
    c.fillText(str, x + 1, y + 1);
    c.fillStyle = color;
    c.fillText(str, x, y);
  }

  function drawTile(ch, x, y) {
    if (ch === "#") {
      c.fillStyle = colors.btn;
      c.fillRect(x, y, T, T);
      c.fillStyle = colors.muted;
      c.fillRect(x + 2, y + 3, 1, 1);
      c.fillRect(x + 6, y + 6, 1, 1);
      if (tileAtRaw(x, y - 1) !== "#") {
        c.fillStyle = colors.c;
        c.fillRect(x, y, T, 2);
      }
    } else if (ch === "B") {
      c.fillStyle = colors.p;
      c.fillRect(x, y, T, T);
      c.fillStyle = colors.bg;
      c.fillRect(x, y + 3, T, 1);
      c.fillRect(x + 3, y, 1, 3);
      c.fillRect(x + 6, y + 4, 1, 4);
    } else if (ch === "?" || ch === "U") {
      c.fillStyle = ch === "?" ? colors.y : colors.muted;
      c.fillRect(x, y, T, T);
      c.fillStyle = colors.o;
      c.fillRect(x, y + 7, T, 1);
      c.fillRect(x + 7, y, 1, T);
      if (ch === "?") {
        c.fillRect(x + 3, y + 1, 2, 1);
        c.fillRect(x + 5, y + 2, 1, 1);
        c.fillRect(x + 4, y + 3, 1, 1);
        c.fillRect(x + 3, y + 5, 1, 1);
      }
    } else if (ch === "T" || ch === "W" || ch === "P") {
      c.fillStyle = colors.c;
      c.fillRect(x, y, T, T);
      c.fillStyle = colors.w;
      const left = tileAtRaw(x - T, y) !== ch;
      if (left) c.fillRect(x + 1, y, 1, T);
      c.fillStyle = colors.o;
      if (ch !== "P") c.fillRect(x, y + 7, T, 1);
    } else if (ch === "o") {
      const f = Math.floor(st.t / 10) % 4;
      c.drawImage(sprites.coin, 0, 0, 6, 6, x + 1 + (f === 1 ? 1 : 0), y + 1, f === 2 ? 4 : 6, 6);
    }
  }
  const tileAtRaw = (x, y) => st.lv.g[Math.floor(y / T)]?.[Math.floor(x / T)] ?? ".";

  function drawFlag(tx, color, tall) {
    const x = tx * T - st.cam + 3;
    const top = (GROUND - (tall ? 9 : 4)) * T;
    c.fillStyle = colors.w;
    c.fillRect(x, top, 1, GROUND * T - top);
    c.fillStyle = color;
    c.fillRect(x + 1, top + 1, tall ? 8 : 6, tall ? 6 : 4);
  }

  function drawPixe(x, y, p, alpha = 1) {
    const img = !p.ground ? sprites.jump : sprites.pixe[Math.floor(p.anim / 6) % 2];
    c.save();
    c.globalAlpha = alpha;
    if (p.face < 0) {
      c.translate(Math.round(x) + 8, Math.round(y));
      c.scale(-1, 1);
      c.drawImage(img, 0, 0);
    } else c.drawImage(img, Math.round(x), Math.round(y));
    c.restore();
  }

  function drawTitle() {
    text("PIXE", W / 2, 16, colors.p, "center");
    text("RUN", W / 2, 28, colors.c, "center");
    // はしる ピクセ と ころがる コロ
    const x = ((st.t * 0.8) % (W + 40)) - 20;
    c.fillStyle = colors.btn;
    c.fillRect(0, 72, W, 8);
    c.fillStyle = colors.c;
    c.fillRect(0, 72, W, 2);
    c.drawImage(sprites.pixe[Math.floor(st.t / 6) % 2], Math.round(x), 64);
    c.drawImage(sprites.koro[Math.floor(st.t / 12) % 2], Math.round(x) - 24, 64);
    text(`TIME ${fmt(save.best)}`, W / 2, 96, colors.y, "center");
    text(`CLEAR ${save.clears}`, W / 2, 110, colors.y, "center");
  }

  function draw() {
    c.fillStyle = colors.bg;
    c.fillRect(0, 0, W, H);
    if (st.phase === "title") return drawTitle();
    const lv = st.lv;
    const cam = Math.round(st.cam);
    // とおくの ほし（ゆっくり うごく）
    c.fillStyle = colors.muted;
    for (let i = 0; i < 24; i++) c.fillRect(((i * 37 - cam / 4) % W + W) % W, (i * 23) % 96, 1, 1);
    const x0 = Math.floor(cam / T);
    for (let y = 0; y < ROWS; y++) for (let x = x0; x <= x0 + W / T + 1 && x < lv.w; x++) if (lv.g[y][x] !== ".") drawTile(lv.g[y][x], x * T - cam, y * T);
    for (const cx of lv.checks) drawFlag(cx, cx <= st.check ? colors.p : colors.c, false);
    drawFlag(lv.goal, colors.p, true);
    for (const q of st.pops) c.drawImage(sprites.coin, q.x - cam, q.y + (q.t - 24) / 2);
    for (const e of st.enemies) {
      if (e.dead > 30) continue;
      c.drawImage(e.dead ? sprites.flat : sprites.koro[Math.floor(st.t / 12) % 2], Math.round(e.x) - cam, Math.round(e.y));
    }
    // ゴースト（TIME ATTACK、まえの ベストの じぶん）
    const g = st.ghost;
    if (g && st.phase !== "ready") {
      const i = Math.min(Math.floor(st.frames / 2), g.length / 2 - 1) * 2;
      if (i >= 0) drawPixe(g[i] - cam, g[i + 1], { ground: true, anim: st.frames, face: 1 }, 0.35);
    }
    if (st.phase !== "miss" || st.banner % 8 < 4) drawPixe(st.p.x - cam, st.p.y, st.p);

    // 上の じょうほう
    text(NAMES[st.stage], 2, 2);
    text(`$${String(st.coins).padStart(2, "0")}`, 46, 2, colors.y);
    if (st.mode === "ta") text(fmt(st.total + (st.phase === "clear" || st.phase === "done" ? 0 : st.frames)), W - 2, 2, colors.c, "right");
    else if (st.misses) text(`x${st.misses}`, W - 2, 2, colors.muted, "right");

    if (st.phase === "ready") text(`STAGE ${NAMES[st.stage]}`, W / 2, 56, colors.w, "center");
    if (st.phase === "miss") text("OOPS!", W / 2, 56, colors.p, "center");
    if (st.phase === "clear") {
      text("STAGE CLEAR!", W / 2, 48, colors.c, "center");
      text(fmt(st.frames), W / 2, 62, colors.w, "center");
      if (st.mode === "ta" && st.diff !== null && st.diff !== undefined) text(fmtDiff(st.diff), W / 2, 76, st.diff < 0 ? colors.c : colors.p, "center");
    }
    if (st.phase === "done") {
      c.fillStyle = colors.bg;
      c.fillRect(10, 24, W - 20, 96);
      c.fillStyle = colors.c;
      c.fillRect(10, 24, W - 20, 1);
      c.fillRect(10, 119, W - 20, 1);
      text("ALL CLEAR!", W / 2, 32, colors.p, "center");
      text(`TIME  ${fmt(st.total)}`, W / 2, 50, colors.w, "center");
      text(`COIN  ${String(st.coins).padStart(8, " ")}`, W / 2, 64, colors.y, "center");
      text(`OOPS  ${String(st.misses).padStart(8, " ")}`, W / 2, 78, colors.muted, "center");
      if (st.newBest) text("NEW RECORD!", W / 2, 96, colors.c, "center");
    }
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!last) last = t;
    acc += Math.min(t - last, 100);
    last = t;
    while (acc >= STEP_MS) {
      update();
      acc -= STEP_MS;
    }
    showModes(st.phase === "title" || st.phase === "done");
    draw();
  }

  function showModes(show) {
    headMode.textContent = st.phase === "title" ? "" : { a: "GAME A", b: "GAME B", ta: "TIME ATTACK" }[st.mode];
    padEl.hidden = show;
    if (modesEl.hidden === !show) return;
    modesEl.hidden = !show;
  }

  function fit() {
    const scale = Math.max(1, Math.floor(Math.min((innerWidth - 32) / W, (innerHeight - 240) / H)));
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  }

  function play(m) {
    if (st.phase !== "title" && st.phase !== "done") return;
    mode = m;
    save = load();
    reset(m, "ready");
    sound.sfx.coin();
    showModes(false);
    canvas.focus();
    emit("run-start", { mode: m });
  }

  // open()：GAME A・B・TIME ATTACK を えらぶ ところから。open({ mode: "a", stage: 2 }) は すぐ（テスト用に ステージも）
  function open({ mode: m = null, stage = 0 } = {}) {
    if (running) return;
    save = load();
    buildSprites();
    reset(m ?? mode, m ? "ready" : "title");
    if (m) {
      mode = m;
      if (stage) loadStage(stage);
    }
    fit();
    overlay.hidden = false;
    document.body.classList.add("gaming");
    running = true;
    last = 0;
    acc = 0;
    keys.clear();
    raf = requestAnimationFrame(loop);
    showModes(!m);
    if (m) canvas.focus();
    else modesEl.querySelector(`[data-mode="${mode}"]`).focus();
  }

  function close() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    overlay.hidden = true;
    document.body.classList.remove("gaming");
  }

  for (const btn of modeBtns) btn.addEventListener("click", () => running && play(btn.dataset.mode));

  const KEYMAP = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowDown: "down", s: "down", S: "down" };
  const JUMPKEYS = new Set([" ", "ArrowUp", "w", "W", "z", "Z"]);
  addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.key === "Escape") return close();
    if (!modesEl.hidden) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const i = modeBtns.indexOf(document.activeElement);
        modeBtns[i < 0 ? 0 : (i + (e.key === "ArrowRight" ? 1 : modeBtns.length - 1)) % modeBtns.length].focus();
        return sound.sfx.hover();
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        play(document.activeElement?.dataset?.mode ?? mode);
      }
      return;
    }
    if (KEYMAP[e.key]) {
      keys.add(KEYMAP[e.key]);
      e.preventDefault();
    }
    if (JUMPKEYS.has(e.key)) {
      if (!e.repeat) jumpBuf = 6;
      keys.add("jump");
      e.preventDefault();
    }
  });
  addEventListener("keyup", (e) => {
    if (KEYMAP[e.key]) keys.delete(KEYMAP[e.key]);
    if (JUMPKEYS.has(e.key)) keys.delete("jump");
  });

  // スマホ：◀ ▶ と JUMP（おして いる あいだ）
  for (const btn of padEl.querySelectorAll("[data-key]")) {
    const k = btn.dataset.key;
    const down = (e) => {
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      if (k === "jump") jumpBuf = 6;
      keys.add(k);
      btn.classList.add("on");
    };
    const up = () => {
      keys.delete(k);
      btn.classList.remove("on");
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", up);
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  closeBtn.addEventListener("click", close);
  addEventListener("resize", () => running && fit());
  document.addEventListener("visibilitychange", () => {
    if (!running) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else {
      last = 0;
      raf = requestAnimationFrame(loop);
    }
  });

  return {
    open,
    close,
    isOpen: () => running,
    state: () => st,
    save: () => structuredClone(load()),
    fmt,
    stages: () => NAMES.slice(),
  };
})();
