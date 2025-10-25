const basicAuth = require('express-basic-auth');

//ป้องการโดเมนของแอดมินด้วย basicAuth
const adminAuth = basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true,
  realm: "Admin Area",
});

module.exports = adminAuth;