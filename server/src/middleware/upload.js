import multer from 'multer';
import { storage } from '../config/cloudinary.js';

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh hoặc video!'), false);
    }
  }
});

export default upload;