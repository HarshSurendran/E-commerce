const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const path = require("path");
const hbs = require("hbs");
//const errorHandlingMiddleware = require("./middlewares/errorHandling.middleware.js")

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());
//app.use(errorHandlingMiddleware());

//setup view-engine
console.log(__dirname);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials', function (err) {});


//Require routes
const userRouter = require("./routes/user.routes.js");
const adminRouter = require("./routes/admin.routes.js");
const commonRouter = require("./routes/common.routes.js");

//router declaration
app.use("/api/v1", commonRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);



module.exports = app;