# WARPIX-ARCADE

**ピクセが まってる、レトロゲームの ゲームセンター。**

WARPIX製作所の 第二弾。ドットと チップチューンの 台で、ぜんぶ ただで あそべます。台は すこしずつ 入荷します。
となりの へやは リンク集 [WARPIX-LINK](https://link.warpix.app/)（いつものアプリを、ちょっと楽しくひらく入口。）。

- 公開：https://arcade.warpix.app/
- 仕様メモ：[docs/spec/](docs/spec/README.md)

## 特徴

- **PRESS START で お店に はいる**：コインの 音と 起動ジングル、店内 BGM（リンク集とは べつの 曲。オン・オフは おぼえる）
- **受付の ピクセ**：はじめての 人には あいさつ、2 かいめからは「おかえり」と ハイスコアの はなし。つつくと おしゃべり。あそび おわると ほめて くれる
- **台の ならび**：いまは 1 だい（PIXE INVADERS）。まだ ない 台は 布を かぶった「COMING SOON」
- **PIXE INVADERS**：warpix-link の ミニゲームが 土台。3 ウェーブごとに ボス。ベスト 5 に なまえを 3 もじ。台の 看板の 下に HI と なまえ
- **ホーム画面に 入れられる**（PWA）。一度 ひらけば オフラインでも あそべる
- **この ブラウザにだけ のこす**：ランキング・なまえ・来た かい数・BGM。どこにも 送らない

## ファイル

```
index.html        ページ（PRESS START・フロア・ゲームの 画面・このページについて）
style.css         見た目（色は warpix-link と おなじ 紺・ピンク・シアン）
core.js           合図・保存・ドット絵・音（warpix-link から ひっこし）
invaders.js       1 だいめ PIXE INVADERS（warpix-link の game.js から）
hall.js           フロア：PRESS START・受付の ピクセ・台・BGM・このページについて
sw.js             オフライン（公開ごとに VERSION を 上げる）
manifest.webmanifest, icons/   ホーム画面アプリ（アイコンの 元は tools/icon.html）
fonts/            DotGothic16 を つかう 文字だけに した もの（tools/fonts.mjs）
tests/            ブラウザで ためす テスト
tools/            health.mjs（健康診断）・fonts.mjs・shoot-icons.mjs
```

## 台を ふやす とき

1. `<なまえ>.js` に ゲームを かく（`open()`・`close()`・`isOpen()`・`ranking()` を もつ。おわったら `emit("game-over", { score })`、ランキングに のったら `emit("game-rank", { rank })`）
2. `hall.js` の `CABINETS` の `soon` を 1 つ ほんものに する（`name`・`open`・`hi`）
3. `index.html` に `<script>`、`sw.js` の `FILES` に 足す
4. ピクセの「入荷」の あいさつ・テスト・仕様メモ

## テスト

```bash
node tests/run.mjs            # ぜんぶ（9 件。あいて いる メモリで 2〜5 つ 同時に）
node tests/run.mjs invaders   # 名前に invaders を ふくむ ものだけ
node tools/health.mjs         # 重さ・速さ・待機 CPU・アクセシビリティ（axe）
```

Chrome の 場所は 自動で さがします（見つからない ときは 環境変数 `CHROME_PATH`）。テストの Chrome は プロファイル名 `warpix-arcade-test-` で、おわったら かならず とめます。

## ライセンス

コードは MIT（[LICENSE](LICENSE)）。ピクセと WARPIX の 名前・絵は WARPIX製作所の もの。ドット文字 DotGothic16 は OFL（[fonts/OFL-DotGothic16.txt](fonts/OFL-DotGothic16.txt)）。
