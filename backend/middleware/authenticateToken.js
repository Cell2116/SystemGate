import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            const error = new Error('Access token is required');
            error.statusCode = 401;
            throw error;
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                const error = new Error('Invalid or expired token');
                error.statusCode = 403;
                throw error;
            }

            req.user = user;
            next();
        });
    } catch (error) {
        next(error);
    }
};

export default authenticateToken