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
      return res.status(403).json({ message: "Access forbidden" });
    }
    if (admin.key !== secret) {
      return res.status(403).json({ message: "Access forbidden" });
    }

    if (!['admin', 'sajid', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ message: "Access forbidden" });
    }

    req.user = admin;
    req.user.role = admin.role;
    req.userId = String(admin._id);
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
    if (!token) return res.status(401).json({ message: "Invalid Authentication" });

    const secretkey = process.env.JWT_SECRET_KEY;
    const userFromAuth = jwt.verify(token, secretkey);
    const user = await User.findById(userFromAuth._id).select('_id name email image role key questions discussions payment')
    if (!user) return res.status(403).json({ message: "Invalid Authorization" });

    if (!['admin', 'moderator', 'sajid'].includes(user.role)) return res.status(403).json({ message: "Invalid Authorization" });

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
    const user = await User.findById(userFromAuth._id).select('_id name email role key payment')
    if (!user) return res.status(403).json({ message: "Invalid Authentication 2" });

    const currentDateTime = new Date();
    const paymentExpireDateTime = new Date(user.payment.expireAt);
    const isPremium = user.payment.isPaid && (currentDateTime > paymentExpireDateTime)

    const isAdminAccess = ['admin', 'moderator', 'sajid'].includes(user.role)

    req.isPremium = isPremium
    req.isAdminAccess = isAdminAccess
    req.userId = String(user._id);
    req.role = user.role;
    req.user = user
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid Authentication 3" });
  }
};

const VerifyPaidUser = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;
    const token = bearer ? bearer.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Invalid Authentication" });

    const secretkey = process.env.JWT_SECRET_KEY;
    const userFromAuth = jwt.verify(token, secretkey);
    const user = await User.findById(userFromAuth._id).select('_id email role key payment')
    if (!user) return res.status(403).json({ message: "Invalid Authentication" });

    // checking status
    if (!user.payment.isPaid) return res.status(403).json({ message: "Invalid Authentication" });

    // checking expiry date time
    const currentDateTime = new Date();
    const paymentExpireDateTime = new Date(user.payment.expireAt);
    if (currentDateTime > paymentExpireDateTime) return res.status(403).json({ message: "Invalid Authentication" });


    req.userId = String(user._id);
    req.role = user.role;
    req.user = user
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid Authentication 3" });
  }
};

// non users to check for tokens
const VerifyNonUser = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;
    const token = bearer ? bearer.split(" ")[1] : null;
    if (!token) {
      req.isPremium = false
      next()
    }

    const secretkey = process.env.JWT_SECRET_KEY;
    const userFromAuth = jwt.verify(token, secretkey);
    const user = await User.findById(userFromAuth._id).select('_id email role key payment')
    if (!user) return res.status(403).json({ message: "Invalid Authentication" });

    // checking status
    if (!user.payment.isPaid) return res.status(403).json({ message: "Invalid Authentication" });

    // checking expiry date time
    const currentDateTime = new Date();
    const paymentExpireDateTime = new Date(user.payment.expireAt);
    if (currentDateTime > paymentExpireDateTime) return res.status(403).json({ message: "Invalid Authentication" });


    req.userId = String(user._id);
    req.role = user.role;
    req.user = user
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid Authentication 3" });
  }
};
module.exports = { VerifyAdmin, VerifyUser, VerifyMedlocusAdmin, VerifyModerator, VerifyPaidUser };
