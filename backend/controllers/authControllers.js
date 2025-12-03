import authService from "../services/authService.js";

const authController = {
    authLogin: async (req, res, next) => {
        try {
            const { username, password } = req.body
            console.log("🔥 Username:", username, "Password:", password);
            const result = await authService.login(username, password);
            res.json({
                success: true,
                message: 'Login Successfull',
                token: result.token,
                user: result.user
            })
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message ||'Username/Password Salah'
            })
            next(error);
        }
    },
    authLogout: async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            const result = await authService.logout(token);
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    },
    authRegister: async (req, res, next) => {
        try {
            const { name, username, password, department, role } = req.body;
            const result = await authService.register(username, password, name, department, role);
            res.json({
                success: true,
                message: 'Registration Successful',
                data: result
            });
        } catch (error) {
            next(error);
        }
    },
    getMe: async (req, res, next) => {
        try {
            const userId = req.user.id
            const user = await authService.getUserProfile(userId);
            res.json({
                success: true,
                data: user
            })
        } catch (error) {
            next(error)
        }
    }
};

export default authController;