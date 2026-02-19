# ココデミ（仮） 実サービス提供向け要件定義書

対象: 本番提供する API サービス

公式ドメイン（仮）: `kokode.me`

---

## 1. 目的

ココデミ（仮）をデモ用途から本番提供可能な SaaS/API サービスへ移行し、以下を実現する。

- 顧客ごとに API 利用を分離管理
- Amazon API Gateway の API Key を顧客単位で最大 10 個発行
- 無料利用枠付き完全従量課金（無料枠超過分のみ従量課金）
- スパイク時でも計測漏れのない Stripe Meter 連携
- 緯度経度 + 商品短縮ID から商品URLを返す高可用 API
- エンドユーザー向けココデミアプリ（Flutter）を Android/iOS/Web で提供

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
8. エンドユーザー向けココデミアプリ（商品短縮ID入力、EC遷移、履歴管理）

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
- アプリ向け認証: Firebase App Check（正規アプリからのリクエストが可能になる）
- アプリ向け不正トラフィック防拺: AWS WAF（IPベースレート制限）

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

#### 3.2.1 B2B API（EC事業者向け・API Key 認証）

1. 顧客クライアントが `x-api-key` ヘッダー付きで API Gateway（`/v1/...`）にリクエスト
2. API Gateway が API Key + Usage Plan を検証し、Lambda を起動
3. Lambda が RDS Proxy 経由で PostGIS に接続し、「位置情報 + 商品短縮ID」に該当する商品 URL を検索
4. Lambda が API レスポンスを返却
5. 同時に課金イベントを SQS に送信（最低 1 リクエスト 1 イベント）
6. メータリングワーカーが SQS を消費し Stripe Meter Events API に送信

#### 3.2.2 アプリ API（ココデミアプリ向け・API Key 不要）

1. ココデミアプリ（Flutter）が API Gateway（`/app/v1/...`）にリクエスト
   - `x-api-key` ヘッダーは**不使用**（クライアントに API Key を渡さない）
   - リクエストには Firebase App Check トークン（`X-Firebase-AppCheck` ヘッダー）を付与
2. API Gateway の Lambda Authorizer が App Check トークンを Firebase SDK で検証
   - 検証失敗時は `401 UNAUTHORIZED` を返却
3. AWS WAF により IP ベースのレート制限をかけ、DoS/スクレイピングを緩和
4. Lambda が RDS Proxy 経由で PostGIS に接続し、商品 URL を検索
5. Lambda がレスポンスを返却
6. 課金イベントを SQS に送信（アプリ経由リクエストも課金対象とするか否かは §6 の課金ポリシーで定義）

> **設計意図:** エンドユーザーのデバイスに AWS/API Gateway の API Key が一切渡らない構造とする。  
> B2B API Key は EC 事業者のサーバーサイド〜管理画面のみで保持・利用する。

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

| パス | 認証方式 | 対象クライアント |
| ------ | --------- | ---------------- |
| `POST /v1/resolve-product` | API Key（`x-api-key` ヘッダー必須） | EC 事業者（サーバーサイド統合） |
| `POST /app/v1/resolve-product` | Firebase App Check トークン（`X-Firebase-AppCheck` ヘッダー必須） | ココデミアプリ（Flutter） |

- エンドユーザーデバイスに AWS/API Gateway の API Key を配布しない
- アプリ向けパスは API Gateway の API Key 認証を**外し**、Lambda Authorizer + AWS WAF で保護する

### 4.1.2 入力

| フィールド | 型 | 制約 |
| ----------- | ----- | ------ |
| `lat` | number | -90 〜 90、小数点以下 **最大 6 桁**（例: `35.681234`） |
| `lng` | number | -180 〜 180、小数点以下 **最大 6 桁**（例: `139.767654`） |
| `productShortId` | string | 数字のみ 1〜8 桁 |

> 小数点以下 6 桁は約 0.1 m の精度に相当する（WGS84 基準）。7 桁以上が渡された場合はサーバー側で 6 桁に丸める（四捨五入）。

### 4.1.3 出力

```jsonc
{
  "matched": true,         // boolean: 1件以上あれば true
  "count": 2,              // number: マッチした商品数
  "products": [
    {
      "productUrl": "https://...",  // string: EC URL
      "storeId": "store_abc",       // string: 店舗ID
      "productShortId": "12345",    // string: 商品短縮ID
      "polygonId": "poly_001",      // string: マッチしたエリアID
      "priority": 1                 // number: 優先順位（低いほど優先）
    }
  ],
  "traceId": "trace_xxxx"  // string: 監査用
}
```

- `matched: false` の場合、`products` は空配列 `[]`、`count` は `0`
- `products` は `priority` 昇順（優先度高い順）で返却する
- 単一結果のクライアントは `products[0]` を参照すればよい

### 4.1.4 判定仕様

- PostGIS の空間関数（`ST_Contains` または `ST_Intersects`）でエリア判定
- 同一位置・同一IDで複数該当時は **全件を `products` 配列で返却**し、エラーにしない
- `priority` フィールドで順序付け（管理画面で紐づけごとに設定可能）
- `priority` 未設定の紐づけは最低優先度（後方）に配置する

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
- 無料利用枠（free tier）を適用し、無料枠超過分のみ請求対象とする
- 無料利用枠の閾値はプラン設定値として管理し、管理画面で参照可能とする

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

## 4.9 エンドユーザー向けココデミアプリ

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

### 4.9.6 顧客ブランドアプリ（個別ビルド方式）

#### 概要

顧客（EC事業者）ブランドのアプリは、**顧客ごとに個別ビルドとして作成する**。  
ビルド時にロゴ・アプリ名・テーマカラーを設定し、Google Play / App Store にそれぞれ公開する。  
アプリ内には顧客が**自由にカスタマイズできる矩形枠（アピール枠）**を設け、販促・案内コンテンツに利用できる。

#### 個別ビルドの設定項目（ビルド時固定）

| 項目 | 内容 | 設定方法 |
| ------ | ------ | ---------- |
| アプリ名 | OS のホーム画面・ランチャーに表示される名称 | Flutter `--dart-define` または `flavor` |
| ロゴマーク | スプラッシュ・アイコン・ヘッダーに使用 | アセット差し替え |
| テーマカラー | `primaryColor` / `accentColor` | `--dart-define` |
| `customerId` | バックエンドへのリクエストに自動付与 | `--dart-define` |

> ビルド設定は Flutter の **Flavor（Android product flavor / iOS scheme）** を利用し、  
> 共通コードベースから顧客ごとのビルド成果物を生成する。

#### アピール枠（ランタイムカスタマイズ）

- アプリ内のホーム画面に**固定サイズの矩形枠**を設ける
- 枠内に表示するコンテンツは顧客が管理画面から随時更新できる
- コンテンツはアプリ起動時にバックエンドから取得する（`GET /app/v1/banner?customerId={id}`）

**表示できるコンテンツ種別:**

| 種別 | 内容 |
| ------ | ------ |
| 画像バナー | PNG / JPEG / WebP（推奨 横1200×縦400px）、タップ時に URL を開く |
| テキスト告知 | 最大 200 文字の文章 + 任意の背景色 |
| 非表示 | 枠を表示しない（デフォルト） |

**バナー API エンドポイント:**

- `GET /app/v1/banner?customerId={id}` — Firebase App Check トークン必須
- レスポンス: `{ type, imageUrl, linkUrl, text, bgColor }` または `{ type: "hidden" }`
- キャッシュ: 端末内に 1 時間キャッシュ（販促の鮮度を考慮し短めに設定）

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
- `customer_banners`（`customer_id`, `type`（`image`/`text`/`hidden`）, `image_url`, `link_url`, `text`, `bg_color`, `updated_at`）

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
- Stripe の価格設定で無料利用枠（threshold/tier）を設定し、超過分課金を実現する

## 5.3 エンドユーザーアプリ内データ

- EC URL 履歴は端末ローカルストレージに保存する（クラウド同期なし）
- 保存データはユーザー操作で削除可能とする
- 保存データは URL 閲覧履歴用途に限定し、位置情報は履歴に含めない

---

## 6. 課金・計測ポリシー

## 6.1 課金対象

- 原則: API Gateway で受理されたリクエストは課金対象
- 例外: 社内ヘルスチェック/監視専用エンドポイントは対象外
- ただし請求額計算時は無料利用枠を先に控除し、超過利用分のみを請求する

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
- `/banner`：アピール枠コンテンツの設定（画像バナー・テキスト告知・非表示）

---

## 11. API エラー仕様

| コード | 意味 | 備考 |
| ------ | ---- | ---- |
| `400 INVALID_PARAMETER` | リクエストパラメータ不正 | lat/lng 範囲外、productShortId 形式違反など |
| `401 UNAUTHORIZED` | 認証失敗 | B2B: API Key なし、アプリ: App Check トークン不正 |
| `403 API_KEY_INVALID_OR_REVOKED` | API Key 無効・失効 | B2B API のみ |
| `404 PRODUCT_NOT_FOUND` | 該当商品なし | matched: false と同義。レスポンスボディで表現し、このエラーは通常 200 + `matched: false` で返す |
| `429 RATE_LIMITED` | レート超過 | API Gateway Usage Plan（B2B）または WAF レート制限（アプリ） |
| `500 INTERNAL_ERROR` | サーバー内部エラー | |

- `MULTIPLE_MATCH` エラーは廃止。複数マッチは `products` 配列で全件返却する（4.1.3 参照）
- エラー時も `traceId` を返し、サポート調査可能とする

---

## 12. 受け入れ基準（MVP）

1. 顧客が管理画面でログインできる
2. Stripe Customer Portal で契約登録できる
3. API Key を 10 個まで発行/無効化できる
4. API Gateway + Lambda + PostGIS で商品URLを返せる
5. 全リクエストが SQS 経由でメーター送信される
6. スパイク時でも処理遅延のみで計測欠損が発生しない
7. 月次請求が Stripe で生成される
  無料利用枠が適用され、無料枠超過分のみ請求される
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
18. ココデミアプリが Flutter で実装され、Android/iOS/Web で提供される
19. ココデミアプリのUIが商品短縮ID入力中心のシンプル構成である
20. ココデミアプリがログイン不要で利用できる
21. EC URL が端末内に日時付き記録され、閲覧・削除できる
22. 位置情報許可（Android `ACCESS_FINE_LOCATION` / iOS `fullAccuracy`）を要求できる
23. 位置情報が EC サイトへ送信されない
24. EC リダイレクト時に UTM パラメータを付与できる
25. ココデミアプリ（Flutter）内に AWS/API Gateway の API Key を持たず、Firebase App Check トークンでリクエストを認証する
26. アプリ向けエンドポイント（`/app/v1/...`）に AWS WAF のレート制限が適用されている
27. `/v1/resolve-product` から複数商品が該当する場合、`products` 配列で全件返却される
28. `lat`/`lng` の小数点以下 6 桁超で入力時はサーバー側で 6 桁にいるめる
29. 顧客ブランドアプリを Flutter Flavor を用いて顧客ごとに個別ビルドできる
30. 顧客ブランドアプリのビルド時にアプリ名・ロゴ・テーマカラー・`customerId` を設定できる
31. 管理画面のアピール枠設定（`/banner`）で画像バナー・テキスト告知・非表示を切り替えられる
32. ココデミアプリがアピール枠コンテンツを起動時に取得し、ホーム画面の矩形枠に表示できる
33. アピール枠コンテンツを端末内に 1 時間キャッシュできる
34. アピール枠が「非表示」設定の場合は枠自体を描画しない

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

---

## 17. 料金プラン案（市場調査ベース）

> 本節は市場調査をもとにした価格設計案であり、正式リリース前に改定する。  
> 請求通貨は **JPY** を基本とする（Stripe Billing の通貨設定）。

### 17.1 市場調査概要

| サービス | 無料枠 | 単価（¥/1,000 req） | 備考 |
| --------- | -------- | ------------------- | ------ |
| Google Maps Geocoding | 月 10,000 req 相当 ($200 クレジット) | ¥750 | 汎用ジオコーディング |
| Google Maps Places (Nearby Search Pro) | 同上 | ¥4,800 | 周辺店舗検索 |
| Mapbox Tilequery | 月 100,000 req | ¥75〜113 (推定) | 座標→データ検索。本サービスに最も近い用途 |
| AWS Location Service | 3ヶ月 × 20,000 req | ¥75 | バックエンド原価相当 |
| Positionstack (Basic) | 月 100 req | ¥30 | 格安ジオコーディング SaaS |

**調査結論:**

- バックエンド原価（AWS Location 相当）は ¥75/1,000 req 程度
- Google Maps の汎用 API は ¥750/1,000 req（原価の 10 倍程度）
- ココデミ（kokode.me）は「日本EC特化・商品短縮ID高速ルックアップ」という独自価値で差別化できるため、Google Maps より低く・バックエンド原価より十分高いレンジで設定する

---

### 17.2 無料利用枠

| 項目 | 設定値 |
| ------ | -------- |
| 無料枠リクエスト数 | **月 1,000 req**（超過分のみ課金） |
| API Keyの本数上限 | 1 本（無料プランの場合） |
| 対象 | 全顧客（新規・既存問わず毎月付与） |
| Stripe 設定 | Metered Price の tier 設定で閾値 1,000 を無課金帯として定義 |

---

### 17.3 完全従量課金（PAYG）プラン

APIキー発行だけを行い、固定月額なしで利用するプラン。
無料枠 (月 1,000 req) を超過した分のみ課金される。

|リクエスト数（月累計）|単価|
|---|---|
|〜1,000 req|**無料**|
|1,001〜10,000 req|¥2.0 / req|
|10,001〜100,000 req|¥1.0 / req|
|100,001〜500,000 req|¥0.5 / req|
|500,001 req〜|¥0.3 / req|

> **計算例:**  月に 15,000 req 利用した場合  
> = 0（無料枠 1,000 req）+ 9,000 × ¥2.0（〜10,000 req 帯）+ 5,000 × ¥1.0（10,001〜 帯）= **¥23,000**

---

### 17.4 固定コミットプラン（月額サブスクリプション）

毎月一定量を確約することで、純 PAYG より安価になるプラン。
超過分は各プランの超過単価で追加課金される。

|プラン名|月額（税抜）|込みリクエスト数|超過単価|推奨規模|
|---|---|---|---|---|
|**Lite**|¥3,000|5,000 req|¥1.5 / req|小規模テスト〜月商数十万規模の EC|
|**Basic**|¥9,800|30,000 req|¥0.8 / req|月商数百万規模の EC|
|**Growth**|¥29,800|150,000 req|¥0.5 / req|中規模 EC（月商〜数千万）|
|**Pro**|¥98,000|1,000,000 req|¥0.3 / req|大規模 EC・複数店舗展開|
|**Enterprise**|要問合せ|カスタム|カスタム|月 200 万 req 超・SLA 付き|

> **コスト比較（月 30,000 req の場合）**
> PAYG: 9,000×¥2.0 + 20,000×¥1.0 = **¥38,000**  
> Basic: **¥9,800**（同一リクエスト数で約 74% 削減）

---

### 17.5 プラン比較と競合ポジション

| 比較軸 | ココデミ（PAYG ミッドレンジ） | Google Maps Places (Pro) | Mapbox Tilequery |
|--------|---------------------------|--------------------------|-----------------|
| 単価（¥/1,000 req）| ¥1,000 | ¥4,800 | ¥75〜113（推定） |
| 日本EC特化         | ◎ | × | × |
| 商品短縮ID対応     | ◎ | × | × |
| 日本語サポート | ◎ | △ | △ |
| JPY請求            | ◎ | △（USD基本） | △（USD基本） |
| 無料枠（月間）     | 1,000 req | $200 クレジット相当 | 100,000 req |

---

### 17.6 価格設計上の方針

1. **原価カバー率:** バックエンド原価（AWS Lambda + RDS Proxy + SQS + Stripe 手数料）を超えるよう、単価下限を ¥0.3/req 以上に設定する
2. **JPY固定請求:** Stripe Billing の通貨を JPY に固定し、顧客の為替リスクを排除する
3. **Stripe tier 設定:** Metered Billing の段階的ティア（graduated tier）を使用し、PAYG の各帯域を Stripe 側で定義する
4. **透明性:** 料金計算式をダッシュボードでリアルタイム表示し、請求最終額を事前に把握できるようにする
5. **見直しサイクル:** サービス開始 6ヶ月後に原価・競合・利用実績をもとに価格改定を検討する

---

### 17.7 フェーズ別プラン提供計画

|フェーズ|提供プラン|
|---|---|
|Phase 1（MVP）|PAYG のみ（固定プランなし）、無料枠 1,000 req|
|Phase 2|Lite / Basic プランを追加|
|Phase 3|Growth / Pro プランを追加|
|Phase 4|Enterprise（SLA付き）対応|
