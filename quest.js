// ---------- 2 だいめ「PIXE QUEST」（v0.3） ----------
// ピクセを そだてる 台。じゅんばんに たたかう ので、はやい 指は いらない（50 代にも 子どもにも）。
// - 来なかった あいだも ピクセは しゅぎょう して いて、来ると すこし つよい（たまごっちの 逆で、こないことを せめない）
// - まけても けいけんちは のこる。たおした ボスは なかまに なって、1 たい つれて いける
// - ボスは 「つぎに なにを するか」を みせて くる（いきを すいこんだ → まもる、など）。よんで こたえる たのしさ
const quest = (() => {
  const KEY = "warpix-arcade-quest";
  const overlay = document.getElementById("quest");
  const homeEl = document.getElementById("quest-home");
  const battleEl = document.getElementById("quest-battle");
  const closeBtn = document.getElementById("quest-close");

  // ---------- ボス（16x16） ----------
  // pattern：ボスの こうどう。じゅんばんに くりかえす。say だけの ものは「つぎに なにか くる」の あいず
  const BOSSES = [
    {
      id: "purun",
      name: "プルン",
      hp: 20, atk: 4, def: 0, exp: 10,
      art: ["................", "................", "................", "................", "......cccc......", "....cccccccc....", "...ccwwccccccc..", "..ccwwcccccccc..", "..cccccccccccc..", ".ccccoccccocccc.", ".ccccoccccocccc.", ".cpcccccccccpcc.", ".ccccccoocccccc.", "cccccccccccccccc", ".cccccccccccccc.", "................"],
      pattern: ["hit", "hit", "wobble"],
      ally: { say: "プルンが ぷるぷる いやして くれた。", heal: 3 },
      allyNote: "まいターン HP を 3 かいふく",
    },
    {
      id: "obake",
      name: "オバケ",
      hp: 36, atk: 6, def: 1, exp: 20,
      art: ["................", "......wwww......", "....wwwwwwww....", "...wwwwwwwwww...", "..wwwwwwwwwwww..", "..wwoowwwwoowww.", "..wwoowwwwoowww.", "..wwwwwwwwwwwww.", ".wpwwwwoowwwwpw.", ".wwwwwwwwwwwwww.", "wwwwwwwwwwwwwww.", ".wwwwwwwwwwwwwww", "..wwwwwwwwwwwww.", "..wwwwwwwwwwwww.", "..ww.www.www.ww.", "...w..w...w...w."],
      pattern: ["hit", "fade", "hit", "hit"],
      ally: { say: "オバケが おどかした！", scare: 0.25 },
      allyNote: "ときどき あいてを ひるませる",
    },
    {
      id: "golem",
      name: "ゴーレム",
      hp: 55, atk: 8, def: 6, exp: 35,
      art: ["................", "....vvvvvvvv....", "...vvvvvvvvvv...", "...vvyyvvyyvv...", "...vvvvvvvvvv...", "...vvvooooovv...", "....vvvvvvvv....", ".vvvvvvvvvvvvvv.", "vvvvvvvvvvvvvvvv", "vvv.vvvvvvvv.vvv", "vvv.vvvvvvvv.vvv", "vv..vvvvvvvv..vv", "....vvvvvvvv....", "....vvv..vvv....", "...vvvv..vvvv...", "................"],
      pattern: ["hit", "raise", "smash"],
      ally: { def: 3 },
      allyNote: "まもりが 3 あがる",
    },
    {
      id: "hachi",
      name: "ハチ",
      hp: 60, atk: 7, def: 2, exp: 50,
      art: ["................", "....ww....ww....", "...wwww..wwww...", "...wwww..wwww...", "....ww....ww....", ".....yyyyyy.....", "....yyyyyyyy....", "...yoyyyyyyoy...", "...pyyyyyyyyp...", "...oooooooooo...", "...yyyyyyyyyy...", "...oooooooooo...", "....yyyyyyyy....", ".....yyyyyy.....", ".......oo.......", "................"],
      pattern: ["double", "hit", "buzz", "triple"],
      ally: { say: "ハチが ちくっと さした！", dmg: 3 },
      allyNote: "まいターン 3 の ダメージ",
    },
    {
      id: "doragon",
      name: "ドラゴン",
      hp: 90, atk: 10, def: 4, exp: 80,
      art: ["................", "..y..........y..", "..yy........yy..", "...pppppppppp...", "..pppppppppppp..", "..ppwoppppwopp..", "..pppppppppppp..", "..pppppopoppppp.", "...pppppppppp...", "..pppwwwwwwppp..", ".ppppwwwwwwpppp.", "pp.pwwwwwwwwp.pp", "...pwwwwwwwwp...", "...pppppppppp...", "...pp......pp...", "................"],
      pattern: ["hit", "inhale", "breath", "hit", "hit"],
      ally: { say: "ドラゴンが ひを ふいた！", dmg: 6, every: 2 },
      allyNote: "2 ターンごとに 6 の ダメージ",
    },
    {
      id: "maou",
      name: "まおう",
      hp: 130, atk: 12, def: 6, exp: 150,
      art: ["................", "....y.y..y.y....", "....yyyyyyyy....", "....yyyyyyyy....", "...wwwwwwwwww...", "..wwwwwwwwwwww..", "..wwoowwwwooww..", "..wwoowwwwooww..", "..wpwwwoowwwpw..", "...wwwwwwwwww...", ".vvvvvvvvvvvvvv.", "vvvvvvvvvvvvvvvv", "vvvvvyyyyyyvvvvv", "vvvvvvvvvvvvvvvv", ".vvvvvvvvvvvvvv.", "..vv........vv.."],
      pattern: ["hit", "fade", "hit", "raise", "smash", "inhale", "breath"],
      ally: { atk: 5 },
      allyNote: "ちからが 5 あがる",
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
  function stats() {
    const lv = save.lv;
    const ally = bossById(save.ally)?.ally ?? {};
    return { max: 20 + lv * 6, atk: 4 + lv * 2 + (ally.atk ?? 0), def: lv - 1 + (ally.def ?? 0) };
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
  const TRAINING = ["うでたて ふせを 100かい！", "やまみちを ランニング！", "たきに うたれて しゅぎょう！", "ほんを よんで おべんきょう！", "すぶりを 1000かい！", "ゆっくり ねて たいりょく かいふく！"];
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
          <p>HP ${s.max} ・ ちから ${s.atk} ・ まもり ${s.def}</p>
          <p class="quest-exp"><span class="quest-bar"><span style="width:${Math.round((100 * save.exp) / need(save.lv))}%"></span></span>つぎの LV まで ${need(save.lv) - save.exp}</p>
        </div>
      </div>
      ${diary ? `<p class="quest-diary"><b>ピクセの しゅぎょう にっき</b>${diary.hours}じかん、${diary.what}<br>けいけんち ＋${diary.exp}${diary.ups ? `　LV が ${diary.ups} あがった！` : ""}</p>` : ""}
      ${all ? `<p class="quest-diary"><b>ぜんぶの ボスを たおした！</b>また なんどでも たたかえるよ。</p>` : ""}
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
      <h2 class="quest-label">なかま <small>1たい つれて いける</small></h2>
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

  // ---------- たたかい ----------
  let b = null; // いまの たたかい
  let speed = 650; // メッセージ 1 ぎょうの ま（テストでは みじかく する）
  let skip = false;

  const CMDS = [
    { id: "attack", label: "こうげき", note: "ちからで たたく" },
    { id: "charge", label: "ためる", note: "つぎの こうげき 2.5ばい" },
    { id: "guard", label: "まもる", note: "ダメージ 4ぶんの1" },
    { id: "herb", label: "やくそう", note: "HP はんぶん かいふく" },
  ];

  function fight(id) {
    const boss = bossById(id);
    const s = stats();
    b = { boss, hp: boss.hp, step: 0, turn: 0, me: { hp: s.max, ...s }, herbs: 3, charged: false, faded: false, busy: false, over: false, log: [] };
    sound.sfx.coin();
    battleEl.innerHTML = `
      <div class="quest-foe">
        <span class="quest-foe-art" id="quest-foe-art">${pixelSvg(boss.art)}</span>
        <p class="quest-foe-name">${boss.name}</p>
        <span class="quest-bar foe"><span id="quest-foe-hp"></span></span>
      </div>
      <div class="quest-side">
        <span class="quest-mini" id="quest-me-art">${pixelSvg(NPC.idle)}</span>
        <div class="quest-me-hp"><p>ピクセ LV ${save.lv}　<span id="quest-me-num"></span></p><span class="quest-bar"><span id="quest-me-hp"></span></span></div>
        ${save.ally ? `<span class="quest-mini ally" title="なかま">${pixelSvg(bossById(save.ally).art)}</span>` : ""}
      </div>
      <div class="quest-log" id="quest-log" aria-live="polite"></div>
      <div class="quest-cmds" id="quest-cmds">
        ${CMDS.map((c) => `<button class="quest-cmd" type="button" data-cmd="${c.id}"><b>${c.label}</b><small>${c.note}</small></button>`).join("")}
      </div>
    `;
    homeEl.hidden = true;
    battleEl.hidden = false;
    battleEl.querySelector("#quest-log").addEventListener("click", () => (skip = true));
    for (const btn of battleEl.querySelectorAll("[data-cmd]")) btn.addEventListener("click", () => turn(btn.dataset.cmd));
    refresh();
    say([`${boss.name}が あらわれた！`, ...(save.ally ? [`なかまの ${bossById(save.ally).name}も いっしょだ。`] : [])]).then(() => battleEl.querySelector("[data-cmd]")?.focus());
  }

  function refresh() {
    const $ = (id) => battleEl.querySelector(`#${id}`);
    $("quest-foe-hp").style.width = `${Math.max(0, (100 * b.hp) / b.boss.hp)}%`;
    $("quest-me-hp").style.width = `${Math.max(0, (100 * b.me.hp) / b.me.max)}%`;
    $("quest-me-hp").classList.toggle("low", b.me.hp <= b.me.max / 4);
    $("quest-me-num").textContent = `HP ${Math.max(0, b.me.hp)}/${b.me.max}`;
    const herb = battleEl.querySelector('[data-cmd="herb"] b');
    herb.textContent = `やくそう ×${b.herbs}`;
    for (const btn of battleEl.querySelectorAll("[data-cmd]")) btn.disabled = b.busy || b.over || (btn.dataset.cmd === "herb" && !b.herbs);
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // 1 ぎょうずつ だす（タップで とばせる）。のこすのは さいごの 3 ぎょう
  async function say(lines) {
    const logEl = battleEl.querySelector("#quest-log");
    for (const line of lines) {
      if (typeof line === "function") {
        line();
        refresh();
        continue;
      }
      b.log.push(line);
      logEl.replaceChildren(...b.log.slice(-3).map((t) => Object.assign(document.createElement("p"), { textContent: t })));
      sound.sfx.text();
      if (!skip) await wait(speed);
    }
    skip = false;
  }

  function shake(id) {
    const el = battleEl.querySelector(`#${id}`);
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  }

  const rnd = (n) => Math.floor(Math.random() * (n + 1));

  async function turn(cmd) {
    if (!b || b.busy || b.over) return;
    b.busy = true;
    b.turn++;
    refresh();
    const lines = [];
    const foe = b.boss;
    // ピクセの ばん
    if (cmd === "attack") {
      if (b.faded && !b.charged) {
        lines.push("ピクセの こうげき！", `しかし ${foe.name}を すりぬけた！`);
      } else {
        const dmg = Math.max(1, Math.round(b.me.atk * (b.charged ? 2.5 : 1)) - foe.def + rnd(2));
        lines.push(b.charged ? "ピクセの ためた いちげき！" : "ピクセの こうげき！", () => { b.hp -= dmg; shake("quest-foe-art"); sound.sfx.hit(); }, `${foe.name}に ${dmg}の ダメージ！`);
      }
      b.charged = false;
    } else if (cmd === "charge") {
      lines.push(b.charged ? "ピクセは もう ちからを ためて いる。" : "ピクセは ちからを ためた！");
      b.charged = true;
    } else if (cmd === "guard") {
      lines.push("ピクセは みを まもって いる。");
    } else if (cmd === "herb") {
      const heal = Math.min(b.me.max - b.me.hp, Math.ceil(b.me.max / 2));
      b.herbs--;
      lines.push("ピクセは やくそうを たべた。", () => { b.me.hp += heal; sound.sfx.powerup(); }, `HP が ${heal} かいふく した。`);
    }
    b.faded = false;
    // なかまの ばん
    const ally = bossById(save.ally)?.ally;
    if (ally?.heal) lines.push(() => (b.me.hp = Math.min(b.me.max, b.me.hp + ally.heal)), `${ally.say} HP ＋${ally.heal}`);
    if (ally?.dmg && b.turn % (ally.every ?? 1) === 0) lines.push(() => { b.hp -= ally.dmg; shake("quest-foe-art"); }, `${ally.say} ${ally.dmg}の ダメージ！`);
    await say(lines);
    if (b.hp <= 0) return win();

    // ボスの ばん
    const act = foe.pattern[b.step++ % foe.pattern.length];
    const guard = cmd === "guard";
    const blow = (mult, label) => {
      const raw = Math.max(1, Math.round(foe.atk * mult) - b.me.def + rnd(1));
      const dmg = guard ? Math.max(1, Math.round(raw / 4)) : raw;
      return [label, () => { b.me.hp -= dmg; shake("quest-me-art"); sound.sfx.damage(); }, `ピクセは ${dmg}の ダメージ${guard ? "（まもった！）" : "！"}`];
    };
    const out = [];
    if (ally?.scare && ["hit", "double", "triple", "smash", "breath"].includes(act) && Math.random() < ally.scare) {
      out.push(ally.say, `${foe.name}は ひるんで うごけない！`);
    } else if (act === "hit") out.push(...blow(1, `${foe.name}の こうげき！`));
    else if (act === "double") out.push(`${foe.name}の れんぞく こうげき！`, ...blow(0.6, "1かいめ！").slice(1), ...blow(0.6, "2かいめ！").slice(1));
    else if (act === "triple") out.push(`${foe.name}の ブンブン こうげき！`, ...[0, 1, 2].flatMap(() => blow(0.6, "").slice(1)));
    else if (act === "wobble") out.push(`${foe.name}は ぷるぷる ふるえて いる。`);
    else if (act === "fade") out.push(`${foe.name}の すがたが すうっと うすく なった…`), (b.faded = true);
    else if (act === "raise") out.push(`${foe.name}は うでを おおきく ふりあげた！`);
    else if (act === "smash") out.push(...blow(3, `${foe.name}の おおきな いちげき！`));
    else if (act === "buzz") out.push(`${foe.name}は はねを ブンブン ならして いる…`);
    else if (act === "inhale") out.push(`${foe.name}は おおきく いきを すいこんだ…`);
    else if (act === "breath") out.push(...blow(3.5, `${foe.name}は ほのおを はいた！`));
    await say(out);
    if (b.me.hp <= 0) return lose();
    b.busy = false;
    refresh();
    battleEl.querySelector(`[data-cmd="${cmd}"]:not(:disabled)`)?.focus();
  }

  async function win() {
    b.over = true;
    const foe = b.boss;
    const first = !save.beaten.includes(foe.id);
    const exp = first ? foe.exp : Math.ceil(foe.exp / 2);
    battleEl.querySelector("#quest-foe-art").classList.add("down");
    sound.sfx.fanfare();
    const lines = [`${foe.name}を たおした！`, `けいけんち ＋${exp}`];
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
    await say(lines);
    done();
  }

  async function lose() {
    b.over = true;
    const exp = Math.max(1, Math.ceil(b.boss.exp / 4));
    battleEl.querySelector("#quest-me-art").classList.add("down");
    sound.sfx.gameover();
    const lv = save.lv;
    const ups = gainExp(exp);
    emit("quest-lose", { boss: b.boss.id });
    await say(["ピクセは たおれた…", `でも けいけんは のこったよ。けいけんち ＋${exp}`, ...(ups ? [`ピクセは LV ${lv + ups} に あがった！`] : []), "また ちょうせん しよう。"]);
    done();
  }

  // たたかいの あとは コマンドの かわりに「もどる」
  function done() {
    const cmds = battleEl.querySelector("#quest-cmds");
    cmds.innerHTML = `<button class="quest-cmd back" type="button" id="quest-back"><b>もどる</b></button>`;
    const back = cmds.querySelector("#quest-back");
    back.addEventListener("click", () => {
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
    document.body.classList.add("gaming");
    renderHome(diary);
    homeEl.querySelector(".quest-boss.next, .quest-boss")?.focus();
    emit("quest-open");
  }
  function close() {
    if (!running) return;
    running = false;
    b = null;
    overlay.hidden = true;
    document.body.classList.remove("gaming");
  }
  closeBtn.addEventListener("click", close);
  addEventListener("keydown", (e) => {
    if (running && e.key === "Escape") close();
  });

  return {
    open,
    close,
    isOpen: () => running,
    save: () => structuredClone(save),
    battle: () => b,
    bosses: () => BOSSES.map((k) => k.id),
    art: (id) => bossById(id).art,
    setSpeed: (ms) => (speed = ms),
  };
})();
