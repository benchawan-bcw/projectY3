const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fetch = require("node-fetch");

//ขอ token จากไปรษณีย์ไทย
async function getThaiPostToken() {
  const memberToken =
    "B1W6K;KzB%KJNjMmJ:LTNcQzJcUlQiHQV.YqLFYpJ4K?GhV=PSWRZ~HLK_TCWnK?K=A6GfI1SWGRZVNbEGIQE^B1DgW^Z1URTcJG";
  const response = await fetch(
    "https://trackapi.thailandpost.co.th/post/api/v1/authenticate/token",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${memberToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  return data.token;
}

module.exports = {
  getThaiPostToken,
};
