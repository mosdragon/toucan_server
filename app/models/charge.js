var mongoose = require("../../db");

var chargesCollection = "Charges";
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var chargesSchema = new mongoose.Schema({
	currency: {type: String, default: "usd"},
	amount: {type: Number, required: true},
	description: {type: String, default:""},
	dateCreated: {type: Date, default: new Date()},
	_sessions: {type: [Number], ref: "Sessions", default: []},
	charge_object: {type: Object},
});

chargesSchema.methods.addSession = function(session, callback) {
	var self = this;
	this._sessions.push(session._id);
	self.save(callback);
}

chargesSchema.plugin(autoIncrement.plugin, {
	model: chargesCollection,
	startAt: 674339,
	incrementBy: (207 * 83 * 97),
});


module.exports = mongoose.model(chargesCollection, chargesSchema);