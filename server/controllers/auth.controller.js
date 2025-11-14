
import generateToken from '../utils/jwt.js'
import User from '../models/user.model.js'
import { handleUserSaveError } from '../helpers/dbErrorHandler.js'

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
          const value = await handleUserSaveError(e);
          if (Array.isArray(value)) {
            return res.status(400).json({ message: `${value[0].toUpperCase()}: [ ${value[1]} ] is already in use.` });
          }
          else if (value.name) {
            stagedUser = new User(value)
            return await saveUser(stagedUser);
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

      if (!user) return res.status(401).json({ error: "User not found" });
      if (!user.comparePassword(password)) return res.status(401).send({ error: "Passwords don't match." });

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
