/**
 * 期限通知
 * スプレッドシートの日付列をチェックし、指定日数前の日付がある行を通知する
 *
 * セットアップ手順:
 * 1. Apps Scriptエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開く
 * 2. 必要なプロパティを設定（詳細はREADME.md参照）
 * 3. この関数をトリガーに設定（例: 毎日午前9時実行）
 *
 * 必要な環境変数:
 * - SHEET_NAME: 監視するシート名
 * - DATE_COLUMN: 日付列（例: L）
 * - DAYS_BEFORE_NOTIFICATION: 何日前に通知するか（例: 1）
 * - DATE_NOTIFICATION_TITLE: 通知タイトル（例: 【期限】支払期限が近い）
 * - NOTIFICATION_COLUMNS: 通知に含める列（カンマ区切り、例: D,E,F）
 * - NOTIFICATION_TYPE: 通知タイプ（SLACK, DISCORD, EMAIL）
 * - WEBHOOK_URL or EMAIL_RECIPIENT: 通知先
 */
function checkDatesAndNotify(): void {
  try {
    // 設定を取得
    const config = getDateConfig();

    Logger.log('Starting deadline check...');
    Logger.log(`Configuration: Sheet="${config.sheetName}", Column=${config.dateColumn}, Days=${config.daysBeforeNotification}`);

    // 期限に該当する行を取得
    const matchedRows = getDateRows(config);

    if (matchedRows.length === 0) {
      Logger.log('No deadlines found for notification');
      return;
    }

    Logger.log(`Found ${matchedRows.length} rows matching criteria`);

    // 通知を送信
    sendNotification(config, matchedRows, config.notificationTitle);

    Logger.log('Notification sent successfully');

  } catch (error) {
    Logger.log(`Error in checkDatesAndNotify: ${(error as Error).message}`);
    Logger.log(`Stack trace: ${(error as Error).stack}`);

    // エラー時は管理者にメール通知（オプション）
    notifyError(error as Error);
  }
}

/**
 * ステータス通知
 * スプレッドシートの複数列の条件をすべて満たす行を通知する（AND検索）
 *
 * セットアップ手順:
 * 1. Apps Scriptエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開く
 * 2. 必要なプロパティを設定（詳細はREADME.md参照）
 * 3. この関数をトリガーに設定（例: 毎日午前9時実行）
 *
 * 必要な環境変数:
 * - SHEET_NAME: 監視するシート名
 * - STATUS_MATCH_COLUMNS: チェックする列（カンマ区切り、例: B,C）
 * - STATUS_MATCH_VALUES: 各列の期待値（カンマ区切り、例: 未完了,重要）
 * - STATUS_NOTIFICATION_TITLE: 通知タイトル（例: 【要対応】未完了×重要）
 * - NOTIFICATION_COLUMNS: 通知に含める列（カンマ区切り、例: D,E,F）
 * - NOTIFICATION_TYPE: 通知タイプ（SLACK, DISCORD, EMAIL）
 * - WEBHOOK_URL or EMAIL_RECIPIENT: 通知先
 */
function checkStatusAndNotify(): void {
  try {
    // 設定を取得
    const config = getStatusMatchConfig();

    Logger.log('Starting status check...');
    Logger.log(`Configuration: Sheet="${config.sheetName}", Columns=${config.statusMatchColumns.join(',')}, Values=${config.statusMatchValues.join(',')}`);

    // ステータスに該当する行を取得
    const matchedRows = getStatusMatchRows(config);

    if (matchedRows.length === 0) {
      Logger.log('No matching rows found for notification');
      return;
    }

    Logger.log(`Found ${matchedRows.length} rows matching criteria`);

    // 通知を送信
    sendNotification(config, matchedRows, config.notificationTitle);

    Logger.log('Notification sent successfully');

  } catch (error) {
    Logger.log(`Error in checkStatusAndNotify: ${(error as Error).message}`);
    Logger.log(`Stack trace: ${(error as Error).stack}`);

    // エラー時は管理者にメール通知（オプション）
    notifyError(error as Error);
  }
}

/**
 * エラー通知関数（オプション）
 * 実行エラーが発生した場合にスクリプトオーナーに通知
 * @param error - エラーオブジェクト
 */
function notifyError(error: Error): void {
  try {
    const recipient = Session.getActiveUser().getEmail();
    if (recipient) {
      const subject = '[GAS] 日付通知スクリプトエラー';
      const body = `スクリプト実行中にエラーが発生しました。\n\nエラー内容:\n${error.message}\n\nスタックトレース:\n${error.stack}`;
      GmailApp.sendEmail(recipient, subject, body);
    }
  } catch (e) {
    Logger.log(`Failed to send error notification: ${(e as Error).message}`);
  }
}

/**
 * テスト実行用関数（期限通知）
 * スクリプトプロパティを設定せずに動作確認ができる
 */
function testDateNotify(): void {
  Logger.log('=== Test Date Notification ===');

  try {
    const config = getDateConfig();
    Logger.log('Test configuration:');
    Logger.log(JSON.stringify(config, null, 2));

    const matchedRows = getDateRows(config);
    Logger.log(`Found ${matchedRows.length} matching rows`);

    if (matchedRows.length > 0) {
      Logger.log('Matched rows:');
      Logger.log(JSON.stringify(matchedRows, null, 2));
    }
  } catch (error) {
    Logger.log(`Test error: ${(error as Error).message}`);
  }
}

/**
 * テスト実行用関数（ステータス通知）
 * スクリプトプロパティを設定せずに動作確認ができる
 */
function testStatusNotify(): void {
  Logger.log('=== Test Status Notification ===');

  try {
    const config = getStatusMatchConfig();
    Logger.log('Test configuration:');
    Logger.log(JSON.stringify(config, null, 2));

    const matchedRows = getStatusMatchRows(config);
    Logger.log(`Found ${matchedRows.length} matching rows`);

    if (matchedRows.length > 0) {
      Logger.log('Matched rows:');
      Logger.log(JSON.stringify(matchedRows, null, 2));
    }
  } catch (error) {
    Logger.log(`Test error: ${(error as Error).message}`);
  }
}
