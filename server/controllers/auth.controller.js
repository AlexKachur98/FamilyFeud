
import generateToken from '../utils/jwt.js'
import User from '../models/user.model.js'


export default {

  signup: async (req, res) => {

    async function saveUser(body) {
      let
        stagedUser,
        user;

      try {
        stagedUser = new User(body);
        try {
          user = await stagedUser.save();
        }
        catch (e) {
          if (e.errors) {
            // got an object instead of args
            if (stagedUser = new User(Object.entries(e.errors)[0][1]['value']))
              return await saveUser(stagedUser);
          };

          if (e.errorResponse) {
            // unique item exists
            if (e.errorResponse.code === 11000) {
              const kv = Object.entries(e.errorResponse.keyValue)[0];
              return res.status(400).json({ message: `${kv[0].toUpperCase()}: [ ${kv[1]} ] is already in use.` });
            };
          };
        };
        return user;
      }
      catch (e) {
        throw new Error(e);
      };
    };

    try {
      const
        user = await saveUser(req.body),
        token = generateToken(user);

      res.cookie('t', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 3600000
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email
        },
        token
      });
    }
    catch (e) {
      res.status(500).json({ message: "Internal Server Error" });
    };
  },

  /**
   * 
   * @param {Req} req 
   * @param {Res} res 
   */
  signin: async (req, res) => {
    try {
      const
        { email, password } = req.body,
        user = await User.findOne({ "email": email });

      if (!user) res.status(401).json({ error: "User not found" });
      if (!user.comparePassword(password)) res.status(401).send({ error: "Passwords don't match." });

      const token = generateToken(user);
      res.cookie('t', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 3600000
      });

      res.status(200).json({
        message: "Signed in successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          admin: user.admin,
          created: user.created,
          updated: user.updated
        },
        token
      });
    }
    catch (_) {
      res.status(500).json({ error: "Could not sign in" });
    };
  },

  /**
   * 
   * @param {Req} _ 
   * @param {Res} res 
   */
  signout: (_, res) => {
    res.clearCookie("t");
    res.status(200).json({ message: "signed out" });
  }

};
