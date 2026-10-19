// ---------- 1 だいめ「PIXE INVADERS」 ----------
// warpix-link の ミニゲーム（game.js）から ひっこして きた（v0.1）。ランキングの キー（warpix-ranking）も おなじ
// v0.2：ゲーム&ウオッチの ように GAME A（ふつう）と GAME B（はやい）。ボスは 名前と 顔の ある 4 たい。台の よこで ピクセが おうえん
// 160x144（ゲームボーイと同じ解像度）で描いて、CSSで整数倍に拡大する
const invaders = (() => {
  const W = 160;
  const H = 144;
  const STEP_MS = 1000 / 60;
  const PLAYER_Y = 126;

  const overlay = document.getElementById("game");
  const canvas = document.getElementById("game-canvas");
  const closeBtn = document.getElementById("game-close");
  const modesEl = document.getElementById("game-modes");
  const modeBtns = [...modesEl.querySelectorAll("[data-mode]")];
  const cheerEl = document.getElementById("game-cheer");
  const cheerText = document.getElementById("game-cheer-text");
  const headMode = document.getElementById("game-head-mode");
  const c = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  const SHIP = [
    "...pp...",
    "...ww...",
    "..wwww..",
    ".wowwow.",
    ".wwwwww.",
    "wwpwwpww",
    "w.wwww.w",
    "..c..c..",
  ];
  const INVADER = [
    [
      "..cccc..",
      ".cccccc.",
      "wwwwwwww",
      "wpwwwwpw",
      ".wwwwww.",
      ".w....w.",
    ],
    [
      "..cccc..",
      ".cccccc.",
      "wwwwwwww",
      "wwpwwpww",
      ".wwwwww.",
      "w......w",
    ],
  ];
  const BURST = [
    "p..p..p.",
    ".p.w.p..",
    "..www...",
    "pwwpwwp.",
    "..www...",
    ".p.w.p..",
    "p..p..p.",
    "........",
  ];
  const HEART = [
    "pp.pp",
    "ppppp",
    ".ppp.",
    "..p..",
  ];

  // ---------- ボス：24x12 の からだに 顔を かさねる（たおすと 目が ×に なる）。2 ばいで 描く ----------
  // 顔の かたち：目（2x2）、×の 目（3x3、左上が 目の 1 マス 左上）、口、ほっぺ。" " は からだの まま
  const EYE = ["oo", "oo"];
  const DIZZY = ["o o", " o ", "o o"];
  const BOSSES = [
    {
      id: "ufo",
      name: "UFO-SAN",
      short: "UFO",
      jp: "UFOさん",
      hint: "UFOさんだ。\n3ほうこうに うってくるよ。",
      body: [
        "........cccccccc........",
        "......cccccccccccc......",
        ".....cccccccccccccc.....",
        "..wwwwwwwwwwwwwwwwwwww..",
        ".wwwwwwwwwwwwwwwwwwwwww.",
        "wwwwwwwwwwwwwwwwwwwwwwww",
        "wwwwwwwwwwwwwwwwwwwwwwww",
        ".wwwwwwwwwwwwwwwwwwwwww.",
        "..wwwwwwwwwwwwwwwwwwww..",
        "....c..c........c..c....",
        "...c...c........c...c...",
        "........................",
      ],
      face: { eyes: [[8, 4], [14, 4]], mouth: [[11, 7, ["oo"]]], dizzyMouth: [[10, 7, ["oooo"]]], blush: [[5, 6], [17, 6]] },
      cd: (L) => Math.max(36, 80 - L * 4),
      move(b, L) {
        b.x += b.dir * (0.5 + L * 0.05);
      },
      fire(b, L) {
        for (const vx of [-0.6, 0, 0.6]) st.ebullets.push({ x: b.x + b.w / 2, y: b.y + b.h, v: 1.1 + L * 0.05, vx });
      },
    },
    {
      id: "tako",
      name: "TAKO",
      jp: "タコ",
      hint: "タコが きた！\nすみを ばらまくよ。",
      body: [
        ".......pppppppppp.......",
        ".....pppppppppppppp.....",
        "....pppppppppppppppp....",
        "...wwwwwwwwwwwwwwwwwwww.",
        "...pppppppppppppppppp.ww",
        "...pppppppppppppppppp..w",
        "...pppppppppppppppppp...",
        "....pppppppppppppppp....",
        ".....pppppppppppppp.....",
        "...pp.pp.pp..pp.pp.pp...",
        "..pp..p..pp..pp..p..pp..",
        "..p...p...p..p...p...p..",
      ],
      face: { eyes: [[8, 5], [14, 5]], mouth: [[11, 7, ["oo"]]], dizzyMouth: [[10, 7, ["oooo"]]], blush: [] },
      cd: (L) => Math.max(48, 100 - L * 4),
      // 8 の 字を えがいて ゆらゆら
      move(b) {
        b.t++;
        b.x = 56 + Math.sin(b.t / 50) * 50;
        b.y = 14 + Math.round(Math.sin(b.t / 23) * 4);
      },
      fire(b, L) {
        for (const vx of [-0.9, -0.45, 0, 0.45, 0.9]) st.ebullets.push({ x: b.x + b.w / 2, y: b.y + b.h, v: 0.8 + L * 0.04, vx });
      },
    },
    {
      id: "kani",
      name: "KANI",
      jp: "カニ",
      hint: "カニだ。ときどき\nよこに ダッシュするよ。",
      body: [
        "..yy................yy..",
        ".y..y..............y..y.",
        ".yy.y..............y.yy.",
        "..yy................yy..",
        "...y...y........y...y...",
        "....y..y........y..y....",
        ".....yyyyyyyyyyyyyy.....",
        "....yyyyyyyyyyyyyyyy....",
        "....yyyyyyyyyyyyyyyy....",
        ".....yyyyyyyyyyyyyy.....",
        "....y.y.y......y.y.y....",
        "...y.y.y........y.y.y...",
      ],
      // 目は ぼうの さき（くろい 目は 夜空に とけるので しろ目つき）
      face: { eyes: [[7, 2], [16, 2]], eye: ["ww", "wo"], dizzy: ["w w", " w ", "w w"], mouth: [[11, 8, ["oo"]]], dizzyMouth: [[10, 8, ["oooo"]]], blush: [[6, 7], [16, 7]] },
      cd: (L) => Math.max(30, 64 - L * 3),
      // ふだんは のそのそ。ときどき 自機の ほうへ ダッシュ
      move(b) {
        if (b.dash > 0) {
          b.x += b.dir * 2.6;
          b.dash--;
          return;
        }
        b.x += b.dir * 0.4;
        if (++b.t % 150 === 0) {
          b.dir = st.px + 4 > b.x + b.w / 2 ? 1 : -1;
          b.dash = 24;
        }
      },
      fire(b, L) {
        for (const dx of [4, b.w - 5]) st.ebullets.push({ x: b.x + dx, y: b.y + 8, v: 1.3 + L * 0.05 });
      },
    },
    {
      id: "neko",
      name: "NEKO",
      jp: "ネコ",
      hint: "ネコだ。きえたり\nねらって きたり するよ。",
      body: [
        "...w................w...",
        "...ww..............ww...",
        "...wpw............wpw...",
        "...wppwwwwwwwwwwwwppw...",
        "..wwwwwwwwwwwwwwwwwwww..",
        "..wwwwwwwwwwwwwwwwwwww..",
        "..wwwwwwwwwwwwwwwwwwww..",
        "..wwwwwwwwwwwwwwwwwwww..",
        "..wwwwwwwwwwwwwwwwwwww..",
        "...wwwwwwwwwwwwwwwwww...",
        "....wwwwwwwwwwwwwwww....",
        "......www......www......",
      ],
      face: {
        eyes: [[8, 5], [14, 5]],
        mouth: [[9, 7, ["  pp  ", "o oo o"]], [2, 8, ["oo"]], [20, 8, ["oo"]]],
        dizzyMouth: [[10, 8, ["oooo"]], [2, 8, ["oo"]], [20, 8, ["oo"]]],
        blush: [[5, 7], [17, 7]],
      },
      cd: (L) => Math.max(34, 72 - L * 3),
      // 3 びょうごとに すっと きえて、べつの ばしょに あらわれる
      move(b) {
        b.t++;
        b.hide = b.t % 180 >= 150;
        if (b.t % 180 === 165) b.x = 4 + Math.random() * (W - 8 - b.w);
      },
      fire(b, L) {
        if (b.hide) return;
        const s = 1.1 + L * 0.05;
        const dx = st.px + 4 - (b.x + b.w / 2);
        const dy = PLAYER_Y - (b.y + b.h);
        st.ebullets.push({ x: b.x + b.w / 2, y: b.y + b.h, v: s, vx: Math.max(-1.2, Math.min(1.2, (dx / dy) * s)) });
      },
    },
  ];
  const bossById = (id) => BOSSES.find((k) => k.id === id);

  function withFace(boss, dizzy) {
    const g = boss.body.map((r) => [...r]);
    const put = (x, y, pat) => pat.forEach((r, j) => [...r].forEach((ch, i) => ch !== " " && (g[y + j][x + i] = ch)));
    const f = boss.face;
    for (const [x, y] of f.eyes) dizzy ? put(x - 1, y - 1, f.dizzy ?? DIZZY) : put(x, y, f.eye ?? EYE);
    for (const [x, y, pat] of dizzy ? f.dizzyMouth : f.mouth) put(x, y, pat);
    for (const [x, y] of f.blush) put(x, y, ["pp"]);
    return g.map((r) => r.join(""));
  }

  // スプライトは開くたびに今の配色（CSS変数）で作り直す
  let sprites = {};
  let colors = {};
  function buildSprites() {
    const css = getComputedStyle(document.body);
    const v = (name) => css.getPropertyValue(name).trim();
    colors = { o: v("--shadow"), w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), bg: v("--bg"), muted: v("--muted") };
    const make = (rows, only) => {
      const cv = document.createElement("canvas");
      cv.width = rows[0].length;
      cv.height = rows.length;
      const cx = cv.getContext("2d");
      rows.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (!colors[ch]) return;
          cx.fillStyle = only ?? colors[ch];
          cx.fillRect(x, y, 1, 1);
        })
      );
      return cv;
    };
    sprites = {
      ship: make(SHIP),
      invader: INVADER.map((r) => make(r)),
      burst: make(BURST),
      heart: make(HEART),
      boss: Object.fromEntries(BOSSES.map((k) => [k.id, { face: make(withFace(k, false)), dizzy: make(withFace(k, true)), shadow: make(k.body, colors.muted) }])),
    };
  }

  const keys = new Set();
  let target = null;
  let st = null;
  let running = false;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let paid = false;
  let demo = false; // だれも操作しないデモプレイ
  let mode = "a";
  // デモ中は効果音を鳴らさない
  const sfx = (name) => !demo && sound.sfx[name]();
  // むずかしさ：GAME B は 3 ウェーブ さきの はやさから はじまる（点も そのぶん 高い）
  const lvl = () => st.wave + (st.mode === "b" ? 3 : 0);

  const bgStars = Array.from({ length: 40 }, () => ({
    x: Math.floor(Math.random() * W),
    y: Math.random() * H,
    s: Math.random() < 0.3 ? 0.5 : 0.2,
  }));

  function spawnWave(wave) {
    const list = [];
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 6; col++) {
        list.push({ x: 22 + col * 20, y: 18 + r * 12 + Math.min(wave - 1, 4) * 2, row: r, alive: true });
      }
    }
    return list;
  }

  function spawnBoss() {
    const kind = BOSSES[st.bossCount++ % BOSSES.length];
    const hp = 20 + lvl() * 2;
    st.boss = { kind, x: 56, y: 14, w: 48, h: 24, hp, max: hp, dir: 1, fireCd: 70, flash: 0, t: 0, dash: 0, hide: false };
  }

  // phase：title（GAME A・B を えらぶ）→ ready → play → clear → … → entry（なまえ）→ over
  function reset(m = mode, phase = "ready") {
    st = {
      mode: m,
      score: 0,
      lives: 3,
      wave: 1,
      px: 76,
      inv: 0,
      bullets: [],
      ebullets: [],
      enemies: spawnWave(m === "b" ? 4 : 1),
      boss: null,
      bossCount: 0,
      leaving: null,
      dir: 1,
      stepTimer: 0,
      anim: 0,
      fireCd: 30,
      bursts: [],
      phase,
      phaseTimer: 90,
      t: 0,
    };
    paid = false;
  }

  function play(m) {
    if (st.phase !== "title" && st.phase !== "over") return;
    mode = m;
    reset(m);
    sound.sfx.coin();
    showModes(false);
    canvas.focus();
    cheer(m === "b" ? "GAME B だね。\nおてなみ はいけん！" : "いってらっしゃい！", true);
    emit("game-start", { mode: m });
  }

  // ---------- ランキング：GAME A・B べつべつに ベスト 5。入ったら 3 文字の 名前を 入れる ----------
  const RANK_KEYS = { a: "warpix-ranking", b: "warpix-arcade-ranking-b" };
  const NAME_KEY = "warpix-rank-name";
  // あった ことの ある ボス（タイトルで 顔が みえる。まだの ボスは かげ）
  const MET_KEY = "warpix-arcade-bosses";
  const RANK_MAX = 5;
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-! ";
  const LETTER_X = [44, 64, 84]; // 名前の 3 文字と END の位置
  const END_X = 108;
  const LETTER_Y = 70;
  const loadRanking = (m) => (store.get(RANK_KEYS[m], []) ?? []).filter((r) => r && typeof r.n === "string" && Number.isFinite(r.s)).slice(0, RANK_MAX);
  // 描くたびに読み直さないよう、はじめて使うときに読んで持っておく
  const rankings = {};
  const getRanking = (m = "a") => (rankings[m] ??= loadRanking(m));
  const qualifies = (score) => {
    const list = getRanking(st.mode);
    return score > 0 && (list.length < RANK_MAX || score > list[RANK_MAX - 1].s);
  };
  let met = null;
  const getMet = () => (met ??= new Set([store.get(MET_KEY, [])].flat().filter((id) => bossById(id))));

  function startEntry() {
    const last = String(store.get(NAME_KEY, "PIX") ?? "PIX").toUpperCase().padEnd(3).slice(0, 3);
    st.entry = { letters: [...last].map((ch) => (CHARS.includes(ch) ? ch : "A")), pos: 0 };
    st.phase = "entry";
  }

  function shiftLetter(d) {
    const e = st.entry;
    if (e.pos > 2) return;
    e.letters[e.pos] = CHARS[(CHARS.indexOf(e.letters[e.pos]) + d + CHARS.length) % CHARS.length];
    sound.sfx.hover();
  }

  function submitEntry() {
    const name = st.entry.letters.join("");
    const list = [...getRanking(st.mode)];
    const row = { n: name, s: st.score, w: st.wave };
    list.push(row);
    list.sort((a, b) => b.s - a.s);
    const rank = list.indexOf(row);
    rankings[st.mode] = list.slice(0, RANK_MAX);
    store.set(RANK_KEYS[st.mode], rankings[st.mode]);
    store.set(NAME_KEY, name);
    st.entry = null;
    st.rankRow = rank;
    st.phase = "over";
    st.phaseTimer = 30;
    sound.sfx.fanfare();
    emit("game-rank", { rank: rank + 1, name: name.trim() || "???", score: row.s, mode: st.mode });
  }

  const hit = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  function payout() {
    if (demo || paid || !st || st.score === 0) return;
    paid = true;
    emit("game-over", { score: st.score, wave: st.wave, mode: st.mode });
    score.add(st.score, innerWidth / 2, innerHeight / 3);
  }

  function update() {
    st.t++;
    for (const s of bgStars) {
      s.y += s.s;
      if (s.y > H) s.y = 0;
    }
    st.bursts = st.bursts.filter((b) => --b.t > 0);
    // たおした ボスは ×の 目で ふらふら 上へ かえって いく
    const lv = st.leaving;
    if (lv && (lv.y -= 0.5) < -30) st.leaving = null;

    if (st.phase === "title") return;
    if (st.phase === "ready" || st.phase === "clear") {
      if (--st.phaseTimer <= 0) {
        if (st.phase === "clear") {
          st.wave++;
          // 3 ウェーブごとに、ふつうの敵の代わりにボス（UFOさん → タコ → カニ → ネコ → …）
          const bossWave = st.wave % 3 === 0;
          st.enemies = bossWave ? [] : spawnWave(lvl());
          st.boss = null;
          if (bossWave) {
            spawnBoss();
            cheer(st.boss.kind.hint);
          }
          st.dir = 1;
          st.ebullets = [];
          st.phase = "ready";
          st.phaseTimer = bossWave ? 90 : 60;
        } else {
          st.phase = "play";
        }
      }
      return;
    }
    if (st.phase === "entry") return;
    if (st.phase === "over") {
      st.phaseTimer--;
      if (demo && st.phaseTimer < -90) reset(mode);
      return;
    }

    if (demo) autopilot();
    const L = lvl();

    // 自機の移動
    if (keys.has("left")) st.px -= 1.6;
    if (keys.has("right")) st.px += 1.6;
    if (target !== null) {
      const d = target - st.px;
      st.px += Math.max(-2.5, Math.min(2.5, d));
    }
    st.px = Math.max(2, Math.min(W - 10, st.px));
    if (st.inv > 0) st.inv--;

    // オートショット
    if (--st.fireCd <= 0 && st.bullets.length < 3) {
      st.bullets.push({ x: Math.round(st.px) + 3, y: PLAYER_Y - 3 });
      st.fireCd = 16;
      sfx("shoot");
    }

    // ボス：それぞれの うごきと うちかた
    const boss = st.boss;
    if (boss) {
      boss.kind.move(boss, L);
      if (boss.x < 4 || boss.x + boss.w > W - 4) {
        boss.dir = boss.x < 4 ? 1 : -1;
        boss.x = Math.max(4, Math.min(W - 4 - boss.w, boss.x));
      }
      if (boss.flash > 0) boss.flash--;
      if (--boss.fireCd <= 0) {
        boss.fireCd = boss.kind.cd(L);
        boss.kind.fire(boss, L);
      }
    }

    // 敵の行進（残りが少ないほど速くなる）
    const alive = st.enemies.filter((e) => e.alive);
    const interval = Math.max(3, 28 - (18 - alive.length) * 1.4 - L * 2);
    if (alive.length && ++st.stepTimer >= interval) {
      st.stepTimer = 0;
      st.anim ^= 1;
      const minX = Math.min(...alive.map((e) => e.x));
      const maxX = Math.max(...alive.map((e) => e.x));
      if ((st.dir > 0 && maxX + 10 > W - 4) || (st.dir < 0 && minX - 2 < 4)) {
        st.dir *= -1;
        alive.forEach((e) => (e.y += 4));
      } else {
        alive.forEach((e) => (e.x += 2 * st.dir));
      }
      if (Math.random() < 0.25 + L * 0.05) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        st.ebullets.push({ x: shooter.x + 4, y: shooter.y + 6, v: 1 + L * 0.15 });
      }
    }

    // 自機の弾
    for (const b of st.bullets) {
      b.y -= 3;
      if (boss && boss.hp > 0 && !boss.hide && hit(b.x, b.y, 1, 3, boss.x, boss.y, boss.w, boss.h)) {
        b.y = -10;
        boss.hp--;
        boss.flash = 6;
        st.score += 10 * L;
        sfx("hit");
        if (boss.hp <= 0) defeat(boss, L);
        continue;
      }
      for (const e of alive) {
        if (e.alive && hit(b.x, b.y, 1, 3, e.x, e.y, 8, 6)) {
          e.alive = false;
          b.y = -10;
          st.score += (3 - e.row) * 10 * L;
          st.bursts.push({ x: e.x, y: e.y - 1, t: 12 });
          sfx("hit");
          break;
        }
      }
    }
    st.bullets = st.bullets.filter((b) => b.y > -4);

    // 敵の弾
    for (const b of st.ebullets) {
      b.y += b.v;
      b.x += b.vx ?? 0;
      if (st.inv === 0 && hit(b.x, b.y, 1, 3, st.px, PLAYER_Y, 8, 8)) {
        b.y = H + 10;
        st.lives--;
        st.inv = 90;
        st.bursts.push({ x: st.px, y: PLAYER_Y, t: 20 });
        sfx("damage");
        if (st.lives <= 0) return gameOver();
        cheer(st.lives === 1 ? "あと 1つ。\nおちついて いこう。" : "おっと！\nまだ だいじょうぶ。");
      }
    }
    st.ebullets = st.ebullets.filter((b) => b.y < H);

    if (alive.some((e) => e.alive && e.y + 6 >= PLAYER_Y)) return gameOver();

    if (boss ? boss.hp <= 0 : st.enemies.every((e) => !e.alive)) {
      st.boss = null;
      st.score += 100 * L;
      st.phase = "clear";
      st.phaseTimer = 100;
      st.bullets = [];
      sfx("powerup");
      if (!boss) cheer(["ナイス！", "いい ちょうし！", "その ちょうし！"][st.wave % 3]);
      if (!demo) emit("game-wave", { wave: st.wave });
    }
  }

  function defeat(boss, L) {
    for (let i = 0; i < 5; i++) st.bursts.push({ x: boss.x + i * 10, y: boss.y + (i % 2) * 8, t: 24 });
    st.score += 500 * L;
    st.leaving = { kind: boss.kind, x: boss.x, y: boss.y };
    sfx("boom");
    if (demo) return;
    cheer(`やった！ ${boss.kind.jp}を\nたおした！`, true);
    const seen = getMet();
    if (!seen.has(boss.kind.id)) {
      seen.add(boss.kind.id);
      store.set(MET_KEY, BOSSES.map((k) => k.id).filter((id) => seen.has(id)));
    }
    emit("game-boss", { wave: st.wave, boss: boss.kind.id });
  }

  // デモ用：いちばん近い敵の下へ向かい、真上から来る弾はよける
  function autopilot() {
    const center = st.px + 4;
    const danger = st.ebullets.find((b) => b.y > PLAYER_Y - 40 && Math.abs(b.x - center) < 7);
    if (danger) {
      target = st.px + (danger.x < center ? 20 : -20);
      return;
    }
    if (st.boss) {
      target = st.boss.x + st.boss.w / 2 - 4 + Math.sin(performance.now() / 300) * 6;
      return;
    }
    const alive = st.enemies.filter((e) => e.alive);
    if (!alive.length) return;
    const near = alive.reduce((a, e) => (Math.abs(e.x - st.px) < Math.abs(a.x - st.px) ? e : a));
    target = near.x + Math.sin(performance.now() / 300) * 3;
  }

  function gameOver() {
    st.phase = "over";
    st.phaseTimer = 60;
    st.rankRow = -1;
    sfx("gameover");
    cheer("おつかれさま！\nもう いっかい いく？");
    payout();
    if (!demo && qualifies(st.score)) startEntry();
  }

  function text(str, x, y, color = colors.w, align = "left") {
    c.font = '8px "Press Start 2P", monospace';
    c.textAlign = align;
    c.textBaseline = "top";
    c.fillStyle = colors.o;
    c.fillText(str, x + 1, y + 1);
    c.fillStyle = color;
    c.fillText(str, x, y);
  }

  const hiLine = (m) => {
    const top = getRanking(m)[0];
    return `${m.toUpperCase()} HI ${String(top?.s ?? 0).padStart(6, "0")}`;
  };

  // タイトル：なまえ・あるく インベーダー・ボスの ならび（あった ボスは 顔、まだの ボスは かげ と ？）・ハイスコア
  function drawTitle() {
    text("PIXE", W / 2, 10, colors.p, "center");
    text("INVADERS", W / 2, 22, colors.c, "center");
    const frame = Math.floor(st.t / 30) % 2;
    for (let i = 0; i < 5; i++) c.drawImage(sprites.invader[frame], 34 + i * 20 + (frame ? 2 : 0), 40);
    text("BOSS", W / 2, 58, colors.muted, "center");
    const seen = getMet();
    BOSSES.forEach((k, i) => {
      const x = 8 + i * 37;
      const has = seen.has(k.id);
      c.drawImage(has ? sprites.boss[k.id].face : sprites.boss[k.id].shadow, x, 70);
      text(has ? k.short ?? k.name : "?", x + 12, 86, has ? colors.w : colors.muted, "center");
    });
    text(hiLine("a"), W / 2, 108, colors.y, "center");
    text(hiLine("b"), W / 2, 120, colors.y, "center");
  }

  function draw() {
    c.fillStyle = colors.bg;
    c.fillRect(0, 0, W, H);
    c.fillStyle = colors.muted;
    for (const s of bgStars) c.fillRect(s.x, Math.floor(s.y), 1, 1);
    if (st.phase === "title") return drawTitle();

    for (const e of st.enemies) {
      if (e.alive) c.drawImage(sprites.invader[st.anim], e.x, e.y);
    }
    if (st.boss) {
      const b = st.boss;
      // ネコが きえて いる あいだは、はじめと おわりだけ ちらちら
      const h = b.t % 180;
      const shown = !b.hide || ((h < 156 || h > 174) && b.t % 4 < 2);
      if (!(b.flash && b.flash % 2) && shown) c.drawImage(sprites.boss[b.kind.id].face, Math.round(b.x), b.y, b.w, b.h);
      // HP バー
      c.fillStyle = colors.muted;
      c.fillRect(30, 10, 100, 2);
      c.fillStyle = colors.p;
      c.fillRect(30, 10, Math.round((100 * b.hp) / b.max), 2);
    }
    const lv = st.leaving;
    if (lv) c.drawImage(sprites.boss[lv.kind.id].dizzy, Math.round(lv.x + Math.sin(lv.y / 4) * 3), Math.round(lv.y), 48, 24);
    c.fillStyle = colors.c;
    for (const b of st.bullets) c.fillRect(b.x, b.y, 1, 3);
    c.fillStyle = colors.p;
    for (const b of st.ebullets) c.fillRect(Math.round(b.x), Math.round(b.y), 1, 3);
    for (const b of st.bursts) c.drawImage(sprites.burst, b.x, b.y);

    // 無敵中は点滅
    if (st.phase !== "over" && (st.inv === 0 || Math.floor(st.inv / 6) % 2)) {
      c.drawImage(sprites.ship, Math.round(st.px), PLAYER_Y);
    }

    c.fillStyle = colors.c;
    c.fillRect(0, 136, W, 1);
    for (let i = 0; i < st.lives; i++) c.drawImage(sprites.heart, 2 + i * 7, 139);
    text(String(st.score).padStart(6, "0"), 2, 2);
    text(`W${st.wave}`, W - 2, 2, colors.c, "right");

    if (st.phase === "ready") {
      if (st.boss) {
        text("BOSS WAVE!", W / 2, 56, colors.p, "center");
        text(st.boss.kind.name, W / 2, 72, colors.y, "center");
      } else text(`WAVE ${st.wave}`, W / 2, 64, colors.w, "center");
    }
    if (st.phase === "clear") text("WAVE CLEAR!", W / 2, 64, colors.c, "center");
    if (demo && Math.floor(performance.now() / 600) % 2) {
      text("DEMO PLAY", W / 2, 88, colors.p, "center");
      text("PRESS ANY KEY", W / 2, 100, colors.w, "center");
    }
    if (st.phase === "entry") drawEntry();
    if (st.phase === "over") {
      const list = getRanking(st.mode);
      if (!list.length) {
        text("GAME OVER", W / 2, 56, colors.p, "center");
      } else {
        panel();
        text("GAME OVER", W / 2, 20, colors.p, "center");
        text(`GAME ${st.mode.toUpperCase()} BEST 5`, W / 2, 36, colors.c, "center");
        const blink = Math.floor(performance.now() / 300) % 2;
        list.forEach((r, i) => {
          if (i === st.rankRow && !blink) return;
          const color = i === st.rankRow ? colors.c : colors.w;
          text(`${i + 1} ${r.n.padEnd(3)}`, 22, 52 + i * 12, color);
          text(String(r.s).padStart(6, "0"), 138, 52 + i * 12, color, "right");
        });
      }
      if (st.phaseTimer <= 0 && Math.floor(performance.now() / 500) % 2) {
        text("TAP TO RETRY", W / 2, list.length ? 116 : 72, colors.w, "center");
      }
    }
  }

  // ランキングと名前入れの うしろの板
  function panel() {
    c.fillStyle = colors.bg;
    c.fillRect(10, 14, W - 20, 116);
    c.fillStyle = colors.c;
    c.fillRect(10, 14, W - 20, 1);
    c.fillRect(10, 129, W - 20, 1);
  }

  // 上下の小さな三角（▲▼）
  function tri(x, y, up, color) {
    c.fillStyle = color;
    for (let i = 0; i < 3; i++) c.fillRect(x + 3 - i, up ? y + i : y + 2 - i, 1 + i * 2, 1);
  }

  function drawEntry() {
    const e = st.entry;
    panel();
    text("NEW RECORD!", W / 2, 22, colors.p, "center");
    text(String(st.score).padStart(6, "0"), W / 2, 36, colors.w, "center");
    text("ENTER NAME", W / 2, 50, colors.c, "center");
    const blink = Math.floor(performance.now() / 300) % 2;
    e.letters.forEach((ch, i) => {
      const on = i === e.pos;
      tri(LETTER_X[i] + 1, LETTER_Y - 7, true, on ? colors.c : colors.muted);
      tri(LETTER_X[i] + 1, LETTER_Y + 11, false, on ? colors.c : colors.muted);
      text(ch === " " ? "_" : ch, LETTER_X[i], LETTER_Y, on && blink ? colors.c : colors.w);
    });
    text("END", END_X, LETTER_Y, e.pos === 3 && blink ? colors.c : colors.p);
    text("UP/DOWN:A-Z", W / 2, 96, colors.muted, "center");
    text("ENTER:OK", W / 2, 108, colors.muted, "center");
  }

  // GAME A・B の ボタンは、えらぶ とき（タイトル）と ゲームオーバーの あとに だす
  function showModes(show) {
    headMode.textContent = st.phase === "title" ? "" : `GAME ${st.mode.toUpperCase()}`;
    if (modesEl.hidden === !show) return;
    modesEl.hidden = !show;
  }

  // ---------- 台の よこの ピクセ ----------
  cheerEl.querySelector(".game-cheer-pixe").innerHTML = pixelSvg(NPC.idle);
  function cheer(line, happy = false) {
    if (demo) return;
    cheerText.textContent = line;
    if (!happy) return;
    cheerEl.classList.remove("hop");
    void cheerEl.offsetWidth;
    cheerEl.classList.add("hop");
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
    if (!demo) showModes(st.phase === "title" || (st.phase === "over" && st.phaseTimer <= 0));
    draw();
  }

  function fit() {
    const scale = Math.max(1, Math.floor(Math.min((innerWidth - 32) / W, (innerHeight - 220) / H)));
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  }

  function retryIfOver() {
    if (st?.phase === "over" && st.phaseTimer <= 0) {
      play(st.mode);
      return true;
    }
    return false;
  }

  // open()：GAME A・B を えらぶ ところから。open({ mode: "a" }) は すぐ はじまる。open({ demo: true }) は デモプレイ
  function open({ demo: isDemo = false, mode: m = null } = {}) {
    if (running) return;
    demo = isDemo;
    overlay.classList.toggle("demo", demo);
    buildSprites();
    reset(m ?? mode, isDemo || m ? "ready" : "title");
    fit();
    overlay.hidden = false;
    document.body.classList.add("gaming");
    running = true;
    last = 0;
    acc = 0;
    keys.clear();
    target = null;
    raf = requestAnimationFrame(loop);
    if (demo) return showModes(false);
    if (m) {
      mode = m;
      showModes(false);
      canvas.focus();
      cheer("いってらっしゃい！");
      emit("game-start", { mode: m });
      return;
    }
    showModes(true);
    cheer("GAME A は ふつう、\nGAME B は はやいよ。");
    modesEl.querySelector(`[data-mode="${mode}"]`).focus();
  }

  function close() {
    if (!running) return;
    if (st.phase === "entry") submitEntry(); // とちゅうで閉じても、いまの名前で のこす
    if (st.phase !== "over" && st.phase !== "title") payout();
    demo = false;
    running = false;
    cancelAnimationFrame(raf);
    overlay.hidden = true;
    document.body.classList.remove("gaming");
  }

  for (const btn of modeBtns) btn.addEventListener("click", () => running && play(btn.dataset.mode));

  const KEYMAP = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
  addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.key === "Escape") return close();
    if (st?.phase === "entry") return entryKey(e);
    // ボタンが でて いる ときは ← → で えらんで Enter
    if (!modesEl.hidden && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const i = modeBtns.indexOf(document.activeElement);
      modeBtns[i < 0 ? 0 : (i + (e.key === "ArrowRight" ? 1 : modeBtns.length - 1)) % modeBtns.length].focus();
      return sound.sfx.hover();
    }
    if (st?.phase === "title") {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        play(document.activeElement?.dataset?.mode ?? mode);
      }
      return;
    }
    if (KEYMAP[e.key]) {
      keys.add(KEYMAP[e.key]);
      target = null;
      e.preventDefault();
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const picked = document.activeElement?.dataset?.mode;
      if (picked && !modesEl.hidden) play(picked);
      else retryIfOver();
    }
  });
  addEventListener("keyup", (e) => {
    if (KEYMAP[e.key]) keys.delete(KEYMAP[e.key]);
  });

  // 名前入れ：↑↓ で文字、←→ で場所、Enter で次へ（END で決定）。文字キーは そのまま入る
  function entryKey(e) {
    const en = st.entry;
    e.preventDefault();
    keys.clear();
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") return shiftLetter(1);
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") return shiftLetter(-1);
    if (e.key === "ArrowLeft") return void (en.pos = Math.max(0, en.pos - 1));
    if (e.key === "ArrowRight") return void (en.pos = Math.min(3, en.pos + 1));
    if (e.key === "Backspace") return void (en.pos = Math.max(0, en.pos - 1));
    if (e.key === "Enter" || e.key === " ") {
      if (en.pos >= 3) return submitEntry();
      en.pos++;
      return sound.sfx.select();
    }
    const ch = e.key.length === 1 ? e.key.toUpperCase() : "";
    if (ch && CHARS.includes(ch) && en.pos < 3) {
      en.letters[en.pos] = ch;
      en.pos++;
      sound.sfx.select();
    }
  }

  // タップ：文字の上半分（▲）で次の文字へ、下半分（▼）で前の文字へ。END で決定
  function entryTap(e) {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    if (y < LETTER_Y - 14 || y > LETTER_Y + 22) return;
    if (x >= END_X - 4 && x <= END_X + 28) return submitEntry();
    const i = LETTER_X.findIndex((lx) => x >= lx - 6 && x <= lx + 14);
    if (i < 0) return;
    st.entry.pos = i;
    shiftLetter(y < LETTER_Y + 4 ? 1 : -1);
  }

  // ドラッグ（タップ）した位置に自機が向かう
  function pointerTarget(e) {
    const r = canvas.getBoundingClientRect();
    target = ((e.clientX - r.left) / r.width) * W - 4;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (st?.phase === "title") return play(mode); // タイトルで 画面を さわったら、さいごに えらんだ ほう
    if (st?.phase === "entry") return entryTap(e);
    if (retryIfOver()) return;
    canvas.setPointerCapture(e.pointerId);
    pointerTarget(e);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (st?.phase === "title") return;
    if (e.buttons || e.pointerType !== "mouse") pointerTarget(e);
  });

  closeBtn.addEventListener("click", close);
  addEventListener("resize", () => running && fit());
  document.addEventListener("visibilitychange", () => {
    // 裏に回ったら止めて、戻ったら続きから
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
    isDemo: () => running && demo,
    state: () => st,
    ranking: getRanking,
    bosses: () => BOSSES.map((k) => k.id),
    met: () => [...getMet()],
  };
})();
