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
      const {email,secret} = user
      const admin = await Admin.findOne({email})
      if(!admin) {
        return res.status(403).json({ message: "Access forbidden " });
      }

      if(admin.key !== secret){
        return res.status(403).json({ message: "Access forbidden " });
      }

      if (!['admin','moderator','sajid','superadmin'].includes(user.role)) {
          return res.status(403).json({ message: "Access forbidden " });
      }

      req.user = admin;
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
      const {username,password} = user
      const admin = await Admin.findOne({username})
      if(!admin) {
        return res.status(403).json({ message: "Access forbidden " });
      }

      if(admin.password !== password){
        return res.status(403).json({ message: "Access forbidden " });
      }

      req.user = user;
      next();
  } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
  }
};

// midddown function for testing purposes only   for   testing purposes 
 
const VerifyUser = (req, res, next) => {
  const bearer = req.headers.authorization;
  const token = bearer ? bearer.split(" ")[1] : null;
  if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
  }
  try {
      const secretkey = process.env.JWT_SECRET_KEY;
      const user = jwt.verify(token, secretkey);
      req.user = user;
      next();
  } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { VerifyAdmin, VerifyUser,VerifyMedlocusAdmin };
