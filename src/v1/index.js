var express = require("express");
var v1Router = express.Router();
const { authRouter } = require('./auth')
const { qmRouter } = require('./qm')
const { userRouter } = require('./user')
const { tokencheck } = require('../db/dbquery')
const { notiRouter } = require("./noti")

v1Router.use('/auth', authRouter)
v1Router.use('/qm', tokencheck, qmRouter)
v1Router.use('/users', tokencheck, userRouter)
v1Router.use('/noti', tokencheck, notiRouter)


module.exports = { v1Router };