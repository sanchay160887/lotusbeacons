var debug = require('debug')('https');
var https = require('https');
var util = require('util');
var events = require('events');

var Message = require('./message');


var AndroidGcm = function(androidApiKey) {

    if(androidApiKey)
        this.apikey = androidApiKey;
    else
        throw Error('Error. No API key.');

    if(!(this instanceof AndroidGcm))
        return new AndroidGcm(androidApiKey);

    this.httpServer = {
        host: 'android.googleapis.com',
        path: '/gcm/send',
        port: 443,
        method: 'POST',
        headers: {}
    };
};

util.inherits(AndroidGcm, events.EventEmitter);


AndroidGcm.prototype.send = function(message, cb) {

    var dataToPost = JSON.stringify(message);
    var _self = this;

    _self.httpServer.headers = {
        'Host': _self.httpServer.host,
        'Authorization': 'key=' + _self.apikey,
        'Content-Type': 'application/json;charset=UTF-8',
        'Content-length': Buffer.byteLength(dataToPost, 'utf8')
    };

    var request = https.request(_self.httpServer, function(response) {

        var data = '';
        var _statusCode = response.statusCode;
        var _errorMessage = '';

        if(_statusCode === 400) {
            _errorMessage = '400. Request could not be parsed as JSON, or it contained invalid fields.';
            debug(_errorMessage);
            return cb(_errorMessage, null);
        }
        else if(_statusCode === 401) {
            _errorMessage = '401. Error authenticating the sender account.';
            debug(_errorMessage);
            return cb(_errorMessage, null);
        }
        else if(_statusCode >= 500) {
            _errorMessage = _statusCode + '. Error in the GCM server while trying to process the request, or that the server is temporarily unavailable.';
            debug(_errorMessage);
            return cb(_errorMessage, null);
        }
        else if(_statusCode !== 200) {
            _errorMessage = _statusCode + '. Request Error.';
            debug(_errorMessage);
            return cb(_errorMessage, null);
        }


        response.on('data', function(d) {
            data += d;
        });

        response.on('end', function() {
            data = JSON.parse(data);
            cb(null, data);
        });
    });

    request.on('error', function(err) {
        console.log('request error:  ', err);
    });

    request.write(dataToPost);
    request.end();
};

exports.AndroidGcm = AndroidGcm;
exports.Message = Message;
