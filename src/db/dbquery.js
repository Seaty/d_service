const pgcon = require('./newnode_pgconnection')
const {
    DBCONNECTION,
    ALGORITHM,
    PASSWORD,
    IVSTRING,
    MASTER_DB,
    JWTSECRET,
    JWTEXPIRE
} = require('./config')
const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const moment = require('moment')
const axios = require('axios');
const { uuid } = require('../v1/utils/index')

const encrypt = (text) => {
    var cipher = crypto.createCipheriv(ALGORITHM, PASSWORD, IVSTRING);
    var crypted = cipher.update(text, "utf8", "base64");
    crypted += cipher.final("base64");
    return crypted;
};


const tokencheck = (req, res, next) => {
    var authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log("no token");
        return res.status(401).send({ message: "No token provided." });
    }
    jwt.verify(token, JWTSECRET, function (err, decoded) {
        if (err) {
            return res
                .status(401)
                .send({ message: err.message });
        }

        decoded.auth = true;
        req.auth = decoded;
        next();
    });
};

const socketTokenCheck = async (token) => {
    try {
        let result = jwt.verify(token, JWTSECRET);
        return result
    } catch (error) {
        return error.message
    }

}


const get_login = async (user_id, password) => {
    try {
        let sql = `SELECT password , street_light_option , role , user_name , user_surname ,expire_date, active_status, email  FROM users_account WHERE user_id = '${user_id}' OR email = '${user_id}'`
        let userData = await pgcon.getOne(MASTER_DB, sql, DBCONNECTION)
        if (userData.code) {
            throw userData
        } else if (!userData.data['password']) {
            return { code: 401, message: "user_not_found" }
        } else if (userData.data['password'] != encrypt(password)) {
            return { code: 401, message: "password_not_correct" }
        } else if (userData.data['role'] != "1" && userData.data['street_light_option'] != "1") {
            return { code: 401, message: "permission_denied" }
        }
        let sql2 = `UPDATE users_account SET lastlogin = '${moment().format("YYYY-MM-DD HH:mm:ss")}' WHERE user_id = '${user_id}'`
        await pgcon.execute(MASTER_DB, sql2, DBCONNECTION)
        let sql3 = `SELECT m1.municipality_id,th_name,en_name FROM municipality_match m1 LEFT JOIN municipality_master m2 ON m2.municipality_id = m1.municipality_id ` +
            `WHERE m1.user_id = '${user_id}' AND m1.flag = '1'`
        let municipalityData = await pgcon.get(MASTER_DB, sql3, DBCONNECTION)
        if (municipalityData.code) {
            throw municipalityData
        } else if (municipalityData.data.length == 0) {
            return { code: 401, message: 'not_assign_municipality' }
        }
        userData = userData.data
        let user_data = { user_id: user_id, role: userData.role, user_name: userData.user_name, user_surname: userData.user_surname, municipality: municipalityData.data, email: userData.email }
        let token = jwt.sign(user_data, JWTSECRET, { expiresIn: JWTEXPIRE });
        return { code: false, token: token, municipality: municipalityData.data }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}

const checkDupEmail = async (email) => {
    try {
        let sql = `SELECT user_id, email FROM users_account WHERE email = '${email}'`
        let result = await pgcon.get(MASTER_DB, sql, DBCONNECTION)
        if (result.code) {
            throw result
        } else if (result.data.length > 0) {
            return { code: false, status: true }
        }
        return { code: false, status: false }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}

const checkDupPhone = async (telephone_no) => {
    try {
        let sql = `SELECT user_id, telephone_no FROM users_account WHERE telephone_no = '${telephone_no}'`
        let result = await pgcon.get(MASTER_DB, sql, DBCONNECTION)
        if (result.code) {
            throw result
        } else if (result.data.length > 0) {
            return { code: false, status: true }
        }
        return { code: false, status: false }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}


const register_new_user = async (body) => {
    try {
        let {
            email,
            img_b64,
            user_name,
            user_surname,
            date_of_birth,
            gender,
            telephone_no,
            password
        } = body
        let checkUser = `SELECT user_id,email FROM users_account WHERE email = '${email}' OR telephone_no = '${telephone_no}'`
        let result = await pgcon.get(MASTER_DB, checkUser, DBCONNECTION)
        if (result.code) {
            throw result
        } else if (result.data.length > 0) {
            return { code: 400, message: 'email_or_telephone_already_used' }
        }
        let insertsql = `INSERT INTO users_account(user_id,password,img_b64,user_name,user_surname,date_of_birth,gender,telephone_no,role,street_light_option,email) VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,'2','1',$9) `
        let insertdata = [email, encrypt(password), img_b64, user_name, user_surname, date_of_birth, gender, telephone_no, email]
        let insertResult = await pgcon.excutewithparams(insertsql, insertdata, MASTER_DB, DBCONNECTION)
        if (insertResult.code) {
            throw insertResult
        }
        return { code: false, rowCount: insertResult.rowCount }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}


const registerMunicipality = async (user_id, municipality) => {
    try {
        let insertsql = `INSERT INTO municipality_match(municipality_id,user_id,flag) VALUES ($1,$2,'1') ON CONFLICT DO NOTHING/UPDATE`
        let insertData = [municipality, user_id]
        let insertResult = await pgcon.excutewithparams(insertsql, insertData, MASTER_DB, DBCONNECTION)
        if (insertResult.code) {
            throw insertResult
        }
        return { code: false, rowCount: insertResult.rowCount }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}

//Quick Message

const get_qm_by_user = async (user_id) => {
    try {
        let sql = `SELECT qm_id , msg , lv FROM dtracking_qm WHERE user_id = '${user_id}'`
        let result = await pgcon.get(MASTER_DB, sql, DBCONNECTION)
        if (result.code) {
            throw result
        }
        return { code: false, data: result.data }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}

const checkQuickMessage = async (req) => {
    try {
        let { user_id, msg, lv } = req.body
        let checkSql = `SELECT qm_id FROM dtracking_qm WHERE user_id = '${user_id}' AND msg = '${msg}' AND lv = '${lv}'`
        let result = await pgcon.getOne(MASTER_DB, checkSql, DBCONNECTION)
        if (result.code) {
            throw result
        }
        return result.data.qm_id
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}

const checkQuickMessageById = async (qm_id) => {
    try {
        let sql = `SELECT msg , lv FROM dtracking_qm WHERE qm_id = '${qm_id}'`
        let result = await pgcon.getOne(MASTER_DB, sql, DBCONNECTION)
        if (result.code) {
            throw result
        }
        return result.data
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}


const create_quick_message = async (req) => {
    try {

        let { user_id, msg, lv } = req.body
        let qm_id = uuid()
        let insert_sql = `INSERT INTO dtracking_qm(qm_id,user_id,msg,lv) VALUES ($1,$2,$3,$4)`
        let insert_data = [qm_id, user_id, msg, lv]
        let result = await pgcon.excutewithparams(insert_sql, insert_data, MASTER_DB, DBCONNECTION)
        if (result.code) {
            throw result
        }
        return { code: false }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}

const delete_quick_message = async (qm_id) => {
    try {
        let deletesql = `DELETE FROM dtracking_qm WHERE qm_id = '${qm_id}'`
        let result = await pgcon.execute(MASTER_DB, deletesql, DBCONNECTION)
        if (result.code) {
            throw result
        }
        return { code: false }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}

const update_quick_messsage = async (qm_id, data) => {
    try {
        let keys = Object.keys(data)
        let sql = `UPDATE dtracking_qm SET ${keys.map(key => ` ${key} = '${data[key]}' `)} WHERE qm_id = '${qm_id}'`
        let result = await pgcon.execute(MASTER_DB, sql, DBCONNECTION)
        if (result.code) {
            throw result
        }
        return { code: false }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}


const check_user_data = async (email) => {
    try {
        let sql = `SELECT user_id FROM users_account WHERE email = '${email}'`
        let result = await pgcon.getOne(MASTER_DB, sql, DBCONNECTION)
        if (result.code) {
            throw result
        }
        return result.data
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}


const update_user_data = async (user_id, data) => {
    try {
        let keys = Object.keys(data)
        let sql = `UPDATE users_account SET ${keys.map(key => ` ${key} = ${data[key]} `)} WHERE user_id = '${user_id}'`
        let result = await pgcon.execute(MASTER_DB, sql, DBCONNECTION)
        if (result.code) {
            throw result
        }
        return { code: false }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}



const update_mts_c = async (user_id, dvid, municipality_id) => {
    try {
        let dbname = `${municipality_id}_mts`
        let get_sql = `SELECT dvid,tyid,use,user_id FROM mts_m WHERE dvid = '${dvid}' AND tyid = '002'`
        let r1 = await pgcon.get(dbname, get_sql, DBCONNECTION)
        if (r1.code) {
            return { error: r1.message }
        }
        let sql = `INSERT INTO mts_m(dvid,tyid,use,user_id) VALUES ('${dvid}','002','1','${user_id}')`
        if (r1.data.length > 0) {
            sql = `UPDATE mts_m SET use='1' ,user_id='${user_id}' WHERE dvid = '${dvid}' AND tyid = '002'`
        }
        let r2 = await pgcon.execute(dbname, sql, DBCONNECTION)
        if (r2.code) {
            return { error: r2.message }
        }
        return { error: false }
    } catch (error) {
        return { error: error }
    }
}


const update_realtime_data = async (mobile_id, lat, lon, m_batt, m_storage, m_speed, m_signal, m_upload, m_download, municipality_id) => {
    try {
        let dbname = `${municipality_id}_mts`
        let deeMapUrl = `https://deemap.com/api/geofencing/lat=${lat}/lon=${lon}/radius=200/key=ov.gsjytaVI4MvEu1bYoHuKlaNZcokssctEhOAvD7StDth62IdPei`
        let result = await axios.get(deeMapUrl)
        console.log(result.data);
        if (result.data.length > 0) {
            var { AMP_ENAME, AMP_TNAME, CNTRY_ENAM, CNTRY_TNAM, PROV_ENAME, PROV_TNAME, TAM_ENAME, TAM_TNAME, REG_ENAME, REG_TNAME } = result.data[0]
        }
        //Realtime path
        let realtimesql = `INSERT INTO mts_r(dvid,lst,lat,lon,spd,csq,m_batt,m_storage,m_upload,m_download
            ${result.data.length > 0 ? ',am_en,am_th,cntry_en,cntry_th,prov_en,prov_th,tam_en,tam_th,reg_ename,reg_tname' : ''} ) 
            VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7,$8,$9
        ${result.data.length > 0 ? ',$10,$11,$12,$13,$14,$15,$16,$17,$18,$19' : ''})
        ON CONFLICT (dvid) DO UPDATE SET lst = NOW() , lat = $2, lon =$3, spd = $4, csq = $5, m_batt = $6, m_storage = $7, m_upload = $8, m_download = $9 
        ${result.data.length > 0 ? `,am_en = $10, am_th = $11 ,cntry_en = $12,cntry_th = $13 ,prov_en = $14 ,prov_th = $15 ,tam_en = $16, tam_th = $17,reg_ename = $18 ,reg_tname = $19` : ''}`
        //History path
        let historysql = `INSERT INTO mts_h(dvid,lst,lat,lon,spd,csq,m_batt,m_storage,m_upload,m_download
            ${result.data.length > 0 ? ',am_en,am_th,cntry_en,cntry_th,prov_en,prov_th,tam_en,tam_th,reg_ename,reg_tname' : ''}
            ) VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7,$8,$9${result.data.length > 0 ? ',$10,$11,$12,$13,$14,$15,$16,$17,$18,$19' : ''})`
        let data = [mobile_id, lat, lon, m_speed, m_signal, m_batt, m_storage, m_upload, m_download]
        if (result.data.legnth > 0) {
            data = data.concat([AMP_ENAME, AMP_TNAME, CNTRY_ENAM, CNTRY_TNAM, PROV_ENAME, PROV_TNAME, TAM_ENAME, TAM_TNAME, REG_ENAME, REG_TNAME])
        }
        let r1 = await pgcon.inserttransactionwithData([realtimesql, historysql], [data, data], dbname, DBCONNECTION)
        if (r1.code) {
            return { error: r1.message }
        }
        return { error: false }
    } catch (error) {
        return { error: error }
    }
}


const getLastNoti = async (email, municipality_id, flag) => {
    try {
        let get_sql = `SELECT id,msg,lv,creat_time FROM mts_dn WHERE user_id = '${email}' AND flag = '${flag}'`
        let result = await pgcon.get(`${municipality_id}_mts`, get_sql, DBCONNECTION)
        if (result.code) {
            throw result
        }
        return { code: false, data: result.data }
    } catch (error) {
        throw { code: 500, message: error['message'] || error }
    }
}


const saveNotification = async (msg, user_id, lv, municipality_id) => {
    try {
        let insert_sql = `INSERT INTO mts_dn(id,msg,user_id,lv,create_time,flag) VALUES ('${uuid()}','${msg}','${user_id}','${lv}',NOW(),'1') RETURNING id,msg,user_id,lv`
        let result = await pgcon.getOne(`${municipality_id}_mts`, insert_sql, DBCONNECTION)
        if (result.code) {
            return { error: result.message }
        }
        return result.data
    } catch (error) {
        return { error: error }
    }
}


const get_user_client = async (user_id) => {
    try {
        let get_sql = `SELECT client_id, municipality_id, mobile_id FROM dtracking_online WHERE user_id = '${user_id}'`
        let result = await pgcon.getOne(MASTER_DB, get_sql, DBCONNECTION)
        if (result.code) {
            return { error: result.message }
        }
        return result.data
    } catch (error) {
        return { error: error }
    }
}

const go_online = async (user_id, client_id, municipality_id, mobile_id) => {
    try {
        let update_sql = `INSERT INTO dtracking_online(client_id,municipality_id,user_id,mobile_id,last_update) VALUES ($1,$2,$3,$4,NOW()) ON CONFLICT (user_id) DO UPDATE SET client_id = $1, municipality_id = $2,mobile_id=$4, last_update = NOW()`
        let update_data = [client_id, municipality_id, user_id, mobile_id]
        let result = await pgcon.excutewithparams(update_sql, update_data, MASTER_DB, DBCONNECTION)
        if (result.code) {
            return { error: result.message }
        }
        return { error: false }
    } catch (error) {
        return { error: error }
    }
}

const go_offline = async (client_id) => {
    try {
        let delete_sql = `DELETE FROM dtracking_online WHERE client_id = $1`
        let result = await pgcon.excutewithparams(delete_sql, [client_id], MASTER_DB, DBCONNECTION)
        if (result.code) {
            return { error: result.message }
        }
        return { error: false }
    } catch (error) {
        return { error: error }
    }
}

const save_chat_message = async (from_user, to_user, msg, lv) => {
    try {
        let insert_sql = `INSERT INTO mts_msg(id,from_user,to_user,msg,create_time,lv,flag) VALUES ($1,$2,$3,$4,NOW(),$5,'1')`
        let result = await pgcon.excutewithparams(insert_sql, [uuid(), from_user, to_user, msg, lv], MASTER_DB, DBCONNECTION)
        if (result.code) {
            return { error: result.message }
        }
        return { error: false }
    } catch (error) {
        return { error: error }
    }
}



module.exports = {
    get_login,
    register_new_user,
    checkDupEmail,
    registerMunicipality,
    get_qm_by_user,
    checkQuickMessage,
    create_quick_message,
    delete_quick_message,
    checkQuickMessageById,
    update_quick_messsage,
    update_user_data,
    check_user_data,
    checkDupPhone,
    socketTokenCheck,
    update_mts_c,
    update_realtime_data,
    tokencheck,
    getLastNoti,
    get_user_client,
    saveNotification,
    go_online,
    go_offline
}