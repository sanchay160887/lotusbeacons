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
var gcm = require('android-gcm');
var request = require('request');
querystring = require('querystring');
require('timers');
var devicecron = require('node-cron');

var mongourl = 'mongodb://lotus:remote@ds161255.mlab.com:61255/lotusbeacon';
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

/*var server = app.listen(3000);
server.listen(process.env.PORT || 3000, function() {
    console.log("Socket started");
});*/


app.use('/', express.static(__dirname + '/angular/'));

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

var server = app.listen(process.env.PORT || 3000, function() {
    console.log("App started with Mongodb");
});

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


/* General Supportive Function start -->> */
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
    console.log('Beacon ID ' + BeaconID);
    console.log('Device ID ' + DeviceID);
    console.log('Distance ' + Distance);
    console.log('Mobile No ' + MobileNo);
    var BeaconStoreID = '';

    var resObjVal = {};
    if (!(DeviceID && Distance)) {
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
                    'message': 'Data inserted successfully'
                });
                console.log('coming to last callback');
                db.close();
                if (resObj) {
                    resObj.send();
                }
                callback(null, response);
            }
        ]);
    });
}


function updateDeviceHistory(BeaconID, DeviceID, MobileNo, resObj) {
    console.log('------------Updating device History--------------');
    console.log('Beacon ID ' + BeaconID);
    console.log('Device ID ' + DeviceID);
    console.log('Mobile No ' + MobileNo);
    console.log('------------Updating device History--------------');
    var resObjVal = {};
    if (!(BeaconID && DeviceID && MobileNo)) {
        return;
    }

    var BeaconStore = '';

    todaysdate = getCurrentTime();
    seldate = new Date(todaysdate);
    datestring = seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate();
    fromDate = new Date(datestring).getTime();
    toDate = new Date(datestring + ' 23:59:59').getTime();

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
                if (!(devicelist && devicelist.length > 0)) {
                    if (typeof(beacons[0].BeaconWelcome) != 'undefined' && beacons[0].BeaconWelcome) {
                        sendpushnotification('', [DeviceID], 'Greetings from Lotus Electronics. Look out for latest deals for the products you are shopping for');
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
                    'message': 'Data updated successfully'
                });
                console.log('coming to last callback');
                db.close();
                if (resObj) {
                    resObjVal.data = 'History updated upto last callback';
                    resObj.send(resObjVal);
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
        //sendDevices();
    });

});

app.post('/user/loggedinUser', function(req, res) {
    var resObj = {};
    if (req.session.loggedInUser) {
        var userObjLocal = {};
        userObjLocal.userid = 101;
        userObjLocal.firstname = 'admin';

        resObj.user = userObjLocal;
        resObj.isSuccess = true;
        res.send(resObj);
    } else {
        resObj.isSuccess = false;
        res.send(resObj);
    }
});

app.post('/user/login', function(req, res) {
    var resObj = {};

    if (req.body.username == 'admin' && req.body.password == 'remote@123') {
        req.session.loggedInUser
        resObj.message = "Successfully loggedin!"
        resObj.isSuccess = true;
        user.password = '';
        var userObjLocal = {};

        userObjLocal.userid = 101;
        userObjLocal.firstname = 'admin';

        resObj.user = userObjLocal;
        req.session.loggedInUser = userObjLocal;
    } else {
        req.session.loggedInUser = null;
        resObj.message = "Invalid password"
        resObj.isSuccess = false;
    }

    res.send(resObj);
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

app.post('/updateDeviceHistory', function(req, res) {
    console.log('service calling');
    updateDeviceHistory(req.body.BeaconID, req.body.DeviceID, req.body.MobileNo, res);
});


function beaconDisconnect(BeaconID, DeviceID, MobileNo) {
    console.log('-------------------Beacon disconnected------------- ')

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

                collection.find({
                    /*"MobileNo": MobileNo,*/
                    "DeviceID" : DeviceID,
                }).toArray(function(err, devices) {
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
            if (devicelist && devicelist.length > 0){
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

app.post('/getdata', function(req, res) {
    console.log(JSON.stringify(req.body));
    BeaconID = req.body.BeaconID;
    StoreID = req.body.StoreID;

    console.log('Beacon Parameter on start');
    console.log(BeaconID);
    console.log('Store Parameter on start');
    console.log(StoreID);

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
                } else if (StoreID) {
                    console.log('coming to store');
                    beaconcollection = collection.find({
                        'BeaconStore': ObjectId(StoreID)
                    });
                } else {
                    beaconcollection = collection.find();
                }

                beaconcollection.toArray(function(err, beacons) {
                    var beaconslist = [];
                    for (var b in beacons) {
                        beaconslist[beacons[b].BeaconID] = beacons[b].BeaconKey;
                    }

                    callback(null, beaconslist);
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
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            devicelist.push(devices[dvc]);
                        }
                        callback(null, devicelist);
                    })
                } else {
                    collection.find().toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            devicelist.push(devices[dvc]);
                        }
                        callback(null, devicelist);
                    })
                }
            },
            function(devicelist, callback) {
                var devices = [];
                for (var d in devicelist) {
                    devices.push(devicelist[d].DeviceID);
                }
                var request = require('request');
                var data = JSON.stringify(devices);

                request.post('http://lampdemos.com/lotus15/v2/user/get_user_name', {
                        form: {
                            'android_device_token': data
                        }
                    },
                    function(res2, err, body) {
                        device_detail = [];
                        //var reqbody = JSON.parse(body);
                        var reqbody = parse_JSON(body);
                        if (reqbody) {
                            reqbody = reqbody.data;
                            for (var r in reqbody) {
                                if (reqbody[r] != false) {
                                    for (var d in devicelist) {
                                        if (devicelist[d].DeviceID == reqbody[r].device_token) {
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

                        res.send(devicelist);
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
    if (typeof(req.body.PageNo) != 'undefined' && req.body.PageNo){
        PageNo = req.body.PageNo;
    } else {
        PageNo = 1;
    }
    RecordsPerPage = 10;
    if (typeof(req.body.RecordsPerPage) != 'undefined' && req.body.RecordsPerPage){
        RecordsPerPage = req.body.RecordsPerPage;
    }

    recordsToSkip = Math.max((PageNo - 1) * RecordsPerPage, 0);

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
                    beaconcollection = [];
                }

                beaconcollection.toArray(function(err, beacons) {
                    var beaconslist = [];
                    for (var b in beacons) {
                        beaconslist[beacons[b].BeaconID] = beacons[b].BeaconKey;
                    }
                    callback(null, beaconslist);
                });
            },
            function(beaconlist, callback) {

                //var collection = db.collection('test_device_history');
                var collection = db.collection('device_history');
                var devicelist = new Array();

                var beacons = []
                for (var b in beaconlist) {
                    beacons.push(b);
                }
                console.log(beacons);

                if (beacons && beacons.length > 0) {
                    reccount = collection.aggregate(
                        [{
                            $match: {
                                'Date': {
                                    '$gte': fromDate,
                                    '$lte': toDate
                                },
                                'BeaconID': {
                                    $in: beacons,
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
                        callback(null, beacons);
                    })
                } else {
                    resObjVal.NoOfRecords = 0;
                    callback(null, []);
                }               
            },
            function(beacons, callback) {
                //var collection = db.collection('test_device_history');
                var collection = db.collection('device_history');
                var devicelist = new Array();

                if (beacons && beacons.length > 0) {
                    collection.aggregate(
                        [{
                            $match: {
                                'Date': {
                                    '$gte': fromDate,
                                    '$lte': toDate
                                },
                                'BeaconID': {
                                    $in: beacons,
                                }
                            }
                        }, {
                            $group: {
                                _id: { BeaconID: '$BeaconID', DeviceID: '$DeviceID' },
                                StayTime: { $sum: "$StayTime" }
                            }
                        }]
                    )
                    .skip(recordsToSkip)
                    .limit(RecordsPerPage)
                    .toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconID = devices[dvc]._id.BeaconID;
                            devices[dvc].BeaconKey = beacons[devices[dvc].BeaconID];
                            devices[dvc].DeviceID = devices[dvc]._id.DeviceID;
                            devices[dvc].StayTime = convertSecondsToStringTime(devices[dvc].StayTime);
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
                    devices.push(devicelist[d].DeviceID);
                }
                var request = require('request');
                var data = JSON.stringify(devices);

                request.post('http://lampdemos.com/lotus15/v2/user/get_user_name', {
                        form: {
                            'android_device_token': data
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
                                            if (devicelist[d].DeviceID == reqbody[r].device_token) {
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
    BeaconID = req.body.BeaconID;
    MobileNo = req.body.MobileNo;

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

        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                var beaconcollection = [];
                if (BeaconID && BeaconID.length > 0) {
                    beaconcollection = collection.find({'BeaconID' : BeaconID });
                }

                beaconcollection.toArray(function(err, beacons) {
                    var beaconslist = [];
                    for (var b in beacons) {
                        beaconslist[beacons[b].BeaconID] = beacons[b].BeaconKey;
                    }
                    callback(null, beaconslist);
                });
            },
            function(beaconlist, callback) {
                //var collection = db.collection('test_device_history');
                var collection = db.collection('device_history');
                var devicelist = new Array();

                var beacons = []
                for (var b in beaconlist) {
                    beacons.push(b);
                }

                console.log(beacons);

                if (beacons && beacons.length > 0) {
                    devicecollection = collection.find({
                        'BeaconID': BeaconID,
                        'MobileNo': MobileNo,
                        'Date': {
                            $gte: fromDate,
                            $lte: toDate,
                        }                        
                    }).toArray(function(err, devices) {
                        console.log(devices);
                        devicedetaillist = [];
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            if (typeof(devices[dvc].DateTo) == 'undefined' || !devices[dvc].DateTo){
                                devices[dvc].DateTo = devices[dvc].Date + (devices[dvc].StayTime * 1000);
                            }
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







/*Beacon Services start*/
app.post('/getbeacondata', function(req, res) {
    BeaconStore = req.body.BeaconStore;
    var resObj = {};
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var collection = db.collection('beacons');
        var devicelist = new Array();

        beaconcollection = '';
        if (BeaconStore) {
            beaconcollection = collection.find({
                'BeaconStore': ObjectId(BeaconStore)
            })
        } else {
            beaconcollection = collection.find();
        }

        beaconcollection.toArray(function(err, devices) {
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
        });
        db.close();
    });
});

app.post('/addbeacon', function(req, res) {
    BeaconID = req.body.BeaconID;
    BeaconKey = req.body.BeaconKey;
    BeaconWelcome = req.body.BeaconWelcome;
    BeaconDescr = req.body.BeaconDescr;
    BeaconStore = req.body.BeaconStore;
    var resObj = {};

    if (!(BeaconID && BeaconKey && BeaconStore)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter BeaconID and BeaconKey";
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
                    'BeaconKey': BeaconKey
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

    if (!(BeaconID && BeaconKey && BeaconStore)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter BeaconID and BeaconKey";
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

        var collection = db.collection('beacons');
        collection.update({
            'BeaconID': BeaconID
        }, {
            'BeaconID': BeaconID,
            'BeaconKey': BeaconKey,
            'BeaconWelcome': BeaconWelcome,
            'BeaconDescr': BeaconDescr,
            'BeaconStore': ObjectId(BeaconStore)
        });
        db.close();

        resObj.IsSuccess = true;
        resObj.message = "Beacon updated successfully.";
        res.send(resObj);

    });
});

app.post('/deletebeacon', function(req, res) {
    BeaconID = req.body.BeaconID;
    var resObj = {};

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
                collection.find({
                    'BeaconID': BeaconID
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
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var collection = db.collection('stores');
        var devicelist = new Array();
        collection.find().toArray(function(err, devices) {
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

    if (!StoreName) {
        console.log(StoreName);
        resObj.IsSuccess = false;
        resObj.message = "Please enter Store Name";
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

    if (!StoreName) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter proper Store name";
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
    var gcmObject = new gcm.AndroidGcm(GcmGoogleKey);

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


app.post('/sendpushnotification_image', function(req, res) {
    not_title = req.body.title;
    not_descr = req.body.description;
    not_image = req.body.image_url;
    not_device_token = req.body.gcmTokens;

    sendpushnotification(res, not_device_token, not_title, not_descr, not_image);
});

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

    //console.log(message);

    gcmObject.send(message, function(err, response) {
        //console.log(response);
        if (err) {
            console.log('Something went wrong :: ' + err);
        } else {
            console.log(response.success);
            if (response.success == '1') {
                var request = require('request');
                var gcmdata = JSON.stringify(gcmToken);
                request.post('http://lampdemos.com/lotus15/v2/user/get_notification_entry', {
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

var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './angular/images/notificationuploads/');
    },
    filename: function(req, file, callback) {
        extension = file.originalname.split('.')[1];
        callback(null, file.fieldname + '-' + Date.now() + '.' + extension);
    }
});

var upload = multer({
    storage: storage
}).single('userPhoto');

app.post('/api/photo', function(req, res) {
    upload(req, res, function(err) {
        if (err) {
            console.log(err);
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

    request.post('http://lampdemos.com/lotus15/v2/user/get_user_name', {
            form: {
                'android_device_token': data
            }
        },
        function(res, err, body) {
            console.log(body);
        })
    res.send();
});


app.post('/addUsers', function(req, res) {
    FirstName = req.body.FirstName;
    LastName = req.body.LastName;
    Email = req.body.Email;
    Password = req.body.Password;
    var resObj = {};

    if (!FirstName) {
        console.log(FirstName);
        resObj.IsSuccess = false;
        resObj.message = "Please enter First Name";
        res.send(resObj);
        return;
    }

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('Users');

        async.waterfall([
            function(callback) {
                collection.find({
                    'FirstName': FirstName
                }).toArray(function(err, Users) {
                    callback(null, Users);
                });

            },
            function(Users, callback) {
                if (stores && stores.length > 0) {
                    resObj.IsSuccess = false;
                    resObj.message = "First Name already exists";
                    res.send(resObj);
                    return;
                }

                collection.insert({
                    'FirstName': FirstName,
                    'LastName': LastName,
                    'Email': Email,
                    'Password': Password
                });
                console.log('User inserted');

                callback(null, 'inserted');
            },
            function(response, callback) {
                console.log('coming to last callback');
                db.close();
                resObj.IsSuccess = true;
                resObj.message = "User added successfully.";
                res.send(resObj);
                callback(null, response);
            }
        ]);
    });
});

app.post('/updateservice_for_updatingmobilenumberwithdeviceid', function(req, res) {
    console.log('service calling 2');
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('device_history');

        async.waterfall([
            function(callback) {
                collection.updateMany({
                    'MobileNo': null
                }, {
                    '$set': {
                        'MobileNo': '8982044994',
                    }
                });
                callback(null, 'process 1 finished');
            },
            function(data, callback) {
                var device_mobile = [];
                device_mobile.push(['APA91bFEQR18a30z05XYe6Mnx57Vu0JQrPJXDv_K9fZAyP3wxCDpu2cMdMmVOfskoH1zwp9-qK6ZZgCjXTp6kvbgrs2RW_g2cpBk-zMf8AxG7C5BmTZy-kI', '7389910451']);
                device_mobile.push(['APA91bE75bIjS5CAiGmOJiGRd7xAqHu-HJP1VmRWzw2gMT5M6KhJJ6UuHOO3vx0D0evwDhRlIgM62_iDQwlaI1NwCdoQMhbl2q_9F4BllqfKe00k1si389I', '9977112818']);
                device_mobile.push(['APA91bFXVEpJ2cOxTK1cA5mXwWWtw3yBW5f2UvgohFtRzDPFA7lCSdMTYkXZmTktCCkIy4Uv983CD69ZHUf7oolZGRNpWfBL75w2nTyE8sgT-l8KHGaXx-s', '9907777890']);
                device_mobile.push(['APA91bFXVEpJ2cOxTK1cA5mXwWWtw3yBW5f2UvgohFtRzDPFA7lCSdMTYkXZmTktCCkIy4Uv983CD69ZHUf7oolZGRNpWfBL75w2nTyE8sgT-l8KHGaXx-s', '9584010456']);
                device_mobile.push(['APA91bEUv2EwRtNYoXwg90m10jA6fdI1nMrZDCKYlEHcJ4LdfVzt8YVVFkhuMdaKPaQN5vSbbwZrjgoMOI3dHAd52jy8YPCQ428PfsJJUx7GKOqEt2Dc_zQ', '9584010456']);
                device_mobile.push(['APA91bGwYOTmTCYcS3F4L3n8HKrK0nJzNM-uJbIYFrdG6l7-49vJ2MHiXYNcpMMibY1ISU38-lLp8ONw3ZRPW2ioQdIAjMm5ycfMolCOSc6kM5S6NwMFu88', '9589220777']);
                device_mobile.push(['APA91bFdLNYG8v_ZI0OpxnY5RMekJdCcw4z43jy7P29Fg-DM1AdlUiYuFQctN780_vPRzYMJNPYMsJJ5k9G44s413OSAoXyW2kJ_C_ajZm4UCqL535LfKlg', '7389910439']);
                device_mobile.push(['APA91bG9ZbKEsBNvFaBuW4urIcUSDG7zLwxNFbHg04_XgeksZW3QXJOGlH8_3sGoqEW5Z-MtNnBbaY2JMw-NuLHS4zDszfd6wSvWkcsef2-tXSsokfDmGKE', '7389910438']);

                device_mobile.forEach(function(element) {
                    console.log('Device ID: ' + element[0]);
                    console.log('Mobile No: ' + element[1]);
                    collection.updateMany({
                        'DeviceID': element[0]
                    }, {
                        '$set': {
                            'MobileNo': element[1],
                        }
                    });
                });

                callback(null, 'process 2 finished');
            },
            function(data1, callback) {
                collection.deleteMany({
                    'MobileNo': '8982044994',
                });
                res.send('test');
                callback(null, 'process delete null finished');
            }
        ]);
    });
});

app.post('/testdevicehistory', function(req, res) {

    fromDate = 1483183628981;
    toDate = 1483193628981;
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        var collection = db.collection('device_history');
        devicecollection = collection.find(/*{
            'Date': {
                $gte: fromDate,
                $lte: toDate,
            }
        }*/).count(function(err, cnt) {
            console.log(cnt)
        })
    });
    res.send('');
});
