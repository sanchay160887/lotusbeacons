/*Node Modules*/
var express = require('express');
//var moment = require('moment');

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
var FCM = require('fcm-node');
var serverKey = 'AIzaSyCJ7BLdXAhonngXWKpqUtYK3fOdZFi8m_g';
var fcm = new FCM(serverKey);
var gcm = require('android-gcm');
var request = require('request');
var forEach = require('async-foreach').forEach;
var passwordHash = require('password-hash');
var session = require('express-session');
querystring = require('querystring');
require('timers');
//require('tls').SLAB_BUFFER_SIZE = 100 * 1024 // 100Kb
var devicecron = require('node-cron');
//var mongourl = 'mongodb://lotusbeacon:remote@ds161255.mlab.com:61255/lotusbeacon'; //Live Database
//var mongourl = 'mongodb://lotus:remote@ds137100.mlab.com:37100/lotusbeaconemployee'; //Staging Database
//var mongourl = 'mongodb://lotus:remote@ds161255.mlab.com:61255/lotusbeacon'; //Live Database Ali Account
var mongourl = 'mongodb://lotus:remote@ds145071-a0.mlab.com:45071,ds145071-a1.mlab.com:45071/lotusbeaconlive?replicaSet=rs-ds145071'; //Live Database Syscraft Info Account paid cluster

var lotusWebURL = 'https://www.lotuselectronics.com/v2/';
//var lotusWebURL = 'http://lampdemos.com/lotus15/v2/';
var lotusURL = 'https://www.lotuselectronics.com/v2_emp/';
//var lotusURL = 'http://lampdemos.com/lotus15/v2_emp/';

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
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    },
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

/*// Send current time to all connected clients
function sendTime() {
    io.emit('time', {
        time: new Date().toJSON()
    });
}*/

/*io.on('receiveTime', function(data) {
    console.log('Data coming from client :: ');
})*/

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
    //console.log('Time zone offset: ' + d.getTimezoneOffset());
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

var settings_StayTime = 90;
var settings_welcomeMessage = 'Welcome «CUSTNAME», Greetings from Lotus Electronics. Look out for latest deals for the products you are shopping for';
var settings_EmpCustIntimate = 'Check your «CUSTNAME» is nearby you';

MongoClient.connect(mongourl, function(err, db) {
    if (err) {
        return console.dir(err);
    }
    assert.equal(null, err);

    var settingsCol = db.collection('settings');
    settingsCol.find().toArray(function(err, settings) {
        if (settings && settings.length > 0) {
            settings_StayTime = settings[0].MinStayTimeOfCustomerForEmployee;
            settings_welcomeMessage = settings[0].CustomerWelcomeMessage;
            settings_EmpCustIntimate = settings[0].EmployeeCustomerIntimation
        }
    });
});


/* General Supportive Function End <<-- */
function updateDevice(BeaconID, DeviceID, Distance, MobileNo, CustName, resObj) {
    //console.log('Update Device called to check socket');
    //if (MobileNo && MobileNo == '9584010456') {
    /*console.log('Beacon ID ' + BeaconID);
    console.log('Device ID ' + DeviceID);
    console.log('Distance ' + Distance);
    console.log('Mobile No ' + MobileNo);
    console.log('Customer ' + CustName);*/
    //}
    var BeaconStoreID = '';

    if (!CustName) {
        CustName = 'Customer';
    }

    var resObjVal = {};
    if (!(DeviceID && Distance && MobileNo)) {
        //console.log('Invalid data passing');
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

    //console.log('Update device called');

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
                    beacons = beacons[0];
                    BeaconStoreID = beacons.BeaconStore;
                }

                collection.find({
                    'MobileNo': MobileNo
                }).toArray(function(err, devices) {

                    if (BeaconID != '') {
                        updateDeviceHistory(callback, beacons, DeviceID, MobileNo, CustName);
                    } else {
                        callback(null, devices);
                    }
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
                        //console.log('Device updated or inserted');
                        callback(null, 'updated or inserted');
                    });
                }
            },
            function(response, callback) {
                /*io.emit('updateDevice_response', {
                    'IsSuccess': true,
                    'BeaconID': BeaconID,
                    'StoreID': BeaconStoreID,
                    'MobileNo': MobileNo,
                    'CustName': CustName,
                    'message': 'Data inserted successfully'
                });*/

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

function updateDeviceHistory(pcallback, BeaconObj, DeviceID, MobileNo, CustName, resObj) {
    //console.log('------------Updating device History--------------');
    //console.log('Beacon ID ' + BeaconObj.BeaconID);
    //console.log('Device ID ' + DeviceID);
    //console.log('Mobile No ' + MobileNo);
    //console.log('------------Updating device History--------------');
    var BeaconID = BeaconObj.BeaconID;
    var BeaconStore = BeaconObj.BeaconStore;
    var BeaconSection = BeaconObj.BeaconSection;

    var resObjVal = {};
    if (!(BeaconID && DeviceID && MobileNo)) {
        return;
    }

    todaysdate = getCurrentTime();
    seldate = new Date(todaysdate);
    datestring = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();
    fromDate = new Date(datestring).getTime();

    var staydiffForNextNotification = 900000; //15 Minute
    //var staydiffForNextNotification = 300000; //5 Minute for testing purpose    

    customerEmployeeIntervalStart = getCurrentTime() - staydiffForNextNotification;

    var updateStayTimeWithSame = false;
    var updateStayTimeValue = 0;
    var isNotificationSent = 0;
    var NotificationSentTime = 0;

    //console.log('Update device history called');

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('device_history');

        async.waterfall([
            /*function(callback) {
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
                                        callback(null, 'DeviceID is different');
                                    }
                                });
                        } else {
                            callback(null, 'next callback');
                        }
                    } else {
                        //console.log('old records not found');
                        callback(null, 'next callback');
                    }
                });
            },*/
            function(callback) {
                collection.find({
                    'MobileNo': MobileNo,
                    'freeze': {
                        $ne: 1
                    },
                    'Date': {
                        $gte: fromDate,
                    }
                }).sort({ 'DateTo': -1 }).toArray(function(err, devicelist) {
                    callback(null, devicelist);
                })
            },
            function(devicelist, callback) {
                if (!(devicelist && devicelist.length > 0)) {
                    if (typeof(BeaconObj.BeaconWelcome) != undefined && BeaconObj.BeaconWelcome) {
                        notifymessage = settings_welcomeMessage.replace('«CUSTNAME»', CustName);
                        sendpushnotification_mobileno(null, [MobileNo], 'Welcome', notifymessage);
                    }
                }
                callback(null, devicelist);
            },
            function(devices, callback) {
                var IsInsertRecord = false;
                currtime = getCurrentTime();

                if (devices && devices.length > 0) {
                    //When user stayed to same beacon and socket calling update service again and again
                    if (devices[0].BeaconID == BeaconID) {
                        StayTime = Math.max(((todaysdate - devices[0].Date) / 1000), 0);
                        if (StayTime >= 1) {
                            updateStayTimeWithSame = true;
                            updateStayTimeValue = StayTime;
                            NotificationSentTime = devices[0].NotificationSentTime;
                            isNotificationSent = devices[0].NotificationSent;

                            //console.log('Checking Staytime ', StayTime, ' ', settings_StayTime, ' ', NotificationSentTime);
                            //console.log('check diff %s - %s = %s (%s) ', todaysdate, NotificationSentTime, (todaysdate - NotificationSentTime), staydiffForNextNotification);
                            //NotificationSent
                            if (StayTime >= settings_StayTime &&
                                (!isNotificationSent ||
                                    (!NotificationSentTime ||
                                        (todaysdate - NotificationSentTime >= staydiffForNextNotification)))) {

                                //console.log('Going for sending noifications....');

                                collection.aggregate([{
                                    $match: {
                                        'MobileNo': MobileNo,
                                        'BeaconID': BeaconID,
                                        '_id': { $ne: ObjectId(devices[0]._id) },
                                        'NotificationSentTime': {
                                            $gte: (customerEmployeeIntervalStart - 60000),
                                        },
                                    }
                                }, {
                                    $group: {
                                        _id: { BeaconID: '$BeaconID', MobileNo: '$MobileNo' },
                                        maxNotificationSentTime: { $max: "$NotificationSentTime" }
                                    }
                                }]).toArray(function(err, notifhistory) {
                                    //console.log('Checking device listing' + JSON.stringify(notifhistory));
                                    if (!notifhistory || !notifhistory.maxNotificationSentTime ||
                                        notifhistory.maxNotificationSentTime <= customerEmployeeIntervalStart) {
                                        //From this branch the table is depricated
                                        //var empcollection = db.collection('user_beacons_active');
                                        var empcollection = db.collection('users');

                                        /*empcollection.aggregate([{
                                            $match: {
                                                'BeaconID': BeaconID
                                            }
                                        }, {
                                            $lookup: {
                                                from: 'users',
                                                localField: 'UserID',
                                                foreignField: '_id',
                                                as: 'user_docs'
                                            }
                                        }])*/

                                        empcollection.find({
                                                'UserType': 3,
                                                'AssignedSection': ObjectId(BeaconSection)
                                            }).toArray(function(err, emplist) {
                                                if (emplist && emplist.length > 0) {
                                                    var userIds = [];
                                                    var deviceTokens = [];
                                                    //Depricated from this branch
                                                    /*for (var e in emplist) {
                                                        userIds.push(emplist[e].UserID.toString());
                                                        if (emplist[e].user_docs.length > 0) {
                                                            deviceTokens.push(emplist[e].user_docs[0].devicetoken);
                                                        }
                                                    }*/

                                                    for (var e in emplist) {
                                                        userIds.push(emplist[e]._id.toString());
                                                        deviceTokens.push(emplist[e].devicetoken);
                                                    }

                                                    if (deviceTokens.length > 0) {
                                                        var mobileno = '';
                                                        notifymessage = settings_EmpCustIntimate.replace('«CUSTNAME»', CustName);

                                                        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                                                            registration_ids: deviceTokens,
                                                            data: {
                                                                'message': notifymessage,
                                                                'notification_user_id': userIds,
                                                                'badge': 1,
                                                                'title': 'Attain',
                                                                'BeaconID': BeaconObj.BeaconID,
                                                                'img_url': '',
                                                                'notification_type': 7,
                                                            }
                                                        };

                                                        isNotificationSent = 1;
                                                        NotificationSentTime = getCurrentTime();

                                                        fcm.send(message, function(err, response) {
                                                            if (err) {
                                                                //console.log("Something gone wrong!");
                                                                console.dir(err);
                                                                callback(null, devices);
                                                            } else {
                                                                //console.log('Notification sent to employees');
                                                                if (typeof(response) != 'undefined') {
                                                                    var request = require('request');
                                                                    var gcmdata = JSON.stringify(deviceTokens);
                                                                    var userJSON = JSON.stringify(userIds);
                                                                    request.post(lotusURL + 'employee/get_notification_entry', {
                                                                            form: {
                                                                                'android_device_token': gcmdata,
                                                                                'notification_user_id': userJSON,
                                                                                'mobile_no': MobileNo,
                                                                                'title': 'Attain',
                                                                                'BeaconID': BeaconObj.BeaconID,
                                                                                'message': notifymessage,
                                                                                //  'notification_img': image_url,
                                                                                'notification_type': 7,
                                                                            }
                                                                        },
                                                                        function(res2, err, body) {
                                                                            //console.log('Data coming from employee service --> ' + JSON.stringify(body));
                                                                            callback(null, devices);
                                                                        });
                                                                } else {
                                                                    callback(null, devices);
                                                                }
                                                                //console.log("Successfully sent with Employee response: ", response);
                                                            }
                                                        });
                                                    } else {
                                                        callback(null, devices);
                                                    }
                                                } else {
                                                    callback(null, devices);
                                                }
                                            })
                                    } else {
                                        callback(null, devices);
                                    }
                                })
                            } else {
                                callback(null, devices);
                            }
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
                                        'freeze': 1,
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
                        'freeze': 0,
                        'MobileNo': MobileNo,
                        'Date': todaysdate,
                        'DateTo': todaysdate
                    }, function(err, records) {
                        callback(null, devices);
                        //console.log('Device History inserted Mobile No:' + MobileNo);
                    });
                }
            },
            function(devices, callback) {
                if (updateStayTimeWithSame && devices.length > 0) {
                    //console.log('Is Notification sent : ' + isNotificationSent);
                    collection.update({
                            _id: ObjectId(devices[0]._id)
                        }, {
                            '$set': {
                                'DateTo': todaysdate,
                                'StayTime': updateStayTimeValue,
                                'NotificationSent': isNotificationSent,
                                'NotificationSentTime': NotificationSentTime
                            }
                        },
                        function(err, result) {
                            if (err) {
                                throw err;
                            } else {
                                callback(null, devices);
                                return 0;
                            }
                        });
                }

                /*io.emit('updateDeviceHistory_response', {
                    'IsSuccess': true,
                    'BeaconID': BeaconID,
                    'StoreID': BeaconStore,
                    'MobileNo': MobileNo,
                    'CustName': CustName,
                    'message': 'Data updated successfully'
                });*/
                //console.log('coming to last callback');
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
                pcallback(null, devices);
                //callback(null, devices);
                return 0;
            }
        ]);
    });
}

//Not calling from anywhere from 24 May 2017 for optimization work
/// Employe function for update user Active start
function updateUser_Active(BeaconID, UserID, Distance, resObj) {
    var UserID = ObjectId(UserID);
    //console.log('Update User Active called');
    //console.log(UserID);
    //console.log('==============================');
    //console.log('Beacon ID ' + BeaconID);
    //console.log('User ID ' + UserID);
    //console.log('Distance ' + Distance);

    var BeaconStoreID = '';

    var resObjVal = {};

    if (!BeaconID) {
        resObjVal.IsSuccess = false;
        resObjVal.message = "Invalid Beacon ID";
        resObj.send(resObjVal);
        return 0;
    }

    if (!(UserID && Distance)) {
        //console.log('Invalid data passing');
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
                var collection = db.collection('users');
                collection.find(ObjectId(UserID)).toArray(function(err, users) {
                    if (users.length <= 0) {
                        if (resObj) {
                            resObjVal.IsSuccess = false;
                            resObjVal.message = "Device not available";
                            resObj.send(resObjVal);
                        }
                        //console.log('Invalid User ' + UserID);
                    } else {
                        callback(null, beacons);
                    }
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

                beacons = beacons[0];

                updateUser_Beacon_History(beacons, ObjectId(UserID), callback);
            },
            function(user_beacons_data, callback) {
                collection.update({
                    'UserID': ObjectId(UserID) //It should be oid
                }, {
                    'BeaconID': BeaconID,
                    'UserID': ObjectId(UserID),
                    'Distance': Distance,
                    'connectiontime': getCurrentTime(),
                }, {
                    'upsert': true,
                }, function(err, result) {
                    //console.log('Employee updated or inserted');
                    callback(null, 'updated or inserted');
                });
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

//Not calling from anywhere from 24 May 2017 for optimization work
function updateUser_Beacon_History(BeaconObj, UserID, pcallback, resObj) {
    var BeaconID = BeaconObj.BeaconID;
    var BeaconStore = BeaconObj.BeaconStore;

    //console.log('------------Updating User employee History--------------');
    //console.log('Beacon ID ' + BeaconID);
    //console.log('User ID ' + UserID);
    //console.log('------------Updating User employee History--------------');

    var resObjVal = {};
    if (!(BeaconID && UserID)) {
        return;
    }

    var BeaconStore = '';

    todaysdate = getCurrentTime();
    seldate = new Date(todaysdate);
    datestring = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();
    fromDate = new Date(datestring).getTime();
    //toDate = new Date(datestring + ' 23:59:59').getTime();

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
                collection.find({
                    'UserID': UserID,
                    'freeze': {
                        $ne: 1
                    },
                    'Date': {
                        $gte: fromDate,
                        //$lte: toDate,
                    }
                }).sort({ 'DateTo': -1 }).toArray(function(err, devicelist) {
                    callback(null, devicelist);
                })
            },
            function(devices, callback) {
                //console.log('Inserting records over device history');
                var IsInsertRecord = false;
                currtime = getCurrentTime();

                if (devices && devices.length > 0) {
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
                                        'freeze': 1
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
                        'freeze': 0,
                        'Date': todaysdate,
                        'DateTo': todaysdate
                    }, function(err, records) {
                        callback(null, 'inserted');
                        //console.log('Device History inserted Mobile No:' + UserID);
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
                //console.log('coming to last callback');
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
                    resObj.send(obj);
                }
                pcallback(null, 'done');
                return 0;
            }
        ]);
    });
}

// Emit welcome message on connection
io.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    /*socket.emit('welcome', {
        message: 'Welcome!',
        id: socket.id
    });*/

    // Hitting from Client 
    /*socket.on('receiveTime', function(data) {
        //console.log('Coming with Data :: ' + JSON.stringify(data));
    });*/

    socket.on('updateDevice', function(data) {
        //console.log(JSON.stringify(data));
        updateDevice(data.BeaconID, data.DeviceID, data.Distance, data.MobileNo, data.CustName);
    });

    //Employee socket start from here

    //Employee history maintenance now been commited for sake of optimization of dashboard. 
    /*socket.on('updateUser_Active', function(data) {
        io.emit('updateUser_Active_response', {
            'IsSuccess': true,
            'message': 'Socket is calling from yourside'
        });
        updateUser_Active(data.BeaconID, data.UserID, data.Distance);
    });*/

});

app.post('/updateDevice', function(req, res) {
    updateDevice(req.body.BeaconID, req.body.DeviceID, req.body.Distance, req.body.MobileNo, '', res);
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
//// end

app.post('/updateDeviceHistory', function(req, res) {
    //console.log('service calling');
    updateDeviceHistory(req.body.BeaconID, req.body.DeviceID, req.body.MobileNo, res);
});


function beaconDisconnect(BeaconID, DeviceID, MobileNo) {
    //console.log('-------------------Beacon disconnected------------- ');

    updateDevice(BeaconID, DeviceID, -1, MobileNo, '');

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
                        //console.log('going to Delete record >>>>>>>>>>>>');
                        for (var d in devices) {
                            if (devices[d].Distance < 0) {
                                DeleteMe = true;
                                //console.log('Record Deleted >>>>>>> ' + DeleteMe);
                                break;
                            }
                        }
                    }
                    if (DeleteMe) {
                        //console.log('Deleting records from mongo >>>>>>> ' + DeleteMe + ' Device Id ' + DeviceID);
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
    //console.log('-------------------Beacon disconnected------------- ');
    BeaconID = req.body.BeaconID;
    DeviceID = req.body.DeviceID;
    MobileNo = req.body.MobileNo;
    //console.log('Beacon ID ' + BeaconID);
    //console.log('Device ID ' + DeviceID);
    //console.log('Mobile No ' + MobileNo);
    //console.log('------------Beacon disconnected--------------');
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


function userDisconnect(BeaconID, UserID) {

    updateUser_Active(BeaconID, UserID, -1);

    setTimeout(function() {
        MongoClient.connect(mongourl, function(err, db) {
            if (err) {
                return console.dir(err);
            }
            assert.equal(null, err);

            var collection = db.collection('user_beacons_active');
            //console.log('Getting Collection');

            async.waterfall([
                function(callback) {
                    collection.find({
                        'UserID': ObjectId(UserID),
                        "Distance": { "$lte": -1 }
                    }).toArray(function(err, users) {
                        callback(null, users);
                    });
                },
                function(users, callback) {
                    //console.log('Deleting Collection ' + JSON.stringify(users));
                    var DeleteMe = false;
                    if (users && users.length > 0) {
                        //console.log('going to Delete record >>>>>>>>>>>>');
                        //console.log(JSON.stringify(users));
                        for (var u in users) {
                            if (users[u].Distance < 0) {
                                DeleteMe = true;
                                //console.log('Record Deleted >>>>>>> ' + DeleteMe);
                                break;
                            }
                        }
                    }
                    if (DeleteMe) {
                        //console.log('Deleting records from mongo >>>>>>> ' + DeleteMe + ' User Id ' + UserID);
                        collection.deleteMany({
                            'UserID': ObjectId(UserID)
                        });

                        //var dhcollection = db.collection('test_device_history');
                        var dhcollection = db.collection('user_beacons_history');
                        dhcollection.updateMany({
                                'BeaconID': BeaconID,
                                'UserID': ObjectId(UserID)
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

                        io.emit('updateUser_response', {
                            'IsSuccess': true,
                            'BeaconID': BeaconID,
                            'UserID': UserID,
                            'message': 'Data inserted successfully'
                        });

                    }
                },
                function(acknowledge, callback) {
                    db.close();
                }
            ]);
        });
    }, 120000);
}

app.post('/userDisconnected', function(req, res) {
    //console.log('-------------------Beacon disconnected------------- ');
    BeaconID = req.body.BeaconID;
    UserID = req.body.UserID;
    //console.log('Beacon ID ' + BeaconID);
    //console.log('Device ID ' + UserID);
    //console.log('Mobile No ' + MobileNo);
    //console.log('------------Beacon disconnected--------------');
    async.waterfall([
        function(callback) {
            MongoClient.connect(mongourl, function(err, db) {
                if (err) {
                    return console.dir(err);
                }

                var collection = db.collection('user_beacons_active');

                var filteredcollection = {};

                filteredcollection = collection.find({
                    "UserID": ObjectId(UserID),
                }).toArray(function(err, users) {
                    userlist = [];
                    for (var u in users) {
                        userlist.push(users[u]);
                    }
                    callback(null, userlist);
                })
                db.close();

            });
        },
        function(userlist, callback) {
            if (userlist && userlist.length > 0) {
                userDisconnect(userlist[0].BeaconID, userlist[0].UserID._id);
            }
        },
    ]);
});


devicecron.schedule('* * * * *', function() {
    var outofrangelimit = getCurrentTime();
    outofrangelimit = outofrangelimit - (60 * 1 * 1000);

    MongoClient.connect(mongourl, function(err, db) {
        async.waterfall([
            function(callback) {

                if (err) {
                    return console.dir(err);
                }

                var collection = db.collection('device');
                var devicelist = new Array();
                //console.log('Device Cron executed on ' + outofrangelimit);
                collection.find({
                    "connectiontime": { "$lte": outofrangelimit },
                }).toArray(function(err, devices) {
                    for (var dvc in devices) {
                        devicelist.push(devices[dvc]);
                    }
                    callback(null, devicelist);
                })
            },
            function(devicelist, callback) {
                if (devicelist.length > 0) {
                    for (var dvc in devicelist) {
                        beaconDisconnect(devicelist[dvc].BeaconID, devicelist[dvc].DeviceID,
                            devicelist[dvc].MobileNo);
                    }
                }
                callback(null, true);
            },
            function(result, callback) {
                var ucollection = db.collection('user_beacons_active');
                var userlist = new Array();
                //console.log('Employee Cron executed on ' + outofrangelimit);
                ucollection.find({
                    "connectiontime": { "$lte": outofrangelimit },
                }).toArray(function(err, users) {
                    for (var u in users) {
                        userlist.push(users[u]);
                    }
                    callback(null, userlist);
                })
            },
            function(userlist, callback) {
                if (userlist.length > 0) {
                    for (var u in userlist) {
                        userDisconnect(userlist[u].BeaconID, userlist[u].UserID);
                    }
                }
                callback(null, userlist);
            },
            function(lastval, callback) {
                db.close();
            }
        ]);
    });
});

devicecron.schedule('*/5 * * * *', function() {
    //console.log('Garbage collection called');
    global.gc();
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
        //console.log('login expired');
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

    SectionID = req.body.SectionID;

    if (Number(BeaconID) == -1){
        BeaconID = [];
    } else if (typeof(BeaconID) == 'string') {
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
                } else if (StoreID && Number(StoreID) != -1) {
                    beaconcollection = collection.find({
                        'BeaconStore': ObjectId(StoreID)
                    });
                } else if (Number(StoreID) == -1 && Number(SectionID) != -1) {
                    beaconcollection = collection.find({
                        'BeaconStore': ObjectId(StoreID),
                        'BeaconSection': ObjectId(SectionID)
                    });
                } else if (Number(StoreID) == -1) {
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
                    [/*{
                        $project: {
                            'cmpDate': { '$cmp': ["$Date", "$DateTo"] },
                            'Date': 1,
                            'DateTo': 1,
                            'BeaconID': 1,
                            'MobileNo': 1,
                            'StayTime': 1,
                            'DeviceID': 1,
                            '_id': 1
                        }
                    },*/ {
                        $match: {
                            'Date': {
                                '$gte': fromDate,
                            },
                            'BeaconID': {
                                $in: beacons,
                            }
                            /*,
                            'StayTime': {
                                $gte: 2
                            }
                            ,
                            'cmpDate': {
                                '$lte': 0
                            }*/
                        }
                    }, {
                        $group: {
                            _id: { BeaconID: '$BeaconID', MobileNo: '$MobileNo' },
                            StayTime: { $sum: "$StayTime" }
                        }
                    }]
                ).toArray(function(err, devices) {
                    for (var d in devices) {
                        if (devicehistory[devices[d]._id.MobileNo] == undefined){
                            devicehistory[devices[d]._id.MobileNo] = [];    
                        }
                        
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
                    devicecollection = collection.aggregate([{
                        $match: {
                            'BeaconID': {
                                '$in': beacons
                            }
                        }
                    }, {
                        $lookup: {
                            'from': "beacons",
                            'localField': "BeaconID",
                            'foreignField': "BeaconID",
                            'as': "beacons"
                        }
                    }, {
                        $unwind: {
                            'path': "$beacons",
                        }
                    }, {
                        $lookup: {
                            'from': "sections",
                            'localField': "beacons.BeaconSection",
                            'foreignField': "_id",
                            'as': "sections",
                        },

                    }, {
                        $unwind: {
                            'path': "$beacons",
                        }
                    }]);


                    devicecollection.toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID].BeaconKey;
                            devices[dvc].StoreName = beaconlist[devices[dvc].BeaconID].StoreName;
                            devices[dvc].UniqueKey = devices[dvc].MobileNo + '‖' + devices[dvc].BeaconID;
                            if (devicehistory[devices[dvc].MobileNo] != undefined && devicehistory[devices[dvc].MobileNo][devices[dvc].BeaconID] != undefined) {
                                devices[dvc].StayTime = convertSecondsToStringTime(devicehistory[devices[dvc].MobileNo][devices[dvc].BeaconID]);
                            } else {
                                devices[dvc].StayTime = 'Just Entered';
                            }
                            if (devices[dvc].sections != undefined && devices[dvc].sections.length > 0) {
                                devices[dvc].SectionName = devices[dvc].sections[0].SectionName;
                            } else {
                                devices[dvc].SectionName = '';
                            }
                            devicelist.push(devices[dvc]);
                        }
                        callback(null, devicelist);
                    })
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
                ////console.log(data);

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
    pBeaconID = BeaconID;
    StoreID = req.body.StoreID;
    Section = req.body.Section;

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

    //console.log('fromDate: ' + fromDate);
    //console.log('toDate: ' + toDate);

    var beaconsIDs = [];

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                var beaconcollection = [];
                var HavingCollection = true;
                if (BeaconID && BeaconID.length > 0) {
                    beaconcollection = collection.find({
                        'BeaconID': {
                            $in: BeaconID
                        }
                    });
                } else if (Section && Section.length == 24) {
                    beaconcollection = collection.find({
                        'BeaconSection': ObjectId(Section)
                    });
                } else if (StoreID && StoreID.length == 24) {
                    beaconcollection = collection.find({
                        'BeaconStore': ObjectId(StoreID)
                    });
                } else {
                    HavingCollection = false;
                    beaconcollection = {};
                }

                if (HavingCollection) {
                    beaconcollection.toArray(function(err, beacons) {
                        var beaconslist = [];
                        for (var b in beacons) {
                            beaconslist[beacons[b].BeaconID] = beacons[b].BeaconKey;
                            beaconsIDs.push(beacons[b].BeaconID);
                        }
                        callback(null, beaconslist);
                    });
                } else {
                    callback(null, []);
                }
            },
            function(beaconlist, callback) {
                //var collection = db.collection('test_device_history');
                var collection = db.collection('device_history');
                var devicelist = new Array();

                if (beaconsIDs && beaconsIDs.length > 0) {

                    var groupParam = {};
                    if (Section && Section.length == 24 && (!pBeaconID || pBeaconID.length <= 0)) {
                        groupParam = {
                            _id: { DeviceID: '$DeviceID' },
                            StayTime: { $sum: "$StayTime" },
                            MobileNo: { $max: "$MobileNo" },
                            SectionName: { $max: "$sections.SectionName" },
                            SectionID: { $max: "$sections._id" }
                        };

                    } else {
                        groupParam = {
                            _id: { BeaconID: '$BeaconID', DeviceID: '$DeviceID' },
                            StayTime: { $sum: "$StayTime" },
                            MobileNo: { $max: "$MobileNo" },
                            SectionName: { $max: "$sections.SectionName" },
                            SectionID: { $max: "$sections._id" }
                        };
                    }

                    reccollection = collection.aggregate(
                        [/*{
                            $project: {
                                'cmpDate': { '$cmp': ["$Date", "$DateTo"] },
                                'Date': 1,
                                'DateTo': 1,
                                'BeaconID': 1,
                                'MobileNo': 1,
                                'StayTime': 1,
                                'DeviceID': 1,
                                '_id': 1
                            }
                        },*/ {
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
                                }/*,
                                'cmpDate': {
                                    '$lte': 0
                                }*/
                            }
                        }, {
                            $lookup: {
                                'from': "beacons",
                                'localField': "BeaconID",
                                'foreignField': "BeaconID",
                                'as': "beacons"
                            }
                        }, {
                            $unwind: {
                                'path': "$beacons",
                            }
                        }, {
                            $lookup: {
                                'from': "sections",
                                'localField': "beacons.BeaconSection",
                                'foreignField': "_id",
                                'as': "sections",
                            },

                        }, {
                            $unwind: {
                                'path': "$sections",
                            }
                        }, {
                            $group: groupParam
                        }]
                    )

                    /*if (!SearchNameNumber || 1 != 1) { removed because of record inconsistency during pagination
                        reccollection = reccollection.skip(recordsToSkip).limit(RecordsPerPage);
                    }*/

                    reccollection.toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconID = devices[dvc]._id.BeaconID;
                            devices[dvc].SectionID = devices[dvc].SectionID;
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            devices[dvc].DeviceID = devices[dvc]._id.DeviceID;
                            devices[dvc].UniqueKey = devices[dvc].MobileNo + '‖' + devices[dvc].BeaconID;
                            devices[dvc].StayTime = convertSecondsToStringTime(devices[dvc].StayTime);
                            if (devices[dvc].SectionName != undefined && devices[dvc].SectionName.length > 0) {
                                devices[dvc].SectionName = devices[dvc].SectionName;
                            } else {
                                devices[dvc].SectionName = '';
                            }
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
                    devices.push('91' + devicelist[d].MobileNo);
                }
                var request = require('request');
                var data = JSON.stringify(devices);

                //request.post('http://lampdemos.com/lotus15/v2/user/get_user_name', {
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
                            if (reqbody) {
                                for (var r in reqbody) {
                                    if (reqbody[r] != false) {
                                        for (var d in devicelist) {
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
                        }

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
    SectionID = req.body.Section;

    fromDate = 0;
    toDate = 0;
    seldate = new Date(req.body.DateFrom);
    fromDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate())).getTime();
    seldate = new Date(req.body.DateTo);
    toDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate()) + ' 23:59:59').getTime();

    //console.log('fromDate: ' + fromDate);
    //console.log('toDate: ' + toDate);
    //console.log('BeaconID : ' + BeaconID);
    //console.log('SectionID : ' + SectionID);
    //console.log('MobileNo : ' + MobileNo);

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        beaconsIDs = [];

        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                var beaconcollection = {};

                if (!BeaconID) {
                    beaconcollection = collection.find({
                        'BeaconSection': ObjectId(SectionID)
                    });
                } else {
                    beaconcollection = collection.find({
                        'BeaconID': BeaconID
                    });
                }

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

                if (beaconsIDs && beaconsIDs.length > 0) {
                    groupParams = {};
                    if (!BeaconID) {
                        groupParams = {
                            _id: {
                                SectionID: '$sections._id',
                                startDate: { $ceil: { $divide: ["$Date", 360000] } },
                                //endDate: { $floor: { $divide: ["$DateTo", 60000] } }
                            },
                            Date: { $min: "$Date" },
                            DateTo: { $max: "$DateTo" },
                            StayTime: { $sum: "$StayTime" }
                        };
                    } else {
                        groupParams = {
                            _id: {
                                BeaconID: '$BeaconID',
                                startDate: { $ceil: { $divide: ["$Date", 360000] } },
                                //endDate: { $floor: { $divide: ["$DateTo", 60000] } }
                            },
                            Date: { $min: "$Date" },
                            DateTo: { $max: "$DateTo" },
                            StayTime: { $sum: "$StayTime" }
                        };
                    }

                    devicecollection = collection.aggregate(
                        [{
                            $project: {
                                'cmpDate': { '$cmp': ["$Date", "$DateTo"] },
                                'Date': 1,
                                'DateTo': 1,
                                'BeaconID': 1,
                                'MobileNo': 1,
                                'StayTime': 1,
                                '_id': 1
                            }
                        }, {
                            $match: {
                                'Date': {
                                    '$gte': fromDate,
                                    '$lte': toDate,
                                },
                                'StayTime': {
                                    $gte: 2
                                },
                                'cmpDate': {
                                    '$lte': 0
                                },
                                'BeaconID': { '$in': beaconsIDs },
                                'MobileNo': MobileNo,
                            }
                        }, {
                            $lookup: {
                                'from': "beacons",
                                'localField': "BeaconID",
                                'foreignField': "BeaconID",
                                'as': "beacons"
                            }
                        }, {
                            $unwind: {
                                'path': "$beacons",
                            }
                        }, {
                            $lookup: {
                                'from': "sections",
                                'localField': "beacons.BeaconSection",
                                'foreignField': "_id",
                                'as': "sections",
                            },
                        }, {
                            $unwind: {
                                'path': "$sections",
                            }
                        }, {
                            $group: groupParams
                        }, {
                            $sort: {
                                'Date': -1
                            }
                        }]
                    ).sort({ 'Date': -1 }).toArray(function(err, devices) {
                        devicedetaillist = [];

                        var cnt = 0;
                        if (devices) {
                            cnt = devices.length;
                        }

                        for (i = 0; i < cnt; i++) {
                            if (devices[i + 1] !== undefined) {
                                if (devices[i].DateTo - devices[i + 1].Date <= 180000) {
                                    devices[i].DateTo = devices[i + 1].DateTo;
                                    devices[i].StayTime = devices[i].StayTime + devices[i + 1].StayTime;
                                    devices.splice((i + 1), 1);
                                    cnt = devices.length;
                                }
                            }
                        }

                        cnt = devices.length;

                        for (i = 0; i < cnt; i++) {
                            if (devices[i + 1] !== undefined) {
                                if (devices[i].DateTo - devices[i + 1].Date <= 180000) {
                                    devices[i].DateTo = devices[i + 1].DateTo;
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

    //console.log('fromDate: ' + fromDate);
    //console.log('toDate: ' + toDate);
    //console.log('MobileNo : ' + MobileNo);

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
    if (Number(BeaconStore) == -1) {
        BeaconStore = "";
    }

    BeaconSection = req.body.BeaconSection;
    if (Number(BeaconSection) == -1) {
        BeaconSection = "";
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
                    if (BeaconSection) {
                        beaconcollection = collection.find({
                            'BeaconStore': ObjectId(BeaconStore),
                            'BeaconSection': ObjectId(BeaconSection)
                        })
                    } else {
                        beaconcollection = collection.find({
                            'BeaconStore': ObjectId(BeaconStore)
                        })
                    }

                } else {
                    if (BeaconSection) {
                        if (req.session.loggedInUser && req.session.loggedInUser.UserType == 2) {
                            beaconcollection = collection.find({
                                'BeaconStore': ObjectId(UserStore),
                                'BeaconSection': ObjectId(BeaconSection)
                            });
                        } else {
                            beaconcollection = collection.find({
                                'BeaconSection': ObjectId(BeaconSection)
                            });
                        }
                    } else {
                        if (req.session.loggedInUser && req.session.loggedInUser.UserType == 2) {
                            beaconcollection = collection.find({
                                'BeaconStore': ObjectId(UserStore)
                            });
                        } else {
                            beaconcollection = collection.find();
                        }
                    }
                }

                beaconcollection.sort({ 'BeaconKey': 1 }).toArray(function(err, beacons) {
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
                //console.log('Beacon inserted');

                callback(null, 'inserted');
            },
            function(response, callback) {
                //console.log('coming to last callback');
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
                    '$set': {
                        'BeaconID': BeaconID,
                        'BeaconKey': BeaconKey,
                        'BeaconWelcome': BeaconWelcome,
                        'BeaconDescr': BeaconDescr,
                        'BeaconStore': ObjectId(BeaconStore)
                    }
                });
                //console.log('Beacon updated');

                callback(null, 'updated');
            },
            function(response, callback) {
                //console.log('coming to last callback');
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

    UserStore = getUserAllotedStore(req);

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
        resObj.IsSuccess = false;
        resObj.message = "Please enter Store Name";
        res.send(resObj);
        return;
    }

    if (!StoreLat || !isNumeric(StoreLat) || !StoreLong || !isNumeric(StoreLong)) {
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

                callback(null, 'inserted');
            },
            function(response, callback) {
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
        //console.log(StoreName);
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
    var gcmObject = new gcm.AndroidGcm('AIzaSyAUxc6EwlgRP6MITCynw3_vsYatPI4iZuw');
    //var gcmObject = new gcm.AndroidGcm(FcmGoogleKeyEmp);

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
            //console.log('Something went wrong :: ' + err);
        } else {
            //console.log(response);
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
                        //console.log(devices)
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

    gcmObject.send(message, function(err, response) {
        //console.log(response);
        if (err) {
            //console.log('Something went wrong :: ' + err);
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
                        //console.log('Data coming from service --> ' + JSON.stringify(body));
                        if (resObj) {
                            resObj.send(body);
                        }
                    });
            }
        }
    });
}


function sendpushnotification_fcm(resObj, gcmToken, BeaconID, notification_user_id, MobileNo, title, messagebody, image_url) {
    if (!image_url) {
        image_url = '';
    }

    async.waterfall([
        function(callback) {

            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                registration_ids: gcmToken,

                data: {
                    'message': messagebody,
                    'notification_user_id': notification_user_id,
                    'badge': 1,
                    'title': title,
                    'BeaconID': BeaconID,
                    //'img_url': 'https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300',
                    'img_url': image_url,
                    'notification_type': 7,
                }
            };

            fcm.send(message, function(err, response) {
                if (err) {
                    //console.log("Something has gone wrong!");
                } else {
                    if (typeof(response) != 'undefined') {
                        try {
                            var request = require('request');
                            var gcmdata = JSON.stringify(gcmToken);
                            request.post(lotusURL + 'employee/get_notification_entry', {
                                    form: {
                                        'android_device_token': gcmdata,
                                        'notification_user_id': notification_user_id,
                                        'mobile_no': MobileNo,
                                        'title': title,
                                        'BeaconID': BeaconID,
                                        'message': messagebody,
                                        //  'notification_img': image_url,
                                        'notification_type': 7,
                                    }
                                },
                                function(res2, err, body) {
                                    //console.log('Data coming from service --> ' + JSON.stringify(body));
                                    if (resObj) {
                                        resObj.send(body);
                                    }
                                });
                        } catch (err) { console.dir(err.message) }
                    }
                }
            });

        },


    ]);
}




var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
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
            //console.log(err);
            return res.end("Error uploading file.");
        }
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
            //console.log(body);
        })
    res.send();
});

/*User Services start*/
app.post('/getUserdata', function(req, res) {
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
                collection.find({ "UserType": 2 }).toArray(function(err, users) { //{ "UserType": 2 } changed by arpit
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
                collection.find({
                    "UserType": { "$in": [1, 2, 3, 4] }, //changed by Arpit

                }).toArray(function(err, users) {
                    var cnt = users.length;
                    for (var u in users) {
                        if (users[u].UserID == UserID) {
                            resObj.IsSuccess = false;
                            resObj.message = "This ID Already Exists in the Portal";
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
                //console.log('User inserted');

                callback(null, 'inserted');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Manager has been Added Successfully";
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
                            resObj.message = "This ID Already Exists in the Portal";
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

                callback(null, 'updated');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Manager has been Updated Successfully";
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
    var resObj = {};
    var adminid = '';
    user = req.session.loggedInUser;

    if (!user) {
        res.redirect('/');
        return;
    }

    var adminid = user._id;

    //console.log("Logging out user.");

    req.session.destroy(function() {
        var request = require('request');
        request.post(lotusURL + 'employee/beacon_logout_service', {
                form: {
                    'id': adminid
                }
            },
            function(res2, err, body) {

            });
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
                        "UserType": { "$in": [3, 5] },
                    }
                } else {
                    dataParam = {
                        "UserID": username,
                        "UserType": { "$in": [1, 2, 4] },
                    }
                }

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

                    if (users && users.length > 0 && users[0].hasOwnProperty('section_docs') && users[0].section_docs.length > 0) {
                        //console.log(users[0].section_docs);
                        SectionName = users[0].section_docs[0].SectionName;
                        resObj.SectionName = SectionName;
                    }

                    if (isCallingFromApp) {
                        var devicetoken = req.body.devicetoken;
                        collection.updateMany({
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
                    var PostReq = {
                        'UserID': userRecord.UserID,
                        'Email': userRecord.Email,
                        'Name': userRecord.Name,
                        'UserType': userRecord.UserType,
                        'AssignedStore': userRecord.AssignedStore.toString(),
                        'id': userRecord._id.toString()
                    };

                    request.post(lotusURL + 'employee/beacon_login_service', {
                            form: PostReq
                        },
                        function(res2, err, body) {
                            crmToken = parse_JSON(body);
                            crmToken = crmToken.data;
                            if (crmToken && resObj.user) {
                                resObj.user.crmToken = crmToken;
                                req.session.loggedInUser = resObj.user;
                            }

                            res.send(resObj);
                            db.close();
                        })
                } else {
                    callback(null, userRecord);
                }
            },
            function(user, callback) {
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
                            beacons1.push(beacons[b]);
                        }
                        resObj.beacons = beacons;
                        callback(null, resObj);
                    });
                } else {
                    callback(null, resObj);
                }
            },
            function(result, callback) {
                db.close();
                res.send(resObj);
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
                });
            },
            function(storelist, callback) {
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
                            resObj.message = "This ID Already Exists in the Portal";
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
                //console.log('Employee inserted');

                callback(null, 'inserted');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Employee has been Added Successfully";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });

});




/*Section Services start*/
app.post('/getsectiondata', function(req, res) {

    var resObj = {};

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

    if (!(SectionName)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter appropriate informations";
        res.send(resObj);
        return;
    }

    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Please assign any store";
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
                collection.find({
                    'SectionName': SectionName,
                    AssignedStore: ObjectId(AssignedStore)
                }).toArray(function(err, sections) {
                    var cnt = sections.length;
                    if (sections.length > 0) {
                        resObj.IsSuccess = false;
                        resObj.message = "Section already exists";
                        res.send(resObj);
                        return;
                    } else {
                        callback(null, sections);
                    }
                });
            },
            function(sections, callback) {
                collection.insert({
                    'SectionName': SectionName,
                    'SectionDesc': SectionDesc,
                    'AssignedStore': ObjectId(AssignedStore),
                    'BeaconID': selectedBeacon,

                }, function(err, records) {
                    SectionID = records.ops[0]._id;
                    callback(null, 'inserted');
                    //console.log('Section inserted');
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



                //console.log('Section Beacon inserted');
                callback(null, 'rec');

            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Section has been Added Successfully";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });

});


app.post('/updateEmployee', function(req, res) {
    UserID = req.body.UserID;
    //ResetPassword = req.body.ResetPassword;
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
                            resObj.message = "This ID Already Exists in the Portal";
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
                /*//console.log(ResetPassword);
                //console.log(hashedpassword);*/
                if (Password) {
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
                    //console.log(ObjectId(UserObjectID));
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

                callback(null, 'updated');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Employee Details has been Updated Successfully";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});



app.post('/getEmployeeDetails', function(req, res) {
    EmployeeID = req.body.EmployeeID;

    //console.log('Employee Details Called -----=========');

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
                collection.find(ObjectId(EmployeeID)).toArray(function(err, devices) {
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
                    ID = users[0].UserID;
                    var dbpassword = users[0].Password;

                    var isPasswordMatch = passwordHash.verify(Password, dbpassword);
                    resObj.users = users;
                    // //console.log(resObj);

                    if (ID == UserID && isPasswordMatch == 'true') {
                        resObj.IsSuccess = true;
                        resObj.message = "success";
                        resObj.data = users;
                        //console.log(resObj);
                        res.send(resObj);

                    } else {
                        resObj.IsSuccess = false;
                        resObj.message = "Customer executive not found";
                        res.send(resObj);
                    }
                    db.close();

                });
            },


        ]);
    });
});


app.post('/addCustomer', function(req, res) {
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
        resObj.message = "Please Select Store";
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
                            resObj.message = "This ID Already Exists in the Portal";
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

                callback(null, 'inserted');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "CRM User has been Added Successfully";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});

app.post('/getEmployeedata', function(req, res) {
    var resObj = {};

    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    UserStore = getUserAllotedStore(req);

    //if (req.session.loggedInUser.UserType == 2) {
    if (req.session.loggedInUser.UserType != 1 && !UserStore) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    StoreID = req.body.StoreID;
    SectionID = req.body.SectionID;

    var userMatchExp = {};
    if (req.session.loggedInUser.UserType == 2) {
        userMatchExp = {
            'UserType': 3,
            'AssignedStore': ObjectId(UserStore)
        };
    } else {
        userMatchExp = {
            'UserType': 3
        };

        if (StoreID && Number(StoreID) != -1) {
            userMatchExp.AssignedStore = ObjectId(StoreID);
        }
    }

    if (SectionID && Number(SectionID) != -1) {
        userMatchExp.AssignedSection = ObjectId(SectionID);
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var usercollection = db.collection('users');
                usercollection.aggregate([{
                    $match: userMatchExp
                }, {
                    $lookup: {
                        from: 'stores',
                        localField: 'AssignedStore',
                        foreignField: '_id',
                        as: 'store_docs'

                    }
                }, {
                    $lookup: {
                        from: 'sections',
                        localField: 'AssignedSection',
                        foreignField: '_id',
                        as: 'section_docs'

                    }
                }]).toArray(function(err, users) {
                    var userlist = [];
                    if (users && users.length > 0) {
                        for (var u in users) {
                            if (users[u].store_docs.length > 0) {
                                users[u].StoreName = users[u].store_docs[0].StoreName;
                            } else {
                                users[u].StoreName = '';
                            }

                            if (users[u].section_docs.length > 0) {
                                users[u].SectionName = users[u].section_docs[0].SectionName;
                            } else {
                                users[u].SectionName = '';
                            }

                            users[u].searchfield =
                                users[u].Name + ' ' + users[u].UserID + ' ' + users[u].Designation + ' ' + users[u].StoreName + ' ' + users[u].SectionName;


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


app.post('/deleteEmployee', function(req, res) {
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

        async.waterfall([
            function(callback) {
                collection.find({
                    '_id': ObjectId(UserObjectID)

                }).toArray(function(err, users) {
                    if (users[0].devicetoken != '') {
                        var token = '';
                        var token = users[0].devicetoken;
                        var notifymessage = 'Your account is temporarily closed. Please contact to your store manager';
                        var notificationtype = '8';
                        var title = 'Account Closed';
                        var image_url = '';
                        pushnotification_fcm_common(null, [token], UserObjectID, '', title, notifymessage, notificationtype, image_url);
                    }
                    callback(null, users);
                });
                console.log('ali');
            },

            function(response, callback) {
                collection.deleteMany({
                    '_id': ObjectId(UserObjectID),
                    'UserType': 3
                });

                resObj.IsSuccess = true;
                resObj.message = "Employee has been Deleted Successfully";
                res.send(resObj);

                db.close();
            }
        ]);

    });
});


app.post('/getCrmData', function(req, res) {
    var resObj = {};

    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    UserStore = getUserAllotedStore(req);

    //if (req.session.loggedInUser.UserType == 2) {
    if (req.session.loggedInUser.UserType != 1 && !UserStore) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var crmMatchExp = {};
        if (req.session.loggedInUser.UserType == 2) {
            crmMatchExp = {
                'UserType': 4,
                'AssignedStore': ObjectId(UserStore)
            };
        } else {
            crmMatchExp = {
                'UserType': 4
            };
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
                collection.find(crmMatchExp).toArray(function(err, users) {
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
        resObj.message = "CRM User has been Deleted Successfully";
        res.send(resObj);

        db.close();

    });
});


app.post('/getallsections', function(req, res) {
    pUserObjectID = req.body.pUserObjectID;

    var resObj = {};

    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    UserStore = getUserAllotedStore(req);

    //if (req.session.loggedInUser.UserType == 2) {
    if (req.session.loggedInUser.UserType != 1 && !UserStore) {
        resObj.IsSuccess = false;
        resObj.message = "You are not accessible to use this feature. Please contact to your administrator";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var sectionMatchExp = {};
        if (req.session.loggedInUser.UserType != 1) {
            sectionMatchExp = {
                'AssignedStore': ObjectId(UserStore)
            };
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

                collection.find(sectionMatchExp).toArray(function(err, sections) {
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
                            resObj.message = "This ID Already Exists in the Portal";
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
                //console.log(userdata);
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
                if (Password) {
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
                    //console.log(ObjectId(UserObjectID));
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

                callback(null, 'updated');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "CRM User has been Updated Successfully";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });


});




app.post('/deleteSection', function(req, res) {
    UserObjectID = req.body.UserObjectID;

    //console.log(UserObjectID);
    //console.log('==============Delete Section Called============');

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
        var usercollection = db.collection('users');
        var beaconcollection = db.collection('beacons');

        async.waterfall([
            function(callback) {

                usercollection.aggregate([{
                    $match: {
                        'AssignedSection': ObjectId(UserObjectID)
                    }
                }, {
                    $lookup: {
                        'from': "sections",
                        'localField': "AssignedSection",
                        'foreignField': "_id",
                        'as': "sections"
                    }
                }]).toArray(function(err, users) {

                    var token = '';
                    for (var user in users) {
                        if (!user.devicetoken) {
                            continue;
                        }

                        if (user.sections && user.sections.length > 0) {
                            var token = user.devicetoken;
                            var notifymessage = 'We are closing ' + user.sections.SectionName + ' for now. Please contact to your store manager';
                            var notificationtype = '9';
                            var title = 'Section Deleted';
                            var image_url = '';
                            pushnotification_fcm_common(null, [token], UserObjectID, '', title, notifymessage, notificationtype, image_url);

                        }
                    }
                    callback(null, users);

                });
            },
            function(users, callback) {
                usercollection.updateMany({
                        'AssignedSection': ObjectId(UserObjectID)

                    }, {
                        '$unset': {
                            'AssignedSection': 1,
                        }
                    }, {
                        multi: true
                    },
                    function(err, result) {
                        if (err) {
                            throw err;
                        } else {

                        }
                    }
                );
                callback(null, 'beacons');
            },
            function(beacons, callback) {
                beaconcollection.updateMany({
                        'BeaconSection': ObjectId(UserObjectID)
                    }, {
                        '$unset': {
                            'BeaconSection': 1,
                        }
                    }, {
                        multi: true
                    },
                    function(err, result) {
                        if (err) {
                            throw err;
                        } else {

                        }
                    }
                );
                callback(null, 'sections');
            },
            function(sections, callback) {
                collection.deleteMany({
                    '_id': ObjectId(UserObjectID),
                });
                resObj.IsSuccess = true;
                resObj.message = "Section has been Deleted Successfully";
                res.send(resObj);

                db.close();
            }

        ]);

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


    //console.log('===================update Section called=============================');
    UserObjectID = req.body.UserObjectID;

    AssignedStore = req.body.AssignedStore;

    SectionName = req.body.SectionName;
    SectionDesc = req.body.SectionDesc;
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

                callback(null, 'updated');
            },
            function(updated, callback) {
                sectionbeacon.updateMany({
                        'BeaconSection': ObjectId(UserObjectID)
                    }, {
                        '$unset': {
                            'BeaconSection': 1,
                        }
                    }, {
                        multi: true
                    },
                    function(err, result) {
                        if (err) {
                            throw err;
                        } else {

                        }
                    }
                );

                //console.log('Section Beacon Updated');
                callback(null, 'removed');

            },
            function(update, callback) {
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
                callback(null, 'rec');

            },
            function(response, callback) {
                resObj.IsSuccess = true;
                resObj.message = "Section has been Updated Successfully";
                res.send(resObj);
                db.close();
            }
        ]);
    });
});

// Get Employee Data For PHP through curl in CRM module
app.post('/getCrmEmployee', function(req, res) {

    var UserType = req.body.UserType;
    var AssignedStore = req.body.AssignedStore;
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
                    'UserType': Number(UserType),
                    'AssignedStore': ObjectId(AssignedStore),

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

// Get Employee List For Admin
app.post('/getCrmEmployeeListByAdmin', function(req, res) {
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
                    'UserType': Number(UserType)
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
    GeoFancingRange = req.body.GeoFancingRange;
    MinStayTimeOfCustomerForEmployee = req.body.MinStayTimeOfCustomerForEmployee;
    CustomerWelcomeMessage = req.body.CustomerWelcomeMessage;
    EmployeeCustomerIntimation = req.body.EmployeeCustomerIntimation;

    var resObj = {};
    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    if (req.session.loggedInUser.UserType != 1) {
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
                collection.update({}, {
                    '$set': {
                        'GeoFancingRange': GeoFancingRange,
                        'MinStayTimeOfCustomerForEmployee': MinStayTimeOfCustomerForEmployee,
                        'CustomerWelcomeMessage': CustomerWelcomeMessage,
                        'EmployeeCustomerIntimation': EmployeeCustomerIntimation
                    }
                });

                settings_StayTime = MinStayTimeOfCustomerForEmployee;
	            settings_welcomeMessage = CustomerWelcomeMessage;
	            settings_EmpCustIntimate = EmployeeCustomerIntimation;

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

app.post('/getuserdataByUserType', function(req, res) {
    var UserType = req.body.UserType;
    var resObj = {};

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('users');

        async.waterfall([
            function(callback) {

                collection.find({
                    'UserType': Number(UserType)
                }).toArray(function(err, users) {
                    callback(null, users);
                });
            },
            function(userdata, callback) {
                if (userdata && userdata.length > 0) {
                    resObj.IsSuccess = true;
                    resObj.message = "success";
                    resObj.data = userdata;
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




app.post('/getmanagerByStoreID', function(req, res) {

    var AssignedStore = req.body.AssignedStore;
    var resObj = {};
    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid Store selected";
        res.send(resObj);
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
                    'UserType': 2,
                    'AssignedStore': ObjectId(AssignedStore)
                }).toArray(function(err, users) {
                    callback(null, users);
                });
            },
            function(userdata, callback) {

                if (userdata && userdata.length > 0) {
                    resObj.IsSuccess = true;
                    resObj.message = "success";
                    resObj.data = userdata;
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "No Record Found";
                }

                res.send(resObj);
                db.close();

            }
        ]);
    });
});

/// GET section available according to store only new API 15.04.2017


/*Section Services start*/
app.post('/getsectionInStore', function(req, res) {
    var resObj = {};

    var AssignedStore = req.body.AssignedStore;

    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid Store selected";
        res.send(resObj);
        return resObj;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var devicelist = new Array();
        var collection = db.collection('sections');
        collectionRows = {};
        if (Number(AssignedStore) == -1) {
            collectionRows = collection.find()
        } else {
            collectionRows = collection.find({
                'AssignedStore': ObjectId(AssignedStore)
            })
        }
        collectionRows.toArray(function(err, sections) {
            //console.log(sections);
            if (sections && sections.length > 0) {

                for (var dvc in sections) {
                    devicelist.push(sections[dvc]);
                }

                resObj.IsSuccess = true;
                resObj.message = "Success";
                resObj.data = devicelist;
                res.send(resObj);
            } else {
                resObj.IsSuccess = false;
                resObj.message = "No record found.";
                resObj.data = '';
                res.send(resObj.data);
            }
            db.close();
        })
    });
});


app.post('/EmployeeOfficialNotification', function(req, res) {

    var resObj = {};

    var gcmToken = req.body.gcmTokens;
    var notification_user_id = req.body.notification_user_id;

    var MobileNo = '';

    var title = req.body.title;
    var messagebody = req.body.description;
    var notificationtype = '10';
    var image_url = req.body.image_url;


    pushnotification_fcm_common(res, gcmToken, notification_user_id, MobileNo, title, messagebody, notificationtype, image_url);

});


function pushnotification_fcm_common(resObj, gcmToken, notification_user_id, MobileNo, title, messagebody, notificationtype, image_url) {

    if (!image_url) {
        image_url = '';
    }

    async.waterfall([
        function(callback) {

            var request = require('request');
            var uJSON = JSON.stringify(notification_user_id);

            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                registration_ids: gcmToken,

                data: {
                    'message': messagebody,
                    'notification_user_id': uJSON, //notification_user_id,
                    'badge': 1,
                    'title': title,
                    //'img_url': 'https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300',
                    'img_url': image_url,
                    'notification_type': notificationtype,
                }
            };

            fcm.send(message, function(err, response) {
                if (err) {
                    //console.log("Something has gone wrong!");
                    //console.dir(err);
                } else {
                    if (response != 'undefined') {
                        try {
                            var request = require('request');
                            var gcmdata = JSON.stringify(gcmToken);

                            var userJSON = JSON.stringify(notification_user_id);
                            request.post(lotusURL + 'employee/get_notification_entry', {

                                    form: {
                                        'android_device_token': gcmdata,
                                        'notification_user_id': userJSON, //notification_user_id,
                                        //'mobile_no': MobileNo,
                                        'title': title,
                                        'message': messagebody,
                                        //  'notification_img': image_url,
                                        'notification_type': notificationtype,

                                    }

                                },
                                function(res2, err, body) {
                                    //console.log('Data coming from service --> ' + JSON.stringify(body));
                                    if (resObj) {
                                        resObj.send(body);
                                    }
                                });
                        } catch (err) { console.dir(err.message) }
                    }
                }
            })
        }
    ]);
}

//Get Empoloyee details By Department Manager
app.post('/getEmployeeDetailsByDeptManager', function(req, res) {
    var DepartmentID = req.body.DepartmentID;

    var resObj = {};

    if (!DepartmentID) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid Department selected";
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
                collection.find(ObjectId(DepartmentID)).toArray(function(err, devices) {
                    callback(null, devices);
                });

            },
            function(devices, callback) {
                if (devices && devices.length > 0) {
                    var assignedEmployee = devices[0].AssignedEmployee;
                    var employeecollection = [];
                    if (assignedEmployee && assignedEmployee.length > 0) {
                        for (var b in assignedEmployee) {
                            employeecollection.push(ObjectId(assignedEmployee[b]));
                        }
                    }

                    var emplist = collection.find({
                        '_id': {
                            $in: employeecollection
                        }
                    }).toArray(function(err, employeelist) {
                        callback(null, employeelist);
                    });
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "Employee not found";
                    callback(null, false);
                }
            },
            function(workdone, callback) {
                resObj.IsSuccess = true;
                resObj.data = workdone;
                res.send(resObj);
                db.close();
            }
        ]);
    });
});


app.post('/getEmployeeByStoreSectionUserType', function(req, res) {
    var AssignedStore = req.body.AssignedStore;
    var AssignedSection = req.body.AssignedSection;
    var UserType = req.body.UserType;

    var resObj = {};
    if (!AssignedStore) {
        resObj.IsSuccess = false;
        resObj.message = "Invalid Store selected";
        res.send(resObj);
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
                    'UserType': Number(UserType),
                    'AssignedStore': ObjectId(AssignedStore),
                    'AssignedSection': ObjectId(AssignedSection)
                }).toArray(function(err, users) {
                    callback(null, users);
                });
            },
            function(userdata, callback) {

                if (userdata && userdata.length > 0) {
                    resObj.IsSuccess = true;
                    resObj.message = "success";
                    resObj.data = userdata;
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "No Record Found";
                }
                res.send(resObj);
                db.close();

            }
        ]);
    });
});


//Add Department Manager
app.post('/addDeptManager', function(req, res) {
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
                            resObj.message = "This ID Already Exists in the Portal";
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
                    'AssignedSection': AssignedSection,
                    'UserType': 5,
                });

                callback(null, 'inserted');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Department Manager has been Added Successfully";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });

});


// Update Department Manage
app.post('/updateDeptManager', function(req, res) {
    UserID = req.body.UserID;
    Password = req.body.Password;
    Name = req.body.Name;
    Designation = req.body.Designation;
    AssignedStore = req.body.AssignedStore;
    AssignedEmployee = req.body.AssignedEmployee;
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
                collection.find({
                    '_id': { $ne: ObjectId(UserObjectID) }
                }).toArray(function(err, users) {
                    var cnt = users.length;
                    for (var u in users) {
                        if (users[u].UserID == UserID) {
                            resObj.IsSuccess = false;
                            resObj.message = "This ID Already Exists in the Portal";
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
                if (Password) {
                    collection.update({
                        '_id': ObjectId(UserObjectID)
                    }, {
                        '$set': {
                            'UserID': UserID,
                            'Name': Name,
                            'Password': hashedpassword,
                            'AssignedStore': ObjectId(AssignedStore),
                            'AssignedEmployee': AssignedEmployee,
                            'Designation': Designation
                        }
                    });
                } else {
                    collection.update({
                        '_id': ObjectId(UserObjectID)
                    }, {
                        '$set': {
                            'UserID': UserID,
                            'Name': Name,
                            'AssignedStore': ObjectId(AssignedStore),
                            'AssignedEmployee': AssignedEmployee,
                            'Designation': Designation,
                        }
                    });
                }

                callback(null, 'updated');
            },
            function(response, callback) {
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "Department Manager has been Updated Successfully";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});


app.post('/getDeptManagerData', function(req, res) {
    var resObj = {};

    if (!req.session.loggedInUser) {
        resObj.IsSuccess = false;
        resObj.message = loginexpiredmessage;
        resObj.data = '';
        res.send(resObj);
        return;
    }

    UserStore = getUserAllotedStore(req);

    if (req.session.loggedInUser.UserType != 1 && !UserStore) {
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
                var usercollection = db.collection('users');

                var hodMatchExp = {};
                if (req.session.loggedInUser.UserType == 2) {
                    hodMatchExp = {
                        'UserType': 5,
                        'AssignedStore': ObjectId(UserStore)
                    };
                } else {
                    hodMatchExp = {
                        'UserType': 5
                    };
                }

                usercollection.aggregate([{
                    $match: hodMatchExp
                }, {
                    $lookup: {
                        from: 'stores',
                        localField: 'AssignedStore',
                        foreignField: '_id',
                        as: 'store_docs'

                    }
                }]).toArray(function(err, users) {
                    var userlist = [];
                    if (users && users.length > 0) {
                        for (var u in users) {
                            if (users[u].store_docs.length > 0) {
                                users[u].StoreName = users[u].store_docs[0].StoreName;
                            } else {
                                users[u].StoreName = '';
                            }

                            users[u].searchfield =
                                users[u].Name + ' ' + users[u].UserID + ' ' + users[u].Designation + ' ' + users[u].StoreName;


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

app.post('/deleteDepartmentManager', function(req, res) {
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

        async.waterfall([
            function(callback) {
                collection.find({
                    '_id': ObjectId(UserObjectID)
                }).toArray(function(err, users) {
                    if (users[0].devicetoken != '') {
                        var token = '';
                        var token = users[0].devicetoken;
                        var notifymessage = 'Your account is temporarily closed. Please contact to your store manager';
                        var notificationtype = '8';
                        var title = 'Account Closed';
                        var image_url = '';
                        pushnotification_fcm_common(null, [token], UserObjectID, '', title, notifymessage, notificationtype, image_url);
                    }
                    callback(null, users);
                });
            },
            function(response, callback) {
                collection.deleteMany({
                    '_id': ObjectId(UserObjectID),
                    'UserType': 5
                });
                resObj.IsSuccess = true;
                resObj.message = "Department Manager has been Deleted Successfully";
                res.send(resObj);

                db.close();
            }
        ]);

    });
});


/*
For testing device

setInterval(function() {
  updateDevice("00:A0:50:B3:77:55", "APA91bF0j98Bz5WukCB19k9rxY8-rp781qxFPqYThyDSo580UYQJY7th7frwhtkV1XxhX3pkqU7KVpH-EJzJC_g75026pt6IeTCPDcp6JP2eZvARD33i8EU", "2.5", "9993001001", "Sachin Karnik", null);
}, 5000);*/
