var mongoose = require("../../db");

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var activeCollection = "Actives";
var User = require("./user");
var Session = require("./session");

var bcrypt = require('bcrypt')
var SALT_WORK_FACTOR = 12;


// Distance conversion factors
var milesToKM = 1.60934;
var earthRadius = 6371; // in KM


var activeSchema = new mongoose.Schema({

	_tutor: {type: Number, ref: "Users", unique: true},
	_session: {type: Number, ref: "Sessions"}, // session will be created once a tutor and tutee connect
	beginTime: {type: Date},
	endTime: {type: Date},
	available: {type: Boolean, required: false, default: true},
	coursesTaught: {type: [String], default: []},
	// Using geospatial indexing -- format is [long, lat]
	location: { type: [Number], index: '2dsphere', required: true},
});

activeSchema.methods.setSession = function(params, callback) {
	var session = new Session(params);
	session.save(function(err) {

	});
};

activeSchema.plugin(autoIncrement.plugin, {
	model: activeCollection,
	startAt: 33313,
	incrementBy: 93 * 13,
});

activeSchema.pre('save', function(next) {
    var self = this;

    // next();
    if (self['endTime'] == null) {
    	var now = new Date();
    	// One hour from now
    	now.setHours(now.getHours() + 1);
	    self.setStripeId();
	    // User.findOne({_id: self._tutor}, function(err, user) {
	    // 	console.log(user);
	    // 	self.coursesTaught = user.coursesTaught;
	    // 	return next();
	    // });
		next();

	} else {
		return next();
	}
});





module.exports = mongoose.model(activeCollection, activeSchema);