const functions = require('@google-cloud/functions-framework');
const mysql = require('mysql2/promise');

functions.http('checkSeatAvailability', async (req, res) => {
  const showId = req.query.showId || req.body.showId;
  if (!showId) {
    return res.status(400).json({ error: 'showId is required' });
  }
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [rows] = await conn.execute(
    "SELECT COUNT(*) as available FROM seats WHERE showId = ? AND status = 'AVAILABLE'",
    [showId]
  );
  await conn.end();
  res.json({
    showId,
    availableSeats: rows[0].available,
    timestamp: new Date().toISOString()
  });
});
