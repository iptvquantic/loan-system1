const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const BASE = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(BASE, req.params.id || 'tmp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ok = /\.(jpe?g|png|pdf)$/i.test(file.originalname);
  cb(ok ? null : new Error('Somente JPG, PNG, PDF'), ok);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5_242_880 },
});
