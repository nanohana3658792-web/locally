# Copilot 指示書 - ローカリー（サービス提供版）

このリポジトリは、**デモ構築フェーズ**から**実サービス提供フェーズ**へ移行します。  
今後の開発は、AWS + Stripe を用いた本番運用可能な API サービス基盤の構築を優先してください。

---

## ドキュメントの分離

- デモンストレーション構築要件: `docs/requirements-demo.md`
- 実サービス提供向け要件定義: `docs/requirements-service.md`

以後、デモ画面の改善よりも、実サービス運用のための API・課金・認証・運用監視を優先します。

---

## 実サービス構築の基本方針

1. **顧客ごと API Key 発行**（Amazon API Gateway）
2. **完全従量課金**（Stripe Meter Events）
3. **スパイク吸収と欠損防止**（SQS 経由でメーター送信）
4. **検索 API 本体**（Lambda + RDS PostgreSQL/PostGIS）
5. **顧客セルフサーブ**（管理画面 + Stripe Customer Portal）

---

## 実装時の必須要件（抜粋）

- エリア内判定は PostGIS を利用する
- API Gateway は API Key 必須・Usage Plan 必須
- 顧客ごとの API Key 発行上限は **10 個**
- 課金対象リクエストは **漏れなく** Stripe メーターに送る
- メーター送信は同期直送を避け、SQS バッファを用いる
- 失敗時の再送・DLQ・監査ログを実装する

---

## 優先順位

1. 要件定義（サービス版）
2. アーキテクチャ確定（AWS/Stripe）
3. 認証・顧客管理・API Key 発行制御
4. 課金イベント計測パイプライン
5. 商品検索 API（位置 + 短縮ID）
6. 運用監視・障害対応・監査

---

詳細仕様は `docs/requirements-service.md` を正とします.
