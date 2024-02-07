const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const path = require("path");
const hbs = require("hbs");
const nocache = require("nocache");
const moment = require("moment");
//const errorHandlingMiddleware = require("./middlewares/errorHandling.middleware.js")

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());
//app.use(errorHandlingMiddleware());

//setup view-engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials', function (err) {});
hbs.registerHelper('inc', function (value) {
  return parseInt(value) + 1;
});
hbs.handlebars.registerHelper('getCurrentDateTime', function () {
  return moment().format('dddd, MMMM Do YYYY, h:mm:ss a');
});
hbs.registerHelper('multiply', function (a, b) {
  return a * b;
});
hbs.registerHelper('calculateTotal', function(total, discount, shipping) {
  // Parse input values as numbers
  total = parseFloat(total);
  discount = parseFloat(discount);
  shipping = parseFloat(shipping);

  // Check if any input is NaN
  if (isNaN(total) || isNaN(discount) || isNaN(shipping)) {
      return "Invalid input";
  }

  // Perform the calculation
  const result = (total + shipping) - discount ;

  return result;
});
// hbs.registerHelper('ifZero', function (value) {
//   if(value == 0){
//     return true
//   }else{
//   return false;
//   }
// });

app.use(nocache());


//Require routes
const userRouter = require("./routes/user.routes.js");
const adminRouter = require("./routes/admin.routes.js");
const commonRouter = require("./routes/common.routes.js");
const productRouter  = require("./routes/products.routes.js");

//router declaration
app.use("/api/v1", commonRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/products", productRouter);


app.use((req,res,next)=>{
  res
  .status(404)
  .render("error");
});

module.exports = app;