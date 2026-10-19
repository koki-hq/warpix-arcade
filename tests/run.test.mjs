// 3 だいめ PIXE RUN：はしって とんで はたに タッチ。ゲームオーバーは なく、とちゅうの はたから。TIME ATTACK は ゴーストと 区間タイム
const T = 8;
const GROUND = 15;

// ページの なかで うごく かんたんな ロボット：みぎへ はしり、まえが かべ・あな なら ジャンプ
const BOT = `(() => {
  const press = (key, type) => dispatchEvent(new KeyboardEvent(type, { key }));
  press("ArrowRight", "keydown");
  let hold = 0;
  window.__bot = setInterval(() => {
    const s = run.state();
    if (!s || s.phase !== "play") return;
    press("ArrowRight", "keydown"); // ミスの あとは はなされて いる
    const p = s.p;
    const g = s.lv.g;
    const tx = Math.floor((p.x + 4) / 8);
    const ty = Math.floor((p.y + 4) / 8);
    const solid = (x, y) => "#BU?TPW".includes(g[y]?.[x] ?? ".");
    const wall = solid(tx + 1, ty) || solid(tx + 2, ty);
    const hole = !solid(tx + 1, ty + 1) || !solid(tx + 2, ty + 1);
    if (hold > 0 && --hold === 0) press(" ", "keyup");
    if (p.ground && hold === 0 && (wall || hole)) { press(" ", "keydown"); hold = 20; }
  }, 16);
})()`;

export default {
  async "台を おすと GAME A・B・TIME。はしる・とぶ・？ブロック・ふむ・おちたら はたから・ゴールで つぎへ"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    t.eq(await p.ev(`[...document.querySelectorAll('[data-cab="run"] .cab-hi span')].map((s) => s.textContent)`), ["TIME --:--.--", "CLEAR 0"], "台の HI");
    await p.click('[data-cab="run"]');
    await t.sleep(400);
    t.ok(await p.ev(`run.isOpen() && run.state().phase === "title" && !document.getElementById("run-modes").hidden`), "タイトルに ならない");
    t.eq(await p.ev(`[...document.querySelectorAll("#run-modes [data-mode]")].map((b) => b.dataset.mode)`), ["a", "b", "ta"], "モード");
    await p.shot("run-title.png");
    await p.key("Enter");
    await t.sleep(1800);
    t.ok(await p.ev(`run.state().phase === "play" && run.state().mode === "a" && run.state().stage === 0`), "1-1 が はじまらない");
    // はしる
    const x0 = await p.ev(`run.state().p.x`);
    await p.key("ArrowRight", "down");
    await t.sleep(800);
    await p.key("ArrowRight", "up");
    t.ok((await p.ev(`run.state().p.x`)) > x0 + 30, "はしらない");
    // とぶ（上に ブロックの ない ところで）
    await p.ev(`(() => { const s = run.state(); s.p.x = 4 * ${T}; s.p.vx = 0; })()`);
    await t.sleep(200);
    await p.key(" ", "down");
    await t.sleep(150);
    t.ok(await p.ev(`run.state().p.vy < 0 && !run.state().p.ground`), "とばない");
    await p.key(" ", "up");
    await t.sleep(800);
    t.ok(await p.ev(`run.state().p.ground`), "おりて こない");
    // ？ブロックの 下で ジャンプ → コイン
    await p.ev(`(() => { const s = run.state(); s.p.x = 10 * ${T}; s.p.vx = 0; })()`);
    await t.sleep(100);
    await p.key(" ", "down");
    await t.sleep(500);
    await p.key(" ", "up");
    t.eq(await p.ev(`run.state().lv.g[11][10]`), "U", "？ブロックが かわらない");
    t.ok((await p.ev(`run.state().coins`)) >= 1, "コインが ふえない");
    await p.shot("run-play.png");
    // 敵を ふむ
    await p.ev(`(() => { const s = run.state(); const e = s.enemies[0]; s.p.x = e.x; s.p.y = e.y - 10; s.p.vy = 2; })()`);
    await t.sleep(200);
    t.ok(await p.ev(`run.state().enemies[0].dead > 0`), "ふめない");
    // おちる → さいごの はたから
    await p.ev(`(() => { const s = run.state(); s.check = 74; s.p.x = 40 * ${T}; s.p.y = 160; })()`);
    await t.sleep(200);
    t.eq(await p.ev(`run.state().phase`), "miss", "おちても ミスに ならない");
    await t.sleep(1200);
    t.ok(await p.ev(`run.state().phase === "play" && Math.abs(run.state().p.x - 74 * ${T}) < 4 && run.state().misses === 1`), "はたから はじまらない");
    // ゴール → 1-2
    await p.ev(`(() => { const s = run.state(); s.p.x = s.lv.goal * ${T} - 2; })()`);
    await t.sleep(300);
    t.eq(await p.ev(`run.state().phase`), "clear", "ゴールしない");
    await p.shot("run-clear.png");
    await t.sleep(3000);
    t.ok(await p.ev(`run.state().stage === 1`), "1-2 に すすまない");
    // 1-2 の ひみつの 土管：上で ↓
    await t.sleep(1600);
    await p.ev(`(() => { const s = run.state(); s.p.x = 22 * ${T} + 4; s.p.y = (${GROUND} - 4) * ${T}; s.p.vy = 0; })()`);
    await t.sleep(200);
    await p.key("ArrowDown", "down");
    await t.sleep(200);
    await p.key("ArrowDown", "up");
    t.ok((await p.ev(`run.state().p.x`)) >= 104 * T, `ワープ しない: ${await p.ev(`run.state().p.x`)}`);
    await p.key("Escape");
    t.ok(await p.ev(`!run.isOpen()`), "Esc で とじない");
    t.noErrors(p);
    await server.close();
  },

  async "どの ステージも ゴールまで いける（敵なしで ロボットが はしる）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    const stages = await p.ev(`run.stages()`);
    for (let i = 0; i < stages.length; i++) {
      await p.ev(`run.open({ mode: "b", stage: ${i} }); run.state().enemies = [];`);
      await p.ev(BOT);
      let ok = false;
      for (let k = 0; k < 120 && !ok; k++) {
        await t.sleep(250);
        ok = (await p.ev(`["clear", "done"].includes(run.state().phase) || run.state().stage !== ${i}`)) === true;
      }
      t.ok(ok, `${stages[i]} を ロボットが クリア できない（x=${await p.ev(`Math.round(run.state().p.x / 8)`)}, ミス ${await p.ev(`run.state().misses`)}）`);
      await p.ev(`clearInterval(window.__bot); dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight" })); dispatchEvent(new KeyboardEvent("keyup", { key: " " }))`);
      await p.key("Escape");
    }
    t.noErrors(p);
    await server.close();
  },

  async "TIME ATTACK：区間タイムと ベスト、つぎは ゴーストが はしる。ぜんぶ クリアで 台と ピクセに でる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.click('[data-cab="run"]');
    await t.sleep(300);
    await p.click('[data-mode="ta"]');
    await t.sleep(1800);
    // 4 つの ステージを ワープで おわらせる（すこし はしってから ゴールへ）
    for (let i = 0; i < 4; i++) {
      await p.key("ArrowRight", "down");
      await t.sleep(600);
      await p.key("ArrowRight", "up");
      await p.ev(`(() => { const s = run.state(); s.p.x = s.lv.goal * ${T} - 2; })()`);
      await t.sleep(i < 3 ? 4400 : 3000);
    }
    t.eq(await p.ev(`run.state().phase`), "done", "ぜんぶ クリアに ならない");
    const save = await p.ev(`run.save()`);
    t.ok(save.best > 0 && save.clears === 1 && save.splits.every((f) => f > 0) && save.ghosts.every((g) => g?.length > 0), `きろく: ${JSON.stringify({ ...save, ghosts: save.ghosts.map((g) => g?.length) })}`);
    t.ok(await p.ev(`run.state().newBest`), "はじめてなのに NEW RECORD に ならない");
    await p.shot("run-done.png");
    t.ok(await p.ev(`!document.getElementById("run-modes").hidden`), "おわっても ボタンが でない");
    // もう いちど：ゴーストが いる
    await p.click('[data-mode="ta"]');
    await t.sleep(1900);
    t.ok(await p.ev(`Array.isArray(run.state().ghost) && run.state().ghost.length > 0`), "ゴーストが いない");
    await p.key("Escape");
    await t.sleep(300);
    t.eq(await p.ev(`document.querySelector('[data-cab="run"] .cab-hi span').textContent`), `TIME ${await p.ev(`run.fmt(run.save().best)`)}`, "台の TIME");
    t.noErrors(p);
    await server.close();
  },

  async "スマホ：◀ ▶ JUMP の ボタンで あそべる、はみでない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser({ width: 390, height: 844 });
    const p = await b.firstPage();
    await p.size(390, 844, true);
    await p.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.click('[data-cab="run"]');
    await t.sleep(400);
    const inside = (sel) => p.ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].every((el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= 390 && r.bottom <= 844; })`);
    t.ok(await inside("#run-modes button"), "モードの ボタンが はみでる");
    // ゆびで GAME A を タップ
    const a = await p.ev(`(() => { const r = document.querySelector('#run-modes [data-mode="a"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [a] });
    await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await t.sleep(1800);
    t.ok(await p.ev(`getComputedStyle(document.getElementById("run-pad")).display !== "none"`), `スマホで ボタンが でない: ${await p.ev(`[document.getElementById("run").className, document.getElementById("run-pad").hidden, run.state().phase]`)}`);
    t.ok(await inside("#run-canvas, #run-pad button"), "画面か ボタンが はみでる");
    const x0 = await p.ev(`run.state().p.x`);
    const r = await p.ev(`(() => { const r = document.querySelector('[data-key="right"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r.x, y: r.y }] });
    await t.sleep(700);
    await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    t.ok((await p.ev(`run.state().p.x`)) > x0 + 20, "▶ で はしらない");
    const j = await p.ev(`(() => { const r = document.querySelector('[data-key="jump"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: j.x, y: j.y }] });
    await t.sleep(120);
    t.ok(await p.ev(`!run.state().p.ground`), "JUMP で とばない");
    await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await p.shot("run-phone.png");
    t.noErrors(p);
    await server.close();
  },
};
