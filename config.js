
//provide a sensible default for local development
var db_name = "toucan";
var mongodb_connection_string = 'mongodb://localhost/' + db_name;

//take advantage of openshift env vars when available:
if (process.env.OPENSHIFT_MONGODB_DB_URL){
  mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + db_name;
}


var data = {
	dev: {
		mongo:  mongodb_connection_string,
		// Stripe demo key
		stripe_api_key: "sk_test_4dRYACzSml2igCRyOvb0d8Xw",
		cookiePassword: "insertpasswordhere",
		baseRate: 8,
		baseRateCertified: 18,
		toucan_bank_id: "rp_15bKjgHnsjstms08sHgByby6",
		percentTutor: 80,
	}
};

module.exports = data;