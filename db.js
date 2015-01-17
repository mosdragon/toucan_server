var connectionString = require("./config").dev.mongo;
var mongoose = require('mongoose');

mongoose.connect(connectionString);

module.exports = mongoose;