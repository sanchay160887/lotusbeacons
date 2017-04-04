/*Node Modules*/
var express = require('express');
var moment = require('moment');

var http = require('http'),
    fs = require('fs'), // NEVER use a Sync function except at start-up!
    index = fs.readFileSync(__dirname + '/index.html');

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');
var async = require('async');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var GcmGoogleKey = 'AIzaSyAUxc6EwlgRP6MITCynw3_vsYatPI4iZuw';
var FcmGoogleKeyEmp = 'AIzaSyBG65mkyorOX8uzdzcmMY8DOC183OcQozo';
var gcm = require('android-gcm');
var request = require('request');
var forEach = require('async-foreach').forEach;
var passwordHash = require('password-hash');
var session = require('express-session');
querystring = require('querystring');
require('timers');
var devicecron = require('node-cron');
//var mongourl = 'mongodb://lotus:remote@ds161255.mlab.com:61255/lotusbeacon'; Live Database
var mongourl = 'mongodb://lotus:remote@ds137100.mlab.com:37100/lotusbeaconemployee'; //Staging Database
//var lotusWebURL = 'https://www.lotuselectronics.com/v2/';
var lotusWebURL = 'http://lampdemos.com/lotus15/v2/';

var lotusURL = 'http://lampdemos.com/lotus15/v2_emp/';

//if change here also change it to device history and devicedata controller
var loginexpiredmessage = 'Login Expired. Please reload and login again.';

//var mongourl = 'mongodb://localhost:27017/lotusbeacon';
MongoClient.connect(mongourl, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server.");
    db.close();
});

// Send index.html to all requests
var server = http.createServer(function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.end(index);
});

var app = express();

app.use('/', express.static(__dirname + '/angular/'));
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({
    extended: true
})); // parse application/x-www-form-urlencoded
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
app.all("/*", function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST");

    return next();
});

var server = app.listen(process.env.PORT || 5000, function() {
    console.log("App started with Mongodb");
});


var notificationImagesdirectory = './angular/images/notificationuploads/';

if (!fs.existsSync(notificationImagesdirectory)) {
    fs.mkdirSync(notificationImagesdirectory);
}

// Socket.io server listens to our app
var io = require('socket.io').listen(server);

// Send current time to all connected clients
function sendTime() {
    io.emit('time', {
        time: new Date().toJSON()
    });
}

io.on('receiveTime', function(data) {
    console.log('Data coming from client :: ');
})

/* General Supportive Function start */
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function convertToMinutes(timeValue) {
    var a = timeValue.split(':'); // split it at the colons
    if (a.length < 3) {
        return 0;
    }

    // minutes are worth 60 seconds. Hours are worth 60 minutes.
    // var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
    var seconds = a[1] + ' Min ' + a[2] + ' Sec';
    return (seconds);

}

function convertStringTimeToSeconds(timeValue) {
    var a = timeValue.split(':'); // split it at the colons
    if (a.length < 3) {
        return 0;
    }

    // minutes are worth 60 seconds. Hours are worth 60 minutes.
    var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
    return (seconds);
}

function convertSecondsToStringTime(seconds) {
    if (seconds && !isNumeric(seconds)) {
        return 0;
    }
    seconds = parseInt(seconds);
    var timestring = '';
    hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    if (hours > 0) {
        timestring = hours + ' hr ';
    }
    if (minutes > 0) {
        timestring = timestring + minutes + ' min ';
    }
    if (seconds > 0) {
        timestring = timestring + seconds + ' sec';
    }
    return timestring;
}

function convertSecondsToStringTime2(seconds) {
    if (seconds && !isNumeric(seconds)) {
        return 0;
    }
    seconds = parseInt(seconds);
    var timestring = '';
    hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    if (hours > 0) {
        timestring = hours + ':';
    } else {
        timestring = '00:';
    }
    if (minutes > 0) {
        timestring = timestring + minutes + ':';
    } else {
        timestring = timestring + '00:';
    }
    if (seconds > 0) {
        timestring = timestring + seconds;
    } else {
        timestring = timestring + '00';
    }
    return timestring;
}

function getCurrentTime() {
    var d = new Date();
    console.log('Time zone offset: ' + d.getTimezoneOffset());
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    //India Time +5:30
    utc = utc + 19800000;
    return utc;
}

function parse_JSON(responsecontent) {
    try {
        return JSON.parse(responsecontent);
    } catch (ex) {
        return null;
    }
}

/* General Supportive Function End <<-- */

function updateDevice(BeaconID, DeviceID, Distance, MobileNo, resObj) {
    console.log('Update Device called to check socket');
    if (MobileNo && MobileNo == '9584010456') {
        console.log('Beacon ID ' + BeaconID);
        console.log('Device ID ' + DeviceID);
        console.log('Distance ' + Distance);
        console.log('Mobile No ' + MobileNo);
    }
    var BeaconStoreID = '';

    var resObjVal = {};
    if (!(DeviceID && Distance && MobileNo)) {
        console.log('Invalid data passing');
        io.emit('updateDevice_response', {
            'IsSuccess': false,
            'message': 'Invalid data passing'
        });

        if (resObj) {
            resObjVal.IsSuccess = false;
            resObjVal.message = "Invalid data passing";
            resObj.send(resObjVal);
        }
        return;
    }

    if (!isNumeric(Distance)) {
        if (resObj) {
            resObjVal.IsSuccess = false;
            resObjVal.message = "Distance should be in numbers";
            resObj.send(resObjVal);
        }
        return;
    }

    console.log('Update device called');

    var comingFromLatLong = false;
    if (!BeaconID) {
        BeaconID = '';
        comingFromLatLong = true;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('device');

        async.waterfall([
            function(callback) {
                var bcollection = db.collection('beacons');
                bcollection.find({
                    'BeaconID': BeaconID
                }).toArray(function(err, beacons) {
                    callback(null, beacons);
                });
            },
            function(beacons, callback) {
                if (!(beacons && beacons.length > 0)) {
                    if (resObj) {
                        resObjVal.IsSuccess = false;
                        resObjVal.message = "Invalid Beacon ID";
                        resObj.send(resObjVal);
                    }
                    return 0;
                } else {
                    BeaconStoreID = beacons[0].BeaconStore;
                }

                collection.find({
                    'DeviceID': DeviceID
                }).toArray(function(err, devices) {
                    if (devices && devices.length > 0 && BeaconID != '') {
                        updateDeviceHistory(devices[0].BeaconID, devices[0].DeviceID, MobileNo);
                    }
                    callback(null, devices);
                });
            },
            function(devicedata, callback) {
                if (BeaconID != '') {
                    collection.update({
                        'MobileNo': MobileNo
                    }, {
                        'BeaconID': BeaconID,
                        'DeviceID': DeviceID,
                        'MobileNo': MobileNo,
                        'Distance': Distance,
                        'connectiontime': getCurrentTime(),
                    }, {
                        'upsert': true,
                    }, function(err, result) {
                        console.log('Device updated or inserted');
                        callback(null, 'updated or inserted');
                    });
                }
            },
            function(response, callback) {
                io.emit('updateDevice_response', {
                    'IsSuccess': true,
                    'BeaconID': BeaconID,
                    'StoreID': BeaconStoreID,
                    'MobileNo': MobileNo,
                    'message': 'Data inserted successfully'
                });

                db.close();
                if (resObj) {
                    var obj = {
                        'IsSuccess': true,
                        'BeaconID': BeaconID,
                        'StoreID': BeaconStoreID,
                        'MobileNo': MobileNo,
                        'message': 'Data inserted successfully'
                    };

                    resObj.send(obj);
                }
                callback(null, response);
            }
        ]);
    });
}



/// Employe function for update user Active start
function updateUser_Active(BeaconID, UserID, Distance, resObj) {
    console.log('updateUser_Active function calling')
    var UserID = ObjectId(UserID);

    console.log('Update User Active called');
    console.log(UserID);
    console.log('==============================');

    console.log('Beacon ID ' + BeaconID);
    console.log('User ID ' + UserID);
    console.log('Distance ' + Distance);


    var BeaconStoreID = '';

    var resObjVal = {};
    if (!(UserID && Distance)) {
        console.log('Invalid data passing');
        io.emit('updateUser_Active_response', {
            'IsSuccess': false,
            'message': 'Invalid data passing'
        });

        if (resObj) {
            resObjVal.IsSuccess = false;
            resObjVal.message = "Invalid data passing";
            resObj.send(resObjVal);
        }
        return;
    }

    if (!isNumeric(Distance)) {
        if (resObj) {
            resObjVal.IsSuccess = false;
            resObjVal.message = "Distance should be in numbers";
            resObj.send(resObjVal);
        }
        return;
    }

    console.log('Update device called');

    var comingFromLatLong = false;
    if (!BeaconID) {
        BeaconID = '';
        comingFromLatLong = true;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('user_beacons_active');

        async.waterfall([
            function(callback) {
                var bcollection = db.collection('beacons');
                bcollection.find({
                    'BeaconID': BeaconID
                }).toArray(function(err, beacons) {
                    callback(null, beacons);
                });
            },
            function(beacons, callback) {
                if (!(beacons && beacons.length > 0)) {
                    if (resObj) {
                        resObjVal.IsSuccess = false;
                        resObjVal.message = "Invalid Beacon ID";
                        resObj.send(resObjVal);
                    }
                    return 0;
                } else {
                    BeaconStoreID = beacons[0].BeaconStore;
                }

                collection.find({
                    'UserID': UserID
                }).toArray(function(err, user_beacons) {
                    if (user_beacons && user_beacons.length > 0 && BeaconID != '') {
                        updateUser_Beacon_History(user_beacons[0].BeaconID, user_beacons[0].UserID);
                    }
                    callback(null, user_beacons);
                });
            },
            function(user_beacons_data, callback) {
                console.log(user_beacons_data);
                console.log('user beacon data called');

                if (BeaconID != '') {
                    collection.update({
                        'UserID': UserID //It should be oid
                    }, {
                        'BeaconID': BeaconID,
                        'UserID': UserID,

                        'Distance': Distance,
                        'connectiontime': getCurrentTime(),
                    }, {
                        'upsert': true,
                    }, function(err, result) {
                        console.log('Employee updated or inserted');
                        callback(null, 'updated or inserted');
                    });
                }
            },
            function(response, callback) {
                io.emit('updateUser_Active_response', {
                    'IsSuccess': true,
                    'BeaconID': BeaconID,
                    'StoreID': BeaconStoreID,
                    'UserID': UserID,
                    'message': 'Data inserted successfully'
                });

                db.close();
                if (resObj) {
                    var obj = {
                        'IsSuccess': true,
                        'BeaconID': BeaconID,
                        'StoreID': BeaconStoreID,
                        'UserID': UserID,
                        'message': 'Data inserted successfully'
                    };

                    resObj.send(obj);
                }
                callback(null, response);
            }
        ]);
    });
}


function updateUser_Beacon_History(BeaconID, UserID, resObj) {
    console.log('------------Updating User employee History--------------');
    console.log('Beacon ID ' + BeaconID);
    console.log('User ID ' + UserID);
    console.log('------------Updating User employee History--------------');

    var resObjVal = {};
    if (!(BeaconID && UserID)) {
        return;
    }

    var BeaconStore = '';

    todaysdate = getCurrentTime();
    seldate = new Date(todaysdate);
    datestring = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();
    fromDate = new Date(datestring).getTime();
    toDate = new Date(datestring + ' 23:59:59').getTime();

    console.log('Update user history called');

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        //var collection = db.collection('test_device_history');
        var collection = db.collection('user_beacons_history ');
        var beacons = [];

        async.waterfall([
            function(callback) {
                var bcollection = db.collection('beacons');
                bcollection.find({
                    'BeaconID': BeaconID
                }).toArray(function(err, beaconsdata) {
                    callback(null, beaconsdata);
                });
            },
            function(beaconsdata, callback) {
                if (!(beaconsdata && beaconsdata.length > 0)) {
                    if (typeof(resObj) != 'undefined') {
                        resObjVal.IsSuccess = false;
                        resObjVal.message = "Invalid Beacon ID";
                        resObj.send(resObjVal);
                    }
                    return;
                } else {
                    beacons = beaconsdata;
                    BeaconStore = beaconsdata[0].BeaconStore;
                    callback(null, 'next callback');
                }
            },

            function(data, callback) {
                collection.find({
                    'UserID': UserID,
                    'Date': {
                        $gte: fromDate,
                        $lte: toDate,
                    }
                }).sort({ 'Date': -1 }).toArray(function(err, devicelist) {
                    callback(null, devicelist);
                })
            },
            function(devicelist, callback) {
                var devicetoken = ''
                if (!(devicelist && devicelist.length > 0)) {
                    if (typeof(beacons[0].BeaconWelcome) != 'undefined' && beacons[0].BeaconWelcome) {

                        //========================find device token on basis of user ID====================
                        var usercollection = db.collection('users');
                        usercollection.find({ 'UserID': UserID, }).toArray(function(err, token) {
                            devicetoken = token[0].devicetoken;
                        });

                        //End===================   find device toten on basis of user ID====================

                        //sendpushnotification('', [DeviceID], 'Greetings from Lotus Electronics. Look out for latest deals for the products you are shopping for');
                        notifresobj = {};
                        sendpushnotification(notifresobj, [devicetoken], 'Greetings from Lotus Electronics. Look out for latest deals for the products you are shopping for');
                    }
                }
                console.log('Sending notification');
                callback(null, devicelist);
            },
            function(devices, callback) {
                console.log('Inserting records over device history');
                var IsInsertRecord = false;
                currtime = getCurrentTime();

                if (devices && devices.length > 0 &&
                    !(typeof(devices[0].freeze) != 'undefined' && devices[0].freeze)) {
                    //When user stayed to same beacon and socket calling update service again and again
                    if (devices[0].BeaconID == BeaconID) {
                        StayTime = Math.max(((todaysdate - devices[0].Date) / 1000), 0);
                        if (StayTime >= 1) {
                            collection.update({
                                    _id: ObjectId(devices[0]._id)
                                }, {
                                    '$set': {
                                        'DateTo': todaysdate,
                                        'StayTime': StayTime,
                                    }
                                },
                                function(err, result) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        callback(null, 'updated');
                                        return 0;
                                    }
                                });
                        }
                    } else {
                        //When user move to another beacon from previous beacon
                        StayTime = Math.max(((todaysdate - devices[0].Date) / 1000) - 1, 0);
                        if (StayTime >= 1) {
                            collection.update({
                                    _id: ObjectId(devices[0]._id)
                                }, {
                                    '$set': {
                                        'DateTo': todaysdate,
                                        'StayTime': StayTime,
                                    }
                                },
                                function(err, result) {
                                    if (err) {
                                        throw err;
                                    }
                                });
                        }
                        IsInsertRecord = true;
                    }
                } else {
                    IsInsertRecord = true;
                }
                if (IsInsertRecord) {
                    collection.insert({
                        'BeaconID': BeaconID,
                        'UserID': UserID,
                        'StayTime': 1,
                        'Date': todaysdate,
                        'DateTo': todaysdate
                    }, function(err, records) {
                        callback(null, 'inserted');
                        console.log('Device History inserted Mobile No:' + UserID);
                    });
                }
            },
            function(response, callback) {
                io.emit('updateDeviceHistory_response', {
                    'IsSuccess': true,
                    'BeaconID': BeaconID,
                    'UserID': UserID,
                    //'StoreID': BeaconStore,
                    // 'MobileNo': MobileNo,
                    'message': 'Data updated successfully'
                });
                console.log('coming to last callback');
                db.close();
                if (resObj) {
                    var obj = {
                            'IsSuccess': true,
                            'BeaconID': BeaconID,
                            'UserID': UserID,
                            //'StoreID': BeaconStore,
                            //'MobileNo': MobileNo,
                            'message': 'Data updated successfully'
                        }
                        //resObjVal.data = 'History updated upto last callback';
                    resObj.send(obj);
                }
                callback(null, response);
            }
        ]);
    });




}


function updateDeviceHistory(BeaconID, DeviceID, MobileNo, resObj) {
    if (MobileNo && MobileNo == '9584010456') {
        console.log('------------Updating device History--------------');
        console.log('Beacon ID ' + BeaconID);
        console.log('Device ID ' + DeviceID);
        console.log('Mobile No ' + MobileNo);
        console.log('------------Updating device History--------------');
    }
    var resObjVal = {};
    if (!(BeaconID && DeviceID && MobileNo)) {
        return;
    }

    var BeaconStore = '';

    todaysdate = getCurrentTime();
    seldate = new Date(todaysdate);
    datestring = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();
    fromDate = new Date(datestring).getTime();
    //toDate = new Date(datestring + ' 23:59:59').getTime();
    toDate = fromDate + 60000;

    console.log('Update device history called');

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);


        //var collection = db.collection('test_device_history');
        var collection = db.collection('device_history');

        var beacons = [];

        async.waterfall([
            function(callback) {
                var bcollection = db.collection('beacons');
                bcollection.find({
                    'BeaconID': BeaconID
                }).toArray(function(err, beaconsdata) {
                    callback(null, beaconsdata);
                });
            },
            function(beaconsdata, callback) {
                if (!(beaconsdata && beaconsdata.length > 0)) {
                    if (typeof(resObj) != 'undefined') {
                        resObjVal.IsSuccess = false;
                        resObjVal.message = "Invalid Beacon ID";
                        resObj.send(resObjVal);
                    }
                    return;
                } else {
                    beacons = beaconsdata;
                    BeaconStore = beaconsdata[0].BeaconStore;
                    callback(null, 'next callback');
                }
            },
            function(data, callback) {

                collection.find({
                    'MobileNo': MobileNo
                }).toArray(function(err, devicehistory) {
                    if (devicehistory && devicehistory.length > 0) {
                        if (devicehistory[0].DeviceID != DeviceID) {
                            collection.updateMany({
                                    'MobileNo': MobileNo
                                }, {
                                    '$set': {
                                        'DeviceID': DeviceID,
                                    }
                                },
                                function(err, result) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        console.log(result);
                                        callback(null, 'DeviceID is different');
                                    }
                                });
                        } else {
                            callback(null, 'next callback');
                        }
                    } else {
                        console.log('old records not found');
                        callback(null, 'next callback');
                    }
                });
            },
            function(data, callback) {
                console.log(data);
                collection.find({
                    'MobileNo': MobileNo,
                    'Date': {
                        $gte: fromDate,
                        $lte: toDate,
                    }
                }).sort({ 'Date': -1 }).toArray(function(err, devicelist) {
                    callback(null, devicelist);
                })
            },
            function(devicelist, callback) {

                console.log('Call End.');
                console.log(devicelist);


                if (!(devicelist && devicelist.length > 0)) {
                    console.log('Sending notification');
                    if (typeof(beacons[0].BeaconWelcome) != 'undefined' && beacons[0].BeaconWelcome) {
                        //sendpushnotification('', [DeviceID], 'Greetings from Lotus Electronics. Look out for latest deals for the products you are shopping for');

                        mobile_nos = [];
                        mobile_nos.push('91' + MobileNo);
                        var data = JSON.stringify(mobile_nos);

                        request.post(lotusWebURL + 'user/get_user_name_by_mobileno', {
                                form: {
                                    'mobile_nos': data
                                }
                            },
                            function(res2, err, body) {
                                device_detail = [];
                                var reqbody = parse_JSON(body);
                                if (reqbody) {
                                    reqbody = reqbody.data;
                                    var mobileno = '';
                                    for (var r in reqbody) {
                                        if (reqbody[r] != false && reqbody[r].name) {
                                            notifresobj = {};
                                            sendpushnotification_mobileno(notifresobj, [MobileNo], 'Welcome ' + reqbody[r].name + ', Greetings from Lotus Electronics. Look out for latest deals for the products you are shopping for');
                                        }
                                    }
                                }
                            })
                    }

                    /* ---------------------  Employee Notification Start ---------  */
                    var empcollection = db.collection('user_beacons_active');

                    empcollection.find().sort({ 'Distance': -1 }).toArray(function(err, emplist) {
                            console.log(JSON.stringify(emplist));
                            console.log('emplist called');
                            if (emplist && emplist.length > 0) {
                                var empusers = db.collection('users');

                                var userid = emplist[0].UserID;

                                console.log(userid);

                                empusers.find({
                                    'UserID': userid
                                }).toArray(function(err, emplist) {
                                    if (emplist && emplist.length > 0) {
                                        console.log(JSON.stringify(emplist));
                                        var token = emplist[0].devicetoken;
                                        console.log(JSON.stringify(token));
                                        console.log('Employee Device Token called');

                                        sendpushnotification_fcm(null, [token], beacons[0].BeaconID, userid, MobileNo, 'Check your customer is nearby you');
                                    }
                                })
                            }
                        })

                        /* Send notification to employees */
                }                
                callback(null, devicelist);
            },
            function(devices, callback) {
                console.log('Inserting records over device history');
                var IsInsertRecord = false;
                currtime = getCurrentTime();

                if (devices && devices.length > 0 &&
                    !(typeof(devices[0].freeze) != 'undefined' && devices[0].freeze)) {
                    //When user stayed to same beacon and socket calling update service again and again
                    if (devices[0].BeaconID == BeaconID) {
                        StayTime = Math.max(((todaysdate - devices[0].Date) / 1000), 0);
                        if (StayTime >= 1) {
                            collection.update({
                                    _id: ObjectId(devices[0]._id)
                                }, {
                                    '$set': {
                                        'DateTo': todaysdate,
                                        'StayTime': StayTime,
                                    }
                                },
                                function(err, result) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        callback(null, 'updated');
                                        return 0;
                                    }
                                });
                        }
                    } else {
                        //When user move to another beacon from previous beacon
                        StayTime = Math.max(((todaysdate - devices[0].Date) / 1000) - 1, 0);
                        if (StayTime >= 1) {
                            collection.update({
                                    _id: ObjectId(devices[0]._id)
                                }, {
                                    '$set': {
                                        'DateTo': todaysdate,
                                        'StayTime': StayTime,
                                    }
                                },
                                function(err, result) {
                                    if (err) {
                                        throw err;
                                    }
                                });
                        }
                        IsInsertRecord = true;
                    }
                } else {
                    IsInsertRecord = true;
                }
                if (IsInsertRecord) {
                    collection.insert({
                        'BeaconID': BeaconID,
                        'DeviceID': DeviceID,
                        'StayTime': 1,
                        'MobileNo': MobileNo,
                        'Date': todaysdate,
                        'DateTo': todaysdate
                    }, function(err, records) {
                        callback(null, 'inserted');
                        console.log('Device History inserted Mobile No:' + MobileNo);
                    });
                }
            },
            function(response, callback) {
                io.emit('updateDeviceHistory_response', {
                    'IsSuccess': true,
                    'BeaconID': BeaconID,
                    'StoreID': BeaconStore,
                    'MobileNo': MobileNo,
                    'message': 'Data updated successfully'
                });
                console.log('coming to last callback');
                db.close();
                if (resObj) {
                    var obj = {
                            'IsSuccess': true,
                            'BeaconID': BeaconID,
                            'StoreID': BeaconStore,
                            'MobileNo': MobileNo,
                            'message': 'Data updated successfully'
                        }
                        //resObjVal.data = 'History updated upto last callback';
                    resObj.send(obj);
                }
                callback(null, response);
            }
        ]);
    });
}

// Emit welcome message on connection
io.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    socket.emit('welcome', {
        message: 'Welcome!',
        id: socket.id
    });

    // Hitting from Client 
    socket.on('receiveTime', function(data) {
        console.log('Coming with Data :: ' + JSON.stringify(data));
    });

    socket.on('updateDevice', function(data) {
        updateDevice(data.BeaconID, data.DeviceID, data.Distance, data.MobileNo);
        return "Update device called : " + data.BeaconID + ' Mobile No : ' + data.MobileNo;
        //sendDevices();
    });

    //Employee socket start from here


    socket.on('updateUser_Active', function(data) {
        console.log('updateUser_Active socket calling');
        io.emit('updateUser_Active_response', {
            'IsSuccess': true,
            'message': 'Socket is calling from yourside'
        });
        updateUser_Active(data.BeaconID, data.UserID, data.Distance);
        return "Update device called : " + data.BeaconID + ' UserID : ' + data.UserID;
        //sendDevices();
    });

});

app.post('/updateDevice', function(req, res) {
    updateDevice(req.body.BeaconID, req.body.DeviceID, req.body.Distance, req.body.MobileNo, res);
    if (req.body.BeaconID) {
        var staytime = 0;
        if (req.body.stayTime) {
            staytime = req.body.stayTime;
        }
    }

});

// Employee update user Active Start
app.post('/updateUser_Active', function(req, res) {
    updateUser_Active(req.body.BeaconID, req.body.UserID, req.body.Distance, res);
    if (req.body.BeaconID) {
        var staytime = 0;
        if (req.body.stayTime) {
            staytime = req.body.stayTime;
        }
    }
});
////    end  /////////////////

app.post('/updateDeviceHistory', function(req, res) {
    console.log('service calling');
    updateDeviceHistory(req.body.BeaconID, req.body.DeviceID, req.body.MobileNo, res);
});


function beaconDisconnect(BeaconID, DeviceID, MobileNo) {
    console.log('-------------------Beacon disconnected------------- ');

    updateDevice(BeaconID, DeviceID, -1, MobileNo);

    setTimeout(function() {
        MongoClient.connect(mongourl, function(err, db) {
            if (err) {
                return console.dir(err);
            }
            assert.equal(null, err);

            var collection = db.collection('device');
            var BeaconStoreID = '';

            async.waterfall([
                function(callback) {
                    var bcollection = db.collection('beacons');
                    bcollection.find({
                        'BeaconID': BeaconID
                    }).toArray(function(err, beacons) {
                        callback(null, beacons);
                    });
                },
                function(beacondata, callback) {
                    BeaconStoreID = beacondata[0].BeaconStore;
                    collection.find({
                        'DeviceID': DeviceID,
                        "Distance": { "$lte": -1 }
                    }).toArray(function(err, devices) {
                        callback(null, devices);
                    });
                },
                function(devices, callback) {
                    var DeleteMe = false;
                    if (devices && devices.length > 0) {
                        console.log('going to Delete record >>>>>>>>>>>>');
                        console.log(JSON.stringify(devices));
                        for (var d in devices) {
                            if (devices[d].Distance < 0) {
                                DeleteMe = true;
                                console.log('Record Deleted >>>>>>> ' + DeleteMe);
                                break;
                            }
                        }
                    }
                    if (DeleteMe) {
                        console.log('Deleting records from mongo >>>>>>> ' + DeleteMe + ' Device Id ' + DeviceID);
                        collection.deleteMany({
                            'DeviceID': DeviceID
                        });

                        //var dhcollection = db.collection('test_device_history');
                        var dhcollection = db.collection('device_history');
                        dhcollection.updateMany({
                                'BeaconID': BeaconID,
                                'MobileNo': MobileNo
                            }, {
                                '$set': {
                                    'freeze': 1,
                                }
                            },
                            function(err, result) {
                                if (err) {
                                    throw err;
                                } else {

                                }
                            }
                        );

                        io.emit('updateDevice_response', {
                            'IsSuccess': true,
                            'BeaconID': BeaconID,
                            'StoreID': BeaconStoreID,
                            'MobileNo': MobileNo,
                            'message': 'Data inserted successfully'
                        });
                        callback(null, 'updated');
                    }
                },
                function(acknowledge, callback) {
                    db.close();
                }
            ]);
        });
    }, 120000);
}

app.post('/beaconDisconnected', function(req, res) {
    console.log('-------------------Beacon disconnected------------- ');
    BeaconID = req.body.BeaconID;
    DeviceID = req.body.DeviceID;
    MobileNo = req.body.MobileNo;
    console.log('Beacon ID ' + BeaconID);
    console.log('Device ID ' + DeviceID);
    console.log('Mobile No ' + MobileNo);
    console.log('------------Beacon disconnected--------------');
    async.waterfall([
        function(callback) {
            MongoClient.connect(mongourl, function(err, db) {
                if (err) {
                    return console.dir(err);
                }

                var collection = db.collection('device');

                var filteredcollection = {};
                if (MobileNo) {
                    filteredcollection = collection.find({
                        "MobileNo": MobileNo,
                    })
                } else {
                    filteredcollection = collection.find({
                        "DeviceID": DeviceID,
                    })
                }

                /*collection.find({
                    "MobileNo": MobileNo,
                    /*"DeviceID": DeviceID,*/
                /*})*/
                filteredcollection.toArray(function(err, devices) {
                    devicelist = [];
                    for (var dvc in devices) {
                        devicelist.push(devices[dvc]);
                    }
                    callback(null, devicelist);
                })
                db.close();

            });
        },
        function(devicelist, callback) {
            if (devicelist && devicelist.length > 0) {
                beaconDisconnect(devicelist[0].BeaconID, devicelist[0].DeviceID, MobileNo);
            }
        },
    ]);
});


devicecron.schedule('* * * * *', function() {
    async.waterfall([

        function(callback) {
            MongoClient.connect(mongourl, function(err, db) {
                if (err) {
                    return console.dir(err);
                }

                var collection = db.collection('device');
                var devicelist = new Array();
                var outofrangelimit = getCurrentTime();
                outofrangelimit = outofrangelimit - (60 * 3 * 1000);
                console.log('Device Cron executed on ' + outofrangelimit);
                collection.find({
                    "connectiontime": { "$lte": outofrangelimit },
                }).toArray(function(err, devices) {
                    for (var dvc in devices) {
                        devicelist.push(devices[dvc]);
                    }
                    callback(null, devicelist);
                })
                db.close();
            });
        },
        function(devicelist, callback) {
            if (devicelist.length > 0) {
                for (var dvc in devicelist) {
                    beaconDisconnect(devicelist[dvc].BeaconID, devicelist[dvc].DeviceID,
                        devicelist[dvc].MobileNo);
                }
            }
            callback(null, devicelist);
        }
    ]);
});


function getUserAllotedStore(req) {
    if (req.session.loggedInUser) {
        return ObjectId(req.session.loggedInUser.AssignedStore);
    } else {
        return false;
    }
}

app.post('/getdata', function(req, res) {
    BeaconID = req.body.BeaconID;
    UserID = req.body.UserID;

    if (!UserID && !req.session.loggedInUser) {
        console.log('login expired');
        var resObj = {};
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (!UserID && req.session.loggedInUser.UserType == 2) {
        StoreID = getUserAllotedStore(req);
    } else {
        StoreID = req.body.StoreID;
    }

    console.log('Beacon Parameter on start');
    console.log(BeaconID);
    console.log('Store Parameter on start');
    console.log(StoreID);

    if (typeof(BeaconID) == 'string') {
        BeaconID = BeaconID.split(',');
    }

    var devicehistory = [];

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                var beaconcollection = [];
                if (BeaconID && BeaconID.length > 0) {
                    beaconcollection = collection.find({
                        'BeaconID': {
                            $in: BeaconID
                        }
                    });
                } else if (StoreID && StoreID != "-1") {
                    beaconcollection = collection.find({
                        'BeaconStore': ObjectId(StoreID)
                    });
                } else if (StoreID == "-1") {
                    beaconcollection = collection.aggregate([{
                        $lookup: {
                            from: 'stores',
                            localField: 'BeaconStore',
                            foreignField: '_id',
                            as: 'store_docs'
                        }
                    }]);
                } else {
                    beaconcollection = {};
                }

                beaconcollection.toArray(function(err, beacons) {
                    console.log('Store list');
                    console.dir(beacons);
                    var beaconslist = [];
                    for (var b in beacons) {
                        beaconslist[beacons[b].BeaconID] = {};
                        beaconslist[beacons[b].BeaconID].BeaconKey = beacons[b].BeaconKey;
                        if (beacons[b].store_docs != undefined && beacons[b].store_docs.length > 0) {
                            beaconslist[beacons[b].BeaconID].StoreName = beacons[b].store_docs[0].StoreName;

                        } else {
                            beaconslist[beacons[b].BeaconID].StoreName = '';
                        }
                    }

                    callback(null, beaconslist);
                });
            },
            function(beaconlist, callback) {
                var beacons = []
                for (var b in beaconlist) {
                    beacons.push(b);
                }

                todaysdate = getCurrentTime();
                seldate = new Date(todaysdate);
                datestring = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();
                fromDate = new Date(datestring).getTime();

                var collection = db.collection('device_history');
                collection.aggregate(
                    [{
                        $match: {
                            'Date': {
                                '$gte': fromDate,
                            },
                            'BeaconID': {
                                $in: beacons,
                            },
                            'StayTime': {
                                $gte: 2
                            }
                        }
                    }, {
                        $group: {
                            _id: { BeaconID: '$BeaconID', MobileNo: '$MobileNo' },
                            StayTime: { $sum: "$StayTime" }
                        }
                    }]
                ).toArray(function(err, devices) {
                    for (var d in devices) {
                        devicehistory[devices[d]._id.MobileNo] = [];
                        devicehistory[devices[d]._id.MobileNo][devices[d]._id.BeaconID] = devices[d]['StayTime'];
                    }
                    callback(null, beaconlist);
                });
            },
            function(beaconlist, callback) {
                var collection = db.collection('device');
                var devicelist = new Array();

                var beacons = []
                for (var b in beaconlist) {
                    beacons.push(b);
                }

                if (beacons && beacons.length > 0) {
                    devicecollection = collection.find({
                        'BeaconID': {
                            '$in': beacons
                        }
                    });
                    devicecollection.toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID].BeaconKey;
                            devices[dvc].StoreName = beaconlist[devices[dvc].BeaconID].StoreName;
                            devices[dvc].UniqueKey = devices[dvc].MobileNo + '‖' + devices[dvc].BeaconID;
                            if (devicehistory[devices[dvc].MobileNo] != undefined && devicehistory[devices[dvc].MobileNo][devices[dvc].BeaconID] != undefined) {
                                devices[dvc].StayTime = devicehistory[devices[dvc].MobileNo][devices[dvc].BeaconID];
                            } else {
                                devices[dvc].StayTime = 0;
                            }
                            devicelist.push(devices[dvc]);
                        }
                        callback(null, devicelist);
                    })
                } else {
                    /*collection.find().toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            devicelist.push(devices[dvc]);
                        }
                        callback(null, devicelist);
                    })*/
                    callback(null, []);
                }
            },
            function(devicelist, callback) {
                var devices = [];
                for (var d in devicelist) {
                    //devices.push(devicelist[d].DeviceID);
                    devices.push('91' + devicelist[d].MobileNo);
                }

                var request = require('request');
                var data = JSON.stringify(devices);
                //console.log(data);

                //request.post('http://lampdemos.com/lotus15/v2/user/get_user_name', {
                request.post(lotusWebURL + 'user/get_user_name_by_mobileno', {
                        form: {
                            //'android_device_token': data
                            'mobile_nos': data
                        }
                    },
                    function(res2, err, body) {
                        device_detail = [];
                        //var reqbody = JSON.parse(body);
                        var reqbody = parse_JSON(body);
                        if (reqbody) {
                            reqbody = reqbody.data;
                            var mobileno = '';
                            for (var r in reqbody) {
                                if (reqbody[r] != false) {
                                    for (var d in devicelist) {
                                        /*if (devicelist[d].DeviceID == reqbody[r].device_token) {
                                            devicelist[d].DeviceName = reqbody[r].name;
                                            devicelist[d].DevicePhone = reqbody[r].mobile_no;
                                        }*/
                                        if (typeof(devicelist[d].MobileNo) != 'undefined' && devicelist[d].MobileNo) {
                                            mobileno = '91' + devicelist[d].MobileNo;
                                        } else {
                                            mobileno = '';
                                        }

                                        if (mobileno == reqbody[r].mobile_no) {
                                            devicelist[d].DeviceName = reqbody[r].name;
                                            devicelist[d].DevicePhone = reqbody[r].mobile_no;
                                        }
                                    }
                                }
                            }
                        }

                        var i;
                        i = devicelist.length;
                        while (i--) {
                            if (!devicelist[i].DeviceName) {
                                devicelist.splice(i, 1);
                            }
                        }

                        console.log(JSON.stringify(devicelist));
                        console.log('called');

                        if (UserID && !devicelist) {
                            var resObj = {};
                            resObj.IsSuccess = false;
                            resObj.message = 'No Record found';
                            resObj.data = '';
                            res.send(resObj);
                        } else {
                            res.send(devicelist);
                        }
                        callback(null, devicelist);
                    })
            },
            function(devicelist, callback) {
                db.close();
            }
        ]);

    });
});

app.post('/getDeviceHistorydata', function(req, res) {
    BeaconID = req.body.BeaconID;
    StoreID = req.body.StoreID;

    if (!req.session.loggedInUser) {
        var resObj = {};
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }
    if (req.session.loggedInUser.UserType == 2) {
        StoreID = getUserAllotedStore(req);
    } else {
        StoreID = req.body.StoreID;
    }
    if (!StoreID) {
        res.send({});
    }

    if (typeof(req.body.PageNo) != 'undefined' && req.body.PageNo) {
        PageNo = req.body.PageNo;
    } else {
        PageNo = 1;
    }
    RecordsPerPage = 10;
    if (typeof(req.body.RecordsPerPage) != 'undefined' && req.body.RecordsPerPage) {
        RecordsPerPage = parseInt(req.body.RecordsPerPage);
    }

    recordsToSkip = Math.max((PageNo - 1) * RecordsPerPage, 0);

    SearchNameNumber = req.body.Search;

    resObjVal = {};
    /*resObjVal.IsSuccess = false;
    resObjVal.message = "Invalid data passing";*/

    fromDate = 0;
    toDate = 0;
    seldate = new Date(req.body.DateFrom);
    fromDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate())).getTime();
    seldate = new Date(req.body.DateTo);
    toDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate()) + ' 23:59:59').getTime();

    console.log('fromDate: ' + fromDate);
    console.log('toDate: ' + toDate);

    var beaconsIDs = [];

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                var beaconcollection = [];
                if (BeaconID && BeaconID.length > 0) {
                    console.log('coming to beacon list');
                    beaconcollection = collection.find({
                        'BeaconID': {
                            $in: BeaconID
                        }
                    });
                } else if (StoreID) {
                    console.log('coming to store');
                    beaconcollection = collection.find({
                        'BeaconStore': ObjectId(StoreID)
                    });
                } else {
                    /*console.log('coming to all part');
                    beaconcollection = collection.find();*/
                    beaconcollection = {};
                }

                beaconcollection.toArray(function(err, beacons) {
                    var beaconslist = [];
                    for (var b in beacons) {
                        beaconslist[beacons[b].BeaconID] = beacons[b].BeaconKey;
                        beaconsIDs.push(beacons[b].BeaconID);
                    }
                    callback(null, beaconslist);
                });
            },
            /* Total record count now not needed. Its done beneath
            function(beaconlist, callback) {
                console.log('======BL=====');
                console.log(beaconlist);
                console.log('=============');

                if (SearchNameNumber || 1 == 1) {
                    resObjVal.NoOfRecords = 1;
                    callback(null, beaconlist);
                    return 0;
                }

                if (beaconsIDs && beaconsIDs.length > 0) {
                    var collection = db.collection('device_history');

                    reccount = collection.aggregate(
                        [{
                            $match: {
                                'Date': {
                                    '$gte': fromDate,
                                    '$lte': toDate
                                },
                                'BeaconID': {
                                    $in: beaconsIDs,
                                },
                                'StayTime': {
                                    $gte: 2
                                }
                            }
                        }, {
                            $group: {
                                _id: { BeaconID: '$BeaconID', DeviceID: '$DeviceID' },
                                StayTime: { $sum: "$StayTime" }
                            }
                        }]
                    ).toArray(function(err, devices) {
                        resObjVal.NoOfRecords = devices.length;
                        callback(null, beaconlist);
                    })
                } else {
                    resObjVal.NoOfRecords = 0;
                    callback(null, []);
                }
            },*/
            function(beaconlist, callback) {
                //var collection = db.collection('test_device_history');
                var collection = db.collection('device_history');
                var devicelist = new Array();

                if (beaconsIDs && beaconsIDs.length > 0) {
                    reccollection = collection.aggregate(
                        [{
                            $match: {
                                'Date': {
                                    '$gte': fromDate,
                                    '$lte': toDate
                                },
                                'BeaconID': {
                                    $in: beaconsIDs,
                                },
                                'StayTime': {
                                    $gte: 2
                                }
                            }
                        }, {
                            $group: {
                                _id: { BeaconID: '$BeaconID', DeviceID: '$DeviceID' },
                                StayTime: { $sum: "$StayTime" },
                                MobileNo: { $max: "$MobileNo" }
                            }
                        }]
                    )

                    /*if (!SearchNameNumber || 1 != 1) { removed because of record inconsistency during pagination
                        reccollection = reccollection.skip(recordsToSkip).limit(RecordsPerPage);
                    }*/

                    reccollection.toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconID = devices[dvc]._id.BeaconID;
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            devices[dvc].DeviceID = devices[dvc]._id.DeviceID;
                            //devices[dvc].MobileNo = devices[dvc].MobileNo;
                            devices[dvc].UniqueKey = devices[dvc].MobileNo + '‖' + devices[dvc].BeaconID;
                            devices[dvc].StayTime = convertSecondsToStringTime(devices[dvc].StayTime);
                            devicelist.push(devices[dvc]);
                        }

                        callback(null, devicelist);
                    });


                } else {
                    callback(null, []);
                }
            },
            function(devicelist, callback) {
                var devices = [];
                for (var d in devicelist) {
                    //devices.push(devicelist[d].DeviceID);
                    devices.push('91' + devicelist[d].MobileNo);
                }
                var request = require('request');
                var data = JSON.stringify(devices);

                //request.post('http://lampdemos.com/lotus15/v2/user/get_user_name', {
                request.post(lotusWebURL + 'user/get_user_name_by_mobileno', {
                        form: {
                            //'android_device_token': data
                            'mobile_nos': data
                        }
                    },
                    function(res2, err, body) {
                        device_detail = [];
                        //var reqbody = JSON.parse(body);
                        var reqbody = parse_JSON(body);
                        if (reqbody) {
                            reqbody = reqbody.data;
                            if (reqbody) {
                                for (var r in reqbody) {
                                    if (reqbody[r] != false) {
                                        for (var d in devicelist) {
                                            /*if (devicelist[d].DeviceID == reqbody[r].device_token) {
                                                devicelist[d].DeviceName = reqbody[r].name;
                                                devicelist[d].DevicePhone = reqbody[r].mobile_no;
                                            }*/
                                            if (typeof(devicelist[d].MobileNo) != 'undefined' && devicelist[d].MobileNo) {
                                                mobileno = '91' + devicelist[d].MobileNo;
                                            } else {
                                                mobileno = '';
                                            }

                                            if (mobileno == reqbody[r].mobile_no) {
                                                devicelist[d].DeviceName = reqbody[r].name;
                                                devicelist[d].DevicePhone = reqbody[r].mobile_no;
                                            }
                                        }
                                    }
                                }
                            }

                            var i;
                            i = devicelist.length;
                            while (i--) {
                                if (!devicelist[i].DeviceName) {
                                    devicelist.splice(i, 1);
                                }
                            }


                            /*if (SearchNameNumber || 1 == 1) {
                                removed due to record inconsistency on pagination
                                */

                            if (SearchNameNumber) {
                                var i;
                                i = devicelist.length;
                                while (i--) {
                                    if (!(
                                            devicelist[i].DeviceName.toLowerCase().search(SearchNameNumber.toLowerCase()) >= 0 ||
                                            devicelist[i].DevicePhone.toLowerCase().search(SearchNameNumber.toLowerCase()) >= 0
                                        )) {
                                        devicelist.splice(i, 1);
                                    }
                                }

                                console.log(devicelist);
                            }

                            resObjVal.NoOfRecords = devicelist.length;

                            var finaldevicelist = [];

                            var count = 1;
                            for (var idx in devicelist) {
                                if (count > recordsToSkip) {
                                    finaldevicelist.push(devicelist[idx]);
                                }
                                count = count + 1;

                                if (finaldevicelist.length >= RecordsPerPage) {
                                    break;
                                }
                            }
                            devicelist = finaldevicelist;
                            /*}*/
                        }

                        //console.log(devicelist);
                        resObjVal.Records = devicelist;
                        res.send(resObjVal);
                        callback(null, devicelist);
                    })
            },
            function(beaconlist, callback) {
                db.close();
            }
        ]);

    });
});

app.post('/getDeviceHistoryDetailsdata', function(req, res) {
    MobileNo = req.body.MobileNo;
    BeaconID = req.body.BeaconID;

    fromDate = 0;
    toDate = 0;
    seldate = new Date(req.body.DateFrom);
    fromDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate())).getTime();
    seldate = new Date(req.body.DateTo);
    toDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate()) + ' 23:59:59').getTime();

    console.log('fromDate: ' + fromDate);
    console.log('toDate: ' + toDate);
    console.log('BeaconID : ' + BeaconID);
    console.log('MobileNo : ' + MobileNo);

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        beaconsIDs = [];

        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                var beaconcollection = {};

                beaconcollection = collection.find({
                    'BeaconID': BeaconID
                });

                beaconcollection.toArray(function(err, beacons) {
                    var beaconslist = [];
                    for (var b in beacons) {
                        beaconslist[beacons[b].BeaconID] = beacons[b].BeaconKey;
                        beaconsIDs.push(beacons[b].BeaconID);
                    }
                    callback(null, beaconsIDs);
                });
            },
            function(beaconlist, callback) {
                var collection = db.collection('device_history');
                var devicelist = new Array();

                var beacons = []
                for (var b in beaconlist) {
                    beacons.push(b);
                }

                if (beacons && beacons.length > 0) {
                    /*devicecollection = collection.find({
                        'BeaconID': BeaconID,
                        'MobileNo': MobileNo,
                        'Date': {
                            $gte: fromDate,
                            $lte: toDate,
                        }
                    }).sort({ 'Date': -1 }).toArray(function(err, devices) {
                        console.log(devices);
                        devicedetaillist = [];
                        var cnt = 1;
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            if (typeof(devices[dvc].DateTo) == 'undefined' || !devices[dvc].DateTo) {
                                devices[dvc].DateTo = devices[dvc].Date + (devices[dvc].StayTime * 1000);
                            }
                            devices[dvc].StayTime = convertSecondsToStringTime(devices[dvc].StayTime);
                            devices[dvc].srno = cnt;
                            devices[dvc].page = Math.ceil(cnt / PageLimit, 2);
                            cnt++;
                            devicedetaillist.push(devices[dvc]);
                        }

                        res.send(devicedetaillist);
                        callback(null, 'records found');
                    })*/

                    devicecollection = collection.aggregate(
                        [{
                            $match: {
                                'Date': {
                                    '$gte': fromDate,
                                    '$lte': toDate
                                },
                                'StayTime': {
                                    $gte: 2
                                },
                                'BeaconID': BeaconID,
                                'MobileNo': MobileNo,
                            }
                        }, {
                            $group: {
                                _id: {
                                    BeaconID: '$BeaconID',
                                    DeviceID: '$DeviceID',
                                    startDate: { $ceil: { $divide: ["$Date", 360000] } },
                                    //endDate: { $floor: { $divide: ["$DateTo", 60000] } }
                                },
                                Date: { $min: "$Date" },
                                DateTo: { $max: "$DateTo" },
                                StayTime: { $sum: "$StayTime" }
                            }
                        }, {
                            $sort: {
                                'Date': -1
                            }
                        }]
                    ).sort({ 'Date': -1 }).toArray(function(err, devices) {
                        devicedetaillist = [];

                        console.log(devices);

                        var cnt = devices.length;

                        for (i = 0; i < cnt; i++) {
                            if (devices[i + 1] !== undefined) {
                                if (devices[i].Date - devices[i + 1].DateTo <= 180000) {
                                    devices[i].Date = devices[i + 1].Date;
                                    devices[i].StayTime = devices[i].StayTime + devices[i + 1].StayTime;
                                    devices.splice((i + 1), 1);
                                    cnt = devices.length;
                                }
                            }
                        }

                        cnt = devices.length;

                        for (i = 0; i < cnt; i++) {
                            if (devices[i + 1] !== undefined) {
                                if (devices[i].Date - devices[i + 1].DateTo <= 180000) {
                                    devices[i].Date = devices[i + 1].Date;
                                    devices[i].StayTime = devices[i].StayTime + devices[i + 1].StayTime;
                                    devices.splice((i + 1), 1);
                                    cnt = devices.length;
                                }
                            }
                        }

                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            if (typeof(devices[dvc].DateTo) == 'undefined' || !devices[dvc].DateTo) {
                                devices[dvc].DateTo = devices[dvc].Date + (devices[dvc].StayTime * 1000);
                            }
                            devices[dvc].DateIn = devices[dvc].Date;
                            devices[dvc].StayTime2 = devices[dvc].StayTime;
                            devices[dvc].StayTime = convertSecondsToStringTime(devices[dvc].StayTime);
                            devicedetaillist.push(devices[dvc]);
                        }



                        res.send(devicedetaillist);
                        callback(null, 'records found');
                    })
                } else {
                    res.send([]);
                    callback(null, []);
                }
            },
            function(beaconlist, callback) {
                db.close();
            }
        ]);

    });
});

app.post('/getDeviceSearchHistoryDetailsdata', function(req, res) {
    BeaconID = req.body.BeaconID;
    MobileNo = req.body.MobileNo;

    fromDate = 0;
    toDate = 0;
    seldate = new Date(req.body.DateFrom);
    fromDate = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();
    seldate = new Date(req.body.DateTo);
    toDate = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();

    console.log('fromDate: ' + fromDate);
    console.log('toDate: ' + toDate);
    console.log('MobileNo : ' + MobileNo);

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var request = require('request');

                request.post(lotusWebURL + 'user/get_search_result', {
                        form: {
                            'mobile_no': MobileNo,
                            'from': fromDate,
                            'to': toDate
                        }
                    },
                    function(res2, err, body) {
                        search_detail = [];
                        //var reqbody = JSON.parse(body);
                        var reqbody = parse_JSON(body);
                        if (reqbody) {
                            reqbody = reqbody.data;
                            if (reqbody) {
                                var sa = [];
                                for (var r in reqbody) {
                                    //reqbody[r].srno = cnt;
                                    reqbody[r].datetimestamp = new Date(reqbody[r].date_added).getTime();
                                    search_detail.push(reqbody[r]);
                                }
                            }
                        }

                        res.send(search_detail);
                        callback(null, search_detail);
                    })
            },
            function(search_detail, callback) {
                db.close();
            }
        ]);

    });
});

/*Beacon Services start*/
app.post('/getbeacondata', function(req, res) {
    BeaconStore = req.body.BeaconStore;
    if (BeaconStore == "-1") {
        BeaconStore = "";
    }

    var resObj = {};
    /*if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = "You are not logged in.";
        resObj.data = '';
        res.send(resObj);
        return;
    }*/

    UserStore = getUserAllotedStore(req);


    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var collection = db.collection('stores');

                var storecollection = {};
                if (BeaconStore) {
                    storecollection = collection.find({
                        'BeaconStore': ObjectId(BeaconStore)
                    })
                } else {
                    if (req.session.loggedInUser && req.session.loggedInUser.UserType == 2) {
                        storecollection = collection.find(ObjectId(UserStore));
                    } else {
                        storecollection = collection.find();
                    }
                }
                storecollection.toArray(function(err, stores) {
                    var storelist = [];
                    for (var b in stores) {
                        storelist[stores[b]._id] = stores[b].StoreName;
                    }
                    callback(null, storelist);
                });
            },
            function(storelist, callback) {
                var collection = db.collection('beacons');
                var devicelist = new Array();

                beaconcollection = '';
                if (BeaconStore) {
                    beaconcollection = collection.find({
                        'BeaconStore': ObjectId(BeaconStore)
                    })
                } else {
                    if (req.session.loggedInUser && req.session.loggedInUser.UserType == 2) {
                        beaconcollection = collection.find({
                            'BeaconStore': ObjectId(UserStore)
                        });
                    } else {
                        beaconcollection = collection.find();
                    }
                }

                beaconcollection.sort({ 'BeaconKey': 1 }).toArray(function(err, beacons) {
                    console.log(beacons);
                    console.log('Beacon list called');
                    var beaconlist = [];
                    if (beacons && beacons.length > 0) {
                        for (var b in beacons) {
                            beacons[b].StoreName = storelist[ObjectId(beacons[b].BeaconStore)];
                            beaconlist.push(beacons[b]);
                        }
                        resObj.IsSuccess = true;
                        resObj.message = "Success";
                        resObj.data = beaconlist;

                        res.send(resObj);
                    } else {
                        resObj.IsSuccess = false;
                        resObj.message = "No record found.";
                        resObj.data = '';
                        res.send(resObj);
                    }
                });
            },
            function(beaconlist, callback) {


                db.close();
            }
        ]);

    });
});

app.post('/addbeacon', function(req, res) {
    BeaconID = req.body.BeaconID;
    BeaconKey = req.body.BeaconKey;
    BeaconWelcome = req.body.BeaconWelcome;
    BeaconDescr = req.body.BeaconDescr;
    BeaconStore = req.body.BeaconStore;

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(BeaconID && BeaconKey)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter BeaconID and BeaconKey";
        res.send(resObj);
        return;
    }

    if (!BeaconStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please select Store";
        res.send(resObj);
        return;
    }

    if (BeaconStore.length != 24) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid store selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('beacons');

        async.waterfall([
            function(callback) {
                collection.find({
                    'BeaconID': BeaconID
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });

            },
            function(beacondata, callback) {
                if (beacondata && beacondata.length > 0) {
                    resObj.IsSuccess = false;
                    resObj.message = "BeaconID already exists";
                    res.send(resObj);
                    return;
                }
                collection.find({
                    'BeaconKey': BeaconKey,
                    'BeaconStore': ObjectId(BeaconStore)
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });

            },
            function(beacondata, callback) {
                if (beacondata && beacondata.length > 0) {
                    resObj.IsSuccess = false;
                    resObj.message = "Beacon Key already exists";
                    res.send(resObj);
                    return;
                }

                collection.insert({
                    'BeaconID': BeaconID,
                    'BeaconKey': BeaconKey,
                    'BeaconWelcome': BeaconWelcome,
                    'BeaconDescr': BeaconDescr,
                    'BeaconStore': ObjectId(BeaconStore)
                });
                console.log('Beacon inserted');

                callback(null, 'inserted');
            },
            function(response, callback) {
                console.log('coming to last callback');
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Beacon registered successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});

app.post('/updatebeacon', function(req, res) {
    BeaconID = req.body.BeaconID;
    BeaconKey = req.body.BeaconKey;
    BeaconWelcome = req.body.BeaconWelcome;
    BeaconDescr = req.body.BeaconDescr;
    BeaconStore = req.body.BeaconStore;

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(BeaconID && BeaconKey)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter BeaconID and BeaconKey";
        res.send(resObj);
        return;
    }

    if (!BeaconStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please select Store";
        res.send(resObj);
        return;
    }

    if (BeaconStore.length != 24) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid Store selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var collection = db.collection('beacons');

        async.waterfall([
            function(callback) {
                collection.find({
                    'BeaconKey': BeaconKey,
                    'BeaconStore': ObjectId(BeaconStore),
                    'BeaconID': { $ne: BeaconID }
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });
            },
            function(beacondata, callback) {
                if (beacondata && beacondata.length > 0) {
                    resObj.IsSuccess = false;
                    resObj.message = "Beacon Key already exists in this store";
                    res.send(resObj);
                    return;
                }

                collection.update({
                    'BeaconID': BeaconID
                }, {
                    'BeaconID': BeaconID,
                    'BeaconKey': BeaconKey,
                    'BeaconWelcome': BeaconWelcome,
                    'BeaconDescr': BeaconDescr,
                    'BeaconStore': ObjectId(BeaconStore)
                });
                console.log('Beacon updated');

                callback(null, 'updated');
            },
            function(response, callback) {
                console.log('coming to last callback');
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Beacon updated successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});

app.post('/deletebeacon', function(req, res) {
    BeaconID = req.body.BeaconID;

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }


    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!BeaconID) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter BeaconID";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('beacons');

        collection.deleteMany({
            'BeaconID': BeaconID
        });
        resObj.IsSuccess = true;
        resObj.message = "Beacon deleted successfully";
        res.send(resObj);

        db.close();

    });
});

app.post('/getbeacon', function(req, res) {
    BeaconID = req.body.BeaconID;
    var resObj = {};

    if (!(BeaconID)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter BeaconID";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('beacons');

        async.waterfall([
            function(callback) {
                var collection = db.collection('stores');
                collection.find().toArray(function(err, stores) {
                    var storelist = [];
                    for (var b in stores) {
                        storelist[stores[b]._id] = stores[b].StoreName;
                    }
                    callback(null, storelist);
                });
            },
            function(storelist, callback) {
                collection.find({
                    'BeaconID': BeaconID
                }).toArray(function(err, devices) {
                    if (devices && devices.length > 0) {
                        devices[0].StoreName = storelist[ObjectId(devices[0].BeaconStore)];
                    }
                    callback(null, devices);
                });
            },
            function(devices, callback) {
                if (devices && devices.length > 0) {
                    resObj.IsSuccess = true;
                    resObj.message = "success";
                    resObj.data = devices;
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "Device not found";
                }
                db.close();
                res.send(resObj);
            }
        ]);
    });
});
/*Beacon services end*/


/*Store Services start*/
app.post('/getstoredata', function(req, res) {

    var resObj = {};
    /*if (!req.session.loggedInUser) {
        sObj.IsSuccess = false;
        resObj.message = "You are not logged in.";
        resObj.data = '';
        res.send(resObj);
        return;
    }*/

    UserStore = getUserAllotedStore(req);

    /*if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = "No record found.";
        resObj.data = '';
        res.send(resObj);
    }*/

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var devicelist = new Array();
        var collection = db.collection('stores');
        if (req.session.loggedInUser && req.session.loggedInUser.UserType == 2) {
            collection = collection.find(ObjectId(UserStore));
        } else {
            collection = collection.find();
        }

        collection.sort({ 'StoreName': 1 }).toArray(function(err, devices) {


            if (devices && devices.length > 0) {
                for (var dvc in devices) {
                    devicelist.push(devices[dvc]);
                }

                resObj.IsSuccess = true;
                resObj.message = "Success";
                resObj.data = devicelist;
                res.send(resObj);
            } else {
                resObj.IsSuccess = false;
                resObj.message = "No record found.";
                resObj.data = '';
                res.send(resObj);
            }
        })
        db.close();
    });
});

app.post('/addstore', function(req, res) {
    StoreName = req.body.StoreName;
    StoreDescr = req.body.StoreDescr;
    StoreLat = req.body.StoreLat;
    StoreLong = req.body.StoreLong;
    var resObj = {};

    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!StoreName) {
        console.log(StoreName);
        resObj.IsSuccess = false;
        resObj.message = "Please enter Store Name";
        res.send(resObj);
        return;
    }

    if (!StoreLat || !isNumeric(StoreLat) || !StoreLong || !isNumeric(StoreLong)) {
        console.log(StoreName);
        resObj.IsSuccess = false;
        resObj.message = "Please fill appropriate lattitude and longitude";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('stores');

        async.waterfall([
            function(callback) {
                collection.find({
                    'StoreName': StoreName
                }).toArray(function(err, stores) {
                    callback(null, stores);
                });

            },
            function(stores, callback) {
                if (stores && stores.length > 0) {
                    resObj.IsSuccess = false;
                    resObj.message = "Store Name already exists";
                    res.send(resObj);
                    return;
                }

                collection.insert({
                    'StoreName': StoreName,
                    'StoreDescr': StoreDescr,
                    'StoreLat': StoreLat,
                    'StoreLong': StoreLong
                });
                console.log('Store inserted');

                callback(null, 'inserted');
            },
            function(response, callback) {
                console.log('coming to last callback');
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Store added successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});

app.post('/updatestore', function(req, res) {
    StoreID = req.body.StoreID;
    StoreName = req.body.StoreName;
    StoreDescr = req.body.StoreDescr;
    StoreLat = req.body.StoreLat;
    StoreLong = req.body.StoreLong;

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }


    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!StoreName) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter proper Store name";
        res.send(resObj);
        return;
    }

    if (!StoreLat || !isNumeric(StoreLat) || !StoreLong || !isNumeric(StoreLong)) {
        console.log(StoreName);
        resObj.IsSuccess = false;
        resObj.message = "Please fill appropriate lattitude and longitude";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var collection = db.collection('stores');
        collection.update({
            _id: ObjectId(StoreID)
        }, {
            'StoreName': StoreName,
            'StoreDescr': StoreDescr,
            'StoreLat': StoreLat,
            'StoreLong': StoreLong,
        });
        db.close();

        resObj.IsSuccess = true;
        resObj.message = "Store updated successfully.";
        res.send(resObj);

    });
});

app.post('/deletestore', function(req, res) {
    StoreID = req.body.StoreID;

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!StoreID) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid Store selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('stores');

        collection.find(ObjectId(StoreID)).toArray(function(err, devices) {
            console.log(JSON.stringify(devices));
        });

        collection.deleteMany({
            _id: ObjectId(StoreID)
        });
        resObj.IsSuccess = true;
        resObj.message = "Store deleted successfully";
        res.send(resObj);

        db.close();

    });

});

app.post('/getstore', function(req, res) {
    StoreID = req.body.StoreID;
    var resObj = {};

    if (!(StoreID)) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid Store selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('stores');

        async.waterfall([
            function(callback) {
                collection.find(ObjectId(StoreID)).toArray(function(err, devices) {
                    callback(null, devices);
                });

            },
            function(devices, callback) {
                if (devices && devices.length > 0) {
                    resObj.IsSuccess = true;
                    resObj.message = "success";
                    resObj.data = devices;
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "Store not found";
                }
                db.close();
                res.send(resObj);
            }
        ]);
    });
});
/*Stores services end*/


/*This function kept as checking purpose because this is working code*/

app.post('/sendpushnotification_test', function(req, res) {
    var gcm = require('android-gcm');
    //var gcmObject = new gcm.AndroidGcm('AIzaSyAUxc6EwlgRP6MITCynw3_vsYatPI4iZuw');
    var gcmObject = new gcm.AndroidGcm(FcmGoogleKeyEmp);

    // initialize new androidGcm object 
    var message = new gcm.Message({
        registration_ids: ['APA91bE8pbcfkLUbtfWPLurBq1h2jKe2S4LcA5mkQB7a-tp26pSBLY8jj726HqfBbxXK5hBkp1Aw9IzAlTU8DB3cxGlpIOrMbJjE6BkNA1EdZS3Xi6VaYWA'],
        data: {
            'message': 'Sanchay Description',
            'badge': 1,
            'title': 'Notification Title',
            'img_url': 'https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300',
            'notification_type': 6,
        }
    });

    gcmObject.send(message, function(err, response) {
        if (err) {
            console.log('Something went wrong :: ' + err);
        } else {
            console.log(response);
        }
        res.send();
    });
});




app.post('/sendpushnotification_plain', function(req, res) {
    not_title = req.body.title;
    not_descr = req.body.description;
    not_device_token = req.body.gcmTokens;
    sendpushnotification(res, not_device_token, not_title, not_descr);
});

app.post('/sendpushnotification_image_everyone', function(req, res) {
    not_title = req.body.title;
    not_descr = req.body.description;
    not_image = req.body.image_url;

    BeaconID = req.body.BeaconID;
    StoreID = req.body.StoreID;
    fromDate = 0;
    toDate = 0;
    seldate = new Date(req.body.DateFrom);
    fromDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate())).getTime();
    seldate = new Date(req.body.DateTo);
    toDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate()) + ' 23:59:59').getTime();

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                var beaconcollection = [];
                if (BeaconID) {
                    beaconcollection = collection.find({
                        'BeaconID': ObjectId(BeaconID)
                    });
                } else if (StoreID) {
                    beaconcollection = collection.find({
                        'BeaconStore': ObjectId(StoreID)
                    });
                } else {
                    beaconcollection = {};
                }

                beaconcollection.toArray(function(err, beacons) {
                    beaconsIDs = [];
                    for (var b in beacons) {
                        beaconsIDs.push(beacons[b].BeaconID);
                    }
                    callback(null, beaconsIDs);
                });
            },
            function(beaconsIDs, callback) {
                if (beaconsIDs && beaconsIDs.length > 0) {
                    var collection = db.collection('device_history');

                    reccount = collection.aggregate(
                        [{
                            $match: {
                                'Date': {
                                    '$gte': fromDate,
                                    '$lte': toDate
                                },
                                'BeaconID': {
                                    $in: beaconsIDs,
                                },
                                'StayTime': {
                                    $gte: 2
                                }
                            }
                        }, {
                            $group: {
                                _id: { MobileNo: '$MobileNo' },
                            }
                        }]
                    ).toArray(function(err, devices) {
                        console.log(devices)
                        callback(null, devices);
                    })
                } else {
                    resObjVal.NoOfRecords = 0;
                    callback(null, []);
                }
            },
            function(deviceMobileNos, callback) {
                var MobileNos = [];
                for (var i in deviceMobileNos) {
                    MobileNos.push(deviceMobileNos[i]._id.MobileNo);
                }
                sendpushnotification_mobileno(res, MobileNos, not_title, not_descr, not_image);
            }
        ]);
    });

});


app.post('/sendpushnotification_image', function(req, res) {
    not_title = req.body.title;
    not_descr = req.body.description;
    not_image = req.body.image_url;
    //not_MobileNo = req.body.gcmTokens;
    not_MobileNo = req.body.gcmTokens;
    sendpushnotification_mobileno(res, not_MobileNo, not_title, not_descr, not_image);
});

function array_unique(a) {
    a.sort();
    for (var i = 1; i < a.length;) {
        if (a[i - 1] == a[i]) {
            a.splice(i, 1);
        } else {
            i++;
        }
    }
    return a;
}

function sendpushnotification_mobileno(res, gcmMobiles, title, description, image_url) {
    not_title = title;
    not_descr = description;
    not_image = image_url;
    not_device_token = gcmMobiles;

    async.waterfall([
        function(callback) {
            var mobilenos = [];
            var mobileno = '';
            for (var i in not_device_token) {
                mobileno = not_device_token[i];
                mobileno = mobileno.split('‖');
                mobileno = mobileno[0];
                if (mobileno) {
                    mobileno = '91' + mobileno;
                    mobilenos.push(mobileno);
                }
            }
            mobilenos = array_unique(mobilenos);
            callback(null, mobilenos);
        },
        function(mobilenos, callback) {
            var request = require('request');
            var data = JSON.stringify(mobilenos);

            request.post(lotusWebURL + 'user/get_user_name_by_mobileno', {
                    form: {
                        'mobile_nos': data
                    }
                },
                function(res2, err, body) {
                    device_tokens = [];
                    var reqbody = parse_JSON(body);
                    if (reqbody) {
                        reqbody = reqbody.data;
                        if (reqbody) {
                            for (var r in reqbody) {
                                if (reqbody[r] != false) {
                                    device_tokens.push(reqbody[r].device_token);
                                }
                            }
                        }
                    }

                    callback(null, device_tokens);
                })
        },
        function(devicetokens, callback) {
            sendpushnotification(res, devicetokens, not_title, not_descr, not_image);
        }
    ]);
}

function sendpushnotification(resObj, gcmToken, title, messagebody, image_url) {
    console.log(gcmToken);
    console.log('push notification called');
    var gcmObject = new gcm.AndroidGcm(GcmGoogleKey);
    if (!image_url) {
        image_url = '';
    }

    // initialize new androidGcm object
    var message = new gcm.Message({
        registration_ids: gcmToken, //[gcmToken],
        data: {
            'message': messagebody,
            'badge': 1,
            'title': title,
            //'img_url': 'https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300',
            'img_url': image_url,
            'notification_type': 6,
        }
    });


    //console.log(message);

    gcmObject.send(message, function(err, response) {
        console.log(response);
        if (err) {
            console.log('Something went wrong :: ' + err);
        } else {
            if (response.success) {
                var request = require('request');
                var gcmdata = JSON.stringify(gcmToken);
                request.post(lotusWebURL + 'user/get_notification_entry', {
                        form: {
                            'android_device_token': gcmdata,
                            'title': title,
                            'message': messagebody,
                            'notification_img': image_url
                        }
                    },

                    function(res2, err, body) {
                        console.log('Data coming from service --> ' + JSON.stringify(body));
                        if (resObj) {
                            resObj.send(body);
                        }
                    });
            }
        }
    });
}



function sendpushnotification_fcm(resObj, gcmToken, BeaconID, notification_user_id, MobileNo, title, messagebody, image_url) {
    console.log(gcmToken);
    console.log(BeaconID);
    console.log(notification_user_id);
    console.log('push notification called');
    console.log(title);
    var FCM = require('fcm-node');

    var serverKey = 'AIzaSyCJ7BLdXAhonngXWKpqUtYK3fOdZFi8m_g';
    var fcm = new FCM(serverKey);
    if (!image_url) {
        image_url = '';
    }

    async.waterfall([
        function(callback) {

            var request = require('request');

            request.post(lotusWebURL + 'user/get_name_by_mobileno', {
                    form: {

                        'mobile_no': MobileNo
                    }
                },

                function(res2, err, body) {

                    callback(null, body);

                });

        },

        function(response, callback) {

            var reqbody = parse_JSON(response);

            var data = reqbody.data;

            var name = data.name;


            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                registration_ids: gcmToken,

                data: {
                    'message': 'Check ' + name + ' nearest to you',
                    'notification_user_id': notification_user_id,
                    'badge': 1,
                    'title': title,
                    'BeaconID': BeaconID,
                    //'img_url': 'https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300',
                    // 'img_url': image_url,
                    'notification_type': 7,

                }
            };

            fcm.send(message, function(err, response) {



                if (err) {
                    console.log("Something has gone wrong!");
                } else {
                    if (response != 'undefined') {
                        try {

                            var request = require('request');
                            var gcmdata = JSON.stringify(gcmToken);





                            request.post(lotusURL + 'employee/get_notification_entry', {

                                    form: {
                                        'android_device_token': gcmdata,
                                        'notification_user_id': notification_user_id,
                                        'mobile_no': MobileNo,
                                        'title': title,
                                        'message': 'Check ' + name + ' nearest to you',
                                        //  'notification_img': image_url,
                                        'notification_type': 7,

                                    }

                                },
                                function(res2, err, body) {
                                    console.log('=====notification inserted2222==========');
                                    console.log('Data coming from service --> ' + JSON.stringify(body));
                                    if (resObj) {
                                        resObj.send(body);
                                    }
                                });
                        } catch (err) { console.dir(err.message) }
                    }

                    console.log("Successfully sent with response: ", response);
                }
            });

        },


    ]);
    //console.log(message);

}




var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        //callback(null, './angular/images/notificationuploads/');
        callback(null, notificationImagesdirectory);
    },
    filename: function(req, file, callback) {
        extension = file.originalname.split('.')[1];
        callback(null, file.fieldname + '-' + Date.now() + '.' + extension);
    }
});

var upload = multer({
    fileFilter: function(req, file, cb) {
        var imagetype = file.mimetype.split('/');
        if (!(imagetype[0] == 'image')) {
            console.log('not image');
            return cb(new Error('Only Images are allowed.'))
        }
        cb(null, true)
    },
    storage: storage
}).single('userPhoto');

app.post('/api/photo', function(req, res) {
    upload(req, res, function(err) {
        if (err == 'Only Images are allowed') {
            return res.end(err);
        } else if (err) {
            console.log(err);
            return res.end("Error uploading file.");
        }
        //console.log(req);
        var filename = '';
        if (req.file) {
            filename = req.file.destination + req.file.filename;
            filename = filename.replace('./', '');
            filename = filename.replace('\\', '/');
            filename = filename.replace('angular', '');
        }

        res.send(filename);
    });
});

app.post('/getdeviceidentity', function(req, res) {
    var request = require('request');
    var data = JSON.stringify(["APA91bHcxKvZbp5pcY_KeivI3qbHj1LF0KNct3Vx13jXVEFLzZDH5LMaE_1j08rClLhzAOwVJLp9Jmga0rPX3qndKOe6kK35sG8yDSYg4dipInhSZsgZOTU"]);

    request.post(lotusWebURL + 'user/get_user_name', {
            form: {
                'android_device_token': data
            }
        },
        function(res, err, body) {
            console.log(body);
        })
    res.send();
});

/*User Services start*/
app.post('/getUserdata', function(req, res) {
    var resObj = {};

    console.log(req.session);
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var collection = db.collection('stores');

                var storecollection = {};
                storecollection = collection.find();
                storecollection.toArray(function(err, stores) {
                    var storelist = [];
                    for (var b in stores) {
                        storelist[stores[b]._id] = stores[b].StoreName;
                    }
                    callback(null, storelist);
                });
            },
            function(storelist, callback) {
                var collection = db.collection('users');
                /*{ "UserType": 2 }*/
                collection.find().toArray(function(err, users) {
                    var userlist = [];
                    if (users && users.length > 0) {
                        for (var u in users) {
                            users[u].StoreName = storelist[ObjectId(users[u].AssignedStore)];
                            users[u].searchfield =
                                users[u].Name + ' ' + users[u].UserID + ' ' + users[u].Email + ' ' + users[u].StoreName;
                            userlist.push(users[u]);
                        }
                        resObj.IsSuccess = true;
                        resObj.message = "Success";
                        resObj.data = userlist;
                        res.send(resObj);
                    } else {
                        resObj.IsSuccess = false;
                        resObj.message = "No record found.";
                        resObj.data = '';
                        res.send(resObj);
                    }
                    callback(null, userlist);
                });
            },
            function(userlist, callback) {
                db.close();
            }
        ]);

    });
});

app.post('/addUser', function(req, res) {
    UserID = req.body.UserID;
    Password = req.body.Password;
    Email = req.body.Email;
    Name = req.body.Name;
    Designation = req.body.Designation;
    MobileNo = req.body.MobileNo;
    AssignedStore = req.body.AssignedStore;

    UserID = UserID.toLowerCase();
    Email = Email.toLowerCase();
    Name = Name.toLowerCase();
    Designation = Designation.toLowerCase();
    MobileNo = MobileNo.toLowerCase();

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(UserID && Password && Name && Email)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter appropriate informations";
        res.send(resObj);
        return;
    }

    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please select Store";
        res.send(resObj);
        return;
    }

    if (AssignedStore.length != 24) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid store selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {
                collection.find().toArray(function(err, users) {
                    var cnt = users.length;
                    for (var u in users) {
                        if (users[u].UserID == UserID) {
                            resObj.IsSuccess = false;
                            resObj.message = "User ID already exists";
                            res.send(resObj);
                            return 0;
                        } else if (users[u].Email == Email) {
                            resObj.IsSuccess = false;
                            resObj.message = "Email ID already exists";
                            res.send(resObj);
                            return 0;
                        } else if (users[u].MobileNo == MobileNo) {
                            resObj.IsSuccess = false;
                            resObj.message = "Mobile No already exists";
                            res.send(resObj);
                            return 0;
                        }
                        /*else if (users[u].Name == Name) {
                            resObj.IsSuccess = false;
                            resObj.message = "Name already exists";
                            res.send(resObj);
                            return 0;
                        }*/
                    }
                    callback(null, users);
                });
            },
            function(userdata, callback) {
                /*bcrypt.genSalt(10, function(err, salt) {
                    if (err)
                        return callback(err);

                    bcrypt.hash(Password, salt, function(err, hash) {
                        return callback(null, hash);
                    });
                });*/
                var hashedPassword = passwordHash.generate(Password);
                callback(null, hashedPassword);
            },
            function(hashedpassword, callback) {
                collection.insert({
                    'UserID': UserID,
                    'Email': Email,
                    'Name': Name,
                    'Designation': Designation,
                    'Password': hashedpassword,
                    'MobileNo': MobileNo,
                    'AssignedStore': ObjectId(AssignedStore),
                    'UserType': 2
                });
                console.log('User inserted');

                callback(null, 'inserted');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "User registered successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});

app.post('/updateUser', function(req, res) {
    UserID = req.body.UserID;
    ResetPassword = req.body.ResetPassword;
    Password = req.body.Password;
    Email = req.body.Email;
    Name = req.body.Name;
    Designation = req.body.Designation;
    MobileNo = req.body.MobileNo;
    AssignedStore = req.body.AssignedStore;
    UserObjectID = req.body.UserObjectID;

    UserID = UserID.toLowerCase();
    Email = Email.toLowerCase();
    Name = Name.toLowerCase();
    Designation = Designation.toLowerCase();
    MobileNo = MobileNo.toLowerCase();

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(UserID && Name && Email && UserObjectID)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter appropriate informations";
        res.send(resObj);
        return;
    }

    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please select User";
        res.send(resObj);
        return;
    }

    if (AssignedStore.length != 24) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid User selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {
                collection.find({
                    '_id': { $ne: ObjectId(UserObjectID) }
                }).toArray(function(err, users) {
                    var cnt = users.length;
                    for (var u in users) {
                        if (users[u].UserID == UserID) {
                            resObj.IsSuccess = false;
                            resObj.message = "User ID already exists";
                            res.send(resObj);
                            return 0;
                        } else if (users[u].Email == Email) {
                            resObj.IsSuccess = false;
                            resObj.message = "Email ID already exists";
                            res.send(resObj);
                            return 0;
                        } else if (users[u].MobileNo == MobileNo) {
                            resObj.IsSuccess = false;
                            resObj.message = "Mobile No already exists";
                            res.send(resObj);
                            return 0;
                        }
                        /*else if (users[u].Name == Name) {
                            resObj.IsSuccess = false;
                            resObj.message = "Name already exists";
                            res.send(resObj);
                            return 0;
                        }*/
                    }
                    callback(null, users);
                });
            },
            function(userdata, callback) {
                /*bcrypt.genSalt(10, function(err, salt) {
                    if (err)
                        return callback(err);

                    bcrypt.hash(Password, salt, function(err, hash) {
                        return callback(null, hash);
                    });
                });*/
                var hashedPassword = passwordHash.generate(Password);
                callback(null, hashedPassword);
            },
            function(hashedpassword, callback) {
                /*console.log(ResetPassword);
                console.log(hashedpassword);*/
                if (ResetPassword) {
                    collection.update({
                        '_id': ObjectId(UserObjectID)
                    }, {
                        '$set': {
                            'UserID': UserID,
                            'Email': Email,
                            'Name': Name,
                            'Designation': Designation,
                            'Password': hashedpassword,
                            'MobileNo': MobileNo,
                            'AssignedStore': ObjectId(AssignedStore),
                        }
                    });

                } else {
                    console.log(ObjectId(UserObjectID));
                    collection.update({
                        '_id': ObjectId(UserObjectID)
                    }, {
                        '$set': {
                            'UserID': UserID,
                            'Email': Email,
                            'Name': Name,
                            'Designation': Designation,
                            'MobileNo': MobileNo,
                            'AssignedStore': ObjectId(AssignedStore),
                        }
                    });
                }

                console.log('User updated');

                callback(null, 'updated');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "User updated successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});

app.post('/deleteUser', function(req, res) {
    UserObjectID = req.body.UserObjectID;

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!UserObjectID) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid User Selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('users');

        collection.deleteMany({
            '_id': ObjectId(UserObjectID),
            'UserType': 2
        });
        resObj.IsSuccess = true;
        resObj.message = "User deleted successfully";
        res.send(resObj);

        db.close();

    });
});

app.post('/getUser', function(req, res) {
    UserObjectID = req.body.UserObjectID;
    var resObj = {};

    if (!(UserObjectID)) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid User selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {
                collection.find({
                    '_id': ObjectId(UserObjectID)
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });

            },
            function(devices, callback) {
                if (devices && devices.length > 0) {
                    resObj.IsSuccess = true;
                    resObj.message = "success";
                    resObj.data = devices;
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "Store not found";
                }
                db.close();
                res.send(resObj);
            }
        ]);
    });
});
/*User services end*/


app.post('/getLoggedinUser', function(req, res) {
    var resObj = {};
    if (req.session.loggedInUser) {
        var userObjLocal = {};
        resObj.user = req.session.loggedInUser;
        resObj.isSuccess = true;
        res.send(resObj);
    } else {
        resObj.isError = false;
        res.send(resObj);
    }
});

app.post('/userLogout', function(req, res) {
    console.log("Logging out user.");
    req.session.destroy(function() {
        res.redirect('/');
    });
});

app.post('/userLogin', function(req, res) {
    var resObj = {};

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var resObj = {};
        var collection = db.collection('users');
        var AllotedSection = '';
        // to find beacon id for lotus employee App.


        var userRecord = {};

        var isCallingFromApp = false;

        if (typeof(req.body.fromApp) != undefined) {
            isCallingFromApp = req.body.fromApp;
        }

        if (req.body.username) {
            username = req.body.username.toLowerCase()
        } else {
            resObj.message = "Invalid Username."
            resObj.isSuccess = false;
            res.send(resObj);
            return;
        }


        async.waterfall([
            function(callback) {
                var dataParam = {};
                if (isCallingFromApp) {
                    dataParam = {
                        "UserID": username,
                        "UserType": 3,

                    }
                } else {
                    dataParam = {
                        "UserID": username,
                        "UserType": { "$in": [1, 2, 4] },
                    }
                }

                console.log('=====');
                console.log(JSON.stringify(dataParam));
                console.log('=====');

                console.log(collection);

                /*collection.find(dataParam)*/
                collection.aggregate([{
                    $match: dataParam
                }, {
                    $lookup: {
                        from: 'sections',
                        localField: 'AssignedSection',
                        foreignField: '_id',
                        as: 'section_docs'
                    }
                }]).toArray(function(err, users) {

                    if (err) {
                        return console.dir(err);
                    }
                    var SectionName = '';
                    console.log(JSON.stringify(users));
                    console.log("===11111111111111111--------User Called===========");


                    if (users && users[0].hasOwnProperty('section_docs') && users[0].section_docs.length > 0) {
                        console.log(users[0].section_docs);
                        SectionName = users[0].section_docs[0].SectionName;
                        resObj.SectionName = SectionName;
                    }

                    if (isCallingFromApp) {

                        var devicetoken = req.body.devicetoken;

                        //console.log(devicetoken);

                        collection.updateMany({
                                // 'BeaconID': AssignedStore,
                                'UserID': req.body.username,
                            }, {
                                '$set': {
                                    'devicetoken': devicetoken,
                                }
                            },
                            function(err, result) {
                                if (err) {
                                    throw err;
                                } else {

                                }
                            }
                        );
                    }

                    //console.log(JSON.stringify(users));

                    if (users && users.length > 0) {
                        var dbpassword = users[0].Password;
                        users[0].Password = "";
                        userRecord = users[0];
                        var isPasswordMatch = passwordHash.verify(req.body.password, dbpassword);
                        //isPasswordMatch = true;
                        req.session.loggedInUser = users[0];
                        callback(null, isPasswordMatch);
                    } else {
                        resObj.message = "Invalid Username."
                        resObj.isSuccess = false;
                        res.send(resObj);
                        //callback(null, false);
                        return 0;
                    }

                });
            },
            function(passwordmatched, callback) {
                if (passwordmatched) {
                    resObj.message = "Successfully loggedin."
                    resObj.user = userRecord;

                    resObj.isSuccess = true;
                } else {
                    resObj.message = "Wrong Password."
                    resObj.isSuccess = false;
                }
                if (!isCallingFromApp) {
                    db.close();
                    res.send(resObj);
                } else {
                    callback(null, userRecord);
                }
            },
            function(user, callback) {

                //console.log(user);

                if (isCallingFromApp) {
                    var beaconCollection = db.collection('beacons');
                    // var sectionCollection = db.collection('sections');
                    var AllotedSection = user.AssignedSection;

                    var beacons1 = [];
                    beaconCollection.find({
                        "BeaconSection": ObjectId(AllotedSection)
                    }).toArray(function(err, beacons) {
                        var AllotedSection = user.AssignedSection;
                        for (var b in beacons) {

                            //beacons.push(beacons[b].BeaconKey)
                            // beacons.push(beacons);
                            beacons1.push(beacons[b]);
                        }

                        console.log('=====================SEC===========================');

                        resObj.beacons = beacons;

                        //
                        console.log(resObj);

                        console.log('======end of beacon Array called==========');
                        res.send(resObj);
                    });
                } else {

                    res.send(resObj);
                }
                db.close();
            }
        ]);
    });
});


app.post('/getstoreuserscount', function(req, res) {

    var storeMobileRecords = {};

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        async.waterfall([
            function(callback) {
                var collection = db.collection('stores');

                UserStore = getUserAllotedStore(req);
                if (req.session.loggedInUser && req.session.loggedInUser.UserType == 2) {
                    collection = collection.find(ObjectId(UserStore));
                } else {
                    collection = collection.find();
                }

                collection.toArray(function(err, records) {
                    var stores = [];
                    if (records && records.length > 0) {
                        for (var dvc in records) {
                            stores.push(records[dvc]);
                        }
                        callback(null, stores);
                    }
                });
            },
            function(stores, callback) {
                var storelist = [];
                forEach(stores, function(item, index) {
                    var done = this.async();
                    async.waterfall([
                        function(callback2) {
                            var collection = db.collection('beacons');
                            collection.find({
                                'BeaconStore': ObjectId(item._id)
                            }).toArray(function(err, beacons) {
                                if (beacons && beacons.length > 0) {
                                    var beaconsIDs = [];
                                    for (var dvc in beacons) {
                                        beaconsIDs.push(beacons[dvc].BeaconID);
                                    }
                                    callback2(null, beaconsIDs);
                                } else {
                                    callback2(null, {});
                                }
                            });
                        },
                        function(beaconsIDs, callback2) {
                            //console.log(beaconsIDs);
                            var devicecollection = db.collection('device_history');
                            devicecollection.aggregate(
                                    [{
                                        $match: {
                                            'BeaconID': {
                                                $in: beaconsIDs,
                                            }
                                        }
                                    }, {
                                        $group: {
                                            _id: { MobileNo: '$MobileNo' },
                                            lastUpdateTime: { $max: "$DateTo" }
                                        }
                                    }]
                                )
                                .toArray(function(err, mobilenumbers) {
                                    if (mobilenumbers && mobilenumbers.length > 0) {
                                        item.NoOfMobiles = mobilenumbers.length;
                                        storelist.push(item);
                                        callback2(null, beaconsIDs);
                                    } else {
                                        item.NoOfMobiles = 0;
                                        storelist.push(item);
                                        callback2(null, {});
                                    }
                                });
                        },
                        function(mobiles, callback2) {
                            done();
                        }
                    ]);
                }, function(notAborted, arr) {
                    callback(null, storelist);
                    console.log("done", notAborted, arr);
                });
            },
            function(storelist, callback) {
                //console.log(storelist);
                res.send(storelist);
            }
        ]);

    });
});

app.post('/getBeaconsLastNotifications', function(req, res) {
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var request = require('request');

                request.post(lotusWebURL + 'user/get_beacons_notifications', {
                        form: {
                            'recordlimit': 10,
                        }
                    },
                    function(res2, err, body) {
                        notif_detail = [];
                        //var reqbody = JSON.parse(body);
                        var reqbody = parse_JSON(body);
                        if (reqbody) {
                            reqbody = reqbody.data;
                            if (reqbody) {
                                var sa = [];
                                for (var r in reqbody) {
                                    //reqbody[r].srno = cnt;
                                    reqbody[r].datetimestamp = new Date(reqbody[r].date_added).getTime();
                                    /*if (reqbody[r].mobile_no) {
                                        reqbody[r].mobile_no = reqbody[r].mobile_no.substr(2);
                                    } else {
                                        reqbody[r].mobile_no = '';
                                    }*/
                                    notif_detail.push(reqbody[r]);
                                }
                            }
                        }

                        res.send(notif_detail);
                        callback(null, notif_detail);
                    })
            },
            function(notif_detail, callback) {
                db.close();
            }
        ]);

    });
});

app.post('/getAllNotifications', function(req, res) {
    fromDate = 0;
    toDate = 0;
    seldate = new Date(req.body.DateFrom);
    fromDate = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();
    seldate = new Date(req.body.DateTo);
    toDate = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();

    PageNo = 1;
    if (typeof(req.body.PageNo) != 'undefined' && req.body.PageNo) {
        PageNo = req.body.PageNo;
    }

    RecordsPerPage = 15;
    if (typeof(req.body.RecordsPerPage) != 'undefined' && req.body.RecordsPerPage) {
        RecordsPerPage = parseInt(req.body.RecordsPerPage);
    }

    Search = '';
    if (typeof(req.body.Search) != 'undefined' && req.body.Search) {
        Search = req.body.Search;
    }

    var resObjVal = {};

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var request = require('request');

                request.post(lotusWebURL + 'user/get_all_notifications', {
                        form: {
                            'from': fromDate,
                            'to': toDate,
                            'pageno': PageNo,
                            'recordlimit': RecordsPerPage,
                            'Search': Search
                        }
                    },
                    function(res2, err, body) {
                        notifications = [];
                        var reqbody = parse_JSON(body);
                        if (reqbody) {
                            resObjVal.NoOfRecords = reqbody.data.NoOfRecords;
                            reqbody = reqbody.data.Records;
                            if (reqbody) {
                                var sa = [];
                                for (var r in reqbody) {
                                    reqbody[r].datetimestamp = new Date(reqbody[r].notification_date).getTime();
                                    notifications.push(reqbody[r]);
                                }
                            } else {
                                resObjVal.NoOfRecords = 0;
                            }
                        }

                        resObjVal.Records = notifications;

                        res.send(resObjVal);
                        callback(null, notifications);
                    })
            },
            function(notifications, callback) {
                db.close();
            }
        ]);

    });
});

app.post('/addEmployee', function(req, res) {

    console.log(req);

    UserID = req.body.UserID;
    Password = req.body.Password;

    Name = req.body.Name;
    Designation = req.body.Designation;
    AssignedStore = req.body.AssignedStore;
    AssignedSection = req.body.AssignedSection;

    UserID = UserID.toLowerCase();

    Name = Name.toLowerCase();
    Designation = Designation.toLowerCase();
    AssignedStore = AssignedStore.toLowerCase();
    AssignedSection = AssignedSection.toLowerCase();


    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(UserID && Password && Name)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter appropriate informations";
        res.send(resObj);
        return;
    }

    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please select Store";
        res.send(resObj);
        return;
    }

    if (AssignedStore.length != 24) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid store selected";
        res.send(resObj);
        return;
    }
    //<!------- Assigned Section -------->
    //  
    //   if (!AssignedSection) {
    //        resObj.IsSuccess = false;
    //        resObj.message = "Please select Store";
    //        res.send(resObj);
    //        return;
    //    }
    //
    //    if (AssignedSection.length != 24) {
    //        resObj.IsSuccess = false;
    //        resObj.message = "Invalid store selected";
    //        res.send(resObj);
    //        return;
    //    }



    //<!------ Assigned Section end --->



    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {
                collection.find().toArray(function(err, users) {
                    var cnt = users.length;
                    for (var u in users) {
                        if (users[u].UserID == UserID) {
                            resObj.IsSuccess = false;
                            resObj.message = "User ID already exists";
                            res.send(resObj);
                            return 0;
                        }
                        /*else if (users[u].Name == Name) {
                            resObj.IsSuccess = false;
                            resObj.message = "Name already exists";
                            res.send(resObj);
                            return 0;
                        }*/
                    }
                    callback(null, users);
                });
            },
            function(userdata, callback) {
                /*bcrypt.genSalt(10, function(err, salt) {
                    if (err)
                        return callback(err);

                    bcrypt.hash(Password, salt, function(err, hash) {
                        return callback(null, hash);
                    });
                });*/
                var hashedPassword = passwordHash.generate(Password);
                callback(null, hashedPassword);
            },
            function(hashedpassword, callback) {
                collection.insert({
                    'UserID': UserID,

                    'Name': Name,

                    'Password': hashedpassword,
                    'Designation': Designation,

                    'AssignedStore': ObjectId(AssignedStore),
                    'AssignedSection': ObjectId(AssignedSection),
                    'UserType': 3,


                });
                console.log('User inserted');

                callback(null, 'inserted');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "User registered successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });

});




/*Section Services start*/
app.post('/getsectiondata', function(req, res) {

    var resObj = {};
    /*if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = "You are not logged in.";
        resObj.data = '';
        res.send(resObj);
        return;
    }*/

    //UserSection = getUserAllotedSection(req);

    /*if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = "No record found.";
        resObj.data = '';
        res.send(resObj);
    }*/

    console.log("Get Section Called================================================");

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var devicelist = new Array();
        var collection = db.collection('sections');
        collection = collection.find();
        collection.sort({ 'SectionName': 1 }).toArray(function(err, devices) {
            if (devices && devices.length > 0) {
                for (var dvc in devices) {
                    devicelist.push(devices[dvc]);
                }

                resObj.IsSuccess = true;
                resObj.message = "Success";
                resObj.data = devicelist;
                console.log(resObj.data);

                console.log('==== Section Data Called=======================');
                res.send(resObj);
            } else {
                resObj.IsSuccess = false;
                resObj.message = "No record found.";
                resObj.data = '';
                res.send(resObj);
            }
        })
        db.close();
    });
});



app.post('/addSection', function(req, res) {

    console.log(req);

    SectionName = req.body.SectionName;
    SectionDesc = req.body.SectionDesc;
    AssignedStore = req.body.AssignedStore;
    selectedBeacon = req.body.selectedBeacon;


    SectionName = SectionName.toLowerCase();

    SectionDesc = SectionDesc.toLowerCase();

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(SectionName && SectionDesc)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter appropriate informations";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        assert.equal(null, err);

        var collection = db.collection('sections');

        var sectionbeacon = db.collection('beacons');

        var SectionID = '';


        async.waterfall([
            function(callback) {
                collection.find().toArray(function(err, sections) {
                    var cnt = sections.length;

                    for (var u in sections) {
                        if (sections[u].SectionName == SectionName) {
                            resObj.IsSuccess = false;
                            resObj.message = "SectionName already exists";
                            res.send(resObj);
                            return 0;
                        }

                    }
                    callback(null, sections);
                });
            },
            /*  function(sections, callback) {
                  collection.insert({
                      'SectionName': SectionName,

                      'SectionDesc': SectionDesc,



                  });
                  console.log('Section inserted');

                  callback(null, 'inserted');
              },*/

            function(sections, callback) {

                collection.insert({
                    'SectionName': SectionName,

                    'SectionDesc': SectionDesc,
                    'AssignedStore': AssignedStore,
                    'BeaconID': selectedBeacon,




                }, function(err, records) {
                    console.log(JSON.stringify(records));
                    console.log(records.ops[0]._id);

                    // console.log(json_decode(records));

                    SectionID = records.ops[0]._id;


                    callback(null, 'inserted');

                    console.log('Section inserted');
                });


            },

            function(rec, callback) {


                sectionbeacon.updateMany({

                        'BeaconID': {
                            $in: selectedBeacon
                        }
                    }, {
                        '$set': {
                            'BeaconSection': SectionID,
                        }
                    },
                    function(err, result) {
                        if (err) {
                            throw err;
                        } else {

                        }
                    }
                );



                console.log('Section Beacon inserted');
                callback(null, 'rec');

            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Section added successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });

});


app.post('/updateEmployee', function(req, res) {

    console.log('==============jhhgjhjhj======update employee called=fdfdfdffddf=========================');

    UserID = req.body.UserID;
    ResetPassword = req.body.ResetPassword;
    Password = req.body.Password;
    AssignedSection = req.body.AssignedSection;
    Name = req.body.Name;
    Designation = req.body.Designation;

    AssignedStore = req.body.AssignedStore;
    UserObjectID = req.body.UserObjectID;

    UserID = UserID.toLowerCase();
    AssignedSection = AssignedSection.toLowerCase();
    Name = Name.toLowerCase();
    Designation = Designation.toLowerCase();


    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(UserID && Name && UserObjectID)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter appropriate informations";
        res.send(resObj);
        return;
    }

    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please select User";
        res.send(resObj);
        return;
    }

    if (AssignedStore.length != 24) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid User selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {
                collection.find({
                    '_id': { $ne: ObjectId(UserObjectID) }
                }).toArray(function(err, users) {
                    var cnt = users.length;
                    for (var u in users) {
                        if (users[u].UserID == UserID) {
                            resObj.IsSuccess = false;
                            resObj.message = "User ID already exists";
                            res.send(resObj);
                            return 0;
                        }
                        /*else if (users[u].Name == Name) {
                            resObj.IsSuccess = false;
                            resObj.message = "Name already exists";
                            res.send(resObj);
                            return 0;
                        }*/
                    }
                    callback(null, users);
                });
            },
            function(userdata, callback) {
                /*bcrypt.genSalt(10, function(err, salt) {
                    if (err)
                        return callback(err);

                    bcrypt.hash(Password, salt, function(err, hash) {
                        return callback(null, hash);
                    });
                });*/
                var hashedPassword = passwordHash.generate(Password);
                callback(null, hashedPassword);
            },
            function(hashedpassword, callback) {
                /*console.log(ResetPassword);
                console.log(hashedpassword);*/
                if (ResetPassword) {
                    collection.update({
                        '_id': ObjectId(UserObjectID)
                    }, {
                        '$set': {
                            'UserID': UserID,
                            'Name': Name,


                            'Password': hashedpassword,

                            'AssignedStore': ObjectId(AssignedStore),
                            'AssignedSection': ObjectId(AssignedSection),
                            'Designation': Designation
                        }
                    });

                } else {
                    console.log(ObjectId(UserObjectID));
                    collection.update({
                        '_id': ObjectId(UserObjectID)
                    }, {
                        '$set': {
                            'UserID': UserID,

                            'Name': Name,


                            'AssignedStore': ObjectId(AssignedStore),
                            'AssignedSection': ObjectId(AssignedSection),
                            'Designation': Designation,
                        }
                    });
                }

                console.log('======================Employee updated=======================================');

                callback(null, 'updated');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Employee updated successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });


});



app.post('/getEmployeeDetails', function(req, res) {
    EmployeeID = req.body.EmployeeID;

    console.log(EmployeeID);
    console.log('Employee Details Called -----=========');

    var resObj = {};

    if (!EmployeeID) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid Employee selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {
                collection.find({
                    'UserID': EmployeeID
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });

            },
            function(devices, callback) {
                if (devices && devices.length > 0) {

                    var beaconCollection = db.collection('beacons');
                    var AssignedSection = devices[0].AssignedSection;

                    /*
                    beaconCollection.find({
                        "BeaconSection": ObjectId(AssignedSection)
                    })
                    */
                    beaconCollection.aggregate([{
                        $match: {
                            "BeaconSection": ObjectId(AssignedSection)
                        },
                    }, {
                        $lookup: {
                            from: 'stores',
                            localField: 'BeaconStore',
                            foreignField: '_id',
                            as: 'store_docs'
                        }
                    }, {
                        $lookup: {
                            from: 'sections',
                            localField: 'BeaconSection',
                            foreignField: '_id',
                            as: 'section_docs'
                        }
                    }]).toArray(function(err, beacons) {

                        resObj.beacons = beacons;
                        resObj.devices = devices;


                        resObj.IsSuccess = true;
                        resObj.message = "success";

                        res.send(resObj);
                        callback(null, true);
                    });
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "Employee not found";
                    callback(null, false);
                }

            },
            function(workdone, callback) {
                db.close();
            }
        ]);
    });
});

// get customer executive data in php by calling this webservice through CURL

app.post('/getcustomerdata', function(req, res) {
    UserID = req.body.UserID;
    Password = req.body.Password;
    var resObj = {};

    if (!(UserID)) {
        resObj.IsSuccess = false;
        resObj.message = "Please Provide UserID";
        res.send(resObj);
        return;
    }
    var ID = '';

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {
                var collection = db.collection('users');
                collection.find({
                    'UserID': UserID
                }).toArray(function(err, users) {


                    console.log('=============user called====================');

                    ID = users[0].UserID;
                    var dbpassword = users[0].Password;

                    var isPasswordMatch = passwordHash.verify(Password, dbpassword);

                    console.log(dbpassword);
                    console.log(isPasswordMatch);



                    resObj.users = users;
                    // console.log(resObj);

                    if (ID == UserID && isPasswordMatch == 'true') {
                        console.log('====================hiiii=========================');
                        resObj.IsSuccess = true;
                        resObj.message = "success";
                        resObj.data = users;
                        console.log(resObj);
                        res.send(resObj);

                    } else {
                        resObj.IsSuccess = false;
                        resObj.message = "Customer executive not found";
                        res.send(resObj);
                    }
                    db.close();

                    // var pass = users[0].Password;


                });
            },


        ]);
    });
});


app.post('/addCustomer', function(req, res) {


    console.log(req);

    UserID = req.body.UserID;
    Password = req.body.Password;

    Name = req.body.Name;
    Designation = req.body.Designation;
    AssignedStore = req.body.AssignedStore;


    UserID = UserID.toLowerCase();

    Name = Name.toLowerCase();
    Designation = Designation.toLowerCase();
    AssignedStore = AssignedStore.toLowerCase();



    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(UserID && Password && Name)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter appropriate informations";
        res.send(resObj);
        return;
    }

    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please select Store";
        res.send(resObj);
        return;
    }

    if (AssignedStore.length != 24) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid store selected";
        res.send(resObj);
        return;
    }



    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {
                collection.find().toArray(function(err, users) {
                    var cnt = users.length;
                    for (var u in users) {
                        if (users[u].UserID == UserID) {
                            resObj.IsSuccess = false;
                            resObj.message = "User ID already exists";
                            res.send(resObj);
                            return 0;
                        }

                    }
                    callback(null, users);
                });
            },
            function(userdata, callback) {

                var hashedPassword = passwordHash.generate(Password);
                callback(null, hashedPassword);
            },
            function(hashedpassword, callback) {
                collection.insert({
                    'UserID': UserID,

                    'Name': Name,

                    'Password': hashedpassword,
                    'Designation': Designation,

                    'AssignedStore': ObjectId(AssignedStore),

                    'UserType': 4,


                });
                console.log('User inserted');

                callback(null, 'inserted');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Customer registered successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});

app.post('/getEmployeedata', function(req, res) {
    var resObj = {};

    console.log(req.session);
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var collection = db.collection('stores');

                var storecollection = {};
                storecollection = collection.find();
                storecollection.toArray(function(err, stores) {
                    var storelist = [];
                    for (var b in stores) {
                        storelist[stores[b]._id] = stores[b].StoreName;
                    }
                    callback(null, storelist);
                });
            },
            function(storelist, callback) {
                var collection = db.collection('users');
                var SectionName = '';

                var sectioncollection = db.collection('sections');
                /*{ "UserType": 2 }*/
                collection.find({
                    'UserType': 3

                }).toArray(function(err, users) {
                    var userlist = [];
                    var sectionlist = [];
                    if (users && users.length > 0) {
                        for (var u in users) {
                            users[u].StoreName = storelist[ObjectId(users[u].AssignedStore)];
                            users[u].searchfield =
                                users[u].Name + ' ' + users[u].UserID + ' ' + users[u].Designation + ' ' + users[u].StoreName + ' ' + users[u].AssignedSection;


                            /* sectioncollection.find({
                                 '_id': users[u].AssignedSection,

                             }).toArray(function(err,sections){

                                 for (var s in sections)
                                 {

                                      sectionlist.push(sections[s].SectionName);
                                 } 


                               

                              console.log('============s=============section called==================s')
                              console.log(sectionlist);
                               console.log('============end=============section called End==================end')

                             });*/



                            userlist.push(users[u]);
                        }
                        resObj.IsSuccess = true;
                        resObj.message = "Success";
                        resObj.data = userlist;
                        console.log('===========employee list Start======================');

                        //console.log(resObj);

                        console.log('===========employee list called======================');

                        res.send(resObj);
                    } else {
                        resObj.IsSuccess = false;
                        resObj.message = "No record found.";
                        resObj.data = '';
                        res.send(resObj);
                    }
                    callback(null, userlist);
                });
            },
            function(userlist, callback) {
                db.close();
            }
        ]);

    });
});


app.post('/deleteEmployee', function(req, res) {
    UserObjectID = req.body.UserObjectID;

    console.log(UserObjectID);
    console.log('============== Called===========EEEE==');

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!UserObjectID) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid User Selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('users');

        collection.deleteMany({
            '_id': ObjectId(UserObjectID),
            'UserType': 3
        });
        resObj.IsSuccess = true;
        resObj.message = "Employee deleted successfully";
        res.send(resObj);

        db.close();

    });
});


app.post('/getCrmData', function(req, res) {
    var resObj = {};

    console.log(req.session);
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var collection = db.collection('stores');

                var storecollection = {};
                storecollection = collection.find();
                storecollection.toArray(function(err, stores) {
                    var storelist = [];
                    for (var b in stores) {
                        storelist[stores[b]._id] = stores[b].StoreName;
                    }
                    callback(null, storelist);
                });
            },
            function(storelist, callback) {
                var collection = db.collection('users');
                /*{ "UserType": 2 }*/
                collection.find({
                    'UserType': 4

                }).toArray(function(err, users) {
                    var userlist = [];
                    if (users && users.length > 0) {
                        for (var u in users) {
                            users[u].StoreName = storelist[ObjectId(users[u].AssignedStore)];
                            users[u].searchfield =
                                users[u].Name + ' ' + users[u].UserID + ' ' + users[u].Designation + ' ' + users[u].StoreName;
                            userlist.push(users[u]);
                        }
                        resObj.IsSuccess = true;
                        resObj.message = "Success";
                        resObj.data = userlist;
                        console.log('===========CRM list Start======================');

                        console.log(resObj);

                        console.log('===========CRM list called======================');

                        res.send(resObj);
                    } else {
                        resObj.IsSuccess = false;
                        resObj.message = "No record found.";
                        resObj.data = '';
                        res.send(resObj);
                    }
                    callback(null, userlist);
                });
            },
            function(userlist, callback) {
                db.close();
            }
        ]);

    });
});


app.post('/deleteCrm', function(req, res) {
    UserObjectID = req.body.UserObjectID;

    console.log(UserObjectID);
    console.log('============== Called===========EEEE==');

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!UserObjectID) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid User Selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('users');

        collection.deleteMany({
            '_id': ObjectId(UserObjectID),
            'UserType': 4
        });
        resObj.IsSuccess = true;
        resObj.message = "CRM deleted successfully";
        res.send(resObj);

        db.close();

    });
});


app.post('/getallsections', function(req, res) {


    pUserObjectID = req.body.pUserObjectID;
    console.log('=======================pobid  START CALLED=======================');

    console.log(pUserObjectID);
    console.log('=======================pobid called=======================');


    var resObj = {};

    console.log(req.session);
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var collection = db.collection('stores');

                var storecollection = {};
                storecollection = collection.find();
                storecollection.toArray(function(err, stores) {
                    var storelist = [];
                    for (var b in stores) {
                        storelist[stores[b]._id] = stores[b].StoreName;
                    }
                    callback(null, storelist);
                });
            },
            function(storelist, callback) {
                var collection = db.collection('sections');

                collection.find().toArray(function(err, sections) {
                    var userlist = [];

                    if (sections && sections.length > 0) {
                        for (var u in sections) {
                            sections[u].StoreName = storelist[ObjectId(sections[u].AssignedStore)];
                            sections[u].searchfield =
                                sections[u].SectionName + ' ' + sections[u].SectionDesc + ' ' + sections[u].StoreName;





                            userlist.push(sections[u]);
                        }
                        resObj.IsSuccess = true;
                        resObj.message = "Success";
                        resObj.data = userlist;
                        console.log('===========Sections list Start======================');

                        console.log(resObj);

                        console.log('===========Sections list called End======================');

                        res.send(resObj);
                    } else {
                        resObj.IsSuccess = false;
                        resObj.message = "No record found.";
                        resObj.data = '';
                        res.send(resObj);
                    }
                    callback(null, userlist);
                });
            },
            function(sectionlist, callback) {
                db.close();
            }
        ]);

    });


});




app.post('/updateCustomeExecutive', function(req, res) {

    console.log('==============jhhgjhjhj======update CRM called=fdfdfdffddf=========================');

    UserID = req.body.UserID;
    ResetPassword = req.body.ResetPassword;
    Password = req.body.Password;

    Name = req.body.Name;
    Designation = req.body.Designation;

    AssignedStore = req.body.AssignedStore;
    UserObjectID = req.body.UserObjectID;

    UserID = UserID.toLowerCase();

    Name = Name.toLowerCase();
    Designation = Designation.toLowerCase();


    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(UserID && Name && UserObjectID)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter appropriate informations";
        res.send(resObj);
        return;
    }

    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please select User";
        res.send(resObj);
        return;
    }

    if (AssignedStore.length != 24) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid User selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {
                collection.find({
                    '_id': { $ne: ObjectId(UserObjectID) }
                }).toArray(function(err, users) {
                    var cnt = users.length;
                    for (var u in users) {
                        if (users[u].UserID == UserID) {
                            resObj.IsSuccess = false;
                            resObj.message = "User ID already exists";
                            res.send(resObj);
                            return 0;
                        }
                        /*else if (users[u].Name == Name) {
                            resObj.IsSuccess = false;
                            resObj.message = "Name already exists";
                            res.send(resObj);
                            return 0;
                        }*/
                    }
                    callback(null, users);
                });
            },
            function(userdata, callback) {

                console.log(userdata);
                /*bcrypt.genSalt(10, function(err, salt) {
                    if (err)
                        return callback(err);

                    bcrypt.hash(Password, salt, function(err, hash) {
                        return callback(null, hash);
                    });
                });*/
                var hashedPassword = passwordHash.generate(Password);
                callback(null, hashedPassword);
            },
            function(hashedpassword, callback) {
                /*console.log(ResetPassword);
                console.log(hashedpassword);*/
                if (ResetPassword) {
                    collection.update({
                        '_id': ObjectId(UserObjectID)
                    }, {
                        '$set': {
                            'UserID': UserID,
                            'Name': Name,


                            'Password': hashedpassword,

                            'AssignedStore': ObjectId(AssignedStore),

                            'Designation': Designation
                        }
                    });

                } else {
                    console.log(ObjectId(UserObjectID));
                    collection.update({
                        '_id': ObjectId(UserObjectID)
                    }, {
                        '$set': {
                            'UserID': UserID,

                            'Name': Name,


                            'AssignedStore': ObjectId(AssignedStore),

                            'Designation': Designation,
                        }
                    });
                }

                console.log('======================CRM updated=======================================');

                callback(null, 'updated');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "CRM updated successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });


});




app.post('/deleteSection', function(req, res) {
    UserObjectID = req.body.UserObjectID;

    console.log(UserObjectID);
    console.log('============== Called===========EEEE==');

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!UserObjectID) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid User Selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('sections');

        collection.deleteMany({
            '_id': ObjectId(UserObjectID),

        });
        resObj.IsSuccess = true;
        resObj.message = "Section deleted successfully";
        res.send(resObj);

        db.close();

    });
});


app.post('/getSection', function(req, res) {
    pUserObjectID = req.body.pUserObjectID;
    var resObj = {};

    if (!(pUserObjectID)) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid Section selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('sections');

        async.waterfall([
            function(callback) {
                collection.find({
                    '_id': ObjectId(pUserObjectID)
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });

            },
            function(devices, callback) {
                if (devices && devices.length > 0) {
                    resObj.IsSuccess = true;
                    resObj.message = "success";
                    resObj.data = devices;
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "Section not found";
                }
                db.close();
                res.send(resObj);
            }
        ]);
    });
});



app.post('/updateSection', function(req, res) {

    console.log('==============jhhgjhjhj======update Section called=fdfdfdffddf=========================');
    UserObjectID = req.body.UserObjectID;

    AssignedStore = req.body.AssignedStore;

    SectionName = req.body.SectionName;
    SectionDesc = req.body.SectionDesc;
    selectedBeacon = req.body.selectedBeacon;

    console.log(UserObjectID);
    console.log(AssignedStore);
    console.log(SectionName);
    console.log(SectionDesc);
    console.log(selectedBeacon);

    SectionName = SectionName.toLowerCase();
    SectionDesc = SectionDesc.toLowerCase();



    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    if (!(UserObjectID)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter appropriate informations";
        res.send(resObj);
        return;
    }

    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please select User";
        res.send(resObj);
        return;
    }

    if (AssignedStore.length != 24) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid User selected";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        assert.equal(null, err);

        var collection = db.collection('sections');
        var sectionbeacon = db.collection('beacons');

        async.waterfall([
            function(callback) {
                collection.find({
                    '_id': ObjectId(UserObjectID)
                }).toArray(function(err, sections) {

                    callback(null, sections);
                });
            },
            function(userdata, callback) {
                console.log('Userdata Callback====================Called');

                console.log(userdata);

                console.log(ObjectId(UserObjectID));
                collection.update({
                    '_id': ObjectId(UserObjectID)
                }, {
                    '$set': {


                        'AssignedStore': ObjectId(AssignedStore),
                        'SectionName': SectionName,
                        'SectionDesc': SectionDesc,
                        'BeaconID': selectedBeacon,




                    }
                });


                console.log('======================Employee updated=======================================');

                callback(null, 'updated');
            },
            function(updated, callback) {
                sectionbeacon.updateMany({
                        'BeaconID': {
                            $in: selectedBeacon
                        }
                    }, {
                        '$set': {
                            'BeaconSection': ObjectId(UserObjectID),
                        }
                    },
                    function(err, result) {
                        if (err) {
                            throw err;
                        } else {

                        }
                    }
                );

                console.log('Section Beacon Updated');
                callback(null, 'rec');

            },
            function(response, callback) {
                resObj.IsSuccess = true;
                resObj.message = "Section updated successfully.";
                res.send(resObj);
                db.close();


            }
        ]);
    });


});

// Get Employee Data For PHP through curl in CRM module
app.post('/getCrmEmployee', function(req, res) {

    var UserType = req.body.UserType;
    var resObj = {};




    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        var sectionlist = [];
        async.waterfall([
            function(callback) {


                var SectionName = '';

                var sectioncollection = db.collection('sections');



                var sectcollection = {};
                sectcollection = sectioncollection.find();
                sectcollection.toArray(function(err, sections) {


                    for (var b in sections) {
                        sectionlist[sections[b]._id] = sections[b].SectionName;
                    }

                    callback(null, sectionlist);
                });
            },

            function(sectionlist, callback) {
                var collection = db.collection('stores');

                var storecollection = {};
                storecollection = collection.find();
                storecollection.toArray(function(err, stores) {
                    var storelist = [];
                    for (var b in stores) {
                        storelist[stores[b]._id] = stores[b].StoreName;
                    }
                    callback(null, storelist);
                });
            },
            function(storelist, callback) {
                var collection = db.collection('users');


                var SectionName = '';
                /*{ "UserType": 2 }*/
                collection.find({
                    'UserType': 3

                }).toArray(function(err, users) {
                    var userlist = [];

                    if (users && users.length > 0) {






                        for (var u in users) {
                            //var  AssignedSection = users[0].AssignedSection;
                            users[u].StoreName = storelist[ObjectId(users[u].AssignedStore)];
                            users[u].SectionName = sectionlist[ObjectId(users[u].AssignedSection)];
                            users[u].searchfield =
                                users[u].Name + ' ' + users[u].UserID + ' ' + users[u].Designation + ' ' + users[u].StoreName + ' ' + users[u].SectionName;




                            userlist.push(users[u]);
                        }
                        resObj.IsSuccess = true;
                        resObj.message = "Success";
                        resObj.data = userlist;
                        console.log('===========employee list Start======================');

                        console.log(resObj);

                        console.log('===========employee list END======================');

                        res.send(resObj);
                    } else {
                        resObj.IsSuccess = false;
                        resObj.message = "No record found.";
                        resObj.data = '';
                        res.send(resObj);
                    }
                    callback(null, userlist);
                });
            },
            function(userlist, callback) {
                db.close();
            }
        ]);

    });
});

app.post('/getStore_DeviceCount', function(req, res) {
    resObj = {};
    console.log(req.session);
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var devicecollection = db.collection('device');


        devicecollection.aggregate([{
            '$lookup': {
                'from': "beacons",
                'localField': "BeaconID",
                'foreignField': "BeaconID",
                'as': "beacons"
            }
        }, {
            '$unwind': {
                'path': "$beacons",
            }
        }, {
            '$lookup': {
                'from': "stores",
                'localField': "beacons.BeaconStore",
                'foreignField': "_id",
                'as': "stores",
            }
        }, {
            '$unwind': {
                'path': "$stores",
            }
        }, {
            $group: {
                _id: { StoreID: '$stores._id', StoreName: '$stores.StoreName' },
                count: { $sum: 1 }
            }
        }]).toArray(function(err, devices) {
            resObj.IsSuccess = true;
            resObj.message = "Success";
            resObj.records = devices;
            res.send(resObj);
        });
    });
});

app.get('/getsettings', function(req, res) {
   
    var resObj = {};
   
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('settings');

        async.waterfall([
            function(callback) {
                 collection.find().toArray(function(err, settings) {

                    console.log('====================Settings Called====================');
                     console.log(settings);

                     console.log('====================Settings Called====================');
                  
                    callback(null, settings);
                });
               
            },
          
            function(settingdata, callback) {
                if (settingdata && settingdata.length > 0) {
                    resObj.IsSuccess = true;
                    resObj.message = "success";
                    resObj.data = settingdata;
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "No Record Found";
                }
                db.close();
                res.send(resObj);
            }
        ]);
    });
});




app.post('/updateSettingData', function(req, res) {

    console.log('====================uupdateSettingData called=========================');
   // UserObjectID = req.body.UserObjectID;

    GeoFancingRange = req.body.GeoFancingRange;

    MinStayTimeOfCustomerForEmployee = req.body.MinStayTimeOfCustomerForEmployee;
    
  
    console.log(GeoFancingRange);
    console.log(MinStayTimeOfCustomerForEmployee);
    



    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType == 2) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

   
  

    
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        assert.equal(null, err);

        var collection = db.collection('settings');
       

        async.waterfall([
            function(callback) {
                collection.find().toArray(function(err, settings) {

                    callback(null, settings);
                });
            },
            function(userdata, callback) {
                console.log('Userdata Callback====================Called');

                console.log(userdata);

               
                collection.update({
                   
                }, {
                    '$set': {


                        'GeoFancingRange': GeoFancingRange,
                        'MinStayTimeOfCustomerForEmployee': MinStayTimeOfCustomerForEmployee,
     
                    }
                });


                console.log('======================Settings updated=======================================');

                callback(null, 'updated');
            },
            function(updated, callback) {

              resObj.IsSuccess = true;
                resObj.message = "Settings updated successfully.";
                res.send(resObj);
                db.close();


            },
           
        ]);
    });


});