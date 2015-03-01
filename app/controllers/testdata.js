var express = require('express');
var router = express.Router();

var Session = require("../models/session");
var User = require("../models/user");
var Active = require("../models/active");


var success = 200;
var failure = 500;

var basepath = "";
var path = function(addition) {
	return basepath + addition;
};



module.exports = router;