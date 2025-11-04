import jwt from 'jsonwebtoken';

import config from '../config/config.js'

const generateToken = (user) => {
    return jwt.sign({ _id: user._id }, config.jwtSecret, { expiresIn: '1h' });
};


export default generateToken;
