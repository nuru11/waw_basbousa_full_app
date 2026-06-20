const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/purchases');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXT.has(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('SCREENSHOT_INVALID_TYPE', ERROR_CODES.SCREENSHOT_INVALID_TYPE, 400));
    }
  },
});

const purchaseScreenshotUpload = upload.single('screenshot');

function handleUpload(req, res, next) {
  purchaseScreenshotUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('SCREENSHOT_TOO_LARGE', ERROR_CODES.SCREENSHOT_TOO_LARGE, 400));
      }
      return next(new AppError('VALIDATION_FAILED', err.message, 400));
    }
    if (err) return next(err);
    if (!req.file) {
      return next(new AppError('SCREENSHOT_REQUIRED', ERROR_CODES.SCREENSHOT_REQUIRED, 400));
    }
    next();
  });
}

module.exports = { handleUpload, UPLOAD_DIR };
