import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary.js';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const VIDEO_EXTS = ['mp4', 'mov', 'avi', 'webm'];
const DOC_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];

const getExtLower = (originalname = '') => {
  const parts = originalname.split('.');
  return (parts.length > 1 ? parts.pop() : '').toLowerCase();
};

const taskStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = getExtLower(file.originalname);
    const isImage = file.mimetype?.startsWith('image/');
    const isVideo = file.mimetype?.startsWith('video/');

    if (isVideo) {
      return {
        folder: 'ute-social/task-videos',
        resource_type: 'video',
        access_mode: 'public',
        allowed_formats: VIDEO_EXTS,
        transformation: [{ quality: 'auto' }]
      };
    }

    if (isImage) {
      return {
        folder: 'ute-social/task-images',
        resource_type: 'image',
        access_mode: 'public',
        allowed_formats: IMAGE_EXTS,
        transformation: [{ quality: 'auto' }]
      };
    }

    // Docs / other attachments
    return {
      folder: 'ute-social/task-documents',
      resource_type: 'auto',
      access_mode: 'public',
      allowed_formats: DOC_EXTS
    };
  }
});

const taskUpload = multer({
  storage: taskStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = getExtLower(file.originalname);
    const ok =
      IMAGE_EXTS.includes(ext) ||
      VIDEO_EXTS.includes(ext) ||
      DOC_EXTS.includes(ext);

    if (ok) return cb(null, true);

    return cb(
      new Error('Chỉ chấp nhận file ảnh/video hoặc tài liệu (pdf, word, excel, powerpoint, txt, csv).'),
      false
    );
  }
});

export default taskUpload;
