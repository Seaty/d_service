var express = require("express");
var notiRouter = express.Router();
const { getLastNoti } = require("../../db/dbquery");

notiRouter.get('/read_noti', async (req, res) => {
    try {
        let { municipality, email } = req.auth
        let municipality_id = municipality[0].municipality_id
        let result = await getLastNoti(email, municipality_id, "2")
        if (result.code) {
            return res.status(result.code).send(result.error.message || error)
        }
        res.send(result.data)
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})


notiRouter.get('/unread_noti', async (req, res) => {
    try {
        let { municipality, email } = req.auth
        let municipality_id = municipality[0].municipality_id
        let result = await getLastNoti(email, municipality_id, "1")
        if (result.code) {
            return res.status(result.code).send(result.error.message || error)
        }
        res.send(result.data)
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})


module.exports = {
    notiRouter
}