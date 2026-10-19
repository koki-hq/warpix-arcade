// ゲームセンターの フロア：PRESS START・受付の ピクセ・台の ならび・このページについて
export default {
  async "PRESS START で お店に はいり、はじめての 人には ピクセが あいさつ。2 かいめは おかえり"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser({ width: 390, height: 844 });
    const p = await b.firstPage();
    await p.size(390, 844, true);
    await p.goto(server.url);
    t.ok(await p.ev(`!document.getElementById("start-screen").hidden`), "PRESS START が 出ない");
    t.eq(await p.ev(`document.querySelector(".start-tagline").textContent`), "ピクセが まってる、レトロゲームの ゲームセンター。", "ひとこと");
    // せまい 画面では「、」で 2 行。かたまりが われない
    const lines = await p.ev(`[...document.querySelectorAll(".start-tagline span")].map((s) => [s.getClientRects().length, Math.round(s.getBoundingClientRect().top)])`);
    t.ok(lines[0][0] === 1 && lines[1][0] === 1 && lines[1][1] > lines[0][1], `ひとことの かいぎょう: ${JSON.stringify(lines)}`);
    await p.shot("hall-start.png");
    await p.ev(`document.getElementById("start-btn").click()`);
    await t.sleep(1200);
    t.ok(await p.ev(`document.getElementById("start-screen").hidden && document.body.classList.contains("booted")`), "お店に はいれない");
    t.ok(await p.ev(`sound.playing()`), "BGM が ならない");
    const said = (await p.readIntro()).join("|");
    t.ok(said.includes("いらっしゃい") && said.includes("1だい"), `はじめての あいさつ: ${said}`);
    t.eq(await p.ev(`localStorage.getItem("warpix-arcade-visits")`), "1", "来た かい数");
    await p.shot("hall-floor.png");
    t.eq(await p.ev(`document.documentElement.scrollWidth`), 390, "よこに はみでる");

    await p.goto(server.url);
    await p.boot({ readIntro: false });
    t.ok((await p.text()).includes("おかえり"), "2 かいめに おかえり と いわない");
    t.noErrors(p);
    await server.close();
  },

  async "台は 4 だい：PIXE INVADERS と、布を かぶった 3 だい。ピクセを つつくと おしゃべり"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    const cabs = await p.ev(`[...document.querySelectorAll(".cab")].map((c) => [c.dataset.cab, c.classList.contains("soon"), c.querySelector(".cab-marquee").textContent, c.querySelector(".cab-hi").textContent])`);
    t.eq(cabs, [
      ["invaders", false, "PIXE INVADERS", "A ------B ------"],
      ["soon-1", true, "COMING SOON", "にゅうか まち"],
      ["soon-2", true, "COMING SOON", "にゅうか まち"],
      ["soon-3", true, "COMING SOON", "にゅうか まち"],
    ], "台");
    await p.click('[data-cab="soon-2"]');
    await t.sleep(1500);
    t.ok((await p.text()).includes("ないしょ"), "まだ ない 台を おしても ピクセが いわない");
    t.ok(await p.ev(`document.getElementById("game").hidden`), "まだ ない 台で ゲームが はじまった");
    await p.click("#npc");
    await t.sleep(1800);
    t.ok((await p.text()).includes("ただで"), `つついても おしゃべり しない: ${await p.text()}`);
    // BGM の オン・オフは おぼえる
    await p.click("#bgm-toggle");
    t.ok(await p.ev(`!sound.playing() && localStorage.getItem("warpix-arcade-bgm") === "false" && document.getElementById("bgm-toggle").textContent === "BGM OFF"`), "BGM が とまらない");
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    t.ok(await p.ev(`!sound.playing()`), "BGM OFF を わすれた");
    t.noErrors(p);
    await server.close();
  },

  async "このページについて：のこす ものと、となりの へや（WARPIX-LINK）"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    t.eq(await p.ev(`document.querySelector(".door").href`), "https://link.warpix.app/", "となりの へやの いりぐち");
    await p.click("#about-btn");
    await t.sleep(300);
    t.ok(await p.ev(`document.getElementById("about").open`), "ひらかない");
    const text = await p.ev(`document.getElementById("about").textContent`);
    t.ok(["ランキング", "来た かい数", "BGM", "どこにも 送りません"].every((w) => text.includes(w)), "のこす ものの せつめい");
    await p.shot("hall-about.png");
    await p.click("#about-close");
    t.ok(await p.ev(`!document.getElementById("about").open`), "とじない");
    // この ブラウザに のこして いる キーが、ぜんぶ せつめい されて いる
    await p.ev(`invaders.open({ mode: "b" })`);
    await t.sleep(300);
    await p.ev(`(() => { const s = invaders.state(); s.wave = 2; s.enemies.forEach((e) => (e.alive = false)); })()`);
    await t.sleep(3600); // ボスの ウェーブまで
    await p.ev(`(() => { const s = invaders.state(); s.boss.hp = 1; s.bullets.push({ x: s.boss.x + 24, y: s.boss.y + 20 }); })()`);
    await t.sleep(3000); // つぎの ウェーブが はじまるまで
    await t.sleep(1800); // WAVE 1 の ひょうじが おわるまで
    await p.ev(`(() => { const s = invaders.state(); s.score = 100; s.lives = 1; s.inv = 0; s.ebullets.push({ x: s.px + 4, y: 120, v: 1 }); })()`);
    await t.sleep(800);
    await p.key("Escape");
    const keys = await p.ev(`Object.keys(localStorage).sort()`);
    t.eq(keys, ["warpix-arcade-bgm", "warpix-arcade-bosses", "warpix-arcade-ranking-b", "warpix-arcade-visits", "warpix-rank-name", "warpix-ranking"].filter((k) => keys.includes(k)), `せつめい して いない キー: ${keys}`);
    t.ok(keys.includes("warpix-arcade-ranking-b") && keys.includes("warpix-arcade-bosses"), "ランキングや ボスが のこらない");
    t.ok(text.includes("あった ことの ある ボス"), "ボスの きろくの せつめい");
    t.noErrors(p);
    await server.close();
  },
};
