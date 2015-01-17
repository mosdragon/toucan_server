var express = require('express');
var router = express.Router();

var user = require("../models/user");

/* GET home page. */

router.post('/', function(req, res) {
	// console.log(req);
	console.log("Logging from register");
	console.log(req);
	console.log();
	// console.log(req);
	res.status(200).json({status: 'success!', request: req});
})

router.get('/derp', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
