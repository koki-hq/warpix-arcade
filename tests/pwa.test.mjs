// ホーム画面アプリ：アイコン・マニフェスト・オフライン
export default {
  async "一度 ひらけば、オフラインでも ひらいて あそべる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url, 2000);
    t.ok(await p.ev(`navigator.serviceWorker.ready.then((r) => !!r.active)`), "サービスワーカーが うごいて いない");
    await p.send("Page.reload");
    await t.sleep(1500);
    t.ok(await p.ev(`!!navigator.serviceWorker.controller`), "サービスワーカーが ページを うけもって いない");
    await p.send("Network.enable");
    await p.send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await p.goto(server.url, 1500);
    await p.boot({ readIntro: false });
    await p.click('[data-cab="invaders"]');
    await t.sleep(300);
    t.ok(await p.ev(`document.body.classList.contains("booted") && invaders.isOpen()`), "オフラインで あそべない");
    t.noErrors(p);
    await server.close();
  },

  async "マニフェストと アイコンが そろって いる"(t) {
    const server = await t.startServer();
    const m = await (await fetch(server.url + "manifest.webmanifest")).json();
    t.eq([m.name, m.short_name, m.display, m.start_url], ["WARPIX-ARCADE", "ARCADE", "standalone", "./"], "マニフェスト");
    for (const f of ["icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"]) {
      const r = await fetch(server.url + f);
      t.ok(r.ok && r.headers.get("content-type") === "image/png", `${f} が ない`);
    }
    // サービスワーカーが あつめる ファイルが ぜんぶ ある
    const sw = await (await fetch(server.url + "sw.js")).text();
    const files = JSON.parse(sw.match(/const FILES = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));
    for (const f of files) t.ok((await fetch(server.url + (f === "./" ? "" : f))).ok, `${f} が ない`);
    await server.close();
  },
};
