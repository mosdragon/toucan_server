var mongoose = require("../../db");
var bankAccountCollection = "BankAccounts";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var bankAccountSchema = new mongoose.Schema({
	_user: {type: Number, ref: "Users"},
	_transfers: {type: [Number], ref: "Transfers", default: []},
	stripe_id: {type: String, unique: true},
	stripe_token: {type: Object, required: true, unique: true},
	nickname: {type: String},
	userEmail: String,
    legal_name: String,
    accountNumber: {type: String, default: "XXXX-XXXX-XXXX-"},
});

bankAccountSchema.plugin(autoIncrement.plugin, {
	model: bankAccountCollection,
	startAt: 663157,
	incrementBy: (93 * 91 * 17),
});

bankAccountSchema.methods.setAccountNumber = function(account) {
	this.accountNumber += String(account);
}

bankAccountSchema.methods.addTransfer = function(transfer, callback) {
	var self = this;
	self._transfers.push(transfer._id);
	self.save(callback);
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