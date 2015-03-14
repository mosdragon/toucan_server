var express = require('express');
var router = express.Router();

var async = require("async");

var Active = require("../models/active");
var BankAccount = require("../models/bankAccount");
var Charge = require("../models/charge");
var Course = require("../models/course");
var CreditCard = require("../models/creditCard");
var Review = require("../models/review");
var Session = require("../models/session");
var transfer = require("../models/transfer");
var TutorCode = require("../models/tutorCode");
var User = require("../models/user");

var allModels = [
	Active,
	BankAccount,
	Charge,
	Course,
	CreditCard,
	Review,
	Session,
	transfer,
	TutorCode,
	User,
];

var mongoose = require("../../db");
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);


var success = 200;
var failure = 500;

var successMsg = "SUCCESS";
var failureMsg = "FAILURE";

var baseRate = require("../../config").dev.baseRate;
var baseRateCertified = require("../../config").dev.baseRateCertified;

var basepath = "";
var path = function(addition) {
	return basepath + addition;
};


var resetCount = function(entry, callback) {
	entry.resetCount(function(err, nextCount) {
		if (err || !nextCount) {
			return callback(err);
		} else {
			console.log("COUNT RESET SUCCESS -- " + nextCount);
			return callback();
		}
	});
};

var deleteRecords = function(Model, callback) {
	Model.find({}).exec(function(err, entries) {
		if (err) {
			console.log("Error deleting entries for Model: " + Model);
			return callback(err);
		} else if (entries && entries.length > 0) {
			var count = 0;
			async.eachSeries(entries, function(entry, next) {
				// If entry is the first entry returned, first reset count, then delete everything
				if (count === 0) {
					
					var reset = function(cb) {
						resetCount(entry, cb);
					};
					var remove = function(cb) {
						entry.remove(cb);
					};

					async.series([reset, remove], function(err) {
						if (err) {
							console.log(err);
						}
						next(err);
					});

				} else {
					entry.remove(next);
				}
				count++;
			}, callback);
		} else {
			return callback();
		}
	});
};

router.post(path("/resetDB"), function(req, res) {
	var input = JSON.parse(req.body);

	async.each(allModels, function(model, next) {
		deleteRecords(model, next);
	}, function(err) {
		if (err) {
			console.log("RESET DB ERROR" + err);
			res.send({
				code: failure,
				msg: failureMsg,
			})
		} else {
			res.send({
				code: success,
				msg: successMsg,
			});
		}
	})
});

module.exports = router;