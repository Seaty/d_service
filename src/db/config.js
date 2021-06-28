const DBCONNECTION = {
    host: '203.150.210.26',
    port: '5432',
    user: 'postgres',
    password: 'db@tcp26',
    database: 'municipality_master'

}

ALGORITHM = "aes-256-cbc"
PASSWORD = "8UHjPgXZzXCGkhxV2QCnooyJexUzvJrO"
IVSTRING = "43c8539ab49012be"
MASTER_DB = "municipality_master"

JWTSECRET = "zYA*,.^BT[RV3LXX"
JWTEXPIRE = "8h"

module.exports = {
    DBCONNECTION,
    ALGORITHM,
    PASSWORD,
    IVSTRING,
    MASTER_DB,
    JWTSECRET,
    JWTEXPIRE
}

