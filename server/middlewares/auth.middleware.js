
import jwt from 'jsonwebtoken';


const requireSignin = (req, res, next) => {

  let token;
  const authheader = req.headers.authorization;

  if (authheader && authheader.startsWith('Bearer '))
    token = authheader.split(" ")[1];

  else if (req.cookies.t)
    token = req.cookies.t;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  }
  catch (_) {
    return res.status(401).json({ error: "Unauthorized" });
  };
};

const hasAuthorization = (req, res, next) => {
  const authorized = req.params && req.user && (
    req.params.id == req.user._id ||
    req.user.admin
  );

  if (!authorized) return res.status(403).json({ error: "User is not authorized" });
  next();
};

export default { requireSignin, hasAuthorization };
