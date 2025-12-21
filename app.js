import express from "express";
import { generateSheet } from "./sheet-generator.js";
import { testCase } from "./data.js";

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
    res.send('Hello world');
    await generateSheet(testCase);
});


app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
