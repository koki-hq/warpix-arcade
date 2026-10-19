// 1 だいめ PIXE INVADERS：台を おすと はじまり、ランキングに なまえを きざみ、台の HI と ピクセの ひとことに なる
export default {
  async "台を おすと はじまる。ハイスコアに なまえを きざむと、台の HI に でて ピクセが ほめる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    await p.click('[data-cab="invaders"]');
    await t.sleep(500);
    t.ok(await p.ev(`invaders.isOpen() && !document.getElementById("game").hidden && document.body.classList.contains("gaming")`), "ゲームが はじまらない");
    await t.sleep(1800);
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
    t.eq(await p.ev(`invaders.ranking()`), [{ n: "KOY", s: 1234, w: 1 }], "ランキング");
    await p.key("Escape");
    await t.sleep(300);
    t.ok(await p.ev(`!invaders.isOpen() && document.getElementById("game").hidden && !document.body.classList.contains("gaming")`), "Esc で とじない");
    t.eq(await p.ev(`document.querySelector('[data-cab="invaders"] .cab-hi').textContent`), "HI 001234 KOY", "台の HI");
    await t.sleep(1500);
    t.ok((await p.text()).includes("ハイスコア こうしん"), `ピクセが ほめない: ${await p.text()}`);

    // 2 かいめ：ランキング 2 い
    await p.click('[data-cab="invaders"]');
    await t.sleep(2000);
    await lose(500);
    for (let i = 0; i < 4; i++) await p.key("Enter");
    await t.sleep(300);
    await p.click("#game-close");
    await t.sleep(1500);
    t.ok((await p.text()).includes("2いに"), `ランキング 2 い と いわない: ${await p.text()}`);

    // 3 かいめ：0 てんで とじたら、ピクセは なにも いわない
    await p.ev(`document.getElementById("dialog").click()`);
    await t.sleep(1200);
    const before = await p.text();
    await p.click('[data-cab="invaders"]');
    await t.sleep(500);
    await p.key("Escape");
    await t.sleep(800);
    t.eq(await p.text(), before, "0 てんで ピクセが なにか いった");
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
