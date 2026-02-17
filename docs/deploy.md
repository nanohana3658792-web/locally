# デプロイ手順（Vercel）

## 前提
- Node.js 20 以上
- npm 利用可能
- Vercel アカウント

## 1. ローカル確認
1. 依存インストール
   - `npm install`
2. 開発起動
   - `npm run dev`
3. ビルド確認
   - `npm run build`
4. プレビュー確認
   - `npm run preview`

## 2. Vercel CLI デプロイ
1. CLI インストール
   - `npm i -g vercel`
2. ログイン
   - `vercel login`
3. プロジェクト連携
   - `vercel link`
4. プレビューデプロイ
   - `vercel`
5. 本番デプロイ
   - `vercel --prod`

## 3. GitHub連携デプロイ
1. GitHub リポジトリを Vercel に Import
2. Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. `main` への push で本番自動反映

## 4. SPAルーティング設定
`vercel.json` を配置済み。`/demo/:patternId` や `/slides` の直アクセスを `index.html` にリライト。

## 5. 想定トラブル
- `vite: command not found` → `npm install` 再実行
- ルート直アクセス404 → `vercel.json` の rewrites を確認
- 依存エラー → Node.js バージョンを 20 以上に統一
