import * as userModel from '../models/user.model.js';
import NotFoundError from '../exceptions/NotFoundError.js';
import fs from 'fs/promises';
import path from 'path';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Dari JWT
    const user = await userModel.findUserById(userId);

    if (!user) throw new NotFoundError('User tidak ditemukan');

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    const oldUser = await userModel.findUserById(userId);
    let avatarUrl = null;

    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;

      if (oldUser?.avatar_url) {
        const cleanOldUrl = oldUser.avatar_url.startsWith('/') 
          ? oldUser.avatar_url.substring(1) 
          : oldUser.avatar_url;

        const oldImagePath = path.join(process.cwd(), 'public', cleanOldUrl);

        try {
          await fs.access(oldImagePath);
          await fs.unlink(oldImagePath);
        } catch (err) {}
      }
    }

    const updatedUser = await userModel.updateUserProfile(userId, name, avatarUrl);

    res.status(200).json({
      status: 'success',
      message: 'Profil berhasil diperbarui!',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};