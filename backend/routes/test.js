import express from "express";
export const router = express.Router();


router.get('/', (req, res) =>{
    const {testdata} = req.query;
    res.send(`test api query ${testdata}`);
})

router.post('/', (req, res) =>{
    const {testdata} = req.body;
    res.send(`test api body ${testdata}`);
})


