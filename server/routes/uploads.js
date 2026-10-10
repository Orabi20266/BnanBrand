import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { UPLOADS_DIR } from '../db.js';

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || path.extname(file.originalname) || '.jpg';
    const name = `img_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

export const uploadsRouter = Router();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      return cb(new Error('صيغة الصورة غير مدعومة. المسموح: JPG, PNG, WEBP, GIF, SVG'));
    }
    cb(null, true);
  },
});

uploadsRouter.post('/', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'فشل رفع الصورة.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم اختيار صورة.' });
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
  });
});

uploadsRouter.delete('/:filename', (req, res) => {
  const safe = path.basename(req.params.filename);
  const target = path.join(UPLOADS_DIR, safe);
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'الملف غير موجود.' });
  fs.unlinkSync(target);
  res.json({ ok: true });
});
