import express from "express";
import Excel from "exceljs";
import { generateSheet } from "./controllers/sheet-generator.js";
import { excelData } from "./data2.js";
import {excelRouter, testRouter} from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
// serve frontend static
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// adjust this path based on your structure
const frontendPath = path.join(__dirname, "../frontend/src");
app.use(express.static(frontendPath));

// optional: make "/" open index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// use post excel here
app.use(express.json()); // must come before routes
app.use('/test', testRouter);
app.use('/excel', excelRouter);


app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
