/*Node Modules*/
var express = require('express');

var http = require('http'),
fs = require('fs'),
// NEVER use a Sync function except at start-up!
index = fs.readFileSync(__dirname + '/index.html');

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');
var async = require('async');
var gcm = require('node-gcm');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var GcmGoogleKey = 'AIzaSyAUxc6EwlgRP6MITCynw3_vsYatPI4iZuw';
var gcm = require('android-gcm');

var mongourl = 'mongodb://lotus:remote@ds161255.mlab.com:61255/lotusbeacon';
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


function updateDevice(BeaconID, DeviceID, Distance, resObj){
    /*console.log('Beacon ID ' + BeaconID);
    console.log('Device ID ' + DeviceID);
    console.log('Distance ' + Distance);*/

    var resObjVal = {};
    if (!(DeviceID && Distance)) {
        console.log('Invalid data passing');
        io.emit('updateDevice_response', {
            'IsSuccess': false,
            'message': 'Invalid data passing'
        });
        
        if (resObj){
            resObj.IsSuccess = false;
            resObj.message = "Invalid data passing";
            resObj.send(resObj);
        }
        return;
    }

    if (!isNumeric(Distance)){
        if (resObj){
            resObj.IsSuccess = false;
            resObj.message = "Distance should be in numbers";
            resObj.send(resObj);
        }
        return;
    }

    console.log('Update device called');
    
    var comingFromLatLong = false;
    if (!BeaconID){
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
                collection.find({
                    'DeviceID': DeviceID
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });
                
            },
            function(devicedata, callback){
                if (devicedata && devicedata.length > 0){
                    collection.update(
                        {'DeviceID': DeviceID},
                        {
                            'BeaconID': BeaconID,
                            'DeviceID': DeviceID,
                            'Distance': Distance
                        }
                    );
                    console.log('Device updated');
                } else {
                    collection.insert({
                        'BeaconID': BeaconID,
                        'DeviceID': DeviceID,
                        'Distance': Distance
                    });
                    console.log('Device inserted');
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
                if (resObj){
                    resObj.send();
                }                
                callback(null, response);
            }
        ]);        
    });
}

function updateDeviceHistory(BeaconID, DeviceID, StayTime){
    /*console.log('Beacon ID ' + BeaconID);
    console.log('Device ID ' + DeviceID);
    console.log('Stay Time ' + StayTime);*/

    var resObjVal = {};
    if (!(BeaconID && DeviceID && StayTime)) {
        return;
    }

    if (!isNumeric(StayTime)){
        return;
    }

    console.log('Update device history called');

    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('device_history');

        async.waterfall([
            function(callback) {
                collection.find({
                    'DeviceID': DeviceID,
					'BeaconID': BeaconID
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });
                
            },
            function(devicedata, callback){
                if (devicedata && devicedata.length > 0){
                    collection.update(
                        {'DeviceID': DeviceID, 'BeaconID': BeaconID},
                        {
                            'BeaconID': BeaconID,
                            'DeviceID': DeviceID,
                            'StayTime': StayTime
                        }
                    );
                    console.log('Device History updated');
                } else {
                    collection.insert({
                        'BeaconID': BeaconID,
						'DeviceID': DeviceID,
						'StayTime': StayTime
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
		updateDeviceHistory(data.BeaconID, data.DeviceID, data.StayTime);
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
});

app.post('/updateDeviceHistory', function(req, res) {
	updateDeviceHistory(req.body.BeaconID, req.body.DeviceID, req.body.StayTime);
});

app.post('/beaconConnected', function(req, res) {
    BeaconID = req.body.BeaconID;
    DeviceID = req.body.DeviceID; 
    Distance = req.body.Distance;
    var resObj = {};

    MongoClient.connect(mongourl, function(err, db) {
        async.waterfall([
            function(callback){
                var collection = db.collection('beacons');
                collection.find({
                    'BeaconID': BeaconID
                }).toArray(function(err, devices) {
                    callback(null, devices);
                });
            },
            function(devices, callback){
                if (devices && devices.length > 0){
                    if (devices[0].BeaconKey == 'welcome'){
                        sendpushnotification([DeviceID], 'Welcome', 'Welcome to Lotus. Exciting offers are waiting for you..');
                    }
                } else {
                    resObj.IsSuccess = false;
                    resObj.message = "Invalid Beacon ID";
                    res.send(resObj);
                    return;
                }
                updateDevice(BeaconID, DeviceID, Distance, res);
            }
        ]);
    });    
});

app.post('/beaconDisconnected', function(req, res) {
    //BeaconID = req.body.BeaconID;
    DeviceID = req.body.DeviceID; 
    //Distance = req.body.Distance;
    
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
        assert.equal(null, err);

        var collection = db.collection('device');
        
        collection.deleteMany({'DeviceID' : DeviceID });

        db.close();

        io.emit('updateDevice_response', {
            'IsSuccess': true,
            'message': 'Data inserted successfully'
        });        
    });

});


app.post('/getdata', function(req, res) {
    BeaconID = req.body.BeaconID;
	//StoreID = req.body.StoreID;
        
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
		
		async.waterfall([
			function(callback){
				var collection = db.collection('beacons');
				var beaconcollection = [];
				if (BeaconID){
					//beaconcollection = collection.find({'BeaconID' : BeaconID });
					beaconcollection = collection.find({'BeaconID' : { $in : BeaconID } });
				} else {
					beaconcollection = collection.find();
				}
				beaconcollection.toArray(function(err, beacons){
					var beaconslist = [];
					for(var b in beacons){
						beaconslist[beacons[b].BeaconID] = beacons[b].BeaconKey;
					}
					
					callback(null, beaconslist);
				});				
			}, 
			function(beaconlist, callback){
				var collection = db.collection('device');
				var devicelist = new Array();
				if (BeaconID){
					if (BeaconID){
						//beaconcollection = collection.find({'BeaconID' : BeaconID });
						devicecollection = collection.find({'BeaconID' : { $in : BeaconID } });
					} else {
						devicecollection = collection.find();
					}
					devicecollection.toArray(function(err, devices) {
						for (var dvc in devices) {
							devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
							devicelist.push(devices[dvc]);
						}
						res.send(devicelist);
						callback(null, beaconlist);
						return;
					})
				} else {
					collection.find().toArray(function(err, devices) {
						for (var dvc in devices) {
							devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
							devicelist.push(devices[dvc]);
						}
						res.send(devicelist);
						callback(null, beaconlist);
						return;
					})
				}				
			},
			function(beaconlist, callback){
		        db.close();				
			}
		]);

    });
});

app.post('/getDeviceHistorydata', function(req, res) {
    BeaconID = req.body.BeaconID;
        
    MongoClient.connect(mongourl, function(err, db) {
        if (err) {
            return console.dir(err);
        }
		
		async.waterfall([
			function(callback){
				var collection = db.collection('beacons');
				var beaconcollection = [];
				if (BeaconID){
					//beaconcollection = collection.find({'BeaconID' : BeaconID });
					beaconcollection = collection.find({'BeaconID' : { $in : BeaconID } });
				} else {
					beaconcollection = collection.find();
				}
				beaconcollection.toArray(function(err, beacons){
					var beaconslist = [];
					for(var b in beacons){
						beaconslist[beacons[b].BeaconID] = beacons[b].BeaconKey;
					}
					callback(null, beaconslist);
				});				
			}, 
			function(beaconlist, callback){
				var collection = db.collection('device_history');
				var devicelist = new Array();
				if (BeaconID){
					if (BeaconID){
						devicecollection = collection.find({'BeaconID' : { $in : BeaconID } });
					} else {
						devicecollection = collection.find();
					}
					devicecollection.toArray(function(err, devices) {
						for (var dvc in devices) {
							devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
							devicelist.push(devices[dvc]);
						}
						res.send(devicelist);
						callback(null, beaconlist);
						return;
					})
				} else {
					collection.find().toArray(function(err, devices) {
						for (var dvc in devices) {
							devices[dvc].BeaconKey = beaconlist[devices[dvc].BeaconID];
							devicelist.push(devices[dvc]);
						}
						res.send(devicelist);
						callback(null, beaconlist);
						return;
					})
				}				
			},
			function(beaconlist, callback){
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
        if (BeaconStore){
            beaconcollection = collection.find({'BeaconStore' : ObjectId(BeaconStore)})
        } else {
            beaconcollection = collection.find();
        }

        beaconcollection.toArray(function(err, devices) {
            if (devices && devices.length > 0){
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
    BeaconDescr = req.body.BeaconDescr;
    BeaconStore = req.body.BeaconStore;
    var resObj = {};

    if (!(BeaconID && BeaconKey && BeaconStore)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter BeaconID and BeaconKey";
        res.send(resObj);
        return;
    }

    if (BeaconStore.length != 24){
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
                if (beacondata && beacondata.length > 0){
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
            function(beacondata, callback){
                if (beacondata && beacondata.length > 0){
                    resObj.IsSuccess = false;
                    resObj.message = "Beacon Key already exists";
                    res.send(resObj);
                    return;
                }
                
                collection.insert({
                    'BeaconID': BeaconID,
                    'BeaconKey': BeaconKey,
                    'BeaconDescr': BeaconDescr,
                    'BeaconStore' : ObjectId(BeaconStore)
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
    BeaconDescr = req.body.BeaconDescr;
    BeaconStore = req.body.BeaconStore;

    var resObj = {};

    if (!(BeaconID && BeaconKey && BeaconStore)) {
        resObj.IsSuccess = false;
        resObj.message = "Please enter BeaconID and BeaconKey";
        res.send(resObj);
        return;
    }
    if (BeaconStore.length != 24){
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
        collection.update(
            { 'BeaconID': BeaconID },
            {
                'BeaconID': BeaconID,
                'BeaconKey': BeaconKey,
                'BeaconDescr': BeaconDescr,
                'BeaconStore' : ObjectId(BeaconStore)
            }
        );
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
        
        collection.deleteMany({ 'BeaconID': BeaconID });
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
                if (devices && devices.length > 0){
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
            if (devices && devices.length > 0){
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
            function(stores, callback){
                if (stores && stores.length > 0){
                    resObj.IsSuccess = false;
                    resObj.message = "Store Name already exists";
                    res.send(resObj);
                    return;
                }
                
                collection.insert({
                    'StoreName': StoreName,
                    'StoreDescr': StoreDescr
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
        collection.update({ _id: ObjectId(StoreID) },
            {
                'StoreName': StoreName,
                'StoreDescr': StoreDescr
            }
        );
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
        
        collection.deleteMany({ _id: ObjectId(StoreID) });
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
                if (devices && devices.length > 0){
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
    sendpushnotification(not_device_token, not_title, not_descr);
    res.send();
});


app.post('/sendpushnotification_image', function(req, res) {
    not_title = req.body.title;
    not_descr = req.body.description;
    not_image = req.body.image_url;
    not_device_token = req.body.gcmTokens;

    sendpushnotification(not_device_token, not_title, not_descr, not_image);
    res.send();
});

function sendpushnotification(gcmToken, title, message, image_url){
    var gcmObject = new gcm.AndroidGcm(GcmGoogleKey);
    if (!image_url){
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
            'message': title,
            'badge': 1,
            'title': title,
            //'img_url': 'https://lh4.ggpht.com/mJDgTDUOtIyHcrb69WM0cpaxFwCNW6f0VQ2ExA7dMKpMDrZ0A6ta64OCX3H-NMdRd20=w300',
            'img_url': image_url,
            'notification_type': 6,
        }
    });

    gcmObject.send(message, function(err, response) {
        if (err) {
            console.log('Something went wrong :: ' + err);
        } else {
            console.log(response);
        }
        //res.send();
    });
}

var multer  =   require('multer');
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './angular/images/notificationuploads/');
  },
  filename: function (req, file, callback) {
    extension = file.originalname.split('.')[1];
    callback(null, file.fieldname + '-' + Date.now() + '.' + extension);
  }
});

var upload = multer({ storage : storage}).single('userPhoto');

app.post('/api/photo',function(req,res){
    upload(req,res,function(err) {
        if(err) {
            console.log(err);
            return res.end("Error uploading file.");
        }
        var filename = '';
        if (req.file){
            filename = req.file.destination + req.file.filename;
            filename = filename.replace('./','');
            filename = filename.replace('\\','/');
            filename = filename.replace('angular','');
        }        
         
        res.send(filename);
    });
});

app.post('/getdevicetoken',function(req,res){
    var devicelist = [];
    var device = [];
    device.push('APA91bELNsBdV4nR1j7Wh17Xx0cMD6X-wSbHfchYxaL19BspoVh-l3zGLN2r6LkHFxMuYBiEEFShDy5iAgh1h5nkK7jO3aPUsbYVOjkPLgwZaOEwxES5TZ0');
    device.push('APA91bFieVf2vEQQDAeXtsBkOCJgMks_Sg6LKgVZ0uCl1O0reLZfRZXpsNKvg68744SFfUbV2U9L8QA_TBDJ3GbnbOOiv3og6JYBD-JJwwNU77U08Uhzke4');
    JSON.stringify(device);
    res.send();
});