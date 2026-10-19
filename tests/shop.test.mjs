// お店が そだつ：来た 日ごとに かざりが 1 つ ふえる（10 こまで）。おすと ピクセが はなす
const KEY = "warpix-arcade-days";
const items = (p) => p.ev(`[...document.querySelectorAll("#shop .shop-item")].map((b) => b.dataset.item)`);

export default {
  async "はじめての 日は しょくぶつ 1 つ。おなじ 日に また 来ても ふえない。つぎの 日は ネオン"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    t.eq(await items(p), ["plant"], "はじめての 日");
    t.eq(JSON.parse(await p.ev(`localStorage.getItem("${KEY}")`)).n, 1, "来た 日の かず");
    // おなじ 日に もう いちど
    await p.goto(server.url);
    const same = (await p.boot({ readIntro: false }), await p.readIntro()).join("/");
    t.eq(await items(p), ["plant"], "おなじ 日に ふえた");
    t.ok(!same.includes("おいたよ") && !same.includes("つけたよ"), `おなじ 日なのに かざりの はなし: ${same}`);
    // きのう 来た ことに して、きょう 来る
    await p.ev(`localStorage.setItem("${KEY}", JSON.stringify({ n: 1, last: "2000-01-01" }))`);
    await p.goto(server.url);
    const next = (await p.boot({ readIntro: false }), await p.readIntro()).join("/");
    t.eq(await items(p), ["plant", "neon"], "つぎの 日");
    t.ok(next.includes("ネオンかんばん"), `ネオンの はなしを しない: ${next}`);
    t.ok(await p.ev(`document.querySelector('[data-item="neon"]').classList.contains("fresh")`), "きょうの かざりが はねない");
    await p.click('[data-item="neon"]');
    await t.sleep(1500);
    t.ok((await p.text()).includes("よるに なると"), `おしても はなさない: ${await p.text()}`);
    await p.shot("shop-day2.png");
    t.noErrors(p);
    await server.close();
  },

  async "10 日 いじょう 来たら 10 こ ぜんぶ（トロフィーまで）。スマホでも はみでない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser({ width: 390, height: 844 });
    const p = await b.firstPage();
    await p.size(390, 844, true);
    await p.goto(server.url);
    await p.ev(`localStorage.setItem("warpix-arcade-visits", "20"); localStorage.setItem("${KEY}", JSON.stringify({ n: 11, last: "2000-01-01" }))`);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    const all = await p.ev(`shop.all()`);
    t.eq(all.length, 10, "かざりの かず");
    t.eq(await items(p), all, "ぜんぶ ならばない");
    t.eq(await p.ev(`shop.days()`), 12, "来た 日の かず");
    t.ok(await p.ev(`document.documentElement.scrollWidth <= 390 && [...document.querySelectorAll(".shop-item")].every((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= 390; })`), "はみでる");
    await p.click('[data-item="trophy"]');
    await t.sleep(1500);
    t.ok((await p.text()).includes("きみの トロフィー"), `トロフィーの はなし: ${await p.text()}`);
    await p.ev(`document.getElementById("shop").scrollIntoView()`);
    await p.shot("shop-all-phone.png");
    t.noErrors(p);
    await server.close();
  },
};
