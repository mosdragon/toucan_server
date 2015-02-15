var mongoose = require("../../db");

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var activeCollection = "Actives";

var bcrypt = require('bcrypt')
var SALT_WORK_FACTOR = 12;


// Distance conversion factors
var milesToKM = 1.60934;
var earthRadius = 6371; // in KM


var activeSchema = new mongoose.Schema({

	_tutor: {type: Number, ref: "User", unique: true},
	_session: {type: Number}, // session will be created once a tutor and tutee connect
	dateCreated: {type: Date, default: new Date()},
	beginTime: {type: Date, default: new Date()},
	endTime: {type: Date},
	available: {type: boolean, default: true},
	location: {type: Number, index: "2d"},
});

activeSchema.statics.milesToDegrees = function(miles) {
	var km = Math.floor(miles * milesToKM * 100) / 100;
	return kmToDegrees(km);
};

activeSchema.statics.kmToDegrees = function(km) {
	var degrees = km / earthRadius; // approximate
	return degrees;
};

activeSchema.plugin(autoIncrement.plugin, {
	model: activeCollection,
	startAt: 33313,
	incrementBy: 93 * 13,
});


module.exports = mongoose.model(activeCollection, activeSchema);