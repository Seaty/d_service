const express = require('express')
const app = express()
const cors = require('cors')
const moment = require('moment')
const socket = require('socket.io') 


const port = process.env.PORT || 3000

const { v1Router } = require('./v1')


app.use(cors())
app.use(express.json())
app.use(logFunction)

//v1
app.use('/v1', v1Router)


var server = app.listen(port, () => {
    console.log(`dTracking Service run on port : ${port}`);
})


function logFunction(req, res, next) {
    console.log(moment().format("YYYY-MM-DD HH:mm:ss") + " :" + req.url)
    next()
}


var io = socket(server);
const socketIoFunction = require('./v1/ws')(io)
