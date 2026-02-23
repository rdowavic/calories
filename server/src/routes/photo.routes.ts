import { Router } from 'express';
import multer from 'multer';
import * as photoController from '../controllers/photo.controller';

const router = Router();

// Store uploaded images in memory (we convert to base64 for Clarifai)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Multipart upload (from curl, web)
router.post('/recognize', upload.single('image'), photoController.recognizeFood);

// JSON base64 upload (from mobile app — avoids Android multipart issues)
router.post('/recognize-base64', photoController.recognizeFood);

export default router;
