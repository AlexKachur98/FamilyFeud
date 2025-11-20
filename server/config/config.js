import 'dotenv/config';

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    mongoUri: process.env.MONGODB_URI ||
        process.env.MONGO_HOST || 'mongodb://' + (process.env.IP || 'localhost') + ':' + (process.env.MONGO_PORT || '27017') + '/mernproject'
};

const cookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: config.env === 'production' ? 'none' : 'lax',
  maxAge: 3600000
};
const userBody = (user) => ({
  _id: user._id,
  email: user.email,
  image: user.image,
  admin: user.admin,
  username: user.username,
  created: user.created,
  updated: user.updated
});

export default { ...config, cookieOptions, userBody };