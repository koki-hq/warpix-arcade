// ---------- ゲームセンターの フロア：PRESS START・受付の ピクセ・台の ならび（v0.1） ----------
// 台は すこしずつ 入荷する。まだ ない 台は 布を かぶせて「COMING SOON」

// 台の 画面に うつる えと、まだ ない 台の「？」
const INVADER_FRAMES = [
  ["..cccc..", ".cccccc.", "wwwwwwww", "wpwwwwpw", ".wwwwww.", ".w....w."],
  ["..cccc..", ".cccccc.", "wwwwwwww", "wwpwwpww", ".wwwwww.", "w......w"],
];
const QUESTION = [".www.", "w...w", "...w.", "..w..", ".....", "..w.."];
const STICK = [
  "......oo........",
  ".....owwo..pp.cc",
  "......oo...pp.cc",
  "......oo........",
];

const hall = (() => {
  const startScreen = document.getElementById("start-screen");
  const startBtn = document.getElementById("start-btn");
  const sprite = document.getElementById("npc");
  const body = sprite.querySelector(".npc-body");
  const box = document.getElementById("dialog");
  const textEl = document.getElementById("dialog-text");
  const floor = document.getElementById("floor");
  const bgmBtn = document.getElementById("bgm-toggle");
  const BGM_KEY = "warpix-arcade-bgm";
  const VISITS_KEY = "warpix-arcade-visits";
  const SEEN_KEY = "warpix-arcade-seen"; // 見た ことの ある 台（入荷の おしらせ用）

  // ---------- 受付の ピクセ ----------
  body.innerHTML = pixelSvg(NPC.idle);
  let blinkTimer = 0;
  function blink() {
    body.innerHTML = pixelSvg(NPC.blink);
    setTimeout(() => (body.innerHTML = pixelSvg(NPC.idle)), 160);
    blinkTimer = setTimeout(blink, 2500 + Math.random() * 3000);
  }

  // RPG の メッセージウィンドウ：1 文字ずつ。▼ が でたら タップで つぎへ
  const queue = [];
  let typing = 0;
  let line = "";
  function say(lines) {
    queue.push(...lines);
    if (!typing && !box.classList.contains("more")) next();
  }
  function next() {
    box.classList.remove("more");
    if (!queue.length) return;
    line = queue.shift();
    if (reduceMotion) return finish();
    let i = 0;
    textEl.textContent = "";
    clearInterval(typing);
    typing = setInterval(() => {
      textEl.textContent = line.slice(0, ++i);
      if (i % 2) sound.sfx.text();
      if (i >= line.length) finish();
    }, 35);
  }
  function finish() {
    clearInterval(typing);
    typing = 0;
    textEl.textContent = line;
    box.classList.toggle("more", queue.length > 0);
  }
  // いま いって いる ことを やめて、すぐに いう
  function interrupt(lines) {
    queue.length = 0;
    clearInterval(typing);
    typing = 0;
    box.classList.remove("more");
    say(lines);
  }
  box.addEventListener("click", () => (typing ? finish() : next()));
  const ready = () => !typing && !queue.length;

  function jump() {
    sprite.classList.remove("jump");
    void sprite.offsetWidth;
    sprite.classList.add("jump");
  }

  const CHATTER = [
    "コインは いらないよ。\nぜんぶ ただで あそべるんだ。",
    "あたらしい だいが はいったら\nここで おしらせ するね。",
    "インベーダーは ドラッグで\nうごかすと らくちん。",
    "GAME B は はやいよ。\nうでに じしんが あったら どうぞ。",
    "インベーダーの ボスは 4たい。\nぜんぶに あえたかな？",
    "PIXE QUEST の ぼくは、きみが\nいない あいだも しゅぎょう してるよ。",
    "ボスが「いきを すいこんだ」ら、\nまもると いいよ。",
    "ハイスコアを だしたら\nなまえを 3もじ きざめるよ。",
    "となりの へやには リンク集も\nあるよ。したの ボタンから いける。",
    "ここは WARPIX製作所の\nゲームセンター。ゆっくり していってね。",
  ];
  let chat = 0;
  sprite.addEventListener("click", () => {
    jump();
    sound.sfx.hover();
    if (ready()) interrupt([CHATTER[chat++ % CHATTER.length]]);
  });

  // ---------- 台 ----------
  // 台の 画面に うつる 2 コマ（2 コマめは 1 マス 下に ずらして ぴょこぴょこ）
  const bounce = (art) => [art, ["".padEnd(art[0].length, "."), ...art.slice(0, -1)]];
  const hiOf = (m = "a") => invaders.ranking(m)[0] ?? null;
  // hi：看板の 下の 2 ぎょう。インベーダーは GAME A・B の いちばん（「A 001234 KOY」、まだ ない ときは「B ------」）
  const CABINETS = [
    {
      id: "invaders",
      name: "PIXE INVADERS",
      open: () => invaders.open(),
      frames: INVADER_FRAMES,
      hi: () => ["a", "b"].map((m) => `${m.toUpperCase()} ${hiOf(m) ? `${String(hiOf(m).s).padStart(6, "0")} ${hiOf(m).n}` : "------"}`),
    },
    {
      id: "quest",
      name: "PIXE QUEST",
      open: () => quest.open(),
      frames: bounce(quest.art("purun")),
      hi: () => {
        const s = quest.save();
        return [`PIXE LV ${s.lv}`, `BOSS ${s.beaten.length}/${quest.bosses().length}`];
      },
    },
    { id: "soon-2", soon: true },
    { id: "soon-3", soon: true },
  ];

  for (const cab of CABINETS) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `cab${cab.soon ? " soon" : ""}`;
    el.dataset.cab = cab.id;
    if (cab.soon) {
      el.setAttribute("aria-label", "まだ ない 台（にゅうか まち）");
      el.innerHTML = `<span class="cab-marquee">COMING SOON</span><span class="cab-screen">${pixelSvg(QUESTION)}</span><span class="cab-panel">${pixelSvg(STICK)}</span><span class="cab-hi">にゅうか まち</span>`;
      el.addEventListener("click", () => {
        jump();
        sound.sfx.hover();
        interrupt(["その だいは まだ ないしょ。\nにゅうかを おたのしみに！"]);
      });
    } else {
      el.setAttribute("aria-label", `${cab.name} で あそぶ`);
      el.innerHTML = `<span class="cab-marquee">${cab.name}</span><span class="cab-screen"><span class="cab-frame a">${pixelSvg(cab.frames[0])}</span><span class="cab-frame b">${pixelSvg(cab.frames[1])}</span></span><span class="cab-panel">${pixelSvg(STICK)}</span><span class="cab-hi"></span>`;
      el.addEventListener("click", () => {
        sound.sfx.coin();
        cab.open();
      });
    }
    floor.append(el);
  }
  function refreshHi() {
    for (const cab of CABINETS) {
      if (cab.soon) continue;
      const el = floor.querySelector(`[data-cab="${cab.id}"] .cab-hi`);
      el.replaceChildren(...cab.hi().map((t) => Object.assign(document.createElement("span"), { textContent: t })));
    }
  }
  refreshHi();

  // あそび おわったら、ピクセが ひとこと（ゲームの 画面が とじてから）
  let result = null;
  let bosses = 0;
  on("game-start", () => (bosses = 0));
  on("game-boss", () => bosses++);
  on("game-over", ({ score: s, mode }) => (result = { score: s, rank: 0, mode, bosses }));
  on("game-rank", ({ rank }) => result && (result.rank = rank));
  const overlay = document.getElementById("game");
  new MutationObserver(() => {
    if (!overlay.hidden) return;
    refreshHi();
    if (!result) return;
    const { score: s, rank, mode, bosses: n } = result;
    result = null;
    jump();
    const game = mode === "b" ? "GAME B" : "GAME A";
    if (rank === 1) interrupt([`すごい！ ${game}の\nハイスコア こうしん！ ${s}てん！`, "なまえが いちばん うえに\nのったよ。"]);
    else if (rank) interrupt([`${game}の ランキング ${rank}いに\nなまえが のったね！`, "つぎは いちばん うえを\nめざそう。"]);
    else if (n) interrupt([`おつかれさま！ ボスを\n${n}たい たおしたね。`, `${s}てん。また いつでも どうぞ。`]);
    else interrupt([`おつかれさま！\n${s}てん だったね。`, "もう いっかい あそぶ？"]);
  }).observe(overlay, { attributes: true, attributeFilter: ["hidden"] });

  // PIXE QUEST から もどったら、たおした ボスの はなし
  let wins = [];
  on("quest-open", () => (wins = []));
  on("quest-win", ({ boss, first }) => first && wins.push(boss));
  const questEl = document.getElementById("quest");
  new MutationObserver(() => {
    if (!questEl.hidden) return;
    refreshHi();
    if (!wins.length) return;
    jump();
    const s = quest.save();
    interrupt(["おかえり！ あたらしい なかまが\nできたね。", s.beaten.length === quest.bosses().length ? "ぜんぶの ボスを たおすなんて、\nほんとうに すごい！" : `ピクセは いま LV ${s.lv}。\nつぎの ボスも まってるよ。`]);
    wins = [];
  }).observe(questEl, { attributes: true, attributeFilter: ["hidden"] });

  // ---------- BGM ----------
  let bgmOn = store.get(BGM_KEY, true) !== false;
  function showBgm() {
    bgmBtn.textContent = bgmOn ? "BGM ON" : "BGM OFF";
    bgmBtn.setAttribute("aria-pressed", String(bgmOn));
  }
  showBgm();
  bgmBtn.addEventListener("click", () => {
    bgmOn = !bgmOn;
    store.set(BGM_KEY, bgmOn);
    showBgm();
    if (bgmOn) sound.bgmPlay();
    else sound.bgmStop();
  });

  // ---------- PRESS START ----------
  let started = false;
  function start() {
    if (started) return;
    started = true;
    sound.sfx.coin();
    setTimeout(() => sound.sfx.start(), 180);
    if (bgmOn) sound.bgmPlay(0.9);
    startScreen.classList.add("leaving");
    setTimeout(() => {
      startScreen.hidden = true;
      document.body.classList.add("booted");
      greet();
      blinkTimer = setTimeout(blink, 2000);
    }, reduceMotion ? 0 : 450);
  }
  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    start();
  });
  startScreen.addEventListener("click", start);
  addEventListener("keydown", (e) => {
    if (!started && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      start();
    }
  });

  // 入荷の おしらせ：まえに 来た ときに なかった 台を ピクセが しょうかい する
  const NEW = { quest: "あたらしい だい「PIXE QUEST」が\nはいったよ！ ぼくを そだてる ゲーム。" };
  function greet() {
    const visits = (Number(store.get(VISITS_KEY, 0)) || 0) + 1;
    store.set(VISITS_KEY, visits);
    const ids = CABINETS.filter((c) => !c.soon).map((c) => c.id);
    // v0.2 までに 来た 人は SEEN_KEY が ない → インベーダーだけ 見た ことに する
    const seen = [store.get(SEEN_KEY, visits === 1 ? ids : ["invaders"])].flat();
    store.set(SEEN_KEY, ids);
    const fresh = ids.filter((id) => !seen.includes(id) && NEW[id]).map((id) => NEW[id]);
    const top = hiOf();
    if (visits === 1) {
      say(["いらっしゃい！ ここは\nピクセの ゲームセンター。", `いまは ${ids.length}だい。\nこれから すこしずつ ふえるよ。`, "すきな だいで あそんでってね！"]);
    } else {
      say(["おかえり！ きょうも\nあそんでく？", ...fresh, ...(!fresh.length && top ? [`PIXE INVADERS の ハイスコアは\n${top.s}てん。こえられるかな？`] : [])]);
    }
  }

  // ---------- このページについて ----------
  const about = document.getElementById("about");
  document.getElementById("about-btn").addEventListener("click", () => about.showModal());
  document.getElementById("about-close").addEventListener("click", () => about.close());
  about.addEventListener("click", (e) => e.target === about && about.close());

  // ---------- オフラインでも あそべる ように ----------
  if ("serviceWorker" in navigator && !window.WARPIX_NO_SW) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  return { say, ready, start, cabinets: () => CABINETS.map((c) => c.id) };
})();
