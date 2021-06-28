const { socketTokenCheck, update_mts_c, update_realtime_data } = require('../../db/dbquery')
const { uuid } = require("../utils")


module.exports = function (io) {

    var online_device = {}
    var online_admin = {
        dtc0001: {
            client_id: "testid1",
            status: "1"// 1 = online , 0 = offline , 2 = busy}
        },
        dtc0002: {
            client_id: "testid2",
            status: "2"// 1 = online , 0 = offline , 2 = busy}
        },
        dtc0003: {
            client_id: "testid3",
            status: "1"// 1 = online , 0 = offline , 2 = busy}
        }
    }

    var room = []

    io.on('connection', (client) => {
        console.log(`Connection has create : ${client.id}`);



        client.on('realtime_data', async (data) => {
            console.log(client.id);
            //{ "token":"", "mobile_id":"", "lat":"", "lon":"", "m_batt":"", "m_storage":"", "m_speed":"", "m_signal":"", "m_upload":"", "m_download":"","municipality_id":""}
            let { token, mobile_id, lat, lon, m_batt, m_storage, m_speed, m_signal, m_upload, m_download, municipality_id } = data
            online_device[mobile_id] = { client_id: client.id, municipality_id: municipality_id }
            let { user_id } = await socketTokenCheck(token)
            let err = await update_mts_c(user_id, mobile_id, municipality_id)
            if (err) {
                // Error update master
                console.error(err);
            }
            let err2 = await update_realtime_data(mobile_id, lat, lon, m_batt, m_storage, m_speed, m_signal, m_upload, m_download, municipality_id)
            if (err2) {
                console.error(err2);
            }

        })



        client.on('disconnect',async (text) => {
            let keys = Object.keys(online_device)
            for (let key of keys) {
                if (online_device[key].client_id = client.id) {
                    delete online_device[key]
                }
            }
            console.log(`${client.id} : disconnected`);
            console.log(online_device);
        })



        //Chat zone
        client.on('start_chat', async (data) => {
            console.log(data);
            let user_start_msg = {msg:`สวัสดีครับ, ผมเจ้าหน้ารหัสประจำตัว 000001 ยินดีให้บริการ, ไม่ทราบว่าต้องการให้ช่วยเหลืออะไรครับ`,}
            let {municipality_id,mobile_id} = data
            online_device[mobile_id] = { client_id: client.id, municipality_id: municipality_id }
            console.log(online_device);
            io.to(client.id).emit("start_message",user_start_msg)
        })


        client.on('user_message', async (data) => {
            // {msg:"",mobile_id:"",}


        })



    })
}