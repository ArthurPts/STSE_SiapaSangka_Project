const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());

const pool = new Pool({
  host: "103.27.206.131",
  user: "stse",
  password: "ubaya",
  database: "siapa_sangka_game",
  port: 5433,
});

// Home
app.get("/", (req, res) => {
  res.send("<h1>Halo ini Docker Express.js UTS_SiapaSangka</h1>");
});

// Ambil semua game, bisa search dan filter lewat query
// Contoh: /games?search=portal&genre=Action&category=Single-player
app.get("/games", async (req, res) => {
  try {
    // Ambil data dari query URL
    const search = req.query.search;
    const genre = req.query.genre;
    const category = req.query.category;
    // const tag = req.query.tag;
    const developer = req.query.developer;
    const free = req.query.free;

    // Susun query SQL sedikit demi sedikit
    let sql = "SELECT appid, name, release_date, price, header_image, developers, publishers, categories, genres FROM games WHERE 1=1";
    let values = [];

    if (search) {
      values.push("%" + search + "%");
      sql += " AND name ILIKE $" + values.length;
    }

    // Filter genre (bisa lebih dari satu, pisahkan dengan koma)
    // Contoh: ?genre=Action,RPG  -> game harus punya Action DAN RPG
    if (genre) {
      const daftarGenre = genre.split(",");
      for (let i = 0; i < daftarGenre.length; i++) {
        values.push("%" + daftarGenre[i].trim() + "%");
        sql += " AND genres ILIKE $" + values.length;
      }
    }

    if (category) {
      const daftarCategory = category.split(",");
      for (let i = 0; i < daftarCategory.length; i++) {
        values.push("%" + daftarCategory[i].trim() + "%");
        sql += " AND categories ILIKE $" + values.length;
      }
    }

    // if (tag) {
    //   const daftarTag = tag.split(",");
    //   for (let i = 0; i < daftarTag.length; i++) {
    //     values.push("%" + daftarTag[i].trim() + "%");
    //     sql += " AND tags ILIKE $" + values.length;
    //   }
    // }

    if (developer) {
      values.push("%" + developer + "%");
      sql += " AND developers ILIKE $" + values.length;
    }

    // Filter game gratis
    if (free === "true") {
      sql += " AND (price = '0' OR price = '0.0' OR price = '0.00' OR price ILIKE 'free%')";
    }

    // Urutan hasil
    const sort = req.query.sort;
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    if (sort === "name") {
      sql += " ORDER BY name " + order;
    } else {
      sql += " ORDER BY appid " + order;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    values.push(limit);
    sql += " LIMIT $" + values.length;
    values.push(offset);
    sql += " OFFSET $" + values.length;

    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching games");
  }
});

// Detail satu game
app.get("/games/:appid", async (req, res) => {
  try {
    const appid = req.params.appid;

    const result = await pool.query(
      "SELECT * FROM games WHERE appid = $1",
      [appid]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Game tidak ditemukan");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching game detail");
  }
});

// Start Server
const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});