const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const createUploadsDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage for user uploads
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'user');
    createUploadsDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname).toLowerCase());
  }
});

// Configure storage for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.body.userId || 'default';
    const uploadDir = path.join(__dirname, '..', 'uploads', 'products', userId);
    createUploadsDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname).toLowerCase());
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG files are allowed!'), false);
  }
};

// Create upload middlewares
const uploadSingle = multer({ 
  storage: userStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('image');

const uploadProductImages = multer({ 
  storage: productStorage, 
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Max 10 files
  }
}).array('images', 10);

// for excel
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'excel');
    createUploadsDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname).toLowerCase());
  }
});

//NEW: file filter for Excel
const excelFileFilter = (req, file, cb) => {
  const allowedTypes = /xlsx|xls/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xls, .xlsx) are allowed!'), false);
  }
};

// 🔹 NEW: Excel upload middleware (single file)
const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: excelFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (change if needed)
  }
}).single('file'); // field name = "file"

//
// ================= AUDIO =================
//
const generateFileName = (file) => {
  return Date.now() + '-' + Math.round(Math.random() * 1e9) +
    path.extname(file.originalname).toLowerCase();
};

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'audio');
    createUploadsDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  }
});

const audioFileFilter = (req, file, cb) => {
  const allowed = /mp3|wav|m4a/;
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.test(ext)
    ? cb(null, true)
    : cb(new Error('Only audio files (mp3, wav, m4a) allowed'), false);
};

const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
}).single('audio');


//
// ================= VIDEO =================
//
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'video');
    createUploadsDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  }
});

const videoFileFilter = (req, file, cb) => {
  const allowed = /mp4|mov|avi/;
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.test(ext)
    ? cb(null, true)
    : cb(new Error('Only video files (mp4, mov, avi) allowed'), false);
};

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
}).single('video');

module.exports = {
  uploadSingle,
  uploadProductImages,
  uploadExcel,
  uploadAudio,
  uploadVideo
};