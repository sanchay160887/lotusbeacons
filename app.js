/*Node Modules*/
var express = require('express');

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
require('timers')
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

function sendDevices() {
    async.waterfall([

        function(callback) {
            MongoClient.connect(mongourl, function(err, db) {
                if (err) {
                    return console.dir(err);
                }

                var collection = db.collection('device');
                var devicelist = new Array();
                collection.find().toArray(function(err, devices) {
                    for (var dvc in devices) {
                        devicelist.push(devices[dvc]);
                    }
                    callback(null, devicelist);
                })
                db.close();
            });
        },
        function(devicelist, callback) {
            io.emit('showDevices', devicelist);
            callback(null, devicelist);
        }
    ]);
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function updateDevice(BeaconID, DeviceID, Distance, resObj) {
    console.log('Beacon ID ' + BeaconID);
    console.log('Device ID ' + DeviceID);
    console.log('Distance ' + Distance);

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
                }

                collection.find({
                    'DeviceID': DeviceID
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });

            },
            function(devicedata, callback) {
                if (devicedata && devicedata.length > 0 && BeaconID != '') {
                    collection.update({
                        'DeviceID': DeviceID
                    }, {
                        'BeaconID': BeaconID,
                        'DeviceID': DeviceID,
                        'Distance': Distance,
                        'connectiontime': getCurrentTime(),
                    });
                    console.log('Device updated');
                } else {
                    if (BeaconID != '') {
                        collection.insert({
                            'BeaconID': BeaconID,
                            'DeviceID': DeviceID,
                            'Distance': Distance,
                            'connectiontime': getCurrentTime(),
                        });
                        console.log('Device inserted');
                    }

                }
                callback(null, 'inserted');
            },
            function(response, callback) {
                io.emit('updateDevice_response', {
                    'IsSuccess': true,
                    'message': 'Data inserted successfully'
                });
                //sendDevices();
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

function getCurrentTime() {
    return new Date().getTime();
}

function updateDeviceHistory(BeaconID, DeviceID, StayTime, resObj) {
    console.log('------------Updating device History--------------');
    console.log('Beacon ID ' + BeaconID);
    console.log('Device ID ' + DeviceID);
    console.log('Stay Time ' + StayTime);
    console.log('------------Updating device History--------------');
    var resObjVal = {};
    if (!(BeaconID && DeviceID && StayTime)) {
        return;
    }

    var StayTime = convertStringTimeToSeconds(StayTime); // your input string

    console.log('Update device history called');

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('device_history');

        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                collection.find({
                    'BeaconID': BeaconID
                }).toArray(function(err, beacons) {
                    callback(null, beacons);
                });
            },
            function(beacons, callback) {
                if (!(beacons && beacons.length > 0)) {
                    if (typeof(resObj) != 'undefined') {
                        resObj.IsSuccess = false;
                        resObj.message = "Invalid Beacon ID";
                        res.send(resObj);
                    }
                    return;
                }

                currdate = getCurrentTime();

                fromDate = 0;
                seldate = new Date(currdate);
                SelectedDate = new Date(seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate()).toISOString();
                fromDate = new Date(SelectedDate).getTime();
                seldate = new Date(currdate);
                SelectedDate = new Date(seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate() + ' 23:59:59').toISOString();
                toDate = new Date(SelectedDate).getTime();
                collection.find({
                    'DeviceID': DeviceID,
                    'BeaconID': BeaconID,
                    'Date': {
                        $gte: fromDate,
                        $lte: toDate,
                    }
                }).toArray(function(err, devices) {
                    if (!(devices && devices.length > 0)) {
                        //if (typeof(beacons[0].BeaconWelcome) != 'undefined' && beacons[0].BeaconWelcome) {
                        sendpushnotification('', [DeviceID], beacons[0].BeaconKey +' ('+ beacons[0].BeaconID +') Greetings from Lotus Electronics. Look out for latest deals for the products you are shopping for');
                        //}
                    }
                    callback(null, devices);
                });
            },
            function(devicedata, callback) {
                if (devicedata && devicedata.length > 0) {
                    console.log(devicedata);
                    var oldstaytime = 0;
                    oldstaytime = parseInt(devicedata[0].StayTime);
                    if (!isNaN(oldstaytime)) {
                        oldstaytime = 0;
                    }

                    StayTime = oldstaytime + StayTime;
                    currdate = getCurrentTime();

                    fromDate = 0;
                    seldate = new Date(currdate);
                    SelectedDate = new Date(seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate());
                    fromDate = SelectedDate.getTime();
                    seldate = new Date(currdate);
                    SelectedDate = new Date(seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate() + ' 23:59:59');
                    toDate = SelectedDate.getTime();

                    collection.update({
                        'DeviceID': DeviceID,
                        'BeaconID': BeaconID,
                        'Date': {
                            $gte: fromDate,
                            $lte: toDate,
                        }
                    }, {
                        'BeaconID': BeaconID,
                        'DeviceID': DeviceID,
                        'StayTime': StayTime,
                        'Date': currdate,
                    });
                    console.log('Device History updated');
                } else {
                    collection.insert({
                        'BeaconID': BeaconID,
                        'DeviceID': DeviceID,
                        'StayTime': StayTime,
                        'Date': currdate,
                    });
                    console.log('Device History inserted');
                }
                callback(null, 'inserted');
            },
            function(response, callback) {
                io.emit('updateDeviceHistory_response', {
                    'IsSuccess': true,
                    'message': 'Data updated successfully'
                });
                //sendDevices();
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
        updateDevice(data.BeaconID, data.DeviceID, data.Distance);
        updateDeviceHistory(data.BeaconID, data.DeviceID, data.stayTime);
        sendDevices();
    });

    //setInterval(sendDevices, 5000);
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
    updateDevice(req.body.BeaconID, req.body.DeviceID, req.body.Distance, res);
    if (req.body.BeaconID) {
        var staytime = 0;
        if (req.body.stayTime) {
            staytime = req.body.stayTime;
        }
        updateDeviceHistory(req.body.BeaconID, req.body.DeviceID, staytime);
    }

});

app.post('/updateDeviceHistory', function(req, res) {
    console.log('service calling');
    updateDeviceHistory(req.body.BeaconID, req.body.DeviceID, req.body.stayTime, res);
});

app.post('/beaconConnected', function(req, res) {
    BeaconID = req.body.BeaconID;
    DeviceID = req.body.DeviceID;
    Distance = req.body.Distance;
    var resObj = {};

    MongoClient.connect(mongourl, function(err, db) {
        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                collection.find({
                    'BeaconID': BeaconID
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });
            },
            function(devices, callback) {
                if (devices && devices.length > 0) {
                    /*if (devices[0].BeaconKey == 'welcome') {
                        sendpushnotification('', [DeviceID], 'Welcome', 'Welcome to Lotus. Exciting offers are waiting for you..');
                    }*/
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "Invalid Beacon ID";
                    res.send(resObj);
                    return;
                }
                /*----------------Update Beacon ID------------------*/
                collection.find({ "DeviceID": DeviceID }).toArray(function(err, value) {

                    if (err) {
                        console.log(err);

                    } else {
                        if (value.BeaconID != BeaconID) {
                            //console.log(JSON.stringify(value));


                            collection.update({ 'BeaconID': BeaconID }, function(err, numUpdated) { // update by callback
                                if (err) {
                                    console.log(err);
                                } else if (numUpdated) {

                                    console.log('Updated Successfully %d document(s).', numUpdated);
                                } else {
                                    console.log('No document found with defined "find" criteria!');
                                }
                                //Close connection

                            });

                        }

                        //console.log(JSON.stringify(value));

                    }

                });


                /*--------------Update Beacon ID END --------------------*/

                updateDevice(BeaconID, DeviceID, Distance, res);
                if (req.body.BeaconID) {
                    var staytime = 0;
                    if (req.body.stayTime) {
                        staytime = req.body.stayTime;
                    }
                    updateDeviceHistory(BeaconID, DeviceID, staytime);
                }
            }
        ]);
    });
});

function beaconDisconnect(BeaconID, DeviceID) {
    console.log('-------------------Beacon disconnected------------- ')

    updateDevice(BeaconID, DeviceID, -1);

    setTimeout(function() {
        MongoClient.connect(mongourl, function(err, db) {
            if (err) {
                return console.dir(err);
            }
            assert.equal(null, err);

            var collection = db.collection('device');

            async.waterfall([
                function(callback) {
                    collection.find({
                        'DeviceID': DeviceID
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
                        io.emit('updateDevice_response', {
                            'IsSuccess': true,
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

app.post('/beaconDisconnected', function(req, res) {
    console.log('-------------------Beacon disconnected------------- ')
    BeaconID = req.body.BeaconID;
    DeviceID = req.body.DeviceID;
    beaconDisconnect(BeaconID, DeviceID);
});

//For testing purpose
//devicecron.schedule('*/5 * * * * *', function() {
/* MongoClient.connect(mongourl, function(err, db) {
     if (err) {
         return console.dir(err);
     }

     fromDate = 0;
     seldate = new Date();
     SelectedDate = new Date(seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate());
     fromDate = SelectedDate.getTime();
     seldate = new Date();
     SelectedDate = new Date(seldate.getFullYear() + '-' + (seldate.getMonth() + 1) + '-' + seldate.getDate() + ' 23:59:59');
     toDate = SelectedDate.getTime();

     console.log('=============from Date===============')
     console.log(fromDate);
     console.log('=============To Date=================')
     console.log(toDate);

     var collection = db.collection('device_history');
     var devicelist = new Array();
     collection.find({
         'DeviceID': 'APA91bFvaILdRXwqIopkKzByeFujzqHwsuNcsVZ8TSyO7GRGPzzMwISIpPjSO4xbzNffIiXX5TZL5ZQwLfjf46Hx7TDXcHi2hUXJzMb_4leR-IMvDPLP-9E',
         'BeaconID': '00:A0:50:0E:0F:23',
         'Date': {
             $gte: fromDate,
             $lte: toDate,
         }
     }).toArray(function(err, devices) {
         console.log(devices);
     });
     db.close();
 });*/

//});


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
                //console.log(outofrangelimit);
                collection.find({ "connectiontime": { "$lte": outofrangelimit } }).toArray(function(err, devices) {
                    for (var dvc in devices) {
                        devicelist.push(devices[dvc]);
                    }
                    callback(null, devicelist);
                })
                db.close();
            });
        },
        function(devicelist, callback) {
            //console.log(devicelist);
            if (devicelist.length > 0) {
                for (var dvc in devicelist) {
                    if (devicelist[dvc].Distance != "-1") {
                        beaconDisconnect(devicelist[dvc].BeaconID, devicelist[dvc].DeviceID);
                    }
                }
            }

            io.emit('showDevices', devicelist);
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
                    //beaconcollection = collection.find({'BeaconID' : BeaconID });
                    beaconcollection = collection.find({
                        'BeaconID': {
                            $in: BeaconID
                        }
                    });
                } else if (StoreID) {
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

                    console.log('Get Data Webservice');
                    console.log(beaconslist);
                    console.log('Beacon Parameter');
                    console.log(BeaconID);


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
                            $in: beacons
                        }
                    });
                    devicecollection.toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            devicelist.push(devices[dvc]);
                        }
                        //res.send(devicelist);
                        callback(null, devicelist);
                        return;
                    })
                } else {
                    collection.find().toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            devicelist.push(devices[dvc]);
                        }
                        //res.send(devicelist);
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
                        var reqbody = JSON.parse(body);
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

                        //console.log(devicelist);
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
    SelectedDate = req.body.Date;
    console.log('date:' + SelectedDate);

    fromDate = 0;
    toDate = 0;
    seldate = new Date(req.body.Date);
    SelectedDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate()+1) ).toISOString();
    fromDate = new Date(SelectedDate).getTime();
    SelectedDate = new Date(seldate.getFullYear() + '/' + (seldate.getMonth() + 1) + '/' + (seldate.getDate() +1) + ' 23:59:59').toISOString();
    toDate = new Date(SelectedDate).getTime();

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        async.waterfall([
            function(callback) {
                var collection = db.collection('beacons');
                var beaconcollection = [];
                if (BeaconID && BeaconID.length > 0) {
                    //beaconcollection = collection.find({'BeaconID' : BeaconID });
                    beaconcollection = collection.find({
                        'BeaconID': {
                            $in: BeaconID
                        }
                    });
                } else if (StoreID) {
                    //console.log('coming here');
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
                var collection = db.collection('device_history');
                var devicelist = new Array();

                var beacons = []
                for (var b in beaconlist) {
                    beacons.push(b);
                }

                if (beacons && beacons.length > 0) {
                    console.log(fromDate);
                    console.log('......')
                    console.log(toDate);
                    devicecollection = collection.find({
                        'BeaconID': {
                            $in: beacons,
                        },
                        'Date': {
                            $gte: fromDate,
                            $lte: toDate,
                        }
                    });
                    devicecollection.toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            devices[dvc].StayTime = convertSecondsToStringTime(devices[dvc].StayTime);
                            devicelist.push(devices[dvc]);
                        }
                        console.log('=================Device history 904===============');
                        console.log(devicelist);

                        //res.send(devicelist);
                        callback(null, devicelist);
                    })
                } else {
                    collection.find().toArray(function(err, devices) {
                        for (var dvc in devices) {
                            devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
                            devicelist.push(devices[dvc]);
                        }
                        console.log('=================Device history 916===============');
                        console.log(devicelist);
                        //res.send(devicelist);
                        callback(null, devicelist);
                    })
                }
            },
            function(devicelist, callback) {
                console.log(devicelist);
                var devices = [];
                for (var d in devicelist) {
                    devices.push(devicelist[d].DeviceID);
                }
                var request = require('request');
                var data = JSON.stringify(devices);

                console.log(data);

                request.post('http://lampdemos.com/lotus15/v2/user/get_user_name', {
                        form: {
                            'android_device_token': data
                        }
                    },
                    function(res2, err, body) {
                        device_detail = [];
                        var reqbody = JSON.parse(body);
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

                        //console.log(devicelist);
                        res.send(devicelist);
                        callback(null, devicelist);
                    })
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

        /*
        beaconcollection = collection.aggregate(
           { $lookup : { 
                "from": "stores", 
                "localField": "BeaconStore",
                "foreignField" : "_id",
                "as" : "stores_name"
            } })
        */
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
    //res.send();
});


app.post('/sendpushnotification_image', function(req, res) {
    not_title = req.body.title;
    not_descr = req.body.description;
    not_image = req.body.image_url;
    not_device_token = req.body.gcmTokens;

    sendpushnotification(res, not_device_token, not_title, not_descr, not_image);
    //res.send();
});

function sendpushnotification(resObj, gcmToken, title, messagebody, image_url) {
    var gcmObject = new gcm.AndroidGcm(GcmGoogleKey);
    if (!image_url) {
        image_url = '';
    }
    /*console.log(gcmToken);
    console.log(title);
    console.log(message);
    console.log(image_url);*/

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

    console.log(message);

    gcmObject.send(message, function(err, response) {
        console.log(response);
        if (err) {
            console.log('Something went wrong :: ' + err);
        } else {
            console.log(response.success);
            if (response.success == '1') {
                var request = require('request');
                var gcmdata = JSON.stringify(gcmToken);
                //console.log(gcmdata);
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

