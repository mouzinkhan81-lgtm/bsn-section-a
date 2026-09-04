// KMU Swabi BSN2 - MongoDB Backup Server
// This small backend receives automatic backup snapshots from the website
// and stores them in your own MongoDB Atlas database (free tier is fine).
//
// HOW TO USE:
// 1. Copy .env.example to .env and paste your MongoDB connection string
//    into MONGODB_URI (get it from MongoDB Atlas -> Connect -> Drivers).
// 2. Run: npm run server
// 3. Keep this running in its own terminal alongside `npm run dev`.

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.BACKUP_SERVER_PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ---- MongoDB Connection ----
if (!MONGODB_URI || MONGODB_URI.includes('YOUR_MONGODB')) {
  console.error(
    '\n[KMU Backup Server] MONGODB_URI is not set.\n' +
    'Please copy .env.example to .env and paste your MongoDB Atlas connection string.\n'
  );
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('[KMU Backup Server] Connected to MongoDB successfully.'))
    .catch(err => console.error('[KMU Backup Server] MongoDB connection error:', err.message));
}

// ---- Backup Schema ----
// We store each backup snapshot as its own document, newest last.
const backupSchema = new mongoose.Schema(
  {
    kmuPortal: String,
    campus: String,
    semester: String,
    section: String,
    exportedAt: String,
    autoBackup: Boolean,
    subjects: Array,
    students: Array
  },
  { timestamps: true }
);

const Backup = mongoose.model('Backup', backupSchema);

// ---- Routes ----

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Save a new backup snapshot (called automatically by the website)
app.post('/api/backup', async (req, res) => {
  try {
    const backup = new Backup(req.body);
    await backup.save();
    res.json({ success: true, id: backup._id, savedAt: backup.createdAt });
  } catch (err) {
    console.error('Backup save failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get the most recent backup (useful for restoring data)
app.get('/api/backup/latest', async (req, res) => {
  try {
    const latest = await Backup.findOne().sort({ createdAt: -1 });
    if (!latest) return res.status(404).json({ success: false, error: 'No backups found yet.' });
    res.json({ success: true, backup: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List all backup timestamps (for browsing backup history)
app.get('/api/backup/history', async (req, res) => {
  try {
    const backups = await Backup.find({}, { createdAt: 1, exportedAt: 1 }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, backups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[KMU Backup Server] Running on http://localhost:${PORT}`);
});
