// GET /api/userReviews/:userID — reviews made by 1 user
router.get('/:UserId', async (req, res) => {
  const { UserIDId } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM review WHERE UserID = ?',
      [UserId]
    );
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message);
    res.status(500).json({ error: 'Database error' });
  }
});