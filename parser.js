const fs = require('fs');
const Papa = require('papaparse');

function parseCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return new Promise((resolve) => {
    Papa.parse(fileContent, {
      header: false,
      dynamicTyping: true,
      complete: (results) => {
        resolve(results.data);
      }
    });
  });
}

function findIndexWithRegex(data, pattern) {
  const regex = new RegExp(pattern);
  return data.findIndex(row => row.some(cell => regex.test(cell)));
}

function processTrialTable(trialTable) {
  // Descriptions için işleme fonksiyonu
  return trialTable.map((row, rowIndex) => {
    return row.map((cell, cellIndex) => {
      if (cellIndex === 0) return cell; // Trial adlarını olduğu gibi tut
      if (typeof cell === 'string') {
        const processedCell = cell.replace(/[^\d\.\-\+]/g, '').trim();
        if (processedCell === "0") return "-";
        return cell.replace(/[\d\.\-\+]+/g, '').trim() || "-";
      }
      return "-"; // null veya undefined değerleri "-" ile değiştir
    });
  });
}

const ids = {
  standardName: 'id-standard-name',      // Örnek sabit ID
  standardValues: 'id-standard-values',  // Örnek sabit ID
  trialNames: 'id-trial-names',          // Örnek sabit ID
  trialValues: 'id-trial-values',        // Örnek sabit ID
  tolerancesTable: 'id-tolerances',      // Örnek sabit ID
  lightSources: 'id-light-sources',      // Örnek sabit ID
  descriptions: 'id-descriptions'        // Örnek sabit ID
};


function extractTables(filePath, outputJsonPath) {
  return parseCSV(filePath).then(data => {
    // Define regex patterns for table names
    const tolerancesPattern = '^\\s*Tolerances:.*$';
    const standardNamePattern = '^\\s*Standard Name.*$';
    const trialNamePattern = '^\\s*Trial Name.*$';

    // Find the indices of the tables using regex patterns
    const tolerancesIndex = findIndexWithRegex(data, tolerancesPattern);
    const standardNameIndex = findIndexWithRegex(data, standardNamePattern);
    const trialNameIndex = findIndexWithRegex(data, trialNamePattern);

    // Extract the tables
    const tolerancesTable = data.slice(tolerancesIndex, standardNameIndex !== -1 ? standardNameIndex : undefined);
    const standardTable = data.slice(standardNameIndex, trialNameIndex !== -1 ? trialNameIndex : undefined);
    const trialTable = data.slice(trialNameIndex);

    // Construct the tables with headers and rows
    const result = {
      standardName: { id: ids.standardName, data: standardTable[1][0], type: "text" },
      standardValues: { id: ids.standardValues, data: standardTable, type: "table" },
      trialNames: { id: ids.trialNames, data: trialTable.map(row => row[0]).filter(name => name && name.trim()), type: "table" },
      trialValues: { id: ids.trialValues, data: trialTable, type: "table" },
      tolerancesTable: { id: ids.tolerancesTable, data: tolerancesTable, type: "table" },
      lightSources: { id: ids.lightSources, data: tolerancesTable.slice(1).map(row => row[0]), type: "table" },
      descriptions: { id: ids.descriptions, data: processTrialTable(trialTable), type: "table" }
    };

    // Write the result to a JSON file
    fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf8');

    // Return the result object
    return result;
  });
}

module.exports = { extractTables };
