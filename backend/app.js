import express from "express";
import Excel from "exceljs";
import { generateSheet } from "./sheet-generator.js";
import { excelData } from "./data2.js";

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
    res.send('Hello world');
    //await generateSheet(testCase);

    const workbook = new Excel.Workbook();

    // const { sheetName, testCase } = excelData[0];

    // await generateSheet(workbook, sheetName, testCase);

    // const sheetName1 = excelData[1].sheetName;
    // const testCase1 = excelData[1].testCase;

    // await generateSheet(workbook, sheetName1, testCase1);


    /*****
     * Algorithm
     * 1. Count sheet
     * 2. Make cover sheet
     * 3. Generate each sheet
     * 4. Return final excel file
     *****/
    for (const { sheetName, testCase } of excelData) {
        console.log(sheetName, testCase);

        // generate sheet here
        await generateSheet(workbook, sheetName, testCase);
    }

    workbook.xlsx.writeFile("result.xlsx");

});


app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
