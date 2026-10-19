// 1 だいめ PIXE INVADERS：台を おすと GAME A・B を えらんで はじまり、ランキングに なまえを きざみ、台の HI と ピクセの ひとことに なる
export default {
  async "台を おすと GAME A・B を えらぶ。ハイスコアに なまえを きざむと、台の HI に でて ピクセが ほめる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    t.eq(await p.ev(`[...document.querySelectorAll('[data-cab="invaders"] .cab-hi span')].map((s) => s.textContent)`), ["A ------", "B ------"], "台の HI（まだ なし）");
    await p.click('[data-cab="invaders"]');
    await t.sleep(500);
    t.ok(await p.ev(`invaders.isOpen() && !document.getElementById("game").hidden && document.body.classList.contains("gaming")`), "ゲームが ひらかない");
    t.eq(await p.ev(`invaders.state().phase`), "title", "タイトルから はじまらない");
    t.ok(await p.ev(`!document.getElementById("game-modes").hidden && document.activeElement.dataset.mode === "a"`), "GAME A・B の ボタンが でない");
    t.ok((await p.ev(`document.getElementById("game-cheer-text").textContent`)).includes("GAME B は はやい"), "ピクセが せつめい しない");
    await t.sleep(400);
    await p.shot("invaders-title.png");
    await p.click('[data-mode="a"]');
    await t.sleep(300);
    t.ok(await p.ev(`invaders.state().phase === "ready" && invaders.state().mode === "a" && document.getElementById("game-modes").hidden`), "GAME A が はじまらない");
    await t.sleep(1500);
    await p.shot("invaders-play.png");
    // 自機の 真上に 弾を おいて、ゲームオーバーに する
    const lose = async (score) => {
      await p.ev(`(() => { const s = invaders.state(); s.score = ${score}; s.lives = 1; s.inv = 0; s.ebullets.push({ x: s.px + 4, y: 120, v: 1 }); })()`);
      await t.sleep(800);
    };
    await lose(1234);
    t.eq(await p.ev(`invaders.state().phase`), "entry", "なまえ いれに ならない");
    await p.key("K");
    await p.key("O");
    await p.key("Y");
    await p.key("Enter");
    await t.sleep(300);
    t.eq(await p.ev(`invaders.ranking("a")`), [{ n: "KOY", s: 1234, w: 1 }], "ランキング");
    t.eq(await p.ev(`invaders.ranking("b")`), [], "GAME B の ランキングに まざった");
    await t.sleep(600);
    t.ok(await p.ev(`!document.getElementById("game-modes").hidden`), "ゲームオーバーの あとに ボタンが でない");
    await p.key("Escape");
    await t.sleep(300);
    t.ok(await p.ev(`!invaders.isOpen() && document.getElementById("game").hidden && !document.body.classList.contains("gaming")`), "Esc で とじない");
    t.eq(await p.ev(`[...document.querySelectorAll('[data-cab="invaders"] .cab-hi span')].map((s) => s.textContent)`), ["A 001234 KOY", "B ------"], "台の HI");
    await t.sleep(1500);
    t.ok((await p.text()).includes("ハイスコア こうしん"), `ピクセが ほめない: ${await p.text()}`);

    // 2 かいめ：キーボードだけで GAME A（Enter）→ ランキング 2 い
    await p.click('[data-cab="invaders"]');
    await t.sleep(300);
    await p.key("Enter");
    await t.sleep(2000);
    t.eq(await p.ev(`invaders.state().phase`), "play", "Enter で はじまらない");
    await lose(500);
    for (let i = 0; i < 4; i++) await p.key("Enter");
    await t.sleep(300);
    await p.click("#game-close");
    await t.sleep(1500);
    t.ok((await p.text()).includes("2いに"), `ランキング 2 い と いわない: ${await p.text()}`);

    // 3 かいめ：タイトルで とじたら、ピクセは なにも いわない
    await p.ev(`document.getElementById("dialog").click()`);
    await t.sleep(1200);
    const before = await p.text();
    await p.click('[data-cab="invaders"]');
    await t.sleep(500);
    await p.key("Escape");
    await t.sleep(800);
    t.eq(await p.text(), before, "あそばずに とじたのに ピクセが なにか いった");
    t.noErrors(p);
    await server.close();
  },

  async "GAME B：はやくて、ランキングは べつ。ボスは 4 たい、たおすと タイトルに 顔が のこる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.click('[data-cab="invaders"]');
    await t.sleep(300);
    await p.key("ArrowRight");
    t.eq(await p.ev(`document.activeElement.dataset.mode`), "b", "→ で GAME B を えらべない");
    await p.key("Enter");
    await t.sleep(1800);
    t.eq(await p.ev(`invaders.state().mode`), "b", "GAME B に ならない");
    // GAME B は 3 ウェーブ さきの はやさ：ウェーブ 1 でも 敵の 列が 下に いる
    t.eq(await p.ev(`invaders.state().enemies[0].y`), 24, "1 ウェーブめの 敵の いち");
    // しなない ように して、ボスの ウェーブまで すすめる
    const toBoss = async (wave) => {
      await p.ev(`(() => { const s = invaders.state(); s.lives = 99; s.inv = 1e9; s.wave = ${wave - 1}; s.boss = null; s.enemies.forEach((e) => (e.alive = false)); })()`);
      await t.sleep(3600);
    };
    const ids = await p.ev(`invaders.bosses()`);
    t.eq(ids, ["ufo", "tako", "kani", "neko"], "ボスの ならび");
    for (const [i, id] of ids.entries()) {
      await toBoss(3 * (i + 1));
      t.eq(await p.ev(`invaders.state().boss?.kind.id`), id, `${i + 1} たいめの ボス`);
      t.eq(await p.ev(`invaders.state().phase`), "play", `${id}：はじまらない`);
      const x0 = await p.ev(`invaders.state().boss.x`);
      await t.sleep(1500);
      t.ok(await p.ev(`invaders.state().boss.x !== ${x0} || invaders.state().boss.t > 60`), `${id}：うごかない`);
      t.ok(await p.ev(`invaders.state().ebullets.length > 0`), `${id}：うってこない`);
      await p.shot(`invaders-boss-${id}.png`);
      // あと 1 ぱつで たおせる ように して、ボスに 弾を あてる
      await p.ev(`(() => { const s = invaders.state(); s.boss.hp = 1; s.boss.hide = false; s.boss.t = 0; s.bullets.push({ x: s.boss.x + 24, y: s.boss.y + 20 }); })()`);
      await t.sleep(300);
      t.ok((await p.ev(`invaders.met()`)).includes(id), `${id}：たおしても のこらない`);
      t.ok((await p.ev(`document.getElementById("game-cheer-text").textContent`)).includes("たおした"), `${id}：ピクセが よろこばない`);
      if (i === 0) await p.shot("invaders-boss-down.png");
    }
    t.eq(await p.ev(`JSON.parse(localStorage.getItem("warpix-arcade-bosses"))`), ids, "あった ボスの きろく");
    await t.sleep(3000); // つぎの ウェーブが はじまるまで

    await p.ev(`(() => { const s = invaders.state(); s.score = 4321; s.lives = 1; s.inv = 0; s.ebullets.push({ x: s.px + 4, y: 120, v: 1 }); })()`);
    await t.sleep(800);
    for (let i = 0; i < 4; i++) await p.key("Enter");
    await t.sleep(300);
    t.eq((await p.ev(`invaders.ranking("b")`)).map((r) => r.s), [4321], "GAME B の ランキング");
    t.eq(await p.ev(`invaders.ranking("a")`), [], "GAME A の ランキングに まざった");
    await p.key("Escape");
    await t.sleep(300);
    t.ok((await p.ev(`document.querySelector('[data-cab="invaders"] .cab-hi').textContent`)).includes("B 004321"), "台に GAME B の HI が でない");
    await t.sleep(1500);
    t.ok((await p.text()).includes("GAME B"), `ピクセが GAME B と いわない: ${await p.text()}`);
    // タイトルに 4 たいの 顔
    await p.click('[data-cab="invaders"]');
    await t.sleep(500);
    await p.shot("invaders-title-met.png");
    await p.key("Escape");
    t.noErrors(p);
    await server.close();
  },

  async "スマホの はばでも 画面に おさまり、ドラッグで うごく"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser({ width: 390, height: 844 });
    const p = await b.firstPage();
    await p.size(390, 844, true);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.click('[data-cab="invaders"]');
    await t.sleep(400);
    const inside = (sel) => p.ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return r.left >= 0 && r.right <= 390 && r.top >= 0 && r.bottom <= 844; })()`);
    t.ok(await inside("#game-modes"), "GAME A・B の ボタンが はみでる");
    t.ok(await inside("#game-cheer"), "ピクセが はみでる");
    await p.shot("invaders-phone-title.png");
    await p.click('[data-mode="a"]');
    await t.sleep(1800);
    const r = await p.ev(`(() => { const r = document.getElementById("game-canvas").getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; })()`);
    t.ok(r.l >= 0 && r.r <= 390 && r.t >= 0 && r.b <= 844, `はみでる: ${JSON.stringify(r)}`);
    const x0 = await p.ev(`invaders.state().px`);
    await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r.l + 20, y: r.t + 100 }] });
    for (let i = 0; i < 20; i++) {
      await p.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: r.l + 20, y: r.t + 100 }] });
      await t.sleep(30);
    }
    await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    t.ok((await p.ev(`invaders.state().px`)) < x0 - 10, "ドラッグで うごかない");
    await p.shot("invaders-phone.png");
    t.noErrors(p);
    await server.close();
  },
};
