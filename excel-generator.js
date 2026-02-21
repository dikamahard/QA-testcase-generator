import Excel from "exceljs";
import { generateSheet } from "./sheet-generator";
import { excelData } from "./data2.js";




const workbook = new Excel.Workbook();
const worksheet1 = generateSheet(testCase, "Sheet Test Debug", workbook);


await workbook.xlsx.writeFile("tes1.xlsx");



/*****
 * Algorithm
 * 1. Count sheet
 * 2. Make cover sheet
 * 3. Generate each sheet
 * 4. Return final excel file
 *****/

function generateExcel(jsonData) {

  


}


