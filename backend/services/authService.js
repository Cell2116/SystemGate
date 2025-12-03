import * as db from '../db.js'
import jwt from 'jsonwebtoken';

const authService = {
    login: async (username, password) => {
        if (!username || !password) {
            const error = new Error("Username and password are required");
            error.statusCode = 400;
            throw error;
        }
        const result = await db.query(
            'SELECT * FROM userlogin WHERE username = $1',
            [username]
        );
        if (result.rows.length === 0) {
            const error = new Error("Invalid username or password");
            error.statusCode = 401;
            throw error;
        }
        const user = result.rows[0];
        const isValidPassword = password === user.password;
        if (!isValidPassword) {
            const error = new Error("Invalid username or password");
            error.statusCode = 401;
            throw error;
        }
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                name: user.name,
                department: user.department,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token: token
        }
    },
    getUserProfile: async (userId) => {
        if (!userId) {
            const error = new Error('User ID is required');
            error.statusCode = 400;
            throw error;
        }
        const result = await db.query(
            'SELECT id, name, username, department, role FROM userlogin WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        return result.rows[0];
    },
    logout: async (token) => {
        return { message: 'Logout successful' };
    }
}

export default authService
