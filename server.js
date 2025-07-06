// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Подключаем базу данных
const db = new sqlite3.Database('./war_clicker.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the tea_clicker database.');
});

// Создаем таблицу, если ее нет
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS game_saves (
        user_id TEXT PRIMARY KEY,
        balance INTEGER,
        total_damage INTEGER,
        damage_per_click INTEGER,
        upgrades TEXT,
        boosts TEXT,
        dps INTEGER,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Сохранение игры
app.post('/api/save', (req, res) => {
    const { userId, gameData } = req.body;
    
    db.run(`INSERT OR REPLACE INTO game_saves 
            (user_id, balance, total_damage, damage_per_click, upgrades, boosts, dps) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, gameData.balance, gameData.totalDamage, gameData.damagePerClick, 
         JSON.stringify(gameData.upgrades), JSON.stringify(gameData.boosts), gameData.dps],
        (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        });
});

// Загрузка игры
app.get('/api/load/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.get(`SELECT * FROM game_saves WHERE user_id = ?`, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.json({ exists: false });
        }
        
        res.json({
            exists: true,
            gameData: {
                balance: row.balance,
                totalDamage: row.total_damage,
                damagePerClick: row.damage_per_click,
                upgrades: JSON.parse(row.upgrades),
                boosts: JSON.parse(row.boosts),
                dps: row.dps
            }
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
