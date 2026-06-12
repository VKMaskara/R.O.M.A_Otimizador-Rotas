// src/middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const tmpDir = path.resolve('tmp', 'uploads');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tmpDir),
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `planilha-${timestamp}${ext}`);
    },
});

function fileFilter(req, file, cb) {
    const tiposPermitidos = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!tiposPermitidos.includes(ext)) {
        return cb(new Error('Formato de arquivo inválido. Envie .xlsx, .xls ou .csv.'));
    }
    cb(null, true);
}

export const uploadPlanilha = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
