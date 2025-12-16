/**
 * 設定管理モジュール
 * スクリプトプロパティから設定を読み込み、バリデーションを行う
 */

/**
 * 通知タイプ
 */
type NotificationType = 'SLACK' | 'DISCORD' | 'EMAIL';

/**
 * 期限通知の設定
 */
interface DateConfig {
  sheetName: string;
  sheetUrl: string;
  dateColumn: string;
  daysBeforeNotification: number;
  notificationTitle: string;
  slackMentionUserIds: string[];
  slackMentionGroupIds: string[];
  discordMentionUserIds: string[];
  discordMentionRoleIds: string[];
  notificationColumns: string[];
  notificationType: NotificationType;
  webhookUrl: string;
  emailRecipient: string;
  emailSubject: string;
  timezone: string;
  startRow: number;
}

/**
 * ステータス通知の設定
 */
interface StatusMatchConfig {
  sheetName: string;
  sheetUrl: string;
  statusMatchColumns: string[];
  statusMatchValues: string[];
  notificationTitle: string;
  slackMentionUserIds: string[];
  slackMentionGroupIds: string[];
  discordMentionUserIds: string[];
  discordMentionRoleIds: string[];
  notificationColumns: string[];
  notificationType: NotificationType;
  webhookUrl: string;
  emailRecipient: string;
  emailSubject: string;
  timezone: string;
  startRow: number;
}

/**
 * 期限通知の設定を取得する
 * @returns 期限通知設定オブジェクト
 * @throws 必須設定が不足している場合
 */
function getDateConfig(): DateConfig {
  const props = PropertiesService.getScriptProperties();

  const dateSlackMentionUsersRaw = props.getProperty('DATE_SLACK_MENTION_USERS');
  const dateSlackMentionGroupsRaw = props.getProperty('DATE_SLACK_MENTION_GROUPS');
  const dateDiscordMentionUsersRaw = props.getProperty('DATE_DISCORD_MENTION_USERS');
  const dateDiscordMentionRolesRaw = props.getProperty('DATE_DISCORD_MENTION_ROLES');

  const config: DateConfig = {
    // スプレッドシート設定
    sheetName: props.getProperty('SHEET_NAME') || 'Sheet1',
    sheetUrl: props.getProperty('SHEET_URL') || '',

    // 期限設定
    dateColumn: props.getProperty('DATE_COLUMN') || 'L',
    daysBeforeNotification: parseInt(props.getProperty('DAYS_BEFORE_NOTIFICATION') || '1', 10),

    // 通知タイトル（Slack/Discord/メール本文の見出し）
    notificationTitle: props.getProperty('DATE_NOTIFICATION_TITLE') || '日付通知',

    // メンション（複数指定可）
    // 個別キーが設定されていればそれを優先（空文字も「指定」として扱う）
    // 個別キーが未設定(null)の場合は共通キーにフォールバック
    slackMentionUserIds: parseCsv(dateSlackMentionUsersRaw !== null ? dateSlackMentionUsersRaw : props.getProperty('SLACK_MENTION_USERS')),
    slackMentionGroupIds: parseCsv(dateSlackMentionGroupsRaw !== null ? dateSlackMentionGroupsRaw : props.getProperty('SLACK_MENTION_GROUPS')),
    discordMentionUserIds: parseCsv(dateDiscordMentionUsersRaw !== null ? dateDiscordMentionUsersRaw : props.getProperty('DISCORD_MENTION_USERS')),
    discordMentionRoleIds: parseCsv(dateDiscordMentionRolesRaw !== null ? dateDiscordMentionRolesRaw : props.getProperty('DISCORD_MENTION_ROLES')),

    // 通知内容設定
    notificationColumns: (props.getProperty('NOTIFICATION_COLUMNS') || 'D').split(',').map(col => col.trim()),

    // 通知先設定
    notificationType: (props.getProperty('NOTIFICATION_TYPE') || 'SLACK') as NotificationType,
    webhookUrl: props.getProperty('WEBHOOK_URL') || '',
    emailRecipient: props.getProperty('EMAIL_RECIPIENT') || '',
    emailSubject: props.getProperty('EMAIL_SUBJECT') || '期限通知',

    // タイムゾーン設定
    timezone: props.getProperty('TIMEZONE') || 'Asia/Tokyo',

    // データ範囲設定
    startRow: parseInt(props.getProperty('START_ROW') || '2', 10)
  };

  validateDateConfig(config);

  return config;
}

/**
 * ステータス通知の設定を取得する
 * @returns ステータス通知設定オブジェクト
 * @throws 必須設定が不足している場合
 */
function getStatusMatchConfig(): StatusMatchConfig {
  const props = PropertiesService.getScriptProperties();

  const statusSlackMentionUsersRaw = props.getProperty('STATUS_SLACK_MENTION_USERS');
  const statusSlackMentionGroupsRaw = props.getProperty('STATUS_SLACK_MENTION_GROUPS');
  const statusDiscordMentionUsersRaw = props.getProperty('STATUS_DISCORD_MENTION_USERS');
  const statusDiscordMentionRolesRaw = props.getProperty('STATUS_DISCORD_MENTION_ROLES');

  const config: StatusMatchConfig = {
    // スプレッドシート設定
    sheetName: props.getProperty('SHEET_NAME') || 'Sheet1',
    sheetUrl: props.getProperty('SHEET_URL') || '',

    // ステータスマッチ設定
    statusMatchColumns: (props.getProperty('STATUS_MATCH_COLUMNS') || '').split(',').map(col => col.trim()).filter(col => col),
    statusMatchValues: (props.getProperty('STATUS_MATCH_VALUES') || '').split(',').map(val => val.trim()).filter(val => val),

    // 通知タイトル（Slack/Discord/メール本文の見出し）
    notificationTitle: props.getProperty('STATUS_NOTIFICATION_TITLE') || 'ステータス通知',

    // メンション（複数指定可）
    // 個別キーが設定されていればそれを優先（空文字も「指定」として扱う）
    // 個別キーが未設定(null)の場合は共通キーにフォールバック
    slackMentionUserIds: parseCsv(statusSlackMentionUsersRaw !== null ? statusSlackMentionUsersRaw : props.getProperty('SLACK_MENTION_USERS')),
    slackMentionGroupIds: parseCsv(statusSlackMentionGroupsRaw !== null ? statusSlackMentionGroupsRaw : props.getProperty('SLACK_MENTION_GROUPS')),
    discordMentionUserIds: parseCsv(statusDiscordMentionUsersRaw !== null ? statusDiscordMentionUsersRaw : props.getProperty('DISCORD_MENTION_USERS')),
    discordMentionRoleIds: parseCsv(statusDiscordMentionRolesRaw !== null ? statusDiscordMentionRolesRaw : props.getProperty('DISCORD_MENTION_ROLES')),

    // 通知内容設定
    notificationColumns: (props.getProperty('NOTIFICATION_COLUMNS') || 'D').split(',').map(col => col.trim()),

    // 通知先設定
    notificationType: (props.getProperty('NOTIFICATION_TYPE') || 'SLACK') as NotificationType,
    webhookUrl: props.getProperty('WEBHOOK_URL') || '',
    emailRecipient: props.getProperty('EMAIL_RECIPIENT') || '',
    emailSubject: props.getProperty('EMAIL_SUBJECT') || 'ステータス通知',

    // タイムゾーン設定
    timezone: props.getProperty('TIMEZONE') || 'Asia/Tokyo',

    // データ範囲設定
    startRow: parseInt(props.getProperty('START_ROW') || '2', 10)
  };

  validateStatusMatchConfig(config);

  return config;
}

/**
 * 期限通知設定のバリデーション
 * @param config - 期限通知設定オブジェクト
 * @throws バリデーションエラー
 */
function validateDateConfig(config: DateConfig): void {
  // 必須項目チェック
  if (!config.sheetName) {
    throw new Error('SHEET_NAME is required');
  }

  if (!config.dateColumn) {
    throw new Error('DATE_COLUMN is required');
  }

  if (isNaN(config.daysBeforeNotification) || config.daysBeforeNotification < 0) {
    throw new Error('DAYS_BEFORE_NOTIFICATION must be a non-negative number');
  }

  // 通知タイプ別の必須項目チェック
  const validTypes: NotificationType[] = ['SLACK', 'DISCORD', 'EMAIL'];
  if (!validTypes.includes(config.notificationType)) {
    throw new Error(`NOTIFICATION_TYPE must be one of: ${validTypes.join(', ')}`);
  }

  if ((config.notificationType === 'SLACK' || config.notificationType === 'DISCORD') && !config.webhookUrl) {
    throw new Error('WEBHOOK_URL is required for Slack/Discord notifications');
  }

  if (config.notificationType === 'EMAIL' && !config.emailRecipient) {
    throw new Error('EMAIL_RECIPIENT is required for email notifications');
  }
}

/**
 * ステータス通知設定のバリデーション
 * @param config - ステータス通知設定オブジェクト
 * @throws バリデーションエラー
 */
function validateStatusMatchConfig(config: StatusMatchConfig): void {
  // 必須項目チェック
  if (!config.sheetName) {
    throw new Error('SHEET_NAME is required');
  }

  if (!config.statusMatchColumns || config.statusMatchColumns.length === 0) {
    throw new Error('STATUS_MATCH_COLUMNS is required');
  }

  if (!config.statusMatchValues || config.statusMatchValues.length === 0) {
    throw new Error('STATUS_MATCH_VALUES is required');
  }

  if (config.statusMatchColumns.length !== config.statusMatchValues.length) {
    throw new Error('STATUS_MATCH_COLUMNS and STATUS_MATCH_VALUES must have the same length');
  }

  // 通知タイプ別の必須項目チェック
  const validTypes: NotificationType[] = ['SLACK', 'DISCORD', 'EMAIL'];
  if (!validTypes.includes(config.notificationType)) {
    throw new Error(`NOTIFICATION_TYPE must be one of: ${validTypes.join(', ')}`);
  }

  if ((config.notificationType === 'SLACK' || config.notificationType === 'DISCORD') && !config.webhookUrl) {
    throw new Error('WEBHOOK_URL is required for Slack/Discord notifications');
  }

  if (config.notificationType === 'EMAIL' && !config.emailRecipient) {
    throw new Error('EMAIL_RECIPIENT is required for email notifications');
  }
}

/**
 * スクリプトプロパティを一括設定するヘルパー関数（初回セットアップ用）
 * 実際の運用では Apps Script エディタのプロパティ設定から行うことを推奨
 * @param properties - 設定するプロパティのキーバリューペア
 */
function setScriptProperties(properties: Record<string, string>): void {
  const props = PropertiesService.getScriptProperties();
  props.setProperties(properties);
  Logger.log('Script properties have been set successfully');
}

/**
 * CSV（カンマ区切り）を配列にパースする
 * - 空文字/未設定は []
 * - 空白は除去
 */
function parseCsv(value?: string | null): string[] {
  return (value || '')
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length > 0);
}
