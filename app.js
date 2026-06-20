const express = require("express");
const cors = require("cors");
const db = require('./db.js');
const path = require("path");

const app = express();
const port = 5775;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // serve frontend statis (public/index.html)

// ===================== SSE: mulai =====================
let clients = [];

function kirimEvent(data) {
    clients.forEach(res => res.write(`data: ${JSON.stringify(data)}\n\n`));
}

app.get("/events", (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });
    res.write("\n");
    clients.push(res);

    req.on("close", () => {
        clients = clients.filter(c => c !== res);
    });
});
// ===================== SSE: akhir =====================

app.get("/status", (req, res) => {
    res.json({
        kode: "01",
        status: "API Berbasis ExpressJS OK"
    });
});

app.post("/backup", async (req, res) => {
    let pesanx, kodex;
    let nama = req.body.nama_backup;
    let dtx = atob(req.body.dtx);
    let id = Date.now();
    let arr_data = dtx.split("#");
    let proses = await db.tambahBackup(id, nama, "nodejs");

    if (proses == "1") {
        let berhasil = 0;
        let gagal = 0;
        let total = arr_data.length;

        kirimEvent({ status: "mulai", total }); // beri tahu frontend: proses dimulai

        for (k of arr_data) {
            let arr_data2 = k.split("|");
            let idx        = arr_data2[0];
            let deskripsix = arr_data2[1];
            let waktux     = arr_data2[2];
            let nominalx   = arr_data2[3];
            let jenisx     = arr_data2[4];
            let proses2 = await db.tambahTransaksi(
                `${id}-${idx}`, id, waktux, nominalx, jenisx, deskripsix
            );
            proses2 == "1" ? berhasil++ : gagal++;

            // kirim progress live ke semua client SSE yang terhubung
            kirimEvent({
                status: "progress",
                selesai: berhasil + gagal,
                total,
                deskripsi: deskripsix
            });
        }

        pesanx = { kode: "01", status: "Proses Backup Berhasil", berhasil, gagal };
        kodex = 200;

        kirimEvent({ status: "selesai", berhasil, gagal }); // beri tahu frontend: proses selesai
    } else {
        pesanx = { kode: "00", status: "Proses Backup Gagal, Periksa Kembali Data Anda" };
        kodex = 500;
        kirimEvent({ status: "gagal" });
    }
    return res.status(kodex).json(pesanx);
});

app.get("/daftar_backup", async (req, res) => {
    const dtbackup = await db.bacaBackup();
    if(dtbackup == false){
        res.send('{"kode":"00","pesan":"Data Backup Tidak Di Temukan"}');
    }else{
        res.send('{"kode":"01","pesan":"Data Backup Di Temukan","data":' + JSON.stringify(dtbackup) + '}');
    }
});

app.post("/detail_backup", async (req, res) => {
    let idbackup = req.body.idbackup;
    const dtdetail = await db.bacaDetailBackup(idbackup);
    if(dtdetail == false){
        res.send('{"kode":"00","pesan":"Data Detail Backup Tidak Di Temukan"}');
    }else{
        res.send('{"kode":"01","pesan":"Data Detail Backup Di Temukan","data":' + JSON.stringify(dtdetail) + '}');
    }
})

app.get("/test_db", async (req, res) => {
    const proses = await db.cekKoneksi();
    if (proses == "1") {
        res.json({ kode: "01", status: "Koneksi Database Berhasil" });
    } else {
        res.status(500).json({ kode: "00", status: "Koneksi Database Gagal" });
    }
});

app.listen(port, () => {
    console.log(`API Berjalan di Port: ${port}`);
});