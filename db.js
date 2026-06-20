const mysql = require('mysql2/promise');
let sql;

// Pool: maksimal 2 koneksi aktif bersamaan dari aplikasi Node.js ini.
// Request lain akan antri otomatis kalau ke-2 koneksinya sedang dipakai,
// jadi jumlah koneksi ke MySQL tidak akan pernah melebihi 2.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: false,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0
});

const cekKoneksi = async () => {
    try{
        const conn = await pool.getConnection();
        conn.release(); // kembalikan ke pool, bukan ditutup permanen
        return "1";
    }catch(err){
        console.error("Error cekKoneksi:", err.message);
        return "0";
    }
}

const tambahBackup = async (id, nama, channel) => {
    sql = `INSERT INTO backup VALUES('${id}','${nama}','${channel}',NOW())`;
    try{
        await pool.execute(sql);
        return "1";
    }catch(err){
        console.error("Error tambahBackup:", err.message);
        return "0";
    }
}

const tambahTransaksi = async (idx, id, waktux, nominalx, jenisx, deskripsix) => {
    sql = `INSERT INTO backup_transaksi VALUES('${idx}','${id}','${waktux}','${nominalx}','${jenisx}','${deskripsix}')`;
    try{
        await pool.execute(sql);
        return "1";
    }catch(err){
        console.error("Error tambahTransaksi:", err.message);
        return "0";
    }
}

const bacaBackup = async () => {
    sql = `SELECT * FROM backup ORDER BY waktu DESC`;
    try{
        const [rows] = await pool.execute(sql);
        return rows.length > 0 ? rows : false;
    }catch(err){
        console.error("Error bacaBackup:", err.message);
        return false;
    }
}

const bacaDetailBackup = async (id_backup) => {
    sql = `SELECT * FROM backup_transaksi WHERE id_backup = '${id_backup}' ORDER BY tgl_jam`;
    try{
        const [rows] = await pool.execute(sql);
        return rows.length > 0 ? rows : false;
    }catch(err){
        console.error("Error bacaDetailBackup:", err.message);
        return false;
    }
}

module.exports = {pool, cekKoneksi, tambahBackup, tambahTransaksi, bacaBackup, bacaDetailBackup}