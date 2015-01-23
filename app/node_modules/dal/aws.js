var config = require('config');
var AWS = require('aws-sdk');
AWS.config.update(config.aws.access);
AWS.config.update({region: config.aws.region});

module.exports = AWS;
