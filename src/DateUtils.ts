/**
 * 日付処理ユーティリティモジュール
 * タイムゾーンを考慮した日付計算を提供
 */

/**
 * 指定されたタイムゾーンで今日の0時0分0秒を返す
 * @param timezone - タイムゾーン（例: 'Asia/Tokyo'）
 * @returns 今日の0時0分0秒のDateオブジェクト
 */
function getTodayInTimezone(timezone: string): Date {
  const now = new Date();
  const formatter = Utilities.formatDate(now, timezone, 'yyyy-MM-dd');
  return new Date(formatter + 'T00:00:00');
}

/**
 * 2つの日付の日数差を計算する（時刻部分は無視）
 * @param date1 - 比較元の日付
 * @param date2 - 比較先の日付
 * @returns date2 - date1 の日数差（date2の方が未来なら正の値）
 */
function getDaysDifference(date1: Date, date2: Date): number {
  // 時刻部分をリセット
  const d1 = new Date(date1);
  d1.setHours(0, 0, 0, 0);

  const d2 = new Date(date2);
  d2.setHours(0, 0, 0, 0);

  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 日付を指定されたタイムゾーンでフォーマットする
 * @param date - フォーマットする日付
 * @param timezone - タイムゾーン
 * @param format - 日付フォーマット（デフォルト: 'yyyy/MM/dd'）
 * @returns フォーマットされた日付文字列
 */
function formatDateInTimezone(date: Date, timezone: string, format: string = 'yyyy/MM/dd'): string {
  if (!date || !(date instanceof Date)) {
    return '';
  }

  try {
    return Utilities.formatDate(date, timezone, format);
  } catch (error) {
    Logger.log(`Date format error: ${(error as Error).message}`);
    return '';
  }
}

/**
 * 日付が有効かどうかをチェック
 * @param value - チェックする値
 * @returns 有効な日付の場合true
 */
function isValidDate(value: unknown): value is Date {
  if (!value) return false;
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  const date = new Date(value as string | number);
  return !isNaN(date.getTime());
}
