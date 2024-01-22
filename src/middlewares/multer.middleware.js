const multer = require('multer');
const uuid = require("uuid");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      let ext = path.extname(file.originalname);
      let uniqueFilename = uuid.v4() + ext;
      cb(null, uniqueFilename);
    }
  })
  
const upload = multer({ 
    storage, 
})

module.exports = upload 