var mongoose = require("../../db");
var transfersCollection = "Transfers";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var transfersSchema = new mongoose.Schema({
	currency: {type: String, default: "usd"},
	amount: Number,
	dateCreated: {type: Date, default: new Date()},
  	_recipient: {type: Number, ref:"User", required: true},
  	description: String,
  	transfer_obj: Object,
  	_sessions: {type: [Number], ref: "Sessions", default: []},
});

transfersSchema.methods.addSession = function(session, callback) {
	var self = this;
	this._sessions.push(session._id);
	self.save(callback);
};

transfersSchema.plugin(autoIncrement.plugin, {
	model: transfersCollection,
	startAt: 69711,
	incrementBy: (7 *13 * 21),
});


module.exports = mongoose.model(transfersCollection, transfersSchema);

//   // Create a transfer to the specified recipient
// stripe.transfers.create({
//   amount: 1000, // amount in cents
//   currency: "usd",
//   recipient: recipientId,
//   bank_account: bank_account_id,
//   statement_descriptor: "JULY SALES"
// }, function(err, transfer) {
//   // transfer;
// });