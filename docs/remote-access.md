# 外出先からスマホで使う（Tailscale）

自宅PCで動かしているこのアプリに、外出先のスマホから Tailscale（VPN）経由でアクセスする手順です。
Tailscale に登録した自分の端末からしか接続できないため、インターネットには公開されません。

```
スマホ（外出先） ──Tailscale（暗号化）──> 自宅PC :4000（このアプリ）
```

## 1. 自宅PC（Windows）の設定

### 1-1. Tailscale を入れる
1. https://tailscale.com/download から Windows 版をインストール
2. 起動してログイン（Google / Microsoft アカウントなど。スマホでも同じアカウントを使う）
3. タスクトレイの Tailscale アイコン → 自分のPC名を確認（例: `cookie-pc`）

### 1-2. ポート 4000 を Tailscale からだけ許可する
PowerShell を **管理者として実行** し、次を1回だけ実行します。

```powershell
New-NetFirewallRule -DisplayName "Invoice App (Tailscale)" -Direction Inbound -Protocol TCP -LocalPort 4000 -RemoteAddress 100.64.0.0/10 -Action Allow
```

`100.64.0.0/10` は Tailscale の端末に割り当てられるアドレスです。自宅の Wi-Fi 内の他の機器やインターネットからは接続できません。

アプリの初回起動時に「Windows セキュリティの重要な警告（Node.js）」が出た場合は、「キャンセル」で問題ありません（上のルールで許可済みのため）。

### 1-3. PCがスリープしないようにする
設定 → システム → 電源 → 「画面とスリープ」で、電源接続時のスリープを「なし」にします（画面オフは問題ありません）。

### 1-4. Tailscale の鍵の期限を切る（推奨）
Tailscale は初期設定だと 180 日ごとに再ログインが必要です。外出先で急に繋がらなくなるのを防ぐため、
https://login.tailscale.com/admin/machines → 自宅PC の「…」→ **Disable key expiry** を選びます。

## 2. アプリの起動

リポジトリのフォルダにある **`start-server.bat`** をダブルクリックします。

- DB の更新（`prisma migrate deploy`）→ ビルド → 本番モードで起動（ポート 4000）を順に行います
- `npm run dev`（`start.bat`）より表示が速いので、スマホから使うときはこちらを使ってください
- 開いた黒い画面は閉じずに置いておきます（閉じるとアプリが止まります）
- コードを更新したとき（`git pull` 後）は、一度閉じてから `start-server.bat` を起動し直します

PC起動時に自動で立ち上げたい場合は、`start-server.bat` のショートカットを
`Win + R` → `shell:startup` で開くフォルダに置きます。

## 3. スマホの設定

1. App Store / Google Play から **Tailscale** をインストール
2. PCと同じアカウントでログインし、接続をオンにする
3. ブラウザで **`http://PC名:4000`** を開く（例: `http://cookie-pc:4000`）
   - 開けない場合は、Tailscale アプリに表示されるPCの IP（`100.x.x.x`）で `http://100.x.x.x:4000`

### ホーム画面に追加（アプリのように使う）
- iPhone（Safari）: 共有ボタン → 「ホーム画面に追加」
- Android（Chrome）: メニュー → 「ホーム画面に追加」

## うまく繋がらないとき

| 症状 | 確認すること |
|---|---|
| ページが開かない | PCとスマホの両方で Tailscale が「接続中」か／PCがスリープしていないか／`start-server.bat` の画面が開いたままか |
| PC名で開けない | Tailscale アプリに表示される `100.x.x.x` のアドレスで試す |
| PCでは開けるがスマホで開けない | 1-2 のファイアウォール設定をしたか |
| 画面が古いまま | `start-server.bat` を起動し直す（ビルドし直される） |
