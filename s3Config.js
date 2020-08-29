var aws = require('aws-sdk');
const multer = require("multer");
const multerS3 = require('multer-s3');
const path = require("path");

aws.config.setPromisesDependency();

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_ID,
    secretAccessKey: process.env.AWS_ACCESS_KEY,
    region: 'us-east-1'
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type, only JPEG and PNG is allowed!'), false);
    }
  }

const s3 = new aws.S3();

var limits = {
  files: 2, // allow only 1 file per request
  fileSize: 5000 * 1024 * 1024, // (replace MBs allowed with your desires)
};

const upload = multer({
    fileFilter,
    limits: limits,
    storage: multerS3({
      acl: 'public-read',
      s3,
      bucket: process.env.S3_BUCKET_NAME,
    //   metadata: function (req, file, cb) {
    //     cb(null, {fieldName: 'TESTING_METADATA'});
    //   },
      key: function (req, file, cb) {
        cb(null, Math.floor(Math.random()*9).toString() + Math.floor(Math.random()*9).toString() + Math.floor(Math.random()*9).toString() + Math.floor(Math.random()*9).toString() + Math.floor(Math.random()*9).toString() + "_" + Date.now().toString() + path.extname(file.originalname))
      }
    })
  }).array('images', 2);

module.exports = upload;