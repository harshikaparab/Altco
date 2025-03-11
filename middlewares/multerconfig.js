const express = require("express");
const app = express();
const fs = require('fs')
const mongoose = require("mongoose")
const multer  = require('multer')
const { v4:uuidv4 } = require('uuid') ;
const cloudinary = require("cloudinary").v2
require("dotenv").config()


cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET 
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        console.log("insidefilename fxn", file);
      const random = uuidv4()
      cb(null, random+""+file.originalname)
    }
  })
  
  const upload = multer({ storage: storage })

  module.exports = upload;