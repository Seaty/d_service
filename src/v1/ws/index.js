const { socketTokenCheck, update_mts_c, update_realtime_data, get_user_client, saveNotification, go_online, go_offline } = require('../../db/dbquery')
const moment = require('moment')
const { uuid } = require("../utils")


module.exports = function (io) {

    let userdata = {}

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


    io.on('connection', (client) => {
        console.log(`Connection has create : ${client.id}`);



        client.on('realtime_data', async (data) => {
            console.log(client.id);
            //{ "token":"", "mobile_id":"", "lat":"", "lon":"", "m_batt":"", "m_storage":"", "m_speed":"", "m_signal":"", "m_upload":"", "m_download":"","municipality_id":""}
            let { token, mobile_id, lat, lon, m_batt, m_storage, m_speed, m_signal, m_upload, m_download, municipality_id } = data
            // online_device[mobile_id] = { client_id: client.id, municipality_id: municipality_id }
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


        client.on('reconnect', async () => {
            console.log(userdata['user_id']);
        })

        client.on('disconnect', async (text) => {
            console.log(`${client.id} : disconnected`);
            let err = await go_offline(client.id)
            if (err) {
                console.error(err);
            }
        })



        //Chat zone
        client.on('start_chat', async (data) => {
            // {msg:"",mobile_id:"",}
            console.log(data);
            let user_start_msg = { msg: `สวัสดีครับ, ผมเจ้าหน้ารหัสประจำตัว 000001 ยินดีให้บริการ, ไม่ทราบว่าต้องการให้ช่วยเหลืออะไรครับ`, }
            let { municipality_id, user_id, mobile_id } = data
            userdata = data
            let err = await go_online(user_id, client.id, municipality_id, mobile_id)
            if (err) {
                console.error(err);
            }
            io.to(client.id).emit("start_message", user_start_msg)
        })

        






        //Notification Zone

        client.on('admin_send_noti', async (data) => {
            try {
                let { user_id, msg, lv } = data
                let { client_id, municipality_id } = await get_user_client(user_id)
                let save_result = await saveNotification(msg, user_id, lv, municipality_id)
                if (save_result.error) {
                    console.error(save_result.error);
                }
                let { id } = save_result
                let noti_data = { id, msg, lv }
                io.to(client_id).emit("user_notification", noti_data)
            } catch (error) {
                console.error(error);
            }

        })





    })
}