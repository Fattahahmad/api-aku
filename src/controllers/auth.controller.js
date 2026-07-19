
import * as authService from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    const user = await authService.registerUser(name, email, password);
    const token = await authService.loginUser(email, password);

    res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const token = await authService.loginUser(email, password);

    res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      data: {
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};