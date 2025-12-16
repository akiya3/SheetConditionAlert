/**
 * 通知サービスモジュール
 * Slack、Discord、メールへの通知を抽象化
 */

/**
 * 通知インターフェース
 */
interface Notifier {
  send(matchedRows: RowData[]): void;
  buildMessage(matchedRows: RowData[]): string;
}

/**
 * Slack用メンション文字列を組み立てる（複数対応）
 * - ユーザー: <@U123...>
 * - グループ(ユーザーグループ): <!subteam^S123...>
 */
function buildSlackMentionText(config: DateConfig | StatusMatchConfig): string {
  const parts: string[] = [];
  (config.slackMentionUserIds || []).forEach((id) => parts.push(`<@${id}>`));
  (config.slackMentionGroupIds || []).forEach((id) => parts.push(`<!subteam^${id}>`));
  return parts.join(' ').trim();
}

/**
 * Discord用メンション文字列を組み立てる（複数対応）
 * - ユーザー: <@123...>
 * - ロール: <@&987...>
 */
function buildDiscordMentionText(config: DateConfig | StatusMatchConfig): string {
  const parts: string[] = [];
  (config.discordMentionUserIds || []).forEach((id) => parts.push(`<@${id}>`));
  (config.discordMentionRoleIds || []).forEach((id) => parts.push(`<@&${id}>`));
  return parts.join(' ').trim();
}

/**
 * 通知を送信する（ファクトリーパターン）
 * @param config - 設定オブジェクト（DateConfig または StatusMatchConfig）
 * @param matchedRows - 通知対象の行データ
 * @param ruleName - ルール名（通知タイトルに使用）
 */
function sendNotification(config: DateConfig | StatusMatchConfig, matchedRows: RowData[], ruleName: string): void {
  if (!matchedRows || matchedRows.length === 0) {
    Logger.log('No rows to notify');
    return;
  }

  try {
    const notifier = getNotifier(config, ruleName);
    notifier.send(matchedRows);
    Logger.log(`Successfully sent notification to ${config.notificationType}`);
  } catch (error) {
    Logger.log(`Failed to send notification: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * 通知タイプに応じた通知オブジェクトを取得
 * @param config - 設定オブジェクト（DateConfig または StatusMatchConfig）
 * @param ruleName - ルール名
 * @returns 通知オブジェクト
 */
function getNotifier(config: DateConfig | StatusMatchConfig, ruleName: string): Notifier {
  switch (config.notificationType) {
    case 'SLACK':
      return new SlackNotifier(config, ruleName);
    case 'DISCORD':
      return new DiscordNotifier(config, ruleName);
    case 'EMAIL':
      return new EmailNotifier(config, ruleName);
    default:
      throw new Error(`Unknown notification type: ${config.notificationType}`);
  }
}

/**
 * Slack通知クラス
 */
class SlackNotifier implements Notifier {
  constructor(private config: DateConfig | StatusMatchConfig, private ruleName: string) { }

  send(matchedRows: RowData[]): void {
    const payload = this.buildPayload(matchedRows);

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.config.webhookUrl, options);

    if (response.getResponseCode() !== 200) {
      throw new Error(`Slack API error: ${response.getContentText()}`);
    }
  }

  buildMessage(matchedRows: RowData[]): string {
    const lines: string[] = [];
    const mentionText = buildSlackMentionText(this.config);
    if (mentionText) {
      lines.push(mentionText);
    }
    lines.push(`${this.ruleName}`);
    lines.push(`該当件数: ${matchedRows.length}件`);

    matchedRows.forEach((row) => {
      const rowLabel = row.rowUrl ? `<${row.rowUrl}|${row.rowNumber}行目>` : `${row.rowNumber}行目`;
      const dateInfo = row.date ? ` ${row.date}` : '';
      lines.push(`${rowLabel}${dateInfo}`);

      Object.entries(row.columns).forEach(([col, value]) => {
        lines.push(`   [${col}列] ${value}`);
      });
    });

    return lines.join('\n');
  }

  private buildPayload(matchedRows: RowData[]): SlackPayload {
    const sheetInfo = this.resolveSheetInfo();
    const blocks: SlackBlock[] = [];
    const mentionText = buildSlackMentionText(this.config);
    const headerPrefix = mentionText ? `${mentionText}\n` : '';

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${headerPrefix}*${this.ruleName}*\n該当件数：${matchedRows.length}件\nシート：${sheetInfo.title}\nURL：${sheetInfo.sheetUrl}`
      }
    });

    matchedRows.forEach((row, index) => {
      if (index > 0 || blocks.length > 0) {
        blocks.push({ type: 'divider' });
      }

      blocks.push({
        type: 'section',
        fields: this.buildFields(row, sheetInfo)
      });
    });

    return {
      text: this.buildMessage(matchedRows),
      blocks
    };
  }

  private buildFields(row: RowData, sheetInfo: SheetInfo): SlackField[] {
    const fields: SlackField[] = [];

    // 行番号
    fields.push({
      type: 'mrkdwn',
      text: row.rowUrl ? `*行番号*\n<${row.rowUrl}|${row.rowNumber}>` : `*行番号*\n${row.rowNumber}`
    });

    // 日付（ある場合のみ）
    if (row.date) {
      fields.push({
        type: 'mrkdwn',
        text: `*日付*\n${row.date}`
      });
    }

    // 通知列
    Object.entries(row.columns).forEach(([column, value]) => {
      const label = sheetInfo.columnLabels[column] || `${column}列`;
      fields.push({
        type: 'mrkdwn',
        text: `*${label}*\n${value || '-'}`
      });
    });

    return fields;
  }

  private resolveSheetInfo(): SheetInfo {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(this.config.sheetName);

    if (!sheet) {
      return {
        sheetUrl: spreadsheet.getUrl(),
        title: this.config.sheetName,
        columnLabels: {}
      };
    }

    const sheetUrl = `${spreadsheet.getUrl()}#gid=${sheet.getSheetId()}`;

    return {
      sheetUrl,
      title: sheet.getName(),
      columnLabels: getColumnLabelsFromSheet(sheet, this.config.startRow)
    };
  }
}

type SlackBlock = SlackSectionBlock | SlackDividerBlock;

interface SlackSectionBlock {
  type: 'section';
  text?: SlackTextObject;
  fields?: SlackField[];
}

interface SlackDividerBlock {
  type: 'divider';
}

interface SlackTextObject {
  type: 'mrkdwn';
  text: string;
}

interface SlackField extends SlackTextObject { }

interface SlackPayload {
  text: string;
  blocks: SlackBlock[];
}

interface SheetInfo {
  sheetUrl: string;
  title: string;
  columnLabels: Record<string, string>;
}

/**
 * Discord Embed型定義
 */
interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordField[];
  timestamp?: string;
}

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordPayload {
  content?: string;
  allowed_mentions?: DiscordAllowedMentions;
  embeds: DiscordEmbed[];
}

interface DiscordAllowedMentions {
  parse?: Array<'users' | 'roles' | 'everyone'>;
}

/**
 * Discord通知クラス
 */
class DiscordNotifier implements Notifier {
  constructor(private config: DateConfig | StatusMatchConfig, private ruleName: string) { }

  send(matchedRows: RowData[]): void {
    const payload = this.buildPayload(matchedRows);

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.config.webhookUrl, options);

    if (response.getResponseCode() !== 204 && response.getResponseCode() !== 200) {
      throw new Error(`Discord API error: ${response.getContentText()}`);
    }
  }

  buildMessage(matchedRows: RowData[]): string {
    const mentionText = buildDiscordMentionText(this.config);
    let message = mentionText ? `${mentionText}\n` : '';
    message += `⚠️ **${this.ruleName}**\n`;
    message += `該当件数: ${matchedRows.length}件\n\n`;

    matchedRows.forEach((row) => {
      const dateInfo = row.date ? ` ${row.date}` : '';
      if (row.rowUrl) {
        message += `[${row.rowNumber}行目](${row.rowUrl})${dateInfo}\n`;
      } else {
        message += `${row.rowNumber}行目${dateInfo}\n`;
      }

      // 各列の情報を追加
      Object.entries(row.columns).forEach(([col, value]) => {
        message += `   **[${col}列]** ${value}\n`;
      });

      message += '\n';
    });

    return message;
  }

  private buildPayload(matchedRows: RowData[]): DiscordPayload {
    const sheetInfo = this.resolveSheetInfo();
    const embeds: DiscordEmbed[] = [];
    const mentionText = buildDiscordMentionText(this.config);
    const parseTargets: Array<'users' | 'roles'> = [];
    if (this.config.discordMentionUserIds?.length) parseTargets.push('users');
    if (this.config.discordMentionRoleIds?.length) parseTargets.push('roles');
    const allowedMentions: DiscordAllowedMentions | undefined =
      parseTargets.length ? { parse: parseTargets } : undefined;

    // ヘッダーEmbed
    embeds.push({
      title: `${this.ruleName}`,
      description: `該当件数：${matchedRows.length}件`,
      color: 15105570, // #E67E22 (オレンジ)
      fields: [
        {
          name: '📊 シート名',
          value: sheetInfo.title,
          inline: true
        },
        {
          name: '🔗 シートURL',
          value: `[開く](${sheetInfo.sheetUrl})`,
          inline: true
        }
      ]
    });

    // 各行のEmbed
    matchedRows.forEach((row) => {
      embeds.push({
        color: 15105570,
        fields: this.buildFields(row, sheetInfo),
        timestamp: new Date().toISOString()
      });
    });

    return {
      content: mentionText || undefined,
      allowed_mentions: allowedMentions,
      embeds
    };
  }

  private buildFields(row: RowData, sheetInfo: SheetInfo): DiscordField[] {
    const fields: DiscordField[] = [];

    // 行番号
    fields.push({
      name: '📍 行番号',
      value: row.rowUrl ? `[${row.rowNumber}行目](${row.rowUrl})` : `${row.rowNumber}行目`,
      inline: true
    });

    // 日付（ある場合のみ）
    if (row.date) {
      fields.push({
        name: '📅 日付',
        value: row.date,
        inline: true
      });
    }

    // 通知カラム
    Object.entries(row.columns).forEach(([column, value]) => {
      const label = sheetInfo.columnLabels[column] || column;
      fields.push({
        name: label,
        value: value || '-',
        inline: true
      });
    });

    return fields;
  }

  private resolveSheetInfo(): SheetInfo {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(this.config.sheetName);

    if (!sheet) {
      return {
        sheetUrl: spreadsheet.getUrl(),
        title: this.config.sheetName,
        columnLabels: {}
      };
    }

    const sheetUrl = `${spreadsheet.getUrl()}#gid=${sheet.getSheetId()}`;

    return {
      sheetUrl,
      title: sheet.getName(),
      columnLabels: getColumnLabelsFromSheet(sheet, this.config.startRow)
    };
  }
}

/**
 * メール通知クラス
 */
class EmailNotifier implements Notifier {
  constructor(private config: DateConfig | StatusMatchConfig, private ruleName: string) { }

  send(matchedRows: RowData[]): void {
    const subject = this.config.emailSubject;
    const body = this.buildMessage(matchedRows);

    try {
      GmailApp.sendEmail(this.config.emailRecipient, subject, body);
    } catch (error) {
      throw new Error(`Email send error: ${(error as Error).message}`);
    }
  }

  buildMessage(matchedRows: RowData[]): string {
    let message = `${this.ruleName}\n`;
    message += `該当件数: ${matchedRows.length}件\n\n`;
    message += '--------------------\n\n';

    matchedRows.forEach((row) => {
      const dateInfo = row.date ? `日付: ${row.date}\n` : '';
      message += `【${row.rowNumber}行目】${dateInfo}`;

      if (row.rowUrl) {
        message += `リンク: ${row.rowUrl}\n`;
      }

      // 各列の情報を追加
      Object.entries(row.columns).forEach(([col, value]) => {
        message += `[${col}列] ${value}\n`;
      });

      message += '\n';
    });

    message += '--------------------\n';
    message += `送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: this.config.timezone })}`;

    return message;
  }
}
