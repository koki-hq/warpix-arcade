// 2 だいめ PIXE QUEST：ピクセを そだてる。じゅんばんに たたかい、たおした ボスは なかまに。来ない あいだも しゅぎょう
const KEY = "warpix-arcade-quest";

// コマンドを おしつづけて、たたかいが おわるまで（メッセージは まち なし）
async function fightOut(p, t, cmds = ["attack"]) {
  for (let i = 0; i < 80; i++) {
    if (await p.ev(`quest.battle()?.over ?? true`)) break;
    const cmd = cmds[i % cmds.length];
    await p.ev(`(() => { const b = document.querySelector('[data-cmd="${cmd}"]:not(:disabled)') ?? document.querySelector('[data-cmd="attack"]:not(:disabled)'); b?.click(); })()`);
    await t.sleep(60);
  }
  await t.sleep(200);
}

export default {
  async "台を おすと ピクセの へや。プルンを たおすと LV が あがり、なかまに なって、台と 受付に でる"(t) {
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
    t.ok(await p.ev(`document.activeElement.dataset.boss === "purun"`), "つぎの ボスに フォーカス");
    t.ok(!(await p.ev(`!!document.querySelector(".quest-diary")`)), "はじめてなのに しゅぎょう にっき");
    await p.shot("quest-home.png");
    await p.click('[data-boss="purun"]');
    await t.sleep(1500);
    t.ok((await p.ev(`document.getElementById("quest-log").textContent`)).includes("プルンが あらわれた"), "あらわれない");
    await p.shot("quest-battle.png");
    await p.ev(`quest.setSpeed(0)`);
    await fightOut(p, t);
    const log = await p.ev(`quest.battle().log.join("/")`);
    t.ok(log.includes("プルンを たおした") && log.includes("なかまに なりたそうに"), `かてない: ${log}`);
    const save = await p.ev(`quest.save()`);
    t.ok(save.lv === 2 && save.beaten.join() === "purun" && save.ally === "purun", `きろく: ${JSON.stringify(save)}`);
    t.eq(JSON.parse(await p.ev(`localStorage.getItem("${KEY}")`)).beaten, ["purun"], "のこらない");
    await p.shot("quest-win.png");
    await p.click("#quest-back");
    await t.sleep(300);
    t.ok(await p.ev(`document.querySelector('[data-boss="obake"]').classList.contains("next") && !document.querySelector('[data-boss="obake"]').disabled`), "つぎの ボスが ひらかない");
    t.ok(await p.ev(`document.querySelector('[data-ally="purun"]').getAttribute("aria-pressed") === "true"`), "なかまが いっしょに ならない");
    // なかまは おすと はずせる
    await p.click('[data-ally="purun"]');
    t.eq(await p.ev(`quest.save().ally`), null, "なかまを はずせない");
    await p.click('[data-ally="purun"]');
    await p.shot("quest-home-ally.png");
    await p.key("Escape");
    await t.sleep(300);
    t.ok(await p.ev(`!quest.isOpen() && !document.body.classList.contains("gaming")`), "Esc で とじない");
    t.eq(await p.ev(`[...document.querySelectorAll('[data-cab="quest"] .cab-hi span')].map((s) => s.textContent)`), ["PIXE LV 2", "BOSS 1/6"], "台の HI が かわらない");
    await t.sleep(1500);
    t.ok((await p.text()).includes("なかまが"), `受付の ピクセが いわない: ${await p.text()}`);
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
    // すぐ ひらきなおしても、もう にっきは でない
    await p.key("Escape");
    await p.click('[data-cab="quest"]');
    await t.sleep(300);
    t.ok(!(await p.ev(`!!document.querySelector(".quest-diary")`)), "つづけて ひらいても にっきが でる");
    // 2 かいめの 来店では、もう 入荷の はなしは しない
    await p.goto(server.url);
    const again = (await p.boot({ readIntro: false }), await p.readIntro()).join("/");
    t.ok(!again.includes("はいったよ"), `また 入荷と いう: ${again}`);
    t.noErrors(p);
    await server.close();
  },

  async "ボスの あいず：いきを すいこんだら まもる。まけても けいけんちは のこる"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    await p.goto(server.url);
    await p.ev(`localStorage.setItem("${KEY}", JSON.stringify({ lv: 8, exp: 0, beaten: ["purun", "obake", "golem", "hachi"], ally: "golem", last: Date.now() }))`);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.click('[data-cab="quest"]');
    await t.sleep(300);
    await p.ev(`quest.setSpeed(0)`);
    await p.click('[data-boss="doragon"]');
    await t.sleep(300);
    // ドラゴン：こうげき → いきを すいこむ → ほのお
    for (const cmd of ["attack", "attack", "guard"]) {
      await p.click(`[data-cmd="${cmd}"]`);
      await t.sleep(150);
    }
    const log = await p.ev(`quest.battle().log.join("/")`);
    t.ok(log.includes("いきを すいこんだ") && log.includes("ほのおを はいた") && log.includes("まもった！"), `あいずと まもる: ${log}`);
    const breath = Number(log.match(/ほのおを はいた！\/ピクセは (\d+)の ダメージ/)?.[1]);
    t.ok(breath > 0 && breath <= 8, `まもったのに いたすぎる: ${breath}`);
    await fightOut(p, t, ["charge", "attack", "guard"]);
    t.ok((await p.ev(`quest.save().beaten`)).includes("doragon"), "ドラゴンに かてない（LV 8・ゴーレムつき）");
    await p.click("#quest-back");
    await t.sleep(200);

    // LV 1 で まおうに ちょうせん → まけるが、けいけんちは のこる
    await p.ev(`localStorage.setItem("${KEY}", JSON.stringify({ lv: 1, exp: 0, beaten: ["purun", "obake", "golem", "hachi", "doragon"], ally: null, last: Date.now() }))`);
    await p.key("Escape");
    await p.click('[data-cab="quest"]');
    await t.sleep(300);
    await p.click('[data-boss="maou"]');
    await t.sleep(200);
    await fightOut(p, t);
    const lost = await p.ev(`quest.battle().log.join("/")`);
    t.ok(lost.includes("ピクセは たおれた") && lost.includes("けいけんは のこった"), `まけかた: ${lost}`);
    t.ok(!(await p.ev(`quest.save().beaten`)).includes("maou"), "まけたのに たおした ことに なった");
    t.ok((await p.ev(`quest.save()`)).exp > 0 || (await p.ev(`quest.save()`)).lv > 1, "けいけんちが のこらない");
    await p.shot("quest-lose.png");
    t.noErrors(p);
    await server.close();
  },

  async "スマホの はばでも はみでない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser({ width: 390, height: 844 });
    const p = await b.firstPage();
    await p.size(390, 844, true);
    await p.goto(server.url);
    await p.ev(`localStorage.setItem("${KEY}", JSON.stringify({ lv: 4, exp: 3, beaten: ["purun", "obake"], ally: "obake", last: Date.now() - 30 * 3600 * 1000 }))`);
    await p.goto(server.url);
    await p.boot({ readIntro: false });
    await p.click('[data-cab="quest"]');
    await t.sleep(400);
    const wide = () => p.ev(`document.getElementById("quest").scrollWidth <= 390 && [...document.querySelectorAll("#quest button")].every((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= 390; })`);
    t.ok(await wide(), "ホームが はみでる");
    t.ok((await p.ev(`document.querySelector(".quest-diary").textContent`)).includes("24じかん"), "1 日ぶん より おおく しゅぎょう した");
    await p.shot("quest-phone-home.png");
    await p.click('[data-boss="golem"]');
    await t.sleep(1500);
    t.ok(await wide(), "たたかいが はみでる");
    t.ok(await p.ev(`(() => { const r = document.getElementById("quest-cmds").getBoundingClientRect(); return r.bottom <= 844; })()`), "コマンドが 画面の 下に きれる");
    await p.shot("quest-phone-battle.png");
    t.noErrors(p);
    await server.close();
  },
};
