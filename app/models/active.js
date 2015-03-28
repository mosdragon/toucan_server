var mongoose = require("../../db");

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var activeCollection = "Actives";
var User = require("./user");
var Session = require("./session");

var bcrypt = require('bcrypt')
var SALT_WORK_FACTOR = 12;

var activeSchema = new mongoose.Schema({

	_tutor: {type: Number, ref: "Users", unique: true},
	_session: {type: Number, ref: "Sessions"}, // session will be created once a tutor and tutee connect
	beginTime: {type: Date, default: (new Date())},
	endTime: {type: Date, required: true},
	available: {type: Boolean, default: true},
	coursesTaught: {type: [String], default: []},
	school: {type: String},
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
    if (self['endTime'] == undefined) {
    	var now = new Date();
    	// One hour from now
    	now.setHours(now.getHours() + 1);
	    self.setStripeId();
		next();

	} else {
		return next();
	}
});





module.exports = mongoose.model(activeCollection, activeSchema);