# WARPIX-ARCADE

**ピクセが まってる、レトロゲームの ゲームセンター。**

WARPIX製作所の 第二弾。ドットと チップチューンの 台で、ぜんぶ ただで あそべます。台は すこしずつ 入荷します。
となりの へやは リンク集 [WARPIX-LINK](https://link.warpix.app/)（いつものアプリを、ちょっと楽しくひらく入口。）。

- 公開：https://arcade.warpix.app/
- 仕様メモ：[docs/spec/](docs/spec/README.md)

## 特徴

- **PRESS START で お店に はいる**：コインの 音と 起動ジングル、店内 BGM（リンク集とは べつの 曲。オン・オフは おぼえる）
- **受付の ピクセ**：はじめての 人には あいさつ、2 かいめからは「おかえり」と ハイスコアの はなし。つつくと おしゃべり。あそび おわると ほめて くれる
- **台の ならび**：いまは 3 だい（PIXE INVADERS・PIXE QUEST・PIXE RUN）。まだ ない 台は 布を かぶった「COMING SOON」。あたらしい 台が はいると、ピクセが 「はいったよ！」と おしらせ
- **PIXE INVADERS**：warpix-link の ミニゲームが 土台。ゲーム&ウオッチの ように **GAME A（ふつう）・GAME B（はやい）**、ランキングは べつべつ。3 ウェーブごとに **名前と 顔の ある ボス**（UFOさん・タコ・カニ・ネコ）。あった ボスは タイトルに 顔が のこる。あそんで いる あいだ、台の よこで ピクセが おうえん。ベスト 5 に なまえを 3 もじ。台の 看板の 下に A・B の HI
- **PIXE RUN**：マリオみたいな ステージクリア（1-1〜1-4）。GAME A・GAME B と、TIME（タイムアタック：まえの ベストの じぶんが ゴーストで はしる、区間タイムの さ）。ゲームオーバーは なく、おちても とちゅうの はたから。ひみつの 土管も。スマホでは ◀ ▶ JUMP の ボタン
- **PIXE QUEST**：ピクセを そだてる 台。ボスと じゅんばんに たたかう ので、はやい 指は いらない（こうげき・ためる・まもる・やくそう）。ボスの「あいず」を よんで こたえる。来なかった あいだも ピクセは しゅぎょう して いて（1 日ぶん まで）、来ると すこし つよい。まけても けいけんちは のこる。たおした ボスは なかまに なって 1 たい つれて いける
- **おみせが そだつ**：来た 日ごとに、おみせの かざりが 1 つずつ ふえる（しょくぶつ・ネオン・ポスター…トロフィーまで 10 こ）。おすと ピクセが その はなし
- **ホーム画面に 入れられる**（PWA）。一度 ひらけば オフラインでも あそべる
- **この ブラウザにだけ のこす**：ランキング（A・B）・なまえ・あった ボス・PIXE QUEST の ピクセ・見た 台・来た 日の かず・PIXE RUN の きろく・来た かい数・BGM。どこにも 送らない

## ファイル

```
index.html        ページ（PRESS START・フロア・ゲームの 画面・このページについて）
style.css         見た目（色は warpix-link と おなじ 紺・ピンク・シアン）
core.js           合図・保存・ドット絵・音（warpix-link から ひっこし）
run.js            3 だいめ PIXE RUN（ステージクリア）
shop.js           おみせの かざり（来た 日ごとに ふえる）
quest.js          2 だいめ PIXE QUEST（ピクセを そだてる）
invaders.js       1 だいめ PIXE INVADERS（warpix-link の game.js から。GAME A・B、ボス 4 たい、おうえんの ピクセ）
hall.js           フロア：PRESS START・受付の ピクセ・台・BGM・このページについて
sw.js             オフライン（公開ごとに VERSION を 上げる）
manifest.webmanifest, icons/   ホーム画面アプリ（アイコンの 元は tools/icon.html）
fonts/            DotGothic16 を つかう 文字だけに した もの（tools/fonts.mjs）
tests/            ブラウザで ためす テスト
tools/            health.mjs（健康診断）・fonts.mjs・shoot-icons.mjs
```

## 台を ふやす とき

1. `<なまえ>.js` に ゲームを かく（`open()`・`close()`・`isOpen()` を もつ。画面は `index.html` に `class="game"` の かたまり。合図は じゆう。インベーダーは `game-over`・`game-rank`、PIXE QUEST は `quest-win`・`quest-lose`）
2. `hall.js` の `CABINETS` の `soon` を 1 つ ほんものに する（`name`・`open`・`frames`＝台の 画面の 2 コマ・`hi`＝看板の 下の 2 ぎょう）。`NEW` に 入荷の ひとこと
3. `index.html` に `<script>`、`sw.js` の `FILES` に 足す
4. ピクセの「入荷」の あいさつ・テスト・仕様メモ

## テスト

```bash
node tests/run.mjs            # ぜんぶ（20 件。あいて いる メモリで 2〜5 つ 同時に）
node tests/run.mjs invaders   # 名前に invaders を ふくむ ものだけ
node tools/health.mjs         # 重さ・速さ・待機 CPU・アクセシビリティ（axe）
```

Chrome の 場所は 自動で さがします（見つからない ときは 環境変数 `CHROME_PATH`）。テストの Chrome は プロファイル名 `warpix-arcade-test-` で、おわったら かならず とめます。

## ライセンス

コードは MIT（[LICENSE](LICENSE)）。ピクセと WARPIX の 名前・絵は WARPIX製作所の もの。ドット文字 DotGothic16 は OFL（[fonts/OFL-DotGothic16.txt](fonts/OFL-DotGothic16.txt)）。
