/**
 * スプレッドシート操作モジュール
 * データの取得と処理を担当
 */

/**
 * 行データの型定義
 */
interface RowData {
  rowNumber: number;
  date: string;
  columns: Record<string, string>;
  rowUrl: string;
}

/**
 * 期限が指定日数後の行を抽出する
 * @param config - 期限通知設定オブジェクト
 * @returns マッチした行のデータ配列
 */
function getDateRows(config: DateConfig): RowData[] {
  try {
    const sheet = getSheet(config.sheetName);
    const lastRow = sheet.getLastRow();

    if (lastRow < config.startRow) {
      Logger.log('No data rows found in sheet');
      return [];
    }

    const today = getTodayInTimezone(config.timezone);
    const dateData = getColumnData(sheet, config.dateColumn, config.startRow, lastRow);
    const sheetUrl = buildSheetUrl(sheet);

    // 通知に含める列のデータを取得
    const notificationData: Record<string, unknown[][]> = {};
    config.notificationColumns.forEach(col => {
      notificationData[col] = getColumnData(sheet, col, config.startRow, lastRow);
    });

    const matchedRows: RowData[] = [];

    dateData.forEach((row, index) => {
      const dateValue = row[0];

      if (!isValidDate(dateValue)) {
        return;
      }

      const targetDate = new Date(dateValue);
      const diffDays = getDaysDifference(today, targetDate);

      // 指定した日数後の期限がある場合
      if (diffDays === config.daysBeforeNotification) {
        const rowNum = config.startRow + index;
        const rowData: RowData = {
          rowNumber: rowNum,
          date: formatDateInTimezone(targetDate, config.timezone),
          columns: {},
          rowUrl: generateRowUrl(sheetUrl, config.dateColumn, rowNum)
        };

        // 各列のデータを取得
        config.notificationColumns.forEach(col => {
          const columnValue = notificationData[col][index][0];
          rowData.columns[col] = columnValue ? String(columnValue) : '';
        });

        matchedRows.push(rowData);
      }
    });

    return matchedRows;

  } catch (error) {
    Logger.log(`Error in getDateRows: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * シートを取得する
 * @param sheetName - シート名
 * @returns シートオブジェクト
 * @throws シートが見つからない場合
 */
function getSheet(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  return sheet;
}

/**
 * 指定された列のデータを取得する
 * @param sheet - シートオブジェクト
 * @param column - 列名（例: 'A', 'L'）
 * @param startRow - 開始行
 * @param endRow - 終了行
 * @returns 列データの2次元配列
 */
function getColumnData(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  column: string,
  startRow: number,
  endRow: number
): unknown[][] {
  const range = `${column}${startRow}:${column}${endRow}`;
  return sheet.getRange(range).getValues();
}

/**
 * 列名をインデックスに変換（A=1, B=2, ...）
 * @param column - 列名
 * @returns 列インデックス
 */
function columnToIndex(column: string): number {
  let index = 0;
  for (let i = 0; i < column.length; i++) {
    index = index * 26 + (column.charCodeAt(i) - 64);
  }
  return index;
}

/**
 * 列インデックスを列名に変換（1=A, 2=B, ...）
 * @param index - 列インデックス（1始まり）
 * @returns 列名
 */
function columnIndexToLetter(index: number): string {
  let letter = '';
  while (index > 0) {
    const remainder = (index - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    index = Math.floor((index - 1) / 26);
  }
  return letter;
}

/**
 * シートから列ラベル（ヘッダー）を取得する
 * @param sheet - シートオブジェクト
 * @param startRow - データ開始行（ヘッダー行はstartRow-1と想定）
 * @returns 列名とラベルのマッピング
 */
function getColumnLabelsFromSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  startRow: number
): Record<string, string> {
  const columnLabels: Record<string, string> = {};
  const headerRow = Math.max(1, startRow - 1);
  const lastColumn = sheet.getLastColumn();

  if (lastColumn > 0 && headerRow > 0) {
    try {
      const headers = sheet.getRange(headerRow, 1, 1, lastColumn).getDisplayValues()[0];
      headers.forEach((headerValue, index) => {
        const columnLetter = columnIndexToLetter(index + 1);
        columnLabels[columnLetter] = headerValue || `${columnLetter}列`;
      });
    } catch (error) {
      Logger.log(`Error reading column labels: ${(error as Error).message}`);
    }
  }

  return columnLabels;
}

/**
 * 行のURLを生成する
 * @param sheetUrl - スプレッドシートのURL
 * @param column - 列名
 * @param rowNumber - 行番号
 * @returns 行へのリンクURL
 */
function generateRowUrl(sheetUrl: string, column: string, rowNumber: number): string {
  if (!sheetUrl) {
    return '';
  }

  // URLにフラグメントが既に含まれているか確認
  const separator = sheetUrl.includes('#') ? '&' : '#';
  return `${sheetUrl}${separator}range=${column}${rowNumber}`;
}

/**
 * シート単位のURLを生成する
 * @param sheet - 対象シート
 * @returns シートのURL（gid付き）
 */
function buildSheetUrl(sheet: GoogleAppsScript.Spreadsheet.Sheet): string {
  const spreadsheet = sheet.getParent();
  const baseUrl = spreadsheet.getUrl();
  return `${baseUrl}#gid=${sheet.getSheetId()}`;
}
