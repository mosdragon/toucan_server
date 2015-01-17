var express = require('express');
var router = express.Router();

var user = require("../models/user");

router.post('/', function(req, res) {
	// console.log(req);
	console.log("Logging from register");
	console.log(req);
	console.log(req.body);
	// console.log("params: ");
	// console.log(req.params("age"));
	// console.log(req.param("osama"));
	// res.status(200).json({status: 'success!', request: req});
	res.send('SUCCESS');
})

router.get('/derp', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
