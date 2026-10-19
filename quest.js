// ---------- 2 だいめ「PIXE QUEST」 ----------
// v0.3：ピクセを そだてる 台（じゅんばんに たたかう）。v0.6：たたかいを「見て、よけて、なぐる」に つくりなおした（ファミコンの パンチアウトふう）
// - ボスは こうげきの まえに かならず クセを みせる（かたむく・「！」・左右から きこえる 音）。よけると すきが できて、パンチが はいる
// - ボスごとに じぶんの 曲が あって、こうげきは その 拍に のって くる。耳でも よめる
// - ボタンは 3 つだけ（◀ よける・パンチ・よける ▶）。はやい 指より「見て 1 かい おす」
// - 来なかった あいだも ピクセは しゅぎょう（LV が あがると ハートと パンチが つよく なる）。うまく なれば LV 1 でも かてる
// - たおした ボスは なかまに なって、セコンドに 1 たい ついて くれる
const quest = (() => {
  const KEY = "warpix-arcade-quest";
  const overlay = document.getElementById("quest");
  const homeEl = document.getElementById("quest-home");
  const battleEl = document.getElementById("quest-battle");
  const closeBtn = document.getElementById("quest-close");

  // ---------- ボス（16x16） ----------
  // bout：bpm（曲の はやさ）、hp、tell（クセの なが さ、拍）、rest（つぎまでの 拍）、stun（よけた あとの すき、拍）
  // moves：L 左から・R 右から・C まんなかに ふりおろす・LR / RL つづけて 2 かい・F 左と みせて 右（G は その ぎゃく）
  const BOSSES = [
    {
      id: "purun",
      name: "プルン",
      exp: 10,
      art: ["................", "................", "................", "................", "......cccc......", "....cccccccc....", "...ccwwccccccc..", "..ccwwcccccccc..", "..cccccccccccc..", ".ccccoccccocccc.", ".ccccoccccocccc.", ".cpcccccccccpcc.", ".ccccccoocccccc.", "cccccccccccccccc", ".cccccccccccccc.", "................"],
      bout: { bpm: 96, hp: 48, tell: 2, rest: 2, stun: 2, moves: ["L", "R", "L", "R", "C"] },
      tellSay: "ぷるぷる…",
      song: { bpm: 96, lead: [72, null, 76, null, 79, 76, 72, null, 74, null, 77, null, 81, 77, 74, null, 76, null, 79, null, 84, 79, 76, null, 79, 77, 76, 74, 72, null, null, null], bass: [48, 50, 52, 43] },
      ally: { save: 1 },
      combo: { name: "プルプル ダブルパンチ", dmg: 10 },
      allyNote: "1かいだけ ハート 0 で ふみとどまる",
    },
    {
      id: "obake",
      name: "オバケ",
      exp: 20,
      art: ["................", "......wwww......", "....wwwwwwww....", "...wwwwwwwwww...", "..wwwwwwwwwwww..", "..wwoowwwwoowww.", "..wwoowwwwoowww.", "..wwwwwwwwwwwww.", ".wpwwwwoowwwwpw.", ".wwwwwwwwwwwwww.", "wwwwwwwwwwwwwww.", ".wwwwwwwwwwwwwww", "..wwwwwwwwwwwww.", "..wwwwwwwwwwwww.", "..ww.www.www.ww.", "...w..w...w...w."],
      bout: { bpm: 104, hp: 64, tell: 2, rest: 2, stun: 2, moves: ["L", "C", "R", "F", "R", "G"], fade: true },
      tellSay: "すうっと うすく なった…",
      song: { bpm: 104, lead: [69, null, 72, null, 76, null, 75, null, 74, null, 72, null, 71, null, 68, null, 69, 72, 76, 81, 80, null, 76, null, 77, 76, 74, 72, 71, null, null, null], bass: [45, 41, 40, 45] },
      ally: { slow: 0.5 },
      combo: { name: "びっくり おばけ パンチ", dmg: 12 },
      allyNote: "ボスの クセが すこし ながく なる",
    },
    {
      id: "golem",
      name: "ゴーレム",
      exp: 35,
      art: ["................", "....vvvvvvvv....", "...vvvvvvvvvv...", "...vvyyvvyyvv...", "...vvvvvvvvvv...", "...vvvooooovv...", "....vvvvvvvv....", ".vvvvvvvvvvvvvv.", "vvvvvvvvvvvvvvvv", "vvv.vvvvvvvv.vvv", "vvv.vvvvvvvv.vvv", "vv..vvvvvvvv..vv", "....vvvvvvvv....", "....vvv..vvv....", "...vvvv..vvvv...", "................"],
      bout: { bpm: 84, hp: 88, tell: 3, rest: 1, stun: 3, moves: ["C", "L", "C", "R", "C", "LR"] },
      tellSay: "うでを ふりあげた！",
      song: { bpm: 84, kick: true, lead: [62, null, null, 62, 65, null, 62, null, 60, null, null, 60, 64, null, 60, null, 62, null, 65, null, 69, null, 67, 65, 64, null, 62, null, 61, null, null, null], bass: [38, 36, 34, 33] },
      ally: { guard: 1 },
      combo: { name: "ゴーレム ハンマー", dmg: 16 },
      allyNote: "さいしょの 1 ぱつを うけとめる",
    },
    {
      id: "hachi",
      name: "ハチ",
      exp: 50,
      art: ["................", "....ww....ww....", "...wwww..wwww...", "...wwww..wwww...", "....ww....ww....", ".....yyyyyy.....", "....yyyyyyyy....", "...yoyyyyyyoy...", "...pyyyyyyyyp...", "...oooooooooo...", "...yyyyyyyyyy...", "...oooooooooo...", "....yyyyyyyy....", ".....yyyyyy.....", ".......oo.......", "................"],
      bout: { bpm: 132, hp: 88, tell: 2, rest: 2, stun: 2, moves: ["LR", "L", "RL", "R", "LR", "C"] },
      tellSay: "ブンブン…",
      song: { bpm: 132, kick: true, lead: [76, 79, 76, 79, 81, 79, 76, 74, 76, 79, 76, 79, 83, 81, 79, 76, 74, 77, 74, 77, 79, 77, 74, 72, 71, 74, 71, 74, 76, null, 76, null], bass: [40, 40, 36, 38] },
      ally: { power: 1 },
      combo: { name: "ひとさし ラッシュ", dmg: 14 },
      allyNote: "パンチが 1 つよい",
    },
    {
      id: "doragon",
      name: "ドラゴン",
      exp: 80,
      art: ["................", "..y..........y..", "..yy........yy..", "...pppppppppp...", "..pppppppppppp..", "..ppwoppppwopp..", "..pppppppppppp..", "..pppppopoppppp.", "...pppppppppp...", "..pppwwwwwwppp..", ".ppppwwwwwwpppp.", "pp.pwwwwwwwwp.pp", "...pwwwwwwwwp...", "...pppppppppp...", "...pp......pp...", "................"],
      bout: { bpm: 112, hp: 112, tell: 2, rest: 2, stun: 2, moves: ["C", "L", "R", "F", "LR", "C", "G"] },
      tellSay: "おおきく いきを すいこんだ…",
      song: { bpm: 112, kick: true, lead: [65, null, 68, null, 72, null, 70, 68, 67, null, 63, null, 67, null, null, null, 65, 68, 72, 77, 75, null, 72, 70, 68, 67, 65, 63, 65, null, null, null], bass: [41, 39, 37, 36] },
      ally: { stun: 1 },
      combo: { name: "ドラゴン ファイア パンチ", dmg: 18 },
      allyNote: "よけた あとの すきが ながく なる",
    },
    {
      id: "maou",
      name: "まおう",
      exp: 150,
      art: ["................", "....y.y..y.y....", "....yyyyyyyy....", "....yyyyyyyy....", "...wwwwwwwwww...", "..wwwwwwwwwwww..", "..wwoowwwwooww..", "..wwoowwwwooww..", "..wpwwwoowwwpw..", "...wwwwwwwwww...", ".vvvvvvvvvvvvvv.", "vvvvvvvvvvvvvvvv", "vvvvvyyyyyyvvvvv", "vvvvvvvvvvvvvvvv", ".vvvvvvvvvvvvvv.", "..vv........vv.."],
      bout: { bpm: 140, hp: 144, tell: 2, rest: 1, stun: 2, moves: ["L", "F", "R", "LR", "C", "G", "RL", "C"] },
      tellSay: "ふふふ…",
      song: { bpm: 140, kick: true, lead: [72, 75, 79, 84, 83, 79, 75, 72, 71, 74, 77, 83, 81, 77, 74, 71, 72, 75, 79, 84, 86, 84, 83, 79, 80, 79, 77, 75, 74, null, 71, null], bass: [36, 35, 32, 31] },
      ally: { hearts: 2 },
      combo: { name: "ダーク まおう パンチ", dmg: 20 },
      allyNote: "ハートが 2 ふえる",
    },
  ];
  const bossById = (id) => BOSSES.find((k) => k.id === id);
  // かげ（まだ あって いない ボス）
  const shadow = (art) => art.map((r) => r.replace(/[^.]/g, "v"));

  // ---------- きろく ----------
  const int = (v, min, d) => (Number.isInteger(v) && v >= min ? v : d);
  function load() {
    const s = store.get(KEY, null) ?? {};
    const beaten = [s.beaten].flat().filter((id) => bossById(id));
    return {
      lv: int(s.lv, 1, 1),
      exp: int(s.exp, 0, 0),
      beaten: BOSSES.map((k) => k.id).filter((id) => beaten.includes(id)),
      ally: beaten.includes(s.ally) ? s.ally : null,
      last: Number.isFinite(s.last) ? s.last : 0,
    };
  }
  let save = load();
  const persist = () => store.set(KEY, save);
  const need = (lv) => lv * 10;
  // LV で ふえる：ハート 3＋（LV−1）/2（8 まで）、パンチ 1＋（LV−1）/3
  function stats() {
    const lv = save.lv;
    const ally = bossById(save.ally)?.ally ?? {};
    return { hearts: Math.min(8, 3 + Math.floor((lv - 1) / 2)) + (ally.hearts ?? 0), power: 1 + Math.floor((lv - 1) / 3) + (ally.power ?? 0) };
  }
  function gainExp(n) {
    save.exp += n;
    let ups = 0;
    while (save.exp >= need(save.lv)) {
      save.exp -= need(save.lv);
      save.lv++;
      ups++;
    }
    persist();
    return ups;
  }

  // ---------- 来なかった あいだの しゅぎょう ----------
  // 1 じかんごとに けいけんち 3（1 日ぶん 72 まで）
  const HOUR = 3600 * 1000;
  const TRAINING = ["うでたて ふせを 100かい！", "やまみちを ランニング！", "たきに うたれて しゅぎょう！", "サンドバッグを 1000ぱつ！", "なわとびを 500かい！", "ゆっくり ねて たいりょく かいふく！"];
  function trainWhileAway(now = Date.now()) {
    const away = save.last ? now - save.last : 0;
    save.last = now;
    persist();
    if (away < HOUR) return null;
    const hours = Math.min(24, Math.floor(away / HOUR));
    const exp = hours * 3;
    const ups = gainExp(exp);
    return { what: TRAINING[Math.floor(Math.random() * TRAINING.length)], hours, exp, ups };
  }

  // ---------- ホーム ----------
  function renderHome(diary) {
    const s = stats();
    const all = save.beaten.length === BOSSES.length;
    const next = BOSSES.find((k) => !save.beaten.includes(k.id));
    homeEl.innerHTML = `
      <div class="quest-me">
        <span class="quest-pixe${all ? " crown" : ""}">${pixelSvg(NPC.idle)}</span>
        <div class="quest-stats">
          <p class="quest-lv">ピクセ <b>LV ${save.lv}</b></p>
          <p>ハート ${s.hearts} ・ パンチ ${s.power}</p>
          <p class="quest-exp"><span class="quest-bar"><span style="width:${Math.round((100 * save.exp) / need(save.lv))}%"></span></span>つぎの LV まで ${need(save.lv) - save.exp}</p>
        </div>
      </div>
      ${diary ? `<p class="quest-diary"><b>ピクセの しゅぎょう にっき</b>${diary.hours}じかん、${diary.what}<br>けいけんち ＋${diary.exp}${diary.ups ? `　LV が ${diary.ups} あがった！` : ""}</p>` : ""}
      ${all ? `<p class="quest-diary"><b>ぜんぶの ボスを たおした！</b>また なんどでも たたかえるよ。</p>` : ""}
      <p class="quest-how"><b>あそびかた</b>ゆかが 赤く ひかったら、ひかって いない ところへ ◀ ▶ で よける。よけた すぐ あとは チャンス！ パンチが 4ばい。</p>
      <h2 class="quest-label">ボス</h2>
      <div class="quest-bosses">
        ${BOSSES.map((k) => {
          const beaten = save.beaten.includes(k.id);
          const open = beaten || k === next;
          return `<button class="quest-boss${beaten ? " beaten" : ""}${k === next ? " next" : ""}" type="button" data-boss="${k.id}" ${open ? "" : "disabled"} aria-label="${open ? `${k.name}と たたかう` : "まだ ちょうせん できない ボス"}">
            <span class="quest-boss-art">${pixelSvg(open ? k.art : shadow(k.art))}</span>
            <span class="quest-boss-name">${open ? k.name : "？"}</span>
            ${k === next ? `<span class="quest-boss-tag">つぎ</span>` : beaten ? `<span class="quest-boss-tag done">たおした</span>` : ""}
          </button>`;
        }).join("")}
      </div>
      ${save.beaten.length ? `
      <h2 class="quest-label">セコンド <small>なかまを 1たい つれて いける</small></h2>
      <div class="quest-allies">
        ${save.beaten.map((id) => {
          const k = bossById(id);
          return `<button class="quest-ally${save.ally === id ? " on" : ""}" type="button" data-ally="${id}" aria-pressed="${save.ally === id}">
            <span class="quest-ally-art">${pixelSvg(k.art)}</span><span>${k.name}<small>${k.allyNote}</small></span>
          </button>`;
        }).join("")}
      </div>` : `<p class="quest-hint">ボスを たおすと なかまに なるよ。</p>`}
    `;
    homeEl.hidden = false;
    battleEl.hidden = true;
    for (const btn of homeEl.querySelectorAll("[data-boss]")) btn.addEventListener("click", () => fight(btn.dataset.boss));
    for (const btn of homeEl.querySelectorAll("[data-ally]")) {
      btn.addEventListener("click", () => {
        save.ally = save.ally === btn.dataset.ally ? null : btn.dataset.ally;
        persist();
        sound.sfx.select();
        renderHome();
        homeEl.querySelector(`[data-ally="${btn.dataset.ally}"]`)?.focus();
      });
    }
  }

  // ---------- たたかい（160x120 の キャンバス） ----------
  // v0.7：よけた ばしょに いつづける（パンチで まんなかへ）。こうげきが くる レーンの ゆかが 赤く ひかる。
  // パンチは いつでも すこし はいり、よけた すぐ あとの「チャンス！」は 4 ばい。セコンドは リングの コーナーに いて、なかま ゲージが たまると 合体わざ
  const W = 160;
  const H = 120;
  const LANE = { L: 32, C: 80, R: 128 }; // レーンの まんなか（x）
  const LANE_RECT = { L: [0, 54], C: [54, 106], R: [106, 160] };
  const PIXE_Y = 84;
  const PUNCH_MS = 300; // ふつうの パンチの あいだ
  const CHANCE_MS = 170; // チャンスの パンチの あいだ
  const GLOVE = ["..pppp..", ".pppppp.", "pppppppp", "pppppppp", "pwpppppp", ".pppppp.", "..wwww..", "..wwww.."];

  let b = null; // いまの たたかい
  let raf = 0;
  let colors = {};
  let sprites = {};
  const clock = () => performance.now();

  function buildSprites(boss) {
    const css = getComputedStyle(document.body);
    const v = (name) => css.getPropertyValue(name).trim();
    colors = { o: v("--shadow"), w: v("--fg"), p: v("--accent"), c: v("--accent-2"), y: v("--gold"), v: v("--muted"), b: v("--btn"), bg: v("--bg") };
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
    const ally = bossById(save.ally);
    sprites = { boss: make(boss.art), pixe: make(NPC.idle), blink: make(NPC.blink), glove: make(GLOVE), ally: ally ? make(ally.art) : null };
  }

  function fight(id) {
    const boss = bossById(id);
    const s = stats();
    const second = bossById(save.ally);
    const ally = second?.ally ?? {};
    const bt = boss.bout;
    b = {
      boss,
      bt,
      second,
      ally,
      beat: 60000 / bt.bpm,
      t0: clock() + 60,
      hp: bt.hp,
      hearts: s.hearts,
      maxHearts: s.hearts,
      power: s.power,
      guard: ally.guard ?? 0,
      saveLeft: ally.save ?? 0,
      tell: bt.tell + (ally.slow ?? 0),
      stunLen: bt.stun + (ally.stun ?? 0),
      state: "intro",
      until: 4, // 拍
      mi: 0,
      lands: [],
      show: null,
      lane: "C",
      px: LANE.C, // 見た目の いち（レーンへ すべって いく）
      punch: 0,
      flash: 0,
      hurt: 0,
      gauge: 0, // なかま ゲージ（100 で 合体わざ）
      fx: [], // { kind, until, ... } 見せる ための できごと
      over: false,
      log: [],
      stats: { dodged: 0, hit: 0, punches: 0, chance: 0, combos: 0 },
    };
    buildSprites(boss);
    battleEl.innerHTML = `
      <div class="quest-hud">
        <p class="quest-foe-name">${boss.name}</p>
        <span class="quest-bar foe"><span id="quest-foe-hp"></span></span>
        <p class="quest-hearts" id="quest-hearts" aria-label="ピクセの ハート"></p>
        ${second ? `<p class="quest-gauge-label">なかま</p><span class="quest-bar gauge"><span id="quest-gauge"></span></span>` : ""}
      </div>
      <canvas class="quest-ring" id="quest-ring" width="${W}" height="${H}" aria-label="たたかいの 画面"></canvas>
      <p class="quest-call" id="quest-call" aria-live="polite"></p>
      <div class="quest-pads" id="quest-cmds">
        <button class="quest-pad" type="button" data-cmd="left"><b>◀</b><small>ひだりへ</small></button>
        <button class="quest-pad punch" type="button" data-cmd="punch"><b>パンチ</b></button>
        <button class="quest-pad" type="button" data-cmd="right"><b>▶</b><small>みぎへ</small></button>
      </div>
      <p class="quest-keys">← → で よける ・ スペースで パンチ</p>
    `;
    homeEl.hidden = true;
    battleEl.hidden = false;
    for (const btn of battleEl.querySelectorAll("[data-cmd]")) {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        act(btn.dataset.cmd);
      });
      // キーボードの Enter（ボタンに フォーカスが ある とき）
      btn.addEventListener("click", (e) => e.detail === 0 && act(btn.dataset.cmd));
    }
    fitRing();
    hud();
    call(`${boss.name}が あらわれた！`);
    sound.sfx.coin();
    sound.songPlay(boss.song);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    // キーは どこに フォーカスが あっても きく ので、ボタンには フォーカスしない（スマホで 水色の わくが でない ように）
    overlay.focus({ preventScroll: true });
    emit("quest-fight", { boss: id });
  }

  function fitRing() {
    const ring = battleEl.querySelector("#quest-ring");
    if (!ring) return;
    const scale = Math.max(1, Math.floor(Math.min((Math.min(innerWidth, 480) - 32) / W, (innerHeight - 340) / H)));
    ring.style.width = `${W * scale}px`;
    ring.style.height = `${H * scale}px`;
  }

  function hud() {
    battleEl.querySelector("#quest-foe-hp").style.width = `${Math.max(0, (100 * b.hp) / b.bt.hp)}%`;
    battleEl.querySelector("#quest-hearts").textContent = "♥".repeat(Math.max(0, b.hearts)) + "♡".repeat(Math.max(0, b.maxHearts - b.hearts));
    const g = battleEl.querySelector("#quest-gauge");
    if (g) g.style.width = `${b.gauge}%`;
  }
  function call(text) {
    if (text) b.log.push(text);
    battleEl.querySelector("#quest-call").textContent = text;
  }
  const fx = (kind, ms, extra = {}) => b.fx.push({ kind, until: clock() + ms, from: clock(), ...extra });

  const beatNow = () => (clock() - b.t0) / b.beat;
  const sidePan = { L: -0.8, R: 0.8, C: 0 };
  // L から くる こうげきは 左と まんなか、R は 右と まんなか、C は まんなかだけに あたる
  const danger = (side) => (side === "C" ? ["C"] : [side, "C"]);
  const hits = (side, lane) => danger(side).includes(lane);

  // ボスの つぎの わざ。lands：あたる 拍と ほうこう、show：みせる ほうこう（F・G は とちゅうで かわる）
  function startMove(now) {
    const m = b.bt.moves[b.mi++ % b.bt.moves.length];
    const at = now + b.tell;
    const lands =
      m === "LR" ? [{ side: "L", at }, { side: "R", at: at + 1 }] :
      m === "RL" ? [{ side: "R", at }, { side: "L", at: at + 1 }] :
      m === "F" ? [{ side: "R", at }] :
      m === "G" ? [{ side: "L", at }] :
      [{ side: m, at }];
    b.lands = lands;
    b.feint = m === "F" ? { from: "L", switch: at - 0.75 } : m === "G" ? { from: "R", switch: at - 0.75 } : null;
    b.show = b.feint ? b.feint.from : lands[0].side;
    b.state = "tell";
    sound.cue(b.show === "C" ? 330 : 440, sidePan[b.show]);
    call(b.boss.tellSay);
    // セコンドの オバケ：ボスを おどかして、クセが ながく なる
    if (b.ally.slow) fx("boo", 600);
  }

  function update() {
    if (!b || b.over) return;
    const ms = clock();
    const now = beatNow();
    b.px += (LANE[b.lane] - b.px) * 0.45; // レーンへ すべる
    b.fx = b.fx.filter((f) => f.until > ms);
    if (b.flash > 0) b.flash--;
    if (b.hurt > 0) b.hurt--;
    if (b.state === "combo") {
      if (ms >= b.comboEnd) {
        b.state = "rest";
        b.until = now + b.bt.rest;
        if (b.hp <= 0) return win();
      }
      return;
    }
    if (b.state === "intro") {
      if (now >= b.until) {
        call("ファイト！");
        b.state = "rest";
        b.until = now + 1;
      }
      return;
    }
    if (b.state === "rest" && now >= b.until) startMove(now);
    if (b.state === "tell") {
      if (b.feint && now >= b.feint.switch && b.show !== b.lands[0].side) {
        b.show = b.lands[0].side;
        sound.cue(520, sidePan[b.show]);
      }
      const due = b.lands.find((l) => !l.done && now >= l.at);
      if (due) {
        due.done = true;
        fx("swing", 180, { side: due.side });
        b.show = b.lands.find((l) => !l.done)?.side ?? due.side;
        if (hits(due.side, b.lane)) {
          b.missed = true;
          if (b.guard > 0) {
            b.guard--;
            fx("block", 500);
            call("セコンドの ゴーレムが うけとめた！");
            sound.sfx.hit();
          } else {
            b.hearts--;
            b.hurt = 18;
            b.stats.hit++;
            fx("oops", 500);
            sound.sfx.damage();
            if (b.hearts <= 0 && b.saveLeft > 0) {
              b.saveLeft--;
              b.hearts = 1;
              fx("hold", 700);
              call("セコンドの プルンが ささえて くれた！");
            } else call("いたっ！");
            hud();
            if (b.hearts <= 0) return lose();
          }
        } else {
          b.stats.dodged++;
          b.gauge = Math.min(100, b.gauge + (b.second ? 20 : 0));
          fx("cheer", 400);
          sound.sfx.hover();
          call("よけた！");
          hud();
        }
        if (b.lands.every((l) => l.done)) {
          if (b.missed) {
            b.missed = false;
            b.state = "rest";
            b.until = now + b.bt.rest;
          } else {
            b.state = "stun";
            b.until = now + b.stunLen;
            b.stats.chance++;
            call("チャンス！ パンチ！");
            // セコンドの ドラゴン：ほえて、ボスが すくむ（チャンスが ながい）
            if (b.ally.stun) fx("roar", 700);
          }
        }
      }
    }
    if (b.state === "stun" && now >= b.until) {
      b.state = "rest";
      b.until = now + b.bt.rest;
      call("");
    }
  }

  // パンチ：ふつうは 1、チャンスは 4（×パンチの つよさ）。なかま ゲージが 満タンで チャンスなら 合体わざ
  function act(cmd) {
    if (!b || b.over || b.state === "intro" || b.state === "combo") return;
    const ms = clock();
    if (cmd === "left" || cmd === "right") {
      b.lane = cmd === "left" ? "L" : "R";
      return;
    }
    if (cmd !== "punch") return;
    const chance = b.state === "stun";
    if (ms < b.punch + (chance ? CHANCE_MS : PUNCH_MS)) return;
    b.lane = "C"; // パンチは まんなかに ふみこんで うつ
    b.punch = ms;
    b.stats.punches++;
    if (chance && b.second && b.gauge >= 100) return combo();
    const dmg = (chance ? 4 : 1) * b.power;
    b.hp -= dmg;
    b.flash = chance ? 6 : 2;
    if (chance) b.gauge = Math.min(100, b.gauge + (b.second ? 5 : 0));
    fx("num", 500, { text: chance ? `${dmg}!` : String(dmg), big: chance, x: 80 + (Math.random() * 30 - 15) });
    if (chance) sound.sfx.hit();
    else sound.cue(1200, 0, 0.04);
    hud();
    if (b.hp <= 0) return win();
  }

  // 合体わざ：セコンドが リングに とびこんで、いっしょに 大わざ
  function combo() {
    const k = b.second;
    const dmg = k.combo.dmg * b.power;
    b.state = "combo";
    b.comboEnd = clock() + 1400;
    b.gauge = 0;
    b.stats.combos++;
    b.hp -= dmg;
    fx("combo", 1400, { text: `${dmg}!!` });
    call(`がったい わざ！「${k.combo.name}」`);
    sound.sfx.powerup();
    setTimeout(() => b && sound.sfx.boom(), 500);
    hud();
  }

  function draw() {
    const ring = battleEl.querySelector("#quest-ring");
    if (!ring || !b) return;
    const c = ring.getContext("2d");
    c.imageSmoothingEnabled = false; // ドットを くっきり
    const ms = clock();
    const now = beatNow();
    const phase = now - Math.floor(now);
    const has = (kind) => b.fx.find((f) => f.kind === kind);
    c.fillStyle = colors.bg;
    c.fillRect(0, 0, W, H);
    // リング：ロープと ゆか
    c.fillStyle = colors.b;
    c.fillRect(0, 96, W, H - 96);
    c.fillStyle = colors.v;
    for (const y of [18, 30, 42]) c.fillRect(0, y, W, 1);
    // こうげきが くる レーンの ゆかが 赤く ひかる（拍に あわせて ちょっと つよく）
    if (b.state === "tell" && b.show) {
      c.save();
      c.globalAlpha = phase < 0.5 ? 0.55 : 0.35;
      c.fillStyle = colors.p;
      for (const lane of danger(b.show)) {
        const [x0, x1] = LANE_RECT[lane];
        c.fillRect(x0 + 1, 97, x1 - x0 - 2, H - 97);
      }
      c.restore();
    }
    c.fillStyle = colors.c;
    c.fillRect(0, 96, W, 1);
    // ボス：拍に あわせて はずむ。クセの あいだは かたむき、チャンスの あいだは 星が まわる
    const lean = b.state === "tell" ? (b.show === "L" ? -14 : b.show === "R" ? 14 : 0) : 0;
    const lift = b.state === "tell" && b.show === "C" ? -6 : 0;
    const bob = phase < 0.18 && b.state !== "stun" ? 2 : 0;
    const startle = has("boo") || has("roar") ? (Math.floor(ms / 50) % 2 ? 2 : -2) : 0;
    const bx = 48 + lean + startle;
    const by = 8 + lift + bob;
    c.save();
    if (b.bt.fade && b.state === "tell") c.globalAlpha = 0.35;
    if (b.over && b.won) c.globalAlpha = 0.4;
    if (!(b.flash && b.flash % 2)) c.drawImage(sprites.boss, bx, by + (b.over && b.won ? 12 : 0), 64, 64);
    c.restore();
    if (b.state === "stun") {
      c.fillStyle = colors.y;
      for (let i = 0; i < 3; i++) {
        const a = ms / 200 + (i * Math.PI * 2) / 3;
        c.fillRect(Math.round(80 + Math.cos(a) * 20), Math.round(10 + Math.sin(a) * 5), 2, 2);
      }
      text(c, "CHANCE!", 80, 50, colors.y);
    }
    // クセ：その がわに「！」と ちかづく グローブ。あたる しゅんかんは グローブが レーンを よこぎる
    if (b.state === "tell") {
      const next = b.lands.find((l) => !l.done);
      const prog = next ? Math.min(1, Math.max(0, (now - (next.at - b.tell)) / b.tell)) : 1;
      const x = b.show === "L" ? 8 : b.show === "R" ? 144 : 76;
      if (Math.floor(ms / 120) % 2) text(c, "!", x + 4, 52, colors.y);
      const size = 8 + Math.round(prog * 8);
      c.drawImage(sprites.glove, x + 4 - size / 2, 62, size, size);
    }
    const swing = has("swing");
    if (swing) {
      const t = (ms - swing.from) / 180;
      const xs = danger(swing.side).map((l) => LANE_RECT[l]);
      const from = Math.min(...xs.map((r) => r[0]));
      const to = Math.max(...xs.map((r) => r[1]));
      const gx = swing.side === "R" ? to - (to - from) * t : swing.side === "L" ? from + (to - from) * t : (from + to) / 2;
      c.drawImage(sprites.glove, Math.round(gx) - 8, swing.side === "C" ? 60 + t * 30 : 84, 16, 16);
    }
    // ピクセ
    const px = Math.round(b.px) + (b.hurt % 4 < 2 && b.hurt ? 2 : 0);
    const punching = ms < b.punch + 140;
    const py = PIXE_Y - (punching ? 8 : 0);
    if (!(b.over && !b.won)) c.drawImage(b.hurt ? sprites.blink : sprites.pixe, px - 16, py, 32, 32);
    else c.drawImage(sprites.blink, px - 16, py + 6, 32, 32);
    if (punching) c.drawImage(sprites.glove, px - 4, py - 10, 8, 8);
    // セコンド：左上の コーナー。拍で ゆれて、よけると はねる、なぐられると おどろく
    if (sprites.ally) {
      const hop = has("cheer") ? -3 : 0;
      const sx = 2;
      const sy = 4 + (phase < 0.25 ? -1 : 0) + hop;
      const block = has("block");
      const hold = has("hold");
      if (block) c.drawImage(sprites.ally, px - 16, PIXE_Y - 26, 32, 32); // ピクセの まえに とびこむ
      else if (hold) c.drawImage(sprites.ally, px - 12, PIXE_Y + 10, 24, 24);
      else if (b.state !== "combo") c.drawImage(sprites.ally, sx, sy, 20, 20);
      if (has("oops") && !block) text(c, "!", sx + 26, sy + 6, colors.p, "left");
      if (has("roar")) text(c, "GAO!", sx + 24, sy + 6, colors.y, "left");
      if (has("boo")) text(c, "BOO!", sx + 24, sy + 6, colors.w, "left");
    }
    // 合体わざ：画面が ひかって、セコンドが ボスへ とびこむ
    const cb = has("combo");
    if (cb) {
      const t = (ms - cb.from) / 1400;
      c.save();
      c.globalAlpha = Math.max(0, 0.5 - t);
      c.fillStyle = colors.y;
      c.fillRect(0, 0, W, H);
      c.restore();
      const k = Math.min(1, t * 2.5);
      if (sprites.ally) c.drawImage(sprites.ally, Math.round(2 + k * 62), Math.round(4 + Math.sin(k * Math.PI) * 30), 32, 32);
      if (t > 0.35) text(c, cb.text, 80, 40 - t * 10, colors.p);
      text(c, "COMBO!", 80, 76, colors.y);
    }
    // ダメージの かず
    for (const f of b.fx.filter((f) => f.kind === "num")) {
      const t = (ms - f.from) / 500;
      text(c, f.text, f.x, 44 - t * 14, f.big ? colors.y : colors.w);
    }
    // はじまりの カウント
    if (b.state === "intro") text(c, now < 3 ? String(3 - Math.floor(Math.max(0, now))) : "GO!", 80, 56, colors.w);
  }

  function text(c, str, x, y, color, align = "center") {
    c.font = '8px "Press Start 2P", monospace';
    c.textAlign = align;
    c.textBaseline = "top";
    c.fillStyle = colors.o;
    c.fillText(str, x + 1, y + 1);
    c.fillStyle = color;
    c.fillText(str, x, y);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    update();
    draw();
  }

  async function win() {
    b.over = true;
    b.won = true;
    const foe = b.boss;
    const first = !save.beaten.includes(foe.id);
    const exp = first ? foe.exp : Math.ceil(foe.exp / 2);
    sound.songPlay();
    sound.sfx.boom();
    setTimeout(() => sound.sfx.fanfare(), 400);
    const lines = [`ノックアウト！ ${foe.name}を たおした！`, `けいけんち ＋${exp}`];
    const lv = save.lv;
    const ups = gainExp(exp);
    if (ups) lines.push(`ピクセは LV ${lv + ups} に あがった！`);
    if (first) {
      save.beaten = BOSSES.map((k) => k.id).filter((id) => id === foe.id || save.beaten.includes(id));
      save.ally ??= foe.id;
      persist();
      lines.push(`${foe.name}が なかまに なりたそうに こちらを みている！`, `${foe.name}が なかまに なった！`);
      if (save.beaten.length === BOSSES.length) lines.push("ぜんぶの ボスを たおした！ おめでとう！");
    }
    emit("quest-win", { boss: foe.id, first, lv: save.lv });
    done(lines);
  }

  function lose() {
    b.over = true;
    b.won = false;
    sound.songPlay();
    sound.sfx.gameover();
    const exp = Math.max(1, Math.ceil(b.boss.exp / 4));
    const lv = save.lv;
    const ups = gainExp(exp);
    emit("quest-lose", { boss: b.boss.id });
    done(["ピクセは たおれた…", `でも けいけんは のこったよ。けいけんち ＋${exp}`, ...(ups ? [`ピクセは LV ${lv + ups} に あがった！`] : []), `${b.boss.name}の クセ、すこし みえて きたかな？`]);
  }

  // たたかいの あとは ボタンの かわりに けっかと「もどる」
  function done(lines) {
    b.log.push(...lines);
    battleEl.querySelector("#quest-call").innerHTML = "";
    const box = document.createElement("div");
    box.className = "quest-log";
    box.id = "quest-log";
    box.replaceChildren(...lines.map((t) => Object.assign(document.createElement("p"), { textContent: t })));
    const cmds = battleEl.querySelector("#quest-cmds");
    cmds.replaceWith(box);
    battleEl.querySelector(".quest-keys").remove();
    const back = Object.assign(document.createElement("button"), { type: "button", className: "quest-pad back", id: "quest-back" });
    back.innerHTML = "<b>もどる</b>";
    box.after(back);
    back.addEventListener("click", () => {
      cancelAnimationFrame(raf);
      b = null;
      sound.sfx.select();
      renderHome();
      homeEl.querySelector(".quest-boss.next, .quest-boss")?.focus();
    });
    back.focus();
  }

  // ---------- ひらく・とじる ----------
  let running = false;
  function open() {
    if (running) return;
    running = true;
    save = load();
    const diary = trainWhileAway();
    b = null;
    overlay.hidden = false;
    overlay.scrollTop = 0;
    document.body.classList.add("gaming");
    renderHome(diary);
    homeEl.querySelector(".quest-boss.next, .quest-boss")?.focus();
    emit("quest-open");
  }
  function close() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    if (b) sound.songPlay();
    b = null;
    overlay.hidden = true;
    document.body.classList.remove("gaming");
  }
  closeBtn.addEventListener("click", close);
  addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.key === "Escape") return close();
    if (!b || b.over || e.repeat) return;
    const cmd = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", " ": "punch", ArrowUp: "punch", z: "punch", Z: "punch" }[e.key];
    if (cmd) {
      e.preventDefault();
      act(cmd);
    }
  });
  addEventListener("resize", () => running && fitRing());
  document.addEventListener("visibilitychange", () => {
    // 裏に まわったら とめて、もどったら つづきから（時計を ずらす）
    if (!b || b.over) return;
    if (document.hidden) {
      b.pausedAt = clock();
      cancelAnimationFrame(raf);
    } else if (b.pausedAt) {
      b.t0 += clock() - b.pausedAt;
      if (b.comboEnd) b.comboEnd += clock() - b.pausedAt;
      b.pausedAt = 0;
      raf = requestAnimationFrame(frame);
    }
  });

  return {
    open,
    close,
    isOpen: () => running,
    save: () => structuredClone(save),
    battle: () => b,
    bosses: () => BOSSES.map((k) => k.id),
    art: (id) => bossById(id).art,
    act,
    beatNow: () => (b ? beatNow() : 0),
    danger: () => (b?.state === "tell" && b.show ? danger(b.show) : []),
  };
})();
