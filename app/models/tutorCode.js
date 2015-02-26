var mongoose = require("../../db");
var crypto = require('crypto');

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var tutorCodeCollection = "TutorCodes";

var tutorCodeSchema = new mongoose.Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	emailAddress: {type: String, required: true},
	coursesTaught: {type: [String], required: true},
	isCertified: {type: Boolean, default: false},
	rates: {type: Object, required: true},
	tutorCode: {type: String},
	codeUsed: {type: Boolean, default: false},
	timeUsed: {type: Date},
	dateCreated: {type: Date, default: (new Date())},
});

tutorCodeSchema.methods.setUsed = function(callback) {
	console.log("TutorCode setUsed");
	var self = this;
	self.codeUsed = true;
	self.timeUsed = new Date();
	self.save(callback);
};


var randomValueHex = function(len) {
    return crypto.randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len);   // return required number of characters
};

tutorCodeSchema.methods.generateTutorCode = function(callback) {
	// Want 8 digit tutorCodes
	var self = this;
	var tutorCodeLen = 8;
	self.tutorCode = randomValueHex(tutorCodeLen);
	self.save(function(err) {
		return callback(err, self.tutorCode);
	});
}

tutorCodeSchema.plugin(autoIncrement.plugin, {
	model: tutorCodeCollection,
	startAt: 22231,
	incrementBy: 3 * 13 * 11,
});


module.exports = mongoose.model(tutorCodeCollection, tutorCodeSchema);