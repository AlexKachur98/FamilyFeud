import bufferImage from '../utils/bufferImage.js';

import UserModel from '../models/user.model.js'

const getUser = async (req, res) => {
    try {
        let user = await UserModel.findById(req.params.id);

        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Convert image buffer to base64 string for response
        if (user.image) user = {...user.toObject(), image: `data:${user.image.contentType};base64,${user.image.data.toString('base64')}`};
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        let newUser = new UserModel(req.body);

        await newUser.save();

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        // Handle image upload
        if (req.file) req.body.image = { data: await bufferImage(req.file), contentType: req.file.mimetype };
        
        // Update user
        let updatedUser = await UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        
        // Convert image buffer to base64 string for response
        if (updatedUser.image) updatedUser = {...updatedUser.toObject(), image: `data:${updatedUser.image.contentType};base64,${updatedUser.image.data.toString('base64')}`}
        
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
        
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default { getUser, createUser, updateUser, deleteUser };