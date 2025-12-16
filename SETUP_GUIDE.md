# セットアップガイド

## クイックスタート（5分で開始）

### Step 1: スプレッドシートを開く

通知を設定したいスプレッドシートを開きます。

### Step 2: Apps Scriptエディタを開く

1. メニューから「拡張機能」→「Apps Script」を選択
2. 新しいタブでApps Scriptエディタが開きます

### Step 3: コードをコピー

以下の順序でファイルを作成し、コードをコピーしてください:

1. **Config.js**
   - エディタで「＋」ボタン→「スクリプト」をクリック
   - ファイル名を `Config.js` に変更
   - `src/Config.js` の内容をコピー&ペースト

2. **DateUtils.js**
   - 同様に新しいスクリプトファイルを作成
   - `src/DateUtils.js` の内容をコピー&ペースト

3. **SpreadsheetService.js**
   - 同様に新しいスクリプトファイルを作成
   - `src/SpreadsheetService.js` の内容をコピー&ペースト

4. **NotificationService.js**
   - 同様に新しいスクリプトファイルを作成
   - `src/NotificationService.js` の内容をコピー&ペースト

5. **main.js**（すでに存在する `コード.gs` を編集）
   - デフォルトで存在する `コード.gs` の内容を全て削除
   - `src/main.js` の内容をコピー&ペースト

### Step 4: スクリプトプロパティを設定

#### Slack通知の場合

1. Apps Scriptエディタで左側の「⚙️ プロジェクトの設定」をクリック
2. 「スクリプトプロパティ」セクションまでスクロール
3. 「スクリプト プロパティを追加」をクリックし、以下を1つずつ追加:

```
プロパティ: SHEET_NAME
値: Sheet1（実際のシート名に変更）

プロパティ: DATE_COLUMN
値: L（日付が入っている列）

プロパティ: NOTIFICATION_TYPE
値: SLACK

プロパティ: WEBHOOK_URL
値: https://hooks.slack.com/services/YOUR/WEBHOOK/URL（実際のWebhook URLに変更）

プロパティ: NOTIFICATION_COLUMNS
値: D（通知に含めたい列をカンマ区切りで指定、例: D,E,F）

プロパティ: DAYS_BEFORE_NOTIFICATION
値: 1（何日前に通知するか）

プロパティ: DATE_NOTIFICATION_TITLE（オプション）
値: 日付通知（Slack/Discord/メール本文の見出しに使われる通知タイトル。例: 【期限】支払期限が近い）

プロパティ: DATE_SLACK_MENTION_USERS（オプション）
値: U12345678,U23456789（この通知だけSlackのユーザーをメンション。未設定なら SLACK_MENTION_USERS にフォールバック）

プロパティ: DATE_SLACK_MENTION_GROUPS（オプション）
値: S12345678（この通知だけSlackのユーザーグループをメンション。未設定なら SLACK_MENTION_GROUPS にフォールバック）

プロパティ: DATE_DISCORD_MENTION_USERS（オプション）
値: 123456789012345678（この通知だけDiscordのユーザーをメンション。未設定なら DISCORD_MENTION_USERS にフォールバック）

プロパティ: DATE_DISCORD_MENTION_ROLES（オプション）
値: 987654321098765432（この通知だけDiscordのロールをメンション。未設定なら DISCORD_MENTION_ROLES にフォールバック）

プロパティ: SLACK_MENTION_USERS（オプション）
値: U12345678,U23456789（SlackのユーザーID。通知本文/ブロック先頭で <@...> としてメンションされます）

プロパティ: SLACK_MENTION_GROUPS（オプション）
値: S12345678,S23456789（SlackのユーザーグループID。 <!subteam^...> としてメンションされます）

プロパティ: DISCORD_MENTION_USERS（オプション）
値: 123456789012345678,234567890123456789（DiscordのユーザーID。content に <@...> を入れ、allowed_mentions.parse=['users'] で許可します）

プロパティ: DISCORD_MENTION_ROLES（オプション）
値: 987654321098765432（DiscordのロールID。content に <@&...> を入れ、allowed_mentions.parse=['roles'] で許可します）

プロパティ: SHEET_URL（オプション）
値: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0
```

#### ステータス通知（AND検索）を使う場合

`checkStatusAndNotify()` をトリガーにする場合は、上記に加えて以下も設定します:

```
プロパティ: STATUS_MATCH_COLUMNS
値: B,C（チェックする列をカンマ区切りで指定）

プロパティ: STATUS_MATCH_VALUES
値: 未完了,重要（各列の期待値をカンマ区切りで指定）

プロパティ: STATUS_NOTIFICATION_TITLE（オプション）
値: ステータス通知（Slack/Discord/メール本文の見出しに使われる通知タイトル。例: 【要対応】未完了×重要）

プロパティ: STATUS_SLACK_MENTION_USERS（オプション）
値: U12345678,U23456789（この通知だけSlackのユーザーをメンション。未設定なら SLACK_MENTION_USERS にフォールバック）

プロパティ: STATUS_SLACK_MENTION_GROUPS（オプション）
値: S12345678（この通知だけSlackのユーザーグループをメンション。未設定なら SLACK_MENTION_GROUPS にフォールバック）

プロパティ: STATUS_DISCORD_MENTION_USERS（オプション）
値: 123456789012345678（この通知だけDiscordのユーザーをメンション。未設定なら DISCORD_MENTION_USERS にフォールバック）

プロパティ: STATUS_DISCORD_MENTION_ROLES（オプション）
値: 987654321098765432（この通知だけDiscordのロールをメンション。未設定なら DISCORD_MENTION_ROLES にフォールバック）
```

#### Discord通知の場合

Slack通知と同じ手順で、以下のように設定:

```
NOTIFICATION_TYPE = DISCORD
WEBHOOK_URL = https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

#### メール通知の場合

Slack通知と同じ手順で、以下のように設定:

```
NOTIFICATION_TYPE = EMAIL
EMAIL_RECIPIENT = your-email@example.com
EMAIL_SUBJECT = 期限通知（オプション）
```

※ `EMAIL_SUBJECT` は「メール件名」です。Slack/Discord/メール本文の見出しの通知タイトルは `DATE_NOTIFICATION_TITLE` / `STATUS_NOTIFICATION_TITLE` で別に設定できます。

### Step 5: トリガーを設定

1. Apps Scriptエディタで左側の「⏰ トリガー」アイコンをクリック
2. 右下の「＋トリガーを追加」をクリック
3. 以下のように設定:
   - **実行する関数を選択**: `checkDatesAndNotify`
   - **実行するデプロイを選択**: `Head`
   - **イベントのソースを選択**: `時間主導型`
   - **時間ベースのトリガーのタイプを選択**: `日付ベースのタイマー`
   - **時刻を選択**: `午前9時～10時`（任意の時間帯）
4. 「保存」をクリック
5. 初回は権限の承認画面が表示されるので、承認してください

### Step 6: 動作確認

1. Apps Scriptエディタで上部の「実行する関数を選択」から `checkDatesAndNotify` を選択
2. 「実行」ボタンをクリック
3. 「実行ログ」を確認して、エラーがないことを確認

## Webhook URLの取得方法

### Slackの場合

1. [Slack API](https://api.slack.com/apps) にアクセス
2. 「Create New App」をクリック
3. 「From scratch」を選択
4. App名とワークスペースを選択
5. 「Incoming Webhooks」をクリック
6. 「Activate Incoming Webhooks」をオンに
7. 「Add New Webhook to Workspace」をクリック
8. 通知を送信するチャンネルを選択
9. 表示されたWebhook URLをコピー

### Discordの場合

1. Discordで通知を送信したいチャンネルを開く
2. チャンネル設定（⚙️アイコン）をクリック
3. 「連携サービス」→「ウェブフック」をクリック
4. 「新しいウェブフック」をクリック
5. ウェブフック名を設定（例: 期限通知Bot）
6. 「ウェブフックURLをコピー」をクリック

## よくある質問

### Q: 複数のシートを監視できますか？

A: 現在のバージョンでは1つのシートのみ対応しています。複数のシートを監視する場合は、スクリプトを複製し、それぞれ異なる設定でトリガーを設定してください。

### Q: 通知を複数の宛先に送信できますか？

A: 現在のバージョンでは1つの宛先のみ対応しています。複数の宛先に送信する場合は、Slackの場合は複数のチャンネルに投稿するアプリを作成、メールの場合は `EMAIL_RECIPIENT` にカンマ区切りで複数のアドレスを設定（要コード修正）してください。

### Q: 締め切り当日ではなく、複数日前に通知することはできますか？

A: はい。`DAYS_BEFORE_NOTIFICATION` に任意の数値を設定してください。例えば `7` に設定すると、7日前に通知されます。

### Q: 土日を除外して通知できますか？

A: 現在のバージョンでは対応していません。必要な場合は `src/main.js` の `checkDatesAndNotify()` 関数に曜日判定ロジックを追加してください。

### Q: エラーが発生しました

A: 以下を確認してください:
1. スクリプトプロパティが正しく設定されているか
2. 締め切り列に日付データが入っているか
3. Webhook URLが正しいか
4. 実行ログで詳細なエラーメッセージを確認

## サポート

さらに詳しい情報は `README.md` を参照してください。
