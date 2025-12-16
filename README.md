# Sheet Condition Alert

スプレッドシートの条件に基づいて自動通知を行うGoogle Apps Scriptです。

以下の2つの関数を提供しています：
- **`checkDatesAndNotify()`**: 日付列をチェックし、指定日数前になったら通知
- **`checkStatusAndNotify()`**: 複数列の条件をすべて満たす行を通知（AND検索）

通知先はSlack、Discord、メールのいずれかです。

両方の通知が欲しい場合は、それぞれの関数にトリガーを設定してください。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. TypeScriptをビルド

```bash
npm run build
```

これで `src/` 配下のTypeScriptファイルが `dist/` にJavaScriptとしてコンパイルされます。

### 3. GASにデプロイ
```bash
npm run deploy
```

または手動でデプロイ:

```bash
clasp push
```

### 4. スクリプトプロパティを設定

Apps Scriptエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開き、以下を設定します。

#### 共通の必須項目

| プロパティ名 | 説明 | 例 |
|------------|------|-----|
| `SHEET_NAME` | 監視するシート名 | `Sheet1` |
| `NOTIFICATION_TYPE` | 通知タイプ | `SLACK`、`DISCORD`、`EMAIL` のいずれか |
| `NOTIFICATION_COLUMNS` | 通知に含める列（カンマ区切り） | `D,E,F` |

#### 通知タイプ別の必須項目

**Slack/Discord の場合:**

| プロパティ名 | 説明 | 例 |
|------------|------|-----|
| `WEBHOOK_URL` | Webhook URL | `https://hooks.slack.com/services/...` |

**メールの場合:**

| プロパティ名 | 説明 | 例 |
|------------|------|-----|
| `EMAIL_RECIPIENT` | 送信先メールアドレス | `alert@example.com` |

#### 期限通知用の設定

`checkDatesAndNotify()` を使う場合：

| プロパティ名 | 説明 | 例 | デフォルト値 |
|------------|------|-----|------------|
| `DATE_COLUMN` | 日付列 | `L` | `L` |
| `DAYS_BEFORE_NOTIFICATION` | 何日前に通知するか | `1` | `1` |
| `DATE_NOTIFICATION_TITLE` | 通知タイトル（Slack/Discord/メール本文の見出し） | `【期限】支払期限が近い` | `日付通知` |
| `DATE_SLACK_MENTION_USERS` | Slackユーザーメンション対象（ユーザーIDをカンマ区切り） | `U123...,U234...` | (未設定なら共通設定) |
| `DATE_SLACK_MENTION_GROUPS` | Slackグループメンション対象（ユーザーグループIDをカンマ区切り） | `S123...,S234...` | (未設定なら共通設定) |
| `DATE_DISCORD_MENTION_USERS` | Discordユーザーメンション対象（ユーザーIDをカンマ区切り） | `123...,234...` | (未設定なら共通設定) |
| `DATE_DISCORD_MENTION_ROLES` | Discordロールメンション対象（ロールIDをカンマ区切り） | `987...` | (未設定なら共通設定) |

#### ステータス通知用の設定

`checkStatusAndNotify()` を使う場合：

| プロパティ名 | 説明 | 例 |
|------------|------|-----|
| `STATUS_MATCH_COLUMNS` | チェックする列（カンマ区切り） | `B,C` |
| `STATUS_MATCH_VALUES` | 各列の期待値（カンマ区切り） | `未完了,重要` |
| `STATUS_NOTIFICATION_TITLE` | 通知タイトル（Slack/Discord/メール本文の見出し） | `【要対応】未完了×重要` |
| `STATUS_SLACK_MENTION_USERS` | Slackユーザーメンション対象（ユーザーIDをカンマ区切り） | `U123...,U234...` |
| `STATUS_SLACK_MENTION_GROUPS` | Slackグループメンション対象（ユーザーグループIDをカンマ区切り） | `S123...,S234...` |
| `STATUS_DISCORD_MENTION_USERS` | Discordユーザーメンション対象（ユーザーIDをカンマ区切り） | `123...,234...` |
| `STATUS_DISCORD_MENTION_ROLES` | Discordロールメンション対象（ロールIDをカンマ区切り） | `987...` |

**注意**: `STATUS_MATCH_COLUMNS` と `STATUS_MATCH_VALUES` の数は一致する必要があります。

#### 共通のオプション項目

| プロパティ名 | 説明 | デフォルト値 |
|------------|------|------------|
| `SHEET_URL` | スプレッドシートのURL（行リンク生成用） | (空文字列) |
| `START_ROW` | データ開始行 | `2` |
| `TIMEZONE` | タイムゾーン | `Asia/Tokyo` |
| `EMAIL_SUBJECT` | メール件名 | `期限通知` または `ステータス通知` |
| `SLACK_MENTION_USERS` | Slackユーザーメンション対象（カンマ区切りでユーザーID） | (空) |
| `SLACK_MENTION_GROUPS` | Slackグループメンション対象（カンマ区切りでユーザーグループID） | (空) |
| `DISCORD_MENTION_USERS` | Discordユーザーメンション対象（カンマ区切りでユーザーID） | (空) |
| `DISCORD_MENTION_ROLES` | Discordロールメンション対象（カンマ区切りでロールID） | (空) |

### 5. トリガーを設定

#### 期限通知の場合

1. Apps Scriptエディタで「トリガー」アイコンをクリック
2. 「トリガーを追加」をクリック
3. 以下の設定を行う:
   - 実行する関数: **`checkDatesAndNotify`**
   - イベントのソース: `時間主導型`
   - 時間ベースのトリガー: `日付ベースのタイマー`
   - 時刻: `午前9時～10時` など任意の時間帯

#### ステータス通知の場合

1. Apps Scriptエディタで「トリガー」アイコンをクリック
2. 「トリガーを追加」をクリック
3. 以下の設定を行う:
   - 実行する関数: **`checkStatusAndNotify`**
   - イベントのソース: `時間主導型`
   - 時間ベースのトリガー: `日付ベースのタイマー`
   - 時刻: `午前9時～10時` など任意の時間帯

#### 両方使う場合

上記の2つのトリガーを両方とも作成してください。

## 使用例

### 例1: 期限通知のみ（Slack）

```
SHEET_NAME = タスク管理
DATE_COLUMN = L
DAYS_BEFORE_NOTIFICATION = 1
NOTIFICATION_COLUMNS = D,E,F
NOTIFICATION_TYPE = SLACK
WEBHOOK_URL = https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

トリガー: `checkDatesAndNotify`

### 例2: ステータス通知のみ（Discord）

B列が「未完了」で、C列が「重要」の行を通知：

```
SHEET_NAME = プロジェクト管理
STATUS_MATCH_COLUMNS = B,C
STATUS_MATCH_VALUES = 未完了,重要
NOTIFICATION_COLUMNS = D,E,F
NOTIFICATION_TYPE = DISCORD
WEBHOOK_URL = https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

トリガー: `checkStatusAndNotify`

### 例3: 期限通知とステータス通知の両方

**スクリプトプロパティ:**
```
SHEET_NAME = タスク管理
DATE_COLUMN = L
DAYS_BEFORE_NOTIFICATION = 1
STATUS_MATCH_COLUMNS = B,C
STATUS_MATCH_VALUES = 未完了,重要
NOTIFICATION_COLUMNS = D,E,F
NOTIFICATION_TYPE = SLACK
WEBHOOK_URL = https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**トリガー:**
- トリガー1: `checkDatesAndNotify` （毎日午前9時）
- トリガー2: `checkStatusAndNotify` （毎日午前9時）

### 例4: 複雑なステータス通知（3条件のAND検索）

A列="販売中" AND B列="在庫僅少" AND C列="人気商品"：

```
SHEET_NAME = 在庫管理
STATUS_MATCH_COLUMNS = A,B,C
STATUS_MATCH_VALUES = 販売中,在庫僅少,人気商品
NOTIFICATION_COLUMNS = D,E,F,G
NOTIFICATION_TYPE = EMAIL
EMAIL_RECIPIENT = manager@example.com
EMAIL_SUBJECT = 【緊急】在庫僅少の人気商品
```

トリガー: `checkStatusAndNotify`


## テスト実行

設定が正しいか確認するには、以下のテスト関数を使用できます:

- **期限通知のテスト**: `testDateNotify()`
- **ステータス通知のテスト**: `testStatusNotify()`

### 手順

1. スクリプトプロパティを設定
2. TypeScriptをビルド: `npm run build`
3. GASにpush: `npm run push`
4. Apps Scriptエディタで `testDateNotify` または `testStatusNotify` を選択して実行
5. 「実行ログ」で結果を確認

## トラブルシューティング

### 通知が送信されない

- スクリプトプロパティが正しく設定されているか確認
- 実行ログ（Apps Scriptエディタの「実行数」）でエラーを確認
- `DATE_COLUMN` に日付形式のデータが入っているか確認

### 権限エラーが発生する

- 初回実行時に承認画面が表示されるので、アクセスを許可してください
- GmailApp（メール通知）を使用する場合、Gmail送信権限が必要です

### Webhook URLが機能しない

- **Slack**: Webhook URLが `https://hooks.slack.com/services/` で始まるか確認
- **Discord**: Webhook URLが `https://discord.com/api/webhooks/` で始まるか確認
- URLにスペースや改行が含まれていないか確認

## 関数の仕様

### checkDatesAndNotify()

- **用途**: 日付列をチェックし、指定日数前になったら通知
- **必要な環境変数**:
  - `DATE_COLUMN`: 日付列（例: L）
  - `DAYS_BEFORE_NOTIFICATION`: 何日前に通知するか（例: 1）
- **動作**: `DATE_COLUMN`で指定した列の日付をチェックし、今日から`DAYS_BEFORE_NOTIFICATION`日後の日付がある行を抽出して通知します

### checkStatusAndNotify()

- **用途**: 複数列の条件をすべて満たす行を通知（AND検索）
- **必要な環境変数**:
  - `STATUS_MATCH_COLUMNS`: チェックする列（カンマ区切り、例: B,C）
  - `STATUS_MATCH_VALUES`: 各列の期待値（カンマ区切り、例: 未完了,重要）
- **動作**: `STATUS_MATCH_COLUMNS`と`STATUS_MATCH_VALUES`で指定したすべての条件を満たす行を抽出して通知します（完全一致のAND検索）
- **注意**: 期限は関係なく、条件に一致すれば常に通知されます

## アーキテクチャ

### TypeScript構成（開発）

```
src/
├── main.ts                           2つのメイン関数
├── Config.ts                         設定管理・バリデーション
├── DateUtils.ts                      日付計算・フォーマット
├── SpreadsheetService.ts             期限データ抽出
├── StatusMatchService.ts             ステータスデータ抽出
└── NotificationService.ts            通知送信（Slack/Discord/Email）
```

### ビルド後（GASにデプロイ）

```
dist/
├── main.js                           コンパイル済みJS
├── Config.js
├── DateUtils.js
├── SpreadsheetService.js
├── StatusMatchService.js
└── NotificationService.js
```

**依存関係の読み込み順序** (`.clasp.json` で管理):
1. DateUtils.js
2. Config.js
3. SpreadsheetService.js
4. StatusMatchService.js
5. NotificationService.js
6. main.js

## セキュリティについて

- Webhook URLやメールアドレスは必ずスクリプトプロパティに設定してください
- スクリプトプロパティは暗号化されて保存されます
- コード内にシークレット情報をハードコードしないでください

## ライセンス

MIT License

## サポート

問題が発生した場合は、実行ログを確認してください。エラーが発生すると、スクリプトオーナーに自動でメール通知が送信されます。
