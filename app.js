const express = require("express");
const db = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3000;
const JWT_SECRET = "secret_jwt_token";
app.use(express.json());

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) return res.status(401).json({ error: "Нужен токен авторизации" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res
        .status(401)
        .json({ error: "Токен недействительный или истек" });
    req.user = user;
    next();
  });
}

app.get("/", (req, res) => {
  res.send("hello world");
});

// регистрация пользователя
app.post("/auth/register", (req, res) => {
  const { email, pass } = req.body;

  const password_hash = bcrypt.hashSync(pass, 10);
  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, password_hash],
    (err) => {
      if (err) return res.status(500).json({ error: err });

      res.status(201).json({
        message: "пользователь успешно создан",
        email,
      });
    },
  );
});

// авторизация
app.post("/auth/login", (req, res) => {
  const { email, pass } = req.body;

  db.get(
    "SELECT id, email, password FROM users WHERE email = ?",
    [email],
    (err, user) => {
      if (err) return res.status(500).json({ error: err });
      if (!user)
        return res.status(401).json({ error: "Неверный email или пароль" });

      const ok = bcrypt.compareSync(pass, user.password);
      if (!ok)
        return res.status(401).json({ error: "Неверный email или пароль" });

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      res.json({
        token,
      });
    },
  );
});

app.get("/me", authenticate, (req, res) => {
  db.get(
    `SELECT id, email, created_at FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Не удалось получить пользователя" });
      console.log(user);

      if (!user)
        return res.status(404).json({ error: "Пользователь не найден" });

      res.json({ user });
    },
  );
});

app.listen(port, () => {
  console.log(`Example app on ${port}`);
});

// закрытие базы данных по завершению работы сервера
const shutdown = () => {
  console.log("Останавливаем сервер...");

  db.close((err) => {
    if (err) {
      console.error("Не получилось закрыть базу");
      process.exit(1);
    }
    console.log("База закрыта. До встречи!");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.off("SIGTERM", shutdown);
