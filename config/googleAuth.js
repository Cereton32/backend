const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Sync breakdown data to Google Sheets
exports.syncToSheets = async (breakdown, formType) => {
  try {
    const spreadsheetId = process.env.SHEET_ID;
    
    // First check if breakdown exists in sheet
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Breakdowns!A2:A`,
    });

    const rows = existing.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === breakdown.breakdownId);
    
    // Prepare data for update
    let values;
    if (rowIndex === -1) {
      // New breakdown - insert full row
      values = [
        [
          breakdown.breakdownId,
          breakdown.operatorId,
          breakdown.machineId,
          breakdown.machineFamily,
          breakdown.productionStopped ? 'Yes' : 'No',
          breakdown.problemDescription,
          breakdown.problemMedia || '',
          breakdown.openTimestamp.toISOString(),
          '', // Temporary timestamp
          '', // Maintenance ID
          '', // Temporary action
          '', // Spare used
          '', // Closure timestamp
          '', // Closure maintenance ID
          '', // Analysis report
          '', // Analysis media
          '', // Approval timestamp
          '', // Approval ID
          '', // Status
          breakdown.createdByDevice,
          breakdown.lastUpdated.toISOString()
        ]
      ];
      
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Breakdowns!A2:T',
        valueInputOption: 'USER_ENTERED',
        resource: { values },
      });
    } else {
      // Existing breakdown - update specific columns
      let range;
      let updateValues;
      
      switch (formType) {
        case 'open':
          range = `Breakdowns!A${rowIndex + 2}:H${rowIndex + 2}`;
          updateValues = [
            breakdown.breakdownId,
            breakdown.operatorId,
            breakdown.machineId,
            breakdown.machineFamily,
            breakdown.productionStopped ? 'Yes' : 'No',
            breakdown.problemDescription,
            breakdown.problemMedia || '',
            breakdown.openTimestamp.toISOString()
          ];
          break;
        case 'temporary':
          range = `Breakdowns!I${rowIndex + 2}:L${rowIndex + 2}`;
          updateValues = [
            breakdown.temporaryTimestamp.toISOString(),
            breakdown.maintenanceId,
            breakdown.temporaryAction,
            breakdown.spareUsed
          ];
          break;
        case 'closure':
          range = `Breakdowns!M${rowIndex + 2}:P${rowIndex + 2}`;
          updateValues = [
            breakdown.closureTimestamp.toISOString(),
            breakdown.closureMaintenanceId,
            breakdown.analysisReport,
            breakdown.analysisMedia || ''
          ];
          break;
        case 'approval':
          range = `Breakdowns!Q${rowIndex + 2}:S${rowIndex + 2}`;
          updateValues = [
            breakdown.approvalTimestamp.toISOString(),
            breakdown.approvalId,
            breakdown.status
          ];
          break;
      }
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [updateValues] },
      });
    }
    
    console.log(`✅ Synced ${breakdown.breakdownId} (${formType}) to Google Sheets`);
  } catch (err) {
    console.error('Sheets sync failed:', err.message);
  }
};