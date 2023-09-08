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
      const secretkey = process.env.JSW_SECRET_KEY || "fuckyou";
      const user = jwt.verify(token, secretkey);

      const {email,secret} = user
      console.log("🚀 ~ file: middlewares.js:17 ~ VerifyAdmin ~ secret:", secret)
      console.log("🚀 ~ file: middlewares.js:17 ~ VerifyAdmin ~ email:", email)

      const admin = await Admin.findOne({email})
      console.log("🚀 ~ file: middlewares.js:21 ~ VerifyAdmin ~ admin:", admin)
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
      const secretkey = process.env.JSW_SECRET_KEY || "fuckyou";
      const user = jwt.verify(token, secretkey);
      req.user = user;
      next();
  } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { VerifyAdmin, VerifyUser };
