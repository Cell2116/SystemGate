import { fileURLToPath } from 'url';
import path from 'path';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// ROOT DIRECTORY PROJECT
export const rootPath = path.resolve(__dirname);
