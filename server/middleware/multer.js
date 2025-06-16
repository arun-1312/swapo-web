// middleware/multer.js
import multer from 'multer';

const storage = multer.memoryStorage(); // so we get buffer instead of a file path
const upload = multer({ storage });

export default upload;
