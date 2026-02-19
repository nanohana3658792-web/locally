# ローカリー 実サービス提供向け要件定義書

最終更新: 2026-02-19  
対象: 本番提供する API サービス（デモ要件は `docs/requirements-demo.md` へ分離済み）

公式ドメイン（仮）: `kokode.me`

---

## 1. 目的

ローカリーをデモ用途から本番提供可能な SaaS/API サービスへ移行し、以下を実現する。

- 顧客ごとに API 利用を分離管理
- Amazon API Gateway の API Key を顧客単位で最大 10 個発行
- 完全従量課金（使った分だけ課金）
- スパイク時でも計測漏れのない Stripe Meter 連携
- 緯度経度 + 商品短縮ID から商品URLを返す高可用 API
- エンドユーザー向けローカリーアプリ（Flutter）を Android/iOS/Web で提供

---

## 2. サービス概要

### 2.1 提供機能

1. 顧客管理（サインアップ、ログイン、契約状態確認）
2. API Key 管理（発行・無効化・ローテーション、上限 10）
3. 商品検索 API（位置情報 + 商品短縮ID）
4. 従量課金計測（Stripe Meter Events）
5. 請求/支払い管理（Stripe Customer Portal）
6. 管理画面での多角形管理（Google Maps 描画、行政座標の一括登録）
7. 商品短縮ID・多角形・EC URL の紐づけ管理（CSVアップロード対応）
8. エンドユーザー向けローカリーアプリ（商品短縮ID入力、EC遷移、履歴管理）

### 2.2 ユーザー種別

- 顧客管理者: API キー発行、利用量確認、契約管理
- システム管理者: 運用監視、障害対応、顧客サポート
- エンドユーザー: 商品短縮ID検索、ECサイト閲覧

---

## 3. アーキテクチャ要件

### 3.0 ドメイン要件

- 公式ドメイン（仮）は `kokode.me` とする
- サービス公開URLは以下を基本方針とする
  - エンドユーザーアプリ（Web）: `https://kokode.me`
  - 管理画面: `https://admin.kokode.me`
  - API: `https://api.kokode.me`
- 本番環境では TLS 証明書を適用し、HTTPS を必須とする

### 3.1 構成（必須）

- AWS リソースは AWS CDK で IaC 管理し、手動構築を禁止する

- エッジ/API: Amazon API Gateway（API Key 必須、Usage Plan 必須）
- エンドユーザーアプリ: Flutter（Android / iOS / Web）
- アプリ実行: AWS Lambda
- データベース: Amazon RDS for PostgreSQL + PostGIS
- DB 接続中継: Amazon RDS Proxy（Lambda から RDS への接続は必ず Proxy 経由）
- 非同期計測キュー: Amazon SQS（標準キュー）
- 課金: Stripe Billing + Meter Events + Customer Portal
- 管理画面認証: Firebase Authentication
- 管理画面ホスティング: Firebase App Hosting

### 3.4 管理画面フロントエンド技術要件

- 言語: TypeScript
- UI: Tailwind CSS
- SPA フロントエンドとして実装し、API は AWS 側バックエンドと HTTPS で連携する

### 3.5 エンドユーザーアプリ技術要件

- フレームワーク: Flutter
- 提供プラットフォーム: Android / iOS / Web
- UI 方針: 商品短縮ID入力を中心としたシンプルUI
- 認証: ログイン不要

### 3.2 リクエスト処理フロー

1. 顧客クライアントが `x-api-key` 付きで API Gateway にリクエスト
2. API Gateway が Lambda を起動
3. Lambda が RDS Proxy 経由で PostGIS に接続し、「位置情報 + 商品短縮ID」に該当する商品 URL を検索
4. Lambda が API レスポンスを返却
5. 同時に課金イベントを SQS に送信（最低 1 リクエスト 1 イベント）
6. メータリングワーカーが SQS を消費し Stripe Meter Events API に送信

### 3.3 耐障害設計（課金漏れ防止）

- SQS 送信失敗時は Lambda 内で指数バックオフ再試行
- ワーカー失敗時は再試行 + DLQ 退避
- Stripe 送信には冪等キーを付与
- 課金イベントは `event_id` で重複排除
- API 成功/失敗に関わらず「課金対象ポリシー」を明示（6章参照）

---

## 4. 機能要件

## 4.1 商品検索 API

### 4.1.1 エンドポイント

- `POST /v1/resolve-product`

### 4.1.2 入力

- `lat`: number（-90〜90）
- `lng`: number（-180〜180）
- `productShortId`: string（数字のみ 1〜8 桁）

### 4.1.3 出力

- `matched`: boolean
- `productUrl`: string | null
- `storeId`: string | null
- `productShortId`: string
- `traceId`: string（監査用）

### 4.1.4 判定仕様

- PostGIS の空間関数（`ST_Contains` または `ST_Intersects`）でエリア判定
- 同一位置・同一IDで複数該当時は優先順位ルールを適用
- 優先順位ルール未設定時は `MULTIPLE_MATCH` エラー返却

## 4.2 API Key 管理

- 顧客ごとに API Key を最大 10 個まで発行可能
- Key の表示は発行時のみ平文表示、以降はマスク
- Key の状態: `active` / `revoked`
- Key ごとに用途メモ、最終利用日時、作成者を保持
- 発行・無効化は監査ログ必須

## 4.3 顧客管理画面

- ログイン/ログアウト
- 契約状態表示（有効、支払い失敗、解約）
- API Key 一覧/発行/無効化
- 利用量ダッシュボード（日次・月次）
- Stripe Customer Portal への遷移ボタン
- スマートフォンでも操作可能なレスポンシブ UI を必須とする

## 4.4 Stripe Customer Portal 連携

- 顧客は管理画面から Customer Portal を開く
- 支払い方法、請求先、契約状態を自己管理
- 解約/再開がサービス利用状態に自動反映

## 4.5 メータリング

- 課金単位: API リクエスト 1 回 = 1 メーターイベント
- メーター名（例）: `api_request_count`
- イベント属性: `customer_id`, `api_key_id`, `endpoint`, `status_code`, `timestamp`
- 集計周期: Stripe 側の請求サイクル（月次）

## 4.6 多角形管理（管理画面）

- Google Maps を利用して、任意形状の多角形を複数作成・編集・削除できる
- 行政区域など行政発行の緯度経度データを一括登録できる
- 多角形ごとに以下の属性を保持する
  - `polygonName`（地域名など）
  - `areaSize`（㎡ / k㎡）
  - `polygonId`（システム一意ID）
  - `sourceType`（`manual` / `government`）
- 多角形はグループ化できる（例: 都道府県別、商圏別、キャンペーン別）

## 4.7 商品短縮ID・多角形・EC URL 紐づけ

- 管理画面で `productShortId` + `polygonId` + `ecUrl` を登録・更新・無効化できる
- 同一 `productShortId` でも多角形が異なれば別URLを設定可能
- 紐づけレコードは有効期間（`validFrom` / `validTo`）を持てる

## 4.8 EC URL の CSV アップロード

- CSV による一括登録・更新に対応する
- 最小必須カラム: `productShortId,polygonId,ecUrl`
- 任意カラム: `validFrom,validTo,description`
- バリデーション:
  - `productShortId` は数字のみ 1〜8 桁
  - `polygonId` は存在チェック
  - `ecUrl` は URL 形式チェック（http/https）
- 実行結果として「成功件数 / 失敗件数 / エラー明細」を表示し、監査ログに記録する

## 4.9 エンドユーザー向けローカリーアプリ

### 4.9.1 基本UI/操作

- 商品短縮ID入力欄 + 検索ボタンのみを中心としたシンプルUI
- ログイン機能は提供しない（匿名利用）

### 4.9.2 位置情報取得

- 検索時に端末位置情報を利用する
- 端末には高精度位置情報の許可を要求する
  - Android: `ACCESS_FINE_LOCATION`
  - iOS: `fullAccuracy` 相当の高精度許可
- 位置情報が未許可の場合は、許可リクエスト導線を表示する

### 4.9.3 EC URL 履歴（端末内保存）

- ECサイトへ遷移した URL を端末内に日時付きで記録する
- 履歴項目: `ecUrl`, `openedAt`, `productShortId`（任意）, `title`（任意）
- 履歴一覧の閲覧、個別削除、全件削除ができる

### 4.9.4 プライバシー制約

- 位置情報は検索API判定にのみ使用し、ECサイトへは送信しない
- ECリダイレクトURLに `lat` / `lng` など位置情報パラメータを付与しない

### 4.9.5 EC遷移時のUTM付与

- ECサイトへの遷移時に UTM パラメータを付与できる
- 付与対象例: `utm_source`, `utm_medium`, `utm_campaign`
- 既存クエリパラメータと衝突しない形で URL を生成する

---

## 5. データ要件

## 5.1 RDS（PostgreSQL + PostGIS）

### 必須テーブル（論理）

- `customers`
- `api_keys`
- `stores`
- `products`
- `product_areas`（PostGIS Geometry）
- `polygon_groups`
- `polygon_group_members`
- `product_polygon_urls`
- `csv_import_jobs`
- `csv_import_job_items`
- `request_logs`
- `metering_events`
- `audit_logs`

### 空間データ要件

- SRID は 4326（WGS84）を標準
- `product_areas.geom` に GIST インデックス
- 空間検索 + `product_short_id` の複合条件を最適化

### 多角形管理要件

- 手動作成多角形と行政由来多角形を同一テーブルで管理し、`sourceType` で識別
- `polygonName` と `areaSize` を検索条件に利用可能とする
- 多角形グループは多対多（1多角形が複数グループ所属可能）

## 5.2 Stripe 側データ対応

- `customers.external_id` と Stripe Customer ID を 1:1 管理
- 料金プランは従量課金の Metered Price を使用
- 利用量は Meter Events で計上し、請求は Stripe に委譲

## 5.3 エンドユーザーアプリ内データ

- EC URL 履歴は端末ローカルストレージに保存する（クラウド同期なし）
- 保存データはユーザー操作で削除可能とする
- 保存データは URL 閲覧履歴用途に限定し、位置情報は履歴に含めない

---

## 6. 課金・計測ポリシー

## 6.1 課金対象

- 原則: API Gateway で受理されたリクエストは課金対象
- 例外: 社内ヘルスチェック/監視専用エンドポイントは対象外

## 6.2 計測保証

- 目標: 計測漏れ率 0%（業務定義上）
- 設計上の対策:
  - 受理時点でキュー投入
  - 再試行 + DLQ
  - 冪等送信
  - 日次突合（API ログ件数と Stripe 送信件数）

## 6.3 スパイク対策

- SQS でバッファリングし、Stripe API レート超過を吸収
- ワーカーはバッチ送信 + 並列数制御
- バックログ閾値超過時はアラート発報

---

## 7. セキュリティ要件

- API Key は KMS により暗号化保管
- 通信は TLS1.2 以上
- 管理画面は Firebase Authentication を用いた認証を必須とする
- 管理画面は MFA 推奨（Firebase Authentication の多要素認証を利用）
- エンドユーザーアプリはログイン不要で利用可能とする
- IAM 最小権限、環境ごとのロール分離
- 個人情報・決済情報は Stripe 側を正本とし、機微情報の自前保持を最小化
- 監査ログは改ざん耐性を考慮し保管
- 位置情報は EC サイトへ送信しないことを実装・検証する

---

## 8. 非機能要件

- 可用性: 月間 99.9% 以上
- 性能: `POST /v1/resolve-product` p95 500ms 以内（通常時）
- 拡張性: 10 倍トラフィックまで水平スケール可能
- 運用性: CloudWatch メトリクス/ログ/アラームを標準化
- 監査性: 顧客操作・Key操作・課金イベント送信を追跡可能
- 管理画面UX: PC/タブレット/スマートフォンで主要操作（多角形管理、紐づけ、CSV取込）が実行可能
- エンドユーザーアプリUX: Android/iOS/Web で同等機能（ID検索、EC遷移、履歴閲覧/削除）を提供

---

## 9. 監視・運用要件

- 監視対象:
  - API 4xx/5xx 率
  - Lambda エラー率・遅延
  - RDS 接続数・遅延
  - SQS 滞留件数・DLQ件数
  - Stripe 送信失敗率
- 障害時運用:
  - 重要アラートはオンコール通知
  - DLQ 再処理手順を runbook 化
  - 月次で請求突合レポートを実施

---

## 10. 画面要件（管理画面）

- 全画面はスマートフォン対応（縦持ち）を必須とする
- スマホ時は1カラムレイアウト、PC/タブレット時は2カラム以上を許容する
- 管理画面フロントエンドは TypeScript + Tailwind CSS で実装する
- 管理画面は Firebase App Hosting でホスティングする

- `/login`：認証画面
- `/dashboard`：契約状態・当月利用量
- `/api-keys`：API Key 管理（上限10）
- `/billing`：Customer Portal 遷移
- `/audit`：操作履歴（管理者向け）
- `/polygons`：Google Maps による多角形の作成・編集・グルーピング
- `/polygon-imports`：行政発行座標データの一括登録
- `/mappings`：商品短縮ID・多角形ID・EC URL 紐づけ管理
- `/url-imports`：EC URL CSV アップロード

---

## 11. API エラー仕様

- `400 INVALID_PARAMETER`
- `401 UNAUTHORIZED`
- `403 API_KEY_INVALID_OR_REVOKED`
- `404 PRODUCT_NOT_FOUND`
- `409 MULTIPLE_MATCH`
- `429 RATE_LIMITED`
- `500 INTERNAL_ERROR`

エラー時も `traceId` を返し、サポート調査可能とする。

---

## 12. 受け入れ基準（MVP）

1. 顧客が管理画面でログインできる
2. Stripe Customer Portal で契約登録できる
3. API Key を 10 個まで発行/無効化できる
4. API Gateway + Lambda + PostGIS で商品URLを返せる
5. 全リクエストが SQS 経由でメーター送信される
6. スパイク時でも処理遅延のみで計測欠損が発生しない
7. 月次請求が Stripe で生成される
8. 管理画面で自由な多角形を複数登録・編集できる
9. 行政発行の緯度経度情報を使って多角形を一括登録できる
10. 多角形を地域名・面積で命名し、グルーピングできる
11. 商品短縮ID・多角形ID・EC URL を管理画面で紐づけできる
12. EC URL を CSV で一括アップロードできる
13. 管理画面の主要機能がスマートフォンで利用できる
14. Lambda から RDS への接続が RDS Proxy 経由である
15. 管理画面認証が Firebase Authentication で実装されている
16. 管理画面が TypeScript + Tailwind CSS で実装され、Firebase App Hosting で配信される
17. AWS リソースが AWS CDK でデプロイされ、`cdk diff` で差分管理できる
18. ローカリーアプリが Flutter で実装され、Android/iOS/Web で提供される
19. ローカリーアプリのUIが商品短縮ID入力中心のシンプル構成である
20. ローカリーアプリがログイン不要で利用できる
21. EC URL が端末内に日時付き記録され、閲覧・削除できる
22. 位置情報許可（Android `ACCESS_FINE_LOCATION` / iOS `fullAccuracy`）を要求できる
23. 位置情報が EC サイトへ送信されない
24. EC リダイレクト時に UTM パラメータを付与できる

---

## 13. フェーズ計画

### Phase 1: 基盤

- AWS アカウント/ネットワーク/CI-CD
- AWS CDK による API Gateway + Lambda + RDS(PostGIS) + RDS Proxy 最小構成

### Phase 2: 課金

- Stripe Product/Price/Meter 定義
- SQS メータリングパイプライン実装

### Phase 3: 顧客管理

- ログイン、顧客テナント、API Key 10上限制御
- Customer Portal 連携

### Phase 4: 運用

- 監視、DLQ再処理、請求突合、監査ログ可視化

---

## 14. 除外事項（本書の範囲外）

- デモ UI の改修
- 広告配信機能
- ML レコメンド
- 独自決済基盤（Stripe 以外の請求実装）

---

## 15. 変更管理

- 本要件定義書をサービス構築の正本とする
- 重大変更（課金単位、API仕様、上限制御）は ADR を必須化
- リリース前にセキュリティレビューと請求整合レビューを実施

---

## 16. デプロイ要件（AWS CDK）

- AWS 環境は AWS CDK でデプロイする
- CDK スタックは環境別（dev/stg/prod）に分離する
- `cdk diff` による差分確認を必須化する
- `cdk deploy` は CI/CD パイプライン経由を原則とする
- 緊急時手動デプロイ時も、後続で CDK 定義へ必ず収束させる
