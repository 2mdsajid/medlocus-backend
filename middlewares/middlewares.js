const jwt = require("jsonwebtoken");
const Admin = require("../schema/admin");


// Middleware for token verification
const VerifyAdmin = async (req, res, next) => {
  const bearer = req.headers.authorization;
  const token = bearer ? bearer.split(" ")[1] : null;
  if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
  }
  try {
      const secretkey = process.env.JWT_SECRET_KEY
      const user = jwt.verify(token, secretkey);
      console.log("🚀 ~ file: middlewares.js:15 ~ VerifyAdmin ~ user:", user)

      const {email,secret} = user
      const admin = await Admin.findOne({email})
      console.log("🚀 ~ file: middlewares.js:19 ~ VerifyAdmin ~ admin:", admin)
      if(!admin) {
        return res.status(403).json({ message: "Access forbidden for non-admin users" });
      }

      if(admin.key !== secret){
        return res.status(403).json({ message: "Access forbidden for non-admin users" });
      }

      if (user.role !== 'admin') {
          return res.status(403).json({ message: "Access forbidden for non-admin users" });
      }

      req.user = user;
      next();
  } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
  }
};

const VerifyUser = (req, res, next) => {
  const bearer = req.headers.authorization;
  const token = bearer ? bearer.split(" ")[1] : null;
  if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
  }
  try {
      const secretkey = process.env.JWT_SECRET_KEY;
      console.log("🚀 ~ file: middlewares.js:47 ~ VerifyUser ~ secretkey:", secretkey)
      const user = jwt.verify(token, secretkey);
      req.user = user;
      next();
  } catch (error) {
      console.log("🚀 ~ file: middlewares.js:51 ~ VerifyUser ~ error:", error)
      return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { VerifyAdmin, VerifyUser };
