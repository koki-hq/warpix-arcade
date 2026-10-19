// 2 だいめ PIXE QUEST：ピクセを そだてる。たたかいは「見て、よけて、なぐる」（v0.6）。来ない あいだも しゅぎょう
const KEY = "warpix-arcade-quest";

// ページの なかの ロボット：ボスの クセを 見て あたらない がわへ よけ、チャンスに パンチ（skill = 0 なら なにも しない）
const BOT = (skill = 1) => `(() => {
  clearInterval(window.__qbot);
  let lastTell = null;
  window.__qbot = setInterval(() => {
    const b = quest.battle();
    if (!b || b.over || ${skill} === 0) return;
    const next = b.lands.find((l) => !l.done);
    if (b.state === "tell" && next && next !== lastTell) {
      lastTell = next;
      quest.act(next.side === "L" ? "right" : "left");
    }
    if (b.state === "stun") quest.act("punch");
  }, 30);
})()`;

async function waitOver(p, t, ms = 60000) {
  for (let i = 0; i < ms / 250; i++) {
    if (await p.ev(`quest.battle()?.over ?? false`)) return true;
    await t.sleep(250);
  }
  return false;
}

export default {
  async "台を おすと ピクセの へや。プルンと たたかい、よけて なぐって たおすと LV が あがり、なかまに なる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot();
    t.eq(await p.ev(`[...document.querySelectorAll('[data-cab="quest"] .cab-hi span')].map((s) => s.textContent)`), ["PIXE LV 1", "BOSS 0/6"], "台の HI");
    await p.click('[data-cab="quest"]');
    await t.sleep(400);
    t.ok(await p.ev(`quest.isOpen() && !document.getElementById("quest").hidden && document.body.classList.contains("gaming")`), "ひらかない");
    const bosses = await p.ev(`[...document.querySelectorAll(".quest-boss")].map((b) => [b.dataset.boss, b.disabled, b.classList.contains("next")])`);
    t.eq(bosses, [["purun", false, true], ["obake", true, false], ["golem", true, false], ["hachi", true, false], ["doragon", true, false], ["maou", true, false]], "ボスの ならび");
    t.ok((await p.ev(`document.querySelector(".quest-how").textContent`)).includes("赤く ひかったら"), "あそびかたが ない");
    t.ok(await p.ev(`document.activeElement.dataset.boss === "purun"`), "つぎの ボスに フォーカス");
    await p.shot("quest-home.png");
    await p.click('[data-boss="purun"]');
    await t.sleep(300);
    t.eq(await p.ev(`quest.battle().state`), "intro", "3・2・1 から はじまらない");
    t.eq(await p.ev(`[...document.querySelectorAll("[data-cmd]")].map((b) => b.dataset.cmd)`), ["left", "punch", "right"], "ボタン");
    t.eq(await p.ev(`document.getElementById("quest-hearts").textContent`), "♥♥♥", "ハート");
    // すきの ない ときの パンチも すこし はいる（1）
    await t.sleep(3400);
    await p.ev(`quest.act("punch")`);
    t.eq(await p.ev(`quest.battle().hp`), 47, "ふつうの パンチが 1 はいらない");
    t.ok(await p.ev(`document.getElementById("quest-ring").getContext("2d").imageSmoothingEnabled === false`), "ドットが ぼやける");
    // クセが でたら、赤く ひかった ゆかから にげる → そこに いつづける → チャンス → 4 ばい
    for (let i = 0; i < 40 && (await p.ev(`quest.battle().state`)) !== "tell"; i++) await t.sleep(100);
    const side = await p.ev(`quest.battle().lands[0].side`);
    t.eq(await p.ev(`quest.danger()`), side === "C" ? ["C"] : [side, "C"], "赤く ひかる ゆか");
    t.ok((await p.ev(`document.getElementById("quest-call").textContent`)).includes("ぷるぷる"), "クセの ひとことが ない");
    await p.shot("quest-tell.png");
    await p.key(side === "L" ? "ArrowRight" : "ArrowLeft");
    await t.sleep(700);
    t.eq(await p.ev(`quest.battle().lane`), side === "L" ? "R" : "L", "よけた ばしょに いつづけない");
    for (let i = 0; i < 60 && (await p.ev(`quest.battle().state`)) === "tell"; i++) await t.sleep(50);
    t.eq(await p.ev(`quest.battle().state`), "stun", `よけても チャンスに ならない（${side} から）`);
    const hp0 = await p.ev(`quest.battle().hp`);
    await p.key(" ");
    t.eq(await p.ev(`quest.battle().hp`), hp0 - 4, "チャンスの パンチが 4 ばいに ならない");
    t.eq(await p.ev(`quest.battle().lane`), "C", "パンチで まんなかに もどらない");
    await t.sleep(100);
    await p.shot("quest-stun.png");
    // あとは ロボットに まかせて たおす
    await p.ev(BOT());
    t.ok(await waitOver(p, t), "おわらない");
    const log = await p.ev(`quest.battle().log.join("/")`);
    t.ok(log.includes("ノックアウト") && log.includes("なかまに なりたそうに"), `かてない: ${log}`);
    const save = await p.ev(`quest.save()`);
    t.ok(save.lv === 2 && save.beaten.join() === "purun" && save.ally === "purun", `きろく: ${JSON.stringify(save)}`);
    await p.shot("quest-win.png");
    await p.click("#quest-back");
    await t.sleep(300);
    t.ok(await p.ev(`document.querySelector('[data-boss="obake"]').classList.contains("next")`), "つぎの ボスが ひらかない");
    t.ok(await p.ev(`document.querySelector('[data-ally="purun"]').getAttribute("aria-pressed") === "true"`), "セコンドに ならない");
    await p.click('[data-ally="purun"]');
    t.eq(await p.ev(`quest.save().ally`), null, "セコンドを はずせない");
    await p.click('[data-ally="purun"]');
    await p.key("Escape");
    await t.sleep(300);
    t.ok(await p.ev(`!quest.isOpen() && !document.body.classList.contains("gaming")`), "Esc で とじない");
    t.eq(await p.ev(`[...document.querySelectorAll('[data-cab="quest"] .cab-hi span')].map((s) => s.textContent)`), ["PIXE LV 2", "BOSS 1/6"], "台の HI が かわらない");
    await t.sleep(1500);
    t.ok((await p.text()).includes("なかまが"), `受付の ピクセが いわない: ${await p.text()}`);
    t.noErrors(p);
    await server.close();
  },

  async "よけないと ハートが へって まける。でも けいけんちは のこる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.click('[data-cab="quest"]');
    await t.sleep(300);
    await p.click('[data-boss="purun"]');
    t.ok(await waitOver(p, t, 40000), "まけない");
    const log = await p.ev(`quest.battle().log.join("/")`);
    t.ok(log.includes("いたっ") && log.includes("ピクセは たおれた") && log.includes("けいけんは のこった"), `まけかた: ${log}`);
    t.ok(!(await p.ev(`quest.save().beaten`)).includes("purun"), "まけたのに たおした ことに なった");
    t.eq(await p.ev(`quest.save().exp`), 3, "けいけんちが のこらない");
    await p.shot("quest-lose.png");
    t.noErrors(p);
    await server.close();
  },

  async "6 たい ぜんぶ、クセを よめば LV 1 でも たおせる（フェイントも）。セコンドが はたらく"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.setItem("${KEY}", JSON.stringify({ lv: 1, exp: 0, beaten: [], ally: null, last: Date.now() }))`);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.click('[data-cab="quest"]');
    await t.sleep(300);
    const ids = await p.ev(`quest.bosses()`);
    let sawFeint = false;
    for (const id of ids) {
      // LV は 1 の まま（うまければ LV 1 でも かてる ことの たしかめ）
      await p.ev(`(() => { const s = JSON.parse(localStorage.getItem("${KEY}")); s.lv = 1; s.exp = 0; s.ally = null; localStorage.setItem("${KEY}", JSON.stringify(s)); })()`);
      await p.key("Escape");
      await p.click('[data-cab="quest"]');
      await t.sleep(200);
      await p.click(`[data-boss="${id}"]`);
      await p.ev(BOT());
      for (let i = 0; i < 900 && !(await p.ev(`quest.battle()?.over`)); i++) {
        if (!sawFeint && (await p.ev(`(() => { const b = quest.battle(); return !!b.feint && b.state === "tell" && b.show !== b.feint.from; })()`))) sawFeint = true;
        await t.sleep(100);
      }
      const log = await p.ev(`quest.battle().log.join("/")`);
      t.ok(log.includes("ノックアウト"), `${id}：LV 1 で かてない: ${log.slice(-160)}`);
      if (id === "golem") await p.shot("quest-golem.png");
      await p.click("#quest-back");
      await t.sleep(200);
    }
    t.ok(sawFeint, "フェイントが なかった");
    t.eq(await p.ev(`quest.save().beaten`), ids, "ぜんぶ たおせない");
    // セコンドの ゴーレム：さいしょの 1 ぱつを うけとめる（よけない）
    await p.click('[data-ally="golem"]');
    await p.click('[data-boss="purun"]');
    await p.ev(BOT(0));
    for (let i = 0; i < 80 && !(await p.ev(`quest.battle().log.join("/")`)).includes("うけとめた"); i++) await t.sleep(100);
    t.ok((await p.ev(`quest.battle().log.join("/")`)).includes("ゴーレムが うけとめた"), "ゴーレムが うけとめない");
    t.eq(await p.ev(`quest.battle().hearts`), await p.ev(`quest.battle().maxHearts`), "うけとめたのに ハートが へった");
    await p.ev(`clearInterval(window.__qbot)`);
    t.ok(await p.ev(`!!document.getElementById("quest-gauge")`), "セコンドが いるのに なかま ゲージが ない");
    await p.key("Escape");
    // 合体わざ：なかま ゲージが 満タンで チャンスに パンチ
    await p.click('[data-cab="quest"]');
    await t.sleep(200);
    await p.click('[data-ally="hachi"]');
    await p.click('[data-boss="doragon"]');
    await t.sleep(200);
    await p.ev(`quest.battle().gauge = 100`);
    await p.ev(BOT());
    for (let i = 0; i < 100 && !(await p.ev(`quest.battle().stats.combos`)); i++) await t.sleep(100);
    t.ok((await p.ev(`quest.battle().log.join("/")`)).includes("がったい わざ！「ひとさし ラッシュ」"), "合体わざが でない");
    t.eq(await p.ev(`quest.battle().gauge`), 0, "合体わざの あと ゲージが もどらない");
    await t.sleep(300);
    await p.shot("quest-combo.png");
    await p.ev(`clearInterval(window.__qbot)`);
    await p.key("Escape");
    t.noErrors(p);
    await server.close();
  },

  async "来なかった あいだも しゅぎょう：5 じかんぶんの けいけんちで LV が あがる。入荷の おしらせも"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    // v0.2 の ころに 来た 人（SEEN_KEY が ない）
    await p.ev(`localStorage.setItem("warpix-arcade-visits", "3"); localStorage.setItem("${KEY}", JSON.stringify({ lv: 1, exp: 0, beaten: [], ally: null, last: Date.now() - 5 * 3600 * 1000 - 60000 }))`);
    await p.goto(server.url);
    const said = (await p.boot({ readIntro: false }), await p.readIntro()).join("/");
    t.ok(said.includes("PIXE QUEST") && said.includes("はいったよ"), `入荷の おしらせ: ${said}`);
    t.eq(JSON.parse(await p.ev(`localStorage.getItem("warpix-arcade-seen")`)), ["invaders", "quest", "run"], "見た 台");
    await p.click('[data-cab="quest"]');
    await t.sleep(400);
    const diary = await p.ev(`document.querySelector(".quest-diary")?.textContent ?? ""`);
    t.ok(diary.includes("しゅぎょう にっき") && diary.includes("5じかん") && diary.includes("＋15") && diary.includes("LV が 1 あがった"), `にっき: ${diary}`);
    t.eq(await p.ev(`(({ lv, exp }) => [lv, exp])(quest.save())`), [2, 5], "LV と けいけんち");
    await p.shot("quest-diary.png");
    await p.key("Escape");
    await p.click('[data-cab="quest"]');
    await t.sleep(300);
    t.ok(!(await p.ev(`!!document.querySelector(".quest-diary")`)), "つづけて ひらいても にっきが でる");
    await p.goto(server.url);
    const again = (await p.boot({ readIntro: false }), await p.readIntro()).join("/");
    t.ok(!again.includes("はいったよ"), `また 入荷と いう: ${again}`);
    t.noErrors(p);
    await server.close();
  },

  async "スマホ：はみでず、下まで スクロールしても ✕ ESC が 上に のこる。ゆびで よけられる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser({ width: 390, height: 664 });
    const p = await b.firstPage();
    await p.size(390, 664, true);
    await p.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await p.goto(server.url);
    await p.ev(`localStorage.setItem("${KEY}", JSON.stringify({ lv: 4, exp: 3, beaten: ["purun", "obake", "golem"], ally: "obake", last: Date.now() - 30 * 3600 * 1000 }))`);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.ev(`document.querySelector('[data-cab="quest"]').click()`);
    await t.sleep(400);
    const wide = () => p.ev(`document.getElementById("quest").scrollWidth <= 390 && [...document.querySelectorAll("#quest button")].every((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= 390; })`);
    t.ok(await wide(), "ホームが はみでる");
    t.ok((await p.ev(`document.querySelector(".quest-diary").textContent`)).includes("24じかん"), "1 日ぶん より おおく しゅぎょう した");
    // いちばん 下まで スクロールしても、✕ ESC は 画面の 上に みえて いて おせる
    await p.ev(`document.getElementById("quest").scrollTop = 99999`);
    await t.sleep(200);
    t.ok((await p.ev(`document.getElementById("quest").scrollTop`)) > 0, "スクロール できない（ためしに ならない）");
    const esc = await p.ev(`(() => { const r = document.getElementById("quest-close").getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; return { top: r.top, hit: document.elementFromPoint(x, y)?.id }; })()`);
    t.ok(esc.top >= 0 && esc.hit === "quest-close", `✕ ESC が かくれる: ${JSON.stringify(esc)}`);
    t.ok(await p.ev(`[...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.cssText.includes(".game.quest") && r.cssText.includes("safe-area-inset-top")); } catch { return false; } })`), "iPhone の 時計の 帯の ぶんを あけて いない");
    await p.shot("quest-phone-home.png");
    await p.ev(`document.getElementById("quest").scrollTop = 0`);
    await p.ev(`document.querySelector('[data-boss="golem"]').click()`);
    await t.sleep(600);
    t.ok(await wide(), "たたかいが はみでる");
    t.ok(await p.ev(`(() => { const r = document.getElementById("quest-cmds").getBoundingClientRect(); return r.bottom <= 664; })()`), "ボタンが 画面の 下に きれる");
    // ゆびで ◀
    await t.sleep(3200);
    const l = await p.ev(`(() => { const r = document.querySelector('[data-cmd="left"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await p.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [l] });
    await p.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    t.eq(await p.ev(`quest.battle().lane`), "L", "ゆびで よけられない");
    t.ok(await p.ev(`[...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.selectorText === ".bgm-toggle" && r.cssText.includes("safe-area-inset-top")); } catch { return false; } })`), "BGM ボタンが 時計の 帯に かさなる");
    await p.shot("quest-phone-battle.png");
    t.noErrors(p);
    await server.close();
  },
};
