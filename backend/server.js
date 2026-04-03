const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4' 
});

db.connect(err => {
    if (err) console.error('Lỗi kết nối DB:', err);
    else console.log('Đã kết nối MySQL XAMPP thành công!');
});


let isHealthy = true; 

app.post('/api/toggle-health', (req, res) => {
    isHealthy = !isHealthy;
    console.log(`[Cảnh báo] Trạng thái Server: ${isHealthy ? 'ONLINE' : 'OFFLINE'}`);
    res.json({ isHealthy });
});

app.get('/health', (req, res) => {
    if (isHealthy) {
        res.status(200).json({ status: "ok", message: "Hệ thống bình thường" });
    } else {
        res.status(503).json({ status: "error", message: "Server Offline!" });
    }
});


app.use((req, res, next) => {
    if (!isHealthy) {
        return res.status(503).json({ error: "Kết nối bị từ chối: Server đang sập!" });
    }
    next(); 
});


app.get('/api/about', (req, res) => {
    const sql = "SELECT * FROM student_info LIMIT 1";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]); 
    });
});

app.get('/api/stats', (req, res) => {
    const sql = "SELECT COUNT(*) as total FROM products";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]); 
    });
});

app.get('/api/products', (req, res) => {
    const searchTerm = req.query.search || ''; 
    const sql = `
        SELECT * FROM products 
        WHERE CONVERT(name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? 
        OR CAST(id AS CHAR) LIKE ? 
        ORDER BY id DESC
    `;
    const queryParam = `%${searchTerm}%`;
    db.query(sql, [queryParam, queryParam], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/products', (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO products (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, name }); 
    });
});

app.put('/api/products/:id', (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    db.query('UPDATE products SET name = ? WHERE id = ?', [name, id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Sửa thành công" });
    });
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Xóa thành công" });
    });
});

app.listen(PORT, () => {
    console.log(`Backend chạy tại http://localhost:${PORT}`);
});