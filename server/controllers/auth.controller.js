
import generateToken from '../utils/jwt.js'
import User from '../models/user.model.js'
import { handleUserSaveError } from '../helpers/dbErrorHandler.js'
import config from '../config/config.js';


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
          // new formats to handle
          const value = await handleUserSaveError(e);

          if (Array.isArray(value)) {
            return res.status(400).json({ message: `${value[0].toUpperCase()}: [ ${value[1]} ] is already in use.` });
          }
          else if (value.username) {
            stagedUser = new User(value);
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

      res.cookie('t', token, { ...config.cookieOptions });

      return res.status(201).json({
        message: "User registered successfully",
        user: { ...config.userBody(user) },
        token
      });
    }
    catch (e) {
      return res.status(500).json({ message: "Internal Server Error" });
    };
  },

  /**
   * 
   * @param {Req} req 
   * @param {Res} res 
   */
  signin: async (req, res) => {
    try {
      const { email, password } = req.body;
      const data = await User.findOne({ "email": email });
        
      if (!data) return res.status(401).json({ error: "User not found" });
      if (!await data.comparePassword(password)) return res.status(401).send({ error: "Passwords don't match." });

      const token = generateToken(data);
      res.cookie('t', token, { ...config.cookieOptions });

      let user = data.toObject();
      
      if (data?.image?.data) user.image = `data:${data.image.contentType};base64,${data.image.data.toString('base64')}`;

      res.status(200).json({
        message: "Signed in successfully",
        user: { ...config.userBody(user) },
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
