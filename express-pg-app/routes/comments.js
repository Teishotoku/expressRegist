const router = require('express').Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

// GET comments for a post
router.get('/:postId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = $1 ORDER BY created_at ASC',
    [req.params.postId]
  );
  res.json(rows);
});

// POST create comment
router.post('/:postId', authMiddleware, async (req, res) => {
  const { text } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO comments (post_id, user_id, text) VALUES ($1, $2, $3) RETURNING *',
    [req.params.postId, req.user.id, text]
  );
  res.status(201).json(rows[0]);
});

// DELETE comment
router.delete('/:id', authMiddleware, async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM comments WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found or not yours' });
  res.status(204).end();
});

module.exports = router;
