/**
 * ステータスマッチングサービス
 * 複数列の条件をすべて満たす行を抽出（AND検索）
 */

/**
 * ステータス条件に一致する行を抽出する
 * @param config - ステータス通知設定オブジェクト
 * @returns マッチした行のデータ配列
 */
function getStatusMatchRows(config: StatusMatchConfig): RowData[] {
  try {
    const sheet = getSheet(config.sheetName);
    const lastRow = sheet.getLastRow();

    if (lastRow < config.startRow) {
      Logger.log('No data rows found in sheet');
      return [];
    }

    const sheetUrl = buildSheetUrl(sheet);

    // すべての条件列のデータを取得
    const conditionData: Record<string, unknown[][]> = {};
    config.statusMatchColumns.forEach(col => {
      conditionData[col] = getColumnData(sheet, col, config.startRow, lastRow);
    });

    // 通知に含める列のデータを取得
    const notificationData: Record<string, unknown[][]> = {};
    config.notificationColumns.forEach(col => {
      notificationData[col] = getColumnData(sheet, col, config.startRow, lastRow);
    });

    const matchedRows: RowData[] = [];
    const rowCount = lastRow - config.startRow + 1;

    for (let i = 0; i < rowCount; i++) {
      // すべての条件をANDチェック
      const allMatch = config.statusMatchColumns.every((col, colIndex) => {
        const value = String(conditionData[col][i][0] || '');
        const expectedValue = config.statusMatchValues[colIndex];
        return value === expectedValue;
      });

      if (allMatch) {
        const rowNum = config.startRow + i;
        const rowData: RowData = {
          rowNumber: rowNum,
          date: '', // ステータスマッチには日付なし
          columns: {},
          rowUrl: generateRowUrl(sheetUrl, config.statusMatchColumns[0], rowNum)
        };

        // 各通知列のデータを取得
        config.notificationColumns.forEach(col => {
          const columnValue = notificationData[col][i][0];
          rowData.columns[col] = columnValue ? String(columnValue) : '';
        });

        matchedRows.push(rowData);
      }
    }

    return matchedRows;

  } catch (error) {
    Logger.log(`Error in getStatusMatchRows: ${(error as Error).message}`);
    throw error;
  }
}
