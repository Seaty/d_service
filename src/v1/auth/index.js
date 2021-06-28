var express = require("express");
var authRouter = express.Router();
const { get_login } = require("../../db/dbquery");


//Login service
authRouter.post('/get_login', async (req, res) => {
    try {
        let { email, password } = req.body
        let result = await get_login(email, password)
        if (result.code) {
            return res.status(result.code || 500).send(result.message || 'error')
        }
        res.send(result)
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})






module.exports = { authRouter };