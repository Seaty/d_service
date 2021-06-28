var express = require("express");
var userRouter = express.Router();
const { checkDupEmail, register_new_user, registerMunicipality, update_user_data, check_user_data, checkDupPhone } = require("../../db/dbquery");


//Register Service
userRouter.post('/', async (req, res) => {
    try {
        let result = await register_new_user(req.body)
        if (result.code) {
            return res.status(result.code).send(result.message)
        }
        let { email, municipality } = req.body
        if (municipality) {
            let muniResult = await registerMunicipality(email, municipality)
            if (muniResult.code) {
                return res.status(result.code).send(result.message)
            }
        }
        res.send("completed")
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})

//For checking email dup
userRouter.get('/check_email', async (req, res) => {
    try {
        let { email } = req.query
        if (!email) {
            return res.status(400).send("email_required")
        }
        let result = await checkDupEmail(email)
        res.send({ status: result.status })
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})



//For checking duplicated phone number
userRouter.get('/check_phone', async (req, res) => {
    try {
        let { telephone_no } = req.query
        if (!telephone_no) {
            return res.status(400).send("telephone_no_required")
        }
        let result = await checkDupPhone(telephone_no)
        res.send({ status: result.status })
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})



//Update user data at municipality
userRouter.patch('/:email', async (req, res) => {
    try {
        let { email } = req.params
        let checkuser = await check_user_data(email)
        if (checkuser.code) {
            return res.status(result.code).send(result.message)
        } else if (checkuser.data.user_id) {
            return res.status(400).send("email_not_found")
        }
        // let { email } = req.body
        // let checkemail = await checkDupEmail(email)
        // if (checkemail.code) {
        //     return res.status(result.code).send(result.message)
        // } else if (checkemail.status) {
        //     return res.status(400).send("email_required")
        // }
        let result = await update_user_data(email, req.body)
        if (result.code) {
            return res.status(error.code || 500).send(error.message || error)
        }
        res.send("completed")
    } catch (error) {
        res.status(error.code || 500).send(error.message || error)
    }
})

module.exports = {
    userRouter
}