var mongoose = require("../../db");
var bankAccountCollection = "BankAccounts";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var bankAccountSchema = new mongoose.Schema({
	_user: {type: Number, ref: "Users"},
	_transfers: {type: [Number], ref: "Transfers", default: []},
	userEmail: String,
    bank_account: Number,
    legal_name: String,
});

bankAccountSchema.plugin(autoIncrement.plugin, {
	model: bankdAccountCollection,
	startAt: 663157,
	incrementBy: (93 * 91 * 17),
});

bankAccountSchema.methods.addTransfer = function(transfer) {
	this._transfers.push(transfer)
};

module.exports = mongoose.model(bankdAccountCollection, bankAccountSchema);

// // Create a Recipient
// stripe.recipients.create({
//   name: "John Doe",
//   type: "individual",
//   bank_account: token_id,
//   email: "payee@example.com"
// }, function(err, recipient) {
//   // recipient;
// });