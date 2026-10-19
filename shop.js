// ---------- お店が そだつ（v0.4） ----------
// 来た 日ごとに、お店の かざりが 1 つずつ ふえる（10 こまで）。やらなきゃ ではなく、来た 人への おまけ。
// おなじ 日に なんど 来ても 1 日。かざりを おすと、ピクセが その はなしを する
const shop = (() => {
  const KEY = "warpix-arcade-days"; // { n: 来た 日の かず, last: "2026-10-20" }
  const el = document.getElementById("shop");

  // art は 16x16 の ドット絵、text は ネオンの もじ
  const ITEMS = [
    {
      id: "plant", name: "かんようしょくぶつ",
      art: ["................", "......c.........", ".....cc..c......", "..c..ccc.cc.....", "..cc..cc.cc..c..", "...cc.cc.c..cc..", "....cccccc.cc...", ".....ccccccc....", "......ccccc.....", ".......ccc......", "....pppppppp....", "....pppppppp....", ".....pppppp.....", ".....pppppp.....", "......pppp......", "................"],
      new: "いりぐちに しょくぶつを おいたよ。",
      talk: "まいにち みずを あげてるんだ。\nすこし のびたかな？",
    },
    {
      id: "neon", name: "ネオン", text: "OPEN",
      new: "きょうは ネオンかんばんを\nつけたよ。ピカピカでしょ？",
      talk: "よるに なると もっと\nきれいに みえるんだ。",
    },
    {
      id: "poster", name: "ポスター",
      art: ["................", "..cccccccccccc..", "..c..........c..", "..c...wwww...c..", "..c..wwwwww..c..", "..c.wwwwwwww.c..", "..c.wpwwwwpw.c..", "..c..wwwwww..c..", "..c..w....w..c..", "..c..........c..", "..c.pp.pp.pp.c..", "..c..........c..", "..cccccccccccc..", "................", "................", "................"],
      new: "インベーダーの ポスターを\nはったよ。",
      talk: "この ポスター、むかしの\nゲームセンターに あったのに にせたんだ。",
    },
    {
      id: "gumball", name: "ガムボールマシン",
      art: ["................", "......wwww......", "....wwpwcwww....", "...wwcwywpwww...", "...wpwwcwwyww...", "...wwywpwwcww...", "....wwwwwwww....", "......pppp......", ".....pppppp.....", ".....ppyypp.....", ".....pppppp.....", ".....pp..pp.....", ".....pppppp.....", "....pppppppp....", "....pppppppp....", "................"],
      new: "ガムボールマシンが\nとどいたよ！",
      talk: "なんいろが でるかは\nおたのしみ。",
    },
    {
      id: "bench", name: "ベンチ",
      art: ["................", "................", "................", "................", "................", "................", "................", "................", "................", "pppppppppppppppp", "pppppppppppppppp", "................", "vvvvvvvvvvvvvvvv", ".v............v.", ".v............v.", ".v............v."],
      new: "ひとやすみ できる ように\nベンチを おいたよ。",
      talk: "つかれたら すわって いってね。\nいそがなくて いいから。",
    },
    {
      id: "sunflower", name: "ひまわり",
      art: ["................", ".....yyyy.......", "....yyoyyy......", "...yyoooyy......", "....yyoyyy......", ".....yyyy.......", "......c.........", "......c..cc.....", "...cc.c.cc......", "....ccc.........", "......c.........", "....pppppp......", "....pppppp......", ".....pppp.......", ".....pppp.......", "................"],
      new: "ひまわりを かざったよ。\nおみせが あかるく なった。",
      talk: "ひまわりって、いつも\nおひさまの ほうを むくんだって。",
    },
    {
      id: "vending", name: "じはんき",
      art: ["..cccccccccccc..", "..cwwwwwwwwwwc..", "..cwpwywcwpwwc..", "..cwwwwwwwwwwc..", "..cwcwpwywcwwc..", "..cwwwwwwwwwwc..", "..cccccccccccc..", "..cvvvvvvvvvvc..", "..cvyyvvvvvvvc..", "..cvvvvvvvvvvc..", "..cvvvvvvvvvvc..", "..cvvwwwwwwvvc..", "..cvvwwwwwwvvc..", "..cvvvvvvvvvvc..", "..cccccccccccc..", "..c..........c.."],
      new: "じはんきが はいったよ。\nゲームの あとの いっぷくに。",
      talk: "おすすめは つめたい\nラムネ。ドットの あじが するよ。",
    },
    {
      id: "plush", name: "ピクセの ぬいぐるみ", npc: true,
      new: "ぼくの ぬいぐるみが\nできたんだ。にてる？",
      talk: "UFOキャッチャーに いれようか\nまよってるんだ。",
    },
    {
      id: "ball", name: "ミラーボール",
      art: [".......v........", ".......v........", ".......v........", "......wcw.......", "....wcwcwcw.....", "...cwcwcwcwc....", "...wcwcwcwcw....", "...cwcwcwcwc....", "....wcwcwcw.....", "......wcw.......", "................", "..y.........y...", "................", "y......y.......y", "................", "................"],
      new: "ミラーボールを つけたよ！\nキラキラ。",
      talk: "BGM に あわせて\nまわってるんだよ。",
    },
    {
      id: "trophy", name: "きんの トロフィー",
      art: ["................", "..yyyyyyyyyyyy..", "yyyyyyyyyyyyyyyy", "y.yyyywwyyyyyy.y", "y.yyyywwyyyyyy.y", ".yyyyyyyyyyyyyy.", "..yyyyyyyyyyyy..", "....yyyyyyyy....", "......yyyy......", ".......yy.......", ".......yy.......", ".....yyyyyy.....", "....vvvvvvvv....", "....vwwwwwwv....", "....vvvvvvvv....", "................"],
      new: "10かいも 来て くれた おれいに\nトロフィーを かざったよ。",
      talk: "これは きみの トロフィー。\nいつも ありがとう。",
    },
  ];

  // その 人の いまの 日（"2026-10-20"）
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  function load() {
    const s = store.get(KEY, null) ?? {};
    return { n: Number.isInteger(s.n) && s.n > 0 ? s.n : 0, last: typeof s.last === "string" ? s.last : "" };
  }
  let days = load();
  const count = () => Math.min(days.n, ITEMS.length);

  let onTalk = () => {};
  function render() {
    const items = ITEMS.slice(0, count());
    el.hidden = !items.length;
    el.replaceChildren(
      ...items.map((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `shop-item${item.text ? " neon" : ""}`;
        btn.dataset.item = item.id;
        btn.setAttribute("aria-label", item.name);
        btn.innerHTML = item.text ? `<span aria-hidden="true">${item.text}</span>` : pixelSvg(item.npc ? NPC.idle : item.art);
        btn.addEventListener("click", () => onTalk(item));
        return btn;
      })
    );
  }

  // お店に はいった ときに よぶ。あたらしい 日なら 1 日 ふやして、ふえた かざりを かえす
  function visit() {
    days = load();
    const before = count();
    if (days.last !== today()) {
      days = { n: days.n + 1, last: today() };
      store.set(KEY, days);
    }
    render();
    const added = count() > before ? ITEMS[count() - 1] : null;
    if (added) {
      el.querySelector(`[data-item="${added.id}"]`)?.classList.add("fresh");
    }
    return added;
  }

  return {
    visit,
    talk: (fn) => (onTalk = fn),
    days: () => load().n,
    items: () => ITEMS.slice(0, count()).map((i) => i.id),
    all: () => ITEMS.map((i) => i.id),
  };
})();
