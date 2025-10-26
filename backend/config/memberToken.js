//ขอ token จากไปรษณีย์ไทย
require('dotenv').config();

async function getThaiPostToken() {
  const memberToken = process.env.THAIPOST_MEMBER_TOKEN;
  if (!memberToken) throw new Error("กรุณาตั้งค่า THAIPOST_MEMBER_TOKEN ใน .env");

  const response = await fetch(
    "https://trackapi.thailandpost.co.th/post/api/v1/authenticate/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${memberToken}`,
      },
    }
  );
//debug
  const text = await response.text();
  console.log("Response from ThaiPost (auth):", text);
  try {
    const data = JSON.parse(text);
    if (!data.token) throw new Error("Token not returned from ThaiPost");
    return data.token;
  } catch (err) {
    throw new Error("ThaiPost API did not return JSON: " + err.message);
  }
}

module.exports = { getThaiPostToken };
