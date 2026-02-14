const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:/Users/Aidara/Desktop/Girl_Power_2026/administratifs officiels.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`Total rows: ${data.length}`);
if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));

    // Count unique Regions
    const regions = new Set(data.map(row => row['Région']));
    console.log(`Unique Regions: ${regions.size}`);

    // Check Localité column
    console.log('--- Localité Samples ---');
    data.slice(0, 5).forEach((row, i) => {
        console.log(`Row ${i}: ${row['Localité']}`);
    });
}
