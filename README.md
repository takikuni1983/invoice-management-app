# 請求管理システム

見積書・発注請書・請求書・納品書の作成と PDF 出力、売上集計、顧客・品目マスタ管理を行う Next.js 14 + Prisma (SQLite) アプリです。

## 起動

| 用途 | 方法 |
|---|---|
| 開発（コード編集しながら） | `start.bat` または `npm run dev` |
| 普段使い・スマホから使う | `start-server.bat`（DB更新 → ビルド → 本番モード起動） |

どちらも http://localhost:4000 で開きます。

コード更新（`git pull`）後に DB の変更がある場合は、アプリを止めてから次を実行してください（`start-server.bat` は自動で実行します）。

```
npx prisma migrate deploy
npx prisma generate
```

`npx prisma generate` で `EPERM: operation not permitted` が出る場合は、起動中のアプリ（`npm run dev` など）や VS Code を閉じてから再実行してください。

## 外出先・スマホから使う

Tailscale を使って自宅PCのアプリにアクセスします。手順は [docs/remote-access.md](docs/remote-access.md) を参照してください。

## その他

- Zoho Invoice からのインポート: `npm run import:zoho`
