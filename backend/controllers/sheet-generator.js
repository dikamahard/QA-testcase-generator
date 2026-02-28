
export async function generateSheet(workbook, sheetName, testCase) {

  const worksheet = workbook.addWorksheet(sheetName);

  // Header Row
  const HEADERCELL = ["B6", "C6", "D6", "E6", "F6", "G6", "I6", "J6", "K6", "L6"];

  worksheet.getCell("A6").value = null;                 // empty
  worksheet.getCell("B6").value = "TC_ID";
  worksheet.getCell("C6").value = "Test Scenario";
  worksheet.getCell("D6").value = "Type";
  worksheet.getCell("E6").value = "Precondition";
  worksheet.getCell("F6").value = "Test Data";
  worksheet.getCell("G6").value = "Test Procedure";                 
  worksheet.getCell("H6").value = null;                 // empty column
  worksheet.getCell("I6").value = "Expected Result";
  worksheet.getCell("J6").value = "Actual Result";
  worksheet.getCell("K6").value = "Test Result";
  worksheet.getCell("L6").value = "Notes";


  // Header Row Width
  worksheet.getColumn("A").width = 5;
  worksheet.getColumn("B").width = 10;
  worksheet.getColumn("C").width = 35;
  worksheet.getColumn("D").width = 10;
  worksheet.getColumn("E").width = 35;
  worksheet.getColumn("F").width = 35;
  worksheet.getColumn("G").width = 5;
  worksheet.getColumn("H").width = 35;
  worksheet.getColumn("I").width = 35;
  worksheet.getColumn("J").width = 35;
  worksheet.getColumn("K").width = 10;
  worksheet.getColumn("L").width = 20;


  // Merge Header Row (Test Procedure)
  worksheet.mergeCells("G6:H6");
  // test procedure number allginment
  worksheet.getColumn("G").alignment = {vertical: 'middle', horizontal: 'center'};


  // Header Styling
  for (const cell of HEADERCELL) {

    // set header allignment
    worksheet.getCell(cell).alignment = {vertical: 'middle', horizontal: 'center'};

    // set header color
    worksheet.getCell(cell).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '72A5E8' }
    };

    // set header border
    worksheet.getCell(cell).border = {
      top: {style:'thin'},
      left: {style:'thin'},
      bottom: {style:'thin'},
      right: {style:'thin'}
    };

  }



  let rowStart = 7;
  let rowMergeStart = rowStart;
  let rowMergeEnd = 0;
  const USEROW = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  for(const tc of testCase) {

    // max row
    const maxRow = Math.max(tc.precondition.length, tc.testdata.length, tc.testprocedure.length, tc.expectedresult.length, tc.actualresult.length);
    
    for(let i=0; i<maxRow; i++) {
      const row = worksheet.getRow(rowStart);

      if(i===0) {
        row.getCell('B').value = tc.tcid;
        row.getCell('C').value = tc.testscenario;
        row.getCell('D').value = tc.type;
        row.getCell('K').value = tc.testresult;
        row.getCell('L').value = tc.notes;
      }

      row.getCell('E').value = tc.precondition[i];
      row.getCell('F').value = tc.testdata[i];
      row.getCell('G').value = i+1; // auto increment test procedure number
      row.getCell('H').value = tc.testprocedure[i];
      row.getCell('I').value = tc.expectedresult[i];
      row.getCell('J').value = tc.actualresult[i];

      // set allignment for long text
      row.getCell('H').alignment = {wrapText: true};
      row.getCell('I').alignment = {wrapText: true};
      row.getCell('J').alignment = {wrapText: true};
      row.getCell('L').alignment = {wrapText: true};

      //set border
      for(const r of USEROW) {
        row.getCell(r).border = {
          top: {style:'thin'},
          left: {style:'thin'},
          bottom: {style:'thin'},
          right: {style:'thin'}
        };
      }

      rowStart++;
    }

    rowMergeEnd = rowMergeStart + (maxRow-1)


    // Merge Cell
    console.log(`rowMergeStart : ${rowMergeStart}`);
    console.log(`rowMergeEnd : ${rowMergeEnd}`);
    worksheet.mergeCells(`B${rowMergeStart}:B${rowMergeEnd}`);
    worksheet.mergeCells(`C${rowMergeStart}:C${rowMergeEnd}`);  
    worksheet.mergeCells(`D${rowMergeStart}:D${rowMergeEnd}`);  
    worksheet.mergeCells(`K${rowMergeStart}:K${rowMergeEnd}`);
    worksheet.mergeCells(`L${rowMergeStart}:L${rowMergeEnd}`);

    
    // Set Allignment (Row TC_ID, Test Scenario, Type, Test Result)
    worksheet.getCell(`B${rowMergeStart}`).alignment = {vertical: 'middle', horizontal: 'center'};
    worksheet.getCell(`C${rowMergeStart}`).alignment = {vertical: 'middle', horizontal: 'center'};
    worksheet.getCell(`D${rowMergeStart}`).alignment = {vertical: 'middle', horizontal: 'center'};
    worksheet.getCell(`K${rowMergeStart}`).alignment = {vertical: 'middle', horizontal: 'center'};


    rowMergeStart += maxRow;
  }

  console.log(`Sheet ${sheetName} generated successfully`);

  //await workbook.xlsx.writeFile("tes1.xlsx");
  return worksheet;
}


