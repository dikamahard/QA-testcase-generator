import express from "express";
import Excel from "exceljs";
import { generateSheet } from "../controllers/sheet-generator.js";
export const router = express.Router();

router.post('/export', async (req, res) => {
    const payload = req.body;

    
    // generate sheet
    const workbook = new Excel.Workbook();

    for (const { sheetName, testCase } of payload) {
        // generate sheet here
        await generateSheet(workbook, sheetName, testCase);
    }
    
    // to generate file on local server
    //workbook.xlsx.writeFile("result.xlsx");

    // Stream response (better than buffering big files)
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="testcases.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
});


//TODO:Implement
router.get('/import', (req, res) => {

    // get 
    // this feature for importing from excel, need tcid and sheetid for the UI


});
