
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const requireSignin = async (req, res, next) => {

  let token;
  const authheader = req.headers.authorization;

  if (authheader && authheader.startsWith('Bearer '))
    token = authheader.split(" ")[1];
  else if (req.cookies.t)
    token = req.cookies.t;

  if (!token) return res.status(401).json({ valid: false, user: null });

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const data = await User.findById(decode._id).select('-password');

    if (!data) return res.status(401).json({ valid: false, user: null });

    let user = data.toObject();
    if (user?.image?.data) user.image = `data:${user.image.contentType};base64,${user.image.data.toString('base64')}`;

    req.auth = decode;
    req.user = user;
    next();
  }
  catch (_) {
    return res.status(401).json({ valid: false, user: null });
  };
};

const hasAuthorization = (req, res, next) => {
  const authorized = req.params && req.auth && (
    req.params.id === req.auth._id.toString() ||
    req.user.admin
  );

  if (!authorized) return res.status(403).json({ error: "User is not authorized" });
  next();
};

export default { requireSignin, hasAuthorization };
