var mongoose = require("../../db");
var transfersCollection = "Transfers";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var transfersSchema = new mongoose.Schema({
	currency: {type: String, default: "usd"},
	amount: Number, // amount in cents, by Stripe api
	dateCreated: {type: Date, default: new Date()},
  	recipient: Number,
  	bank_account: String,
  	statement_descriptor: String,
  	transfer_obj: Object,
});

transfersSchema.plugin(autoIncrement.plugin, {
	model: transfersCollection,
	startAt: 69711,
	incrementBy: (7 *13 * 21),
});

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