const jwt = require("jsonwebtoken");
const Admin = require("../schema/admin");
const User = require("../schema/user");



// Middleware for token verification  
const VerifyAdmin = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;
    const token = bearer ? bearer.split(" ")[1] : null;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const secretkey = process.env.JWT_SECRET_KEY
    const user = jwt.verify(token, secretkey);
    const { email, secret } = user
    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(403).json({ message: "Access forbidden 1" });
    }

    if (admin.key !== secret) {
      return res.status(403).json({ message: "Access forbidden 2" });
    }

    if (!['admin', 'moderator', 'sajid', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ message: "Access forbidden 3" });
    }

    req.user = admin;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware for token verification
const VerifyMedlocusAdmin = async (req, res, next) => {
  const bearer = req.headers.authorization;
  const token = bearer ? bearer.split(" ")[1] : null;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const secretkey = process.env.JWT_SECRET_KEY
    const user = jwt.verify(token, secretkey);
    const { username, password } = user
    const admin = await Admin.findOne({ username })
    if (!admin) {
      return res.status(403).json({ message: "Access forbidden " });
    }

    if (admin.password !== password) {
      return res.status(403).json({ message: "Access forbidden " });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};


const VerifyModerator = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;
    const token = bearer ? bearer.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Invalid Authentication 1" });

    const secretkey = process.env.JWT_SECRET_KEY;
    const userFromAuth = jwt.verify(token, secretkey);
    const user = await User.findById(userFromAuth._id).select('_id name email image role key questions discussions payment')
    if (!user) return res.status(403).json({ message: "Invalid Authorization 2" });

    if (!['admin', 'moderator', 'sajid'].includes(user.role)) res.status(403).json({ message: "Invalid Authorization" });

    req.userId = user._id;
    req.role = user.role;
    req.user = user
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid Authentication 3" });
  }
};

const VerifyUser = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;
    const token = bearer ? bearer.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Invalid Authentication 1" });

    const secretkey = process.env.JWT_SECRET_KEY;
    const userFromAuth = jwt.verify(token, secretkey);
    const user = await User.findById(userFromAuth._id).select('_id name email image role key questions discussions payment')
    if (!user) return res.status(403).json({ message: "Invalid Authentication 2" });

    req.userId = user._id;
    req.role = user.role;
    req.user = user
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid Authentication 3" });
  }
};

module.exports = { VerifyAdmin, VerifyUser, VerifyMedlocusAdmin,VerifyModerator };
