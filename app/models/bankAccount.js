var mongoose = require("../../db");
var bankAccountCollection = "BankAccounts";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var bankAccountSchema = new mongoose.Schema({
	_user: {type: Number, ref: "Users"},
	_transfers: {type: [Number], ref: "Transfers", default: []},
	stipe_id: {type: String},
	stripe_token: {type: Object},
	nickname: {type: String},
	userEmail: String,
    legal_name: String,
    blurred_number: {type: String, default: "XXXX-XXXX-XXXX-"},
});

bankAccountSchema.plugin(autoIncrement.plugin, {
	model: bankAccountCollection,
	startAt: 663157,
	incrementBy: (93 * 91 * 17),
});

bankAccountSchema.methods.setStripeId = function() {
	this.stripe_id = stripe_token.id;
}

bankAccountSchema.methods.setBlurredNumber = function(input) {
	this.blurred_number += input;
}

bankAccountSchema.methods.addTransfer = function(transfer) {
	this._transfers.push(transfer)
};

module.exports = mongoose.model(bankAccountCollection, bankAccountSchema);

// // Create a Recipient
// stripe.recipients.create({
//   name: "John Doe",
//   type: "individual",
//   bank_account: token_id,
//   email: "payee@example.com"
// }, function(err, recipient) {
//   // recipient;
// });