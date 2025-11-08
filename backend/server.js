const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
connectDB();

const adminRouter = require("./routes/admin.routes.js");
const customerRouter = require("./routes/customer.routes.js");

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

//admin
app.use("/admin-ban-poolsub", adminRouter);

//customer
app.use("/customer-ban-poolsub", customerRouter);

module.exports = app;

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
