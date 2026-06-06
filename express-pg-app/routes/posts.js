const router = require('express').Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

// GET all posts
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC'
  );
  res.json(rows);
});

// POST create post
router.post('/', authMiddleware, async (req, res) => {
  const { title, body } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO posts (user_id, title, body) VALUES ($1, $2, $3) RETURNING *',
    [req.user.id, title, body]
  );
  res.status(201).json(rows[0]);
});

// DELETE post
router.delete('/:id', authMiddleware, async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM posts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found or not yours' });
  res.status(204).end();
});

module.exports = router;
