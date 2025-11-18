/**
 * @file upload.controller.js
 * @author Alex Kachur
 * @since 2025-11-17
 * @purpose Handle avatar uploads to local storage with basic validation.
 */
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').substring(0, 32);
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid file type'));
};

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter
}).single('avatar');

export const handleAvatarUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const relativePath = `/uploads/avatars/${req.file.filename}`;
  return res.status(200).json({ url: relativePath });
};
