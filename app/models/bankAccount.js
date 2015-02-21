var mongoose = require("../../db");
var bankAccountCollection = "BankAccounts";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var bankAccountSchema = new mongoose.Schema({
	_user: {type: Number, ref: "Users"},
	_transfers: {type: [Number], ref: "Transfers", default: []},
	stipe_id: {type: String, unique: true},
	stripe_token: {type: Object, required: true, unique: true},
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

bankAccountSchema.methods.setStripeId = function(token) {
	this.stripe_id = token.id;
}

bankAccountSchema.methods.setBlurredNumber = function(input) {
	this.blurred_number += String(input);
}

bankAccountSchema.methods.addTransfer = function(transfer) {
	this._transfers.push(transfer)
};

bankAccountSchema.pre('save', function(next) {
    var self = this;

    // only if stripe_token added/modified
    if (self.isModified('stripe_token')) {
    	console.log("Modified stripe_token");
	    self.setStripeId(self.stripe_token);
	    return next();

	} else {
		return next();
	}
});

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