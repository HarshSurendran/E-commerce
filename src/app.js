const express = require("express");
const app = express();

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));


//Require routes
const userRouter = require("./routes/user.routes.js");
const adminRouter = require("./routes/admin.routes.js");

//router declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);



module.exports = app;