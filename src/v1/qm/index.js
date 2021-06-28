var express = require("express");
var qmRouter = express.Router();
const { get_qm_by_user, checkQuickMessage, create_quick_message, delete_quick_message, checkQuickMessageById, update_quick_messsage } = require("../../db/dbquery");
const { patchingData } = require('../utils')

qmRouter.get('/', async (req, res) => {
    try {
        let { email } = req.auth
        console.log(req.auth);
        let result = await get_qm_by_user(email)
        if (result.code) {
            return res.status(result.code).send(result)
        }
        res.send(result.data)
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})


qmRouter.post('/', async (req, res) => {
    try {
        let isMessage = await checkQuickMessage(req)
        if (isMessage) {
            return res.status(400).send("already_created")
        }
        let { user_id, msg, lv } = req.body
        if (!user_id || !msg || !lv) {
            return res.status(400).send(`${user_id ? '' : 'user_id'} ${msg ? '' : 'msg'} ${lv ? '' : 'lv'} required`)
        }
        let result = await create_quick_message(req)
        if (result.code) {
            return res.status(result.code).send(result)
        }
        res.send("completed")
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})

qmRouter.delete("/:qm_id", async (req, res) => {
    try {
        let { qm_id } = req.params
        let result = await delete_quick_message(qm_id)
        if (result.code) {
            return res.status(result.code).send(result)
        }
        res.send("completed")
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})

qmRouter.patch("/:qm_id", async (req, res) => {
    try {
        let { qm_id } = req.params
        let new_data = req.body
        let old_data = await checkQuickMessageById(qm_id)
        let update_data = patchingData(old_data, new_data)
        if (update_data.code) {
            return res.status(update_data.code).send(update_data)
        }
        let result = await update_quick_messsage(qm_id, update_data)
        if (result.code) {
            return res.status(result.code).send(result)
        }
        res.send("completed")
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})

module.exports = {
    qmRouter
}