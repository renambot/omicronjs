var express = require("express");
var http = require('http');
var fs = require('fs');
var path = require('path');

var app = express();
var hport = parseInt(process.env.PORT, 10) || 9090;

app.configure(function(){
	app.use(express.methodOverride());	
	app.use(express.static(__dirname + '/'));
	app.use(express.bodyParser({uploadDir:__dirname + '/upload'}));
	app.use(app.router);
});


app.post("/upload", function (request, response) {
    // request.files will contain the uploaded file(s),                                          
    // keyed by the input name (in this case, "file")                                            
    
    for (var f in request.files) {                                           
    	console.log("file name", request.files[f].name);
    	console.log("file path", request.files[f].path);
    	fs.rename( request.files[f].path,
    		path.join( path.dirname(request.files[f].path), request.files[f].name)
    	)
    }

    response.end();                                                             
});                                                                                              





var server = http.createServer(app);

// ---------------------------------------------
// Setup the websocket
// ---------------------------------------------
// To talk to the web clients
var io = require('socket.io');

var sio = io.listen(server);

sio.configure(function () {
  sio.set('transports', ['websocket']);
  sio.set('log level', 0);
});

sio.configure('development', function () {
  sio.set('transports', ['websocket' ]);
  sio.disable('log');
});

sio.sockets.on('connection', function (socket) {
	var address = socket.handshake.address;
	console.log("New connection from " + address.address + ":" + address.port);
});

// ---------------------------------------------
// Tracking
// ---------------------------------------------

var net = require('net');
var util = require('util');
var dgram = require('dgram');
var sprint = require('sprint').sprint;

// Global UDP socket to the tracker server
var udp = undefined;

// CAVE2
//var tserver   = "cave2tracker.evl.uic.edu";
// Green table
//var tserver   = "midori.evl.uic.edu";
// Icelab
var tserver   = "omgtracker.evl.uic.edu";

var tport     = 28000;
var pdataPort = 9123;
var client    = net.connect(tport, tserver,  function() { //'connect' listener
	console.log('client connected: ', tserver, tport);

	var sendbuf = util.format("omicron_data_on,%d", pdataPort);
	console.log("OMicron> Sending handshake: ", sendbuf);
	client.write(sendbuf);

	udp = dgram.createSocket("udp4");
	var dstart = Date.now();
	var emit = 0;

	// array to hold all the button values (1 - down, 0 = up)
	var ptrs    = {};
	var buttons = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var mouse   = [0, 0, 0];
	var mousexy = [0.0, 0.0];
	var colorpt = [0.0, 0.0, 0.0];
	var mousez  = 0;

	udp.on("message", function (msg, rinfo) {
		// console.log("UDP> got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
		// var out = util.format("UDP> msg from [%s:%d] %d bytes", rinfo.address,rinfo.port,msg.length);
		// console.log(out);

		if ((Date.now() - dstart) > 100) {
			var offset = 0;
			var e = {};
			if (offset < msg.length) e.timestamp = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.sourceId = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.serviceId = msg.readInt32LE(offset); offset += 4;
			if (offset < msg.length) e.serviceType = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.type = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.flags = msg.readUInt32LE(offset); offset += 4;

			if (offset < msg.length) e.posx = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.posy = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.posz = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.orw = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.orx = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.ory = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.orz = msg.readFloatLE(offset); offset += 4;
			if (offset < msg.length) e.extraDataType = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.extraDataItems = msg.readUInt32LE(offset); offset += 4;
			if (offset < msg.length) e.extraDataMask = msg.readUInt32LE(offset); offset += 4;
			// memcpy(ed.extraData, &eventPacket[offset], EventData::ExtraDataSize);

			// Extra data types:
            //    0 ExtraDataNull,
            //    1 ExtraDataFloatArray,
            //    2 ExtraDataIntArray,
            //    3 ExtraDataVector3Array,
            //    4 ExtraDataString,
            //    5 ExtraDataKinectSpeech

			var r_roll  = Math.asin(2.0*e.orx*e.ory + 2.0*e.orz*e.orw);
			var r_yaw   = Math.atan2(2.0*e.ory*e.orw-2.0*e.orx*e.orz , 1.0 - 2.0*e.ory*e.ory - 2.0*e.orz*e.orz);
			var r_pitch = Math.atan2(2.0*e.orx*e.orw-2.0*e.ory*e.orz , 1.0 - 2.0*e.orx*e.orx - 2.0*e.orz*e.orz);

			if (e.serviceType == 0) {  // ServiceTypePointer

				//console.log("ServiceTypePointer> source ", e.sourceId);
				if (e.type == 3) { // update
					colorpt = [Math.floor(e.posx*255.0), Math.floor(e.posy*255.0), Math.floor(e.posz*255.0)];
					if (offset < msg.length) {
						if (e.extraDataType == 4 && e.extraDataItems > 0) {
							e.extraString = msg.toString("utf-8", offset, offset+e.extraDataItems);
							ptrinfo = e.extraString.split(" ");
							offset += e.extraDataItems;
							ptrs[e.sourceId] = {id:e.sourceId, label:ptrinfo[0], ip:ptrinfo[1], mouse:[0,0,0], color:colorpt, zoom:0, position:[0,0]};
						}
					}
				}
				else if (e.type == 4) { // move
					//console.log("\t move ", e.posx, e.posy);
					if (e.sourceId in ptrs) {
						ptrs[e.sourceId].position = [e.posx, e.posy];
						ptrs[e.sourceId].zoom = 0;
					}
				}
				else if (e.type == 15) { // zoom
					//console.log("\t zoom ");
					if (e.sourceId in ptrs) {
						ptrs[e.sourceId].position = [e.posx, e.posy];
						ptrs[e.sourceId].zoom = 1;

						if (offset < msg.length) {
							// One int for zoom value
							if (e.extraDataType == 2 && e.extraDataItems == 1) {
								e.extraInt = msg.readInt32LE(offset);
								offset += 4;
								ptrs[e.sourceId].zoom = e.extraInt;
							}
						}
					}
				}
				else if (e.type == 5) { // button down
					//console.log("\t down , flags ", e.flags);
					if (e.sourceId in ptrs) {
						ptrs[e.sourceId].position = [e.posx, e.posy];
						
						var counter, i;
						for(counter=0; counter < 3; counter++)
						{
							i = Math.pow(2, counter);
							if (e.flags & i)
								ptrs[e.sourceId].mouse[counter] = 1;
							else
								ptrs[e.sourceId].mouse[counter] = 0;
						}
					}
				}
				else if (e.type == 6) { // button up
					//console.log("\t up , flags ", e.flags);
					if (e.sourceId in ptrs) {
						ptrs[e.sourceId].position = [e.posx, e.posy];
							
						ptrs[e.sourceId].mouse[0] = 0;
						ptrs[e.sourceId].mouse[1] = 0;
						ptrs[e.sourceId].mouse[2] = 0;
					}
				}
				else {
					console.log("\t UNKNOWN event type ", e.type);					
				}

				// Emit a pointer event
				//sio.sockets.emit('pointer', {x:mousexy[0],y:mousexy[1],zoom:mousez, b1:mouse[0], b2:mouse[1], b3:mouse[2]} );
				if (e.sourceId in ptrs)
					sio.sockets.emit('pointer',  ptrs[e.sourceId] );
			}

			if (e.type == 3) {
				if (e.serviceType == 1) {  // ServiceTypeMocap
					var RAD_TO_DEGREE = 180.0/Math.PI;
					var pfmt = sprint("\tp: x %6.2fm | y %6.2fm | z %6.2fm\n",
								e.posx, e.posy, e.posz); // in meters
					var rfmt = sprint("\tr: p(x) %4.0f | y(y) %4.0f | r(z) %4.0f\n", // degrees
								RAD_TO_DEGREE * r_pitch, RAD_TO_DEGREE * r_yaw, RAD_TO_DEGREE * r_roll);

					if (e.sourceId == 0) {
						//console.log("head> ", pfmt+rfmt);
						sio.sockets.emit('head', {text: pfmt+rfmt, pos:[e.posx, e.posy, e.posz],
												rot:[RAD_TO_DEGREE * r_pitch, RAD_TO_DEGREE * r_yaw, RAD_TO_DEGREE * r_roll]});
					}
					if (e.sourceId == 1) {
						//console.log("wand> ", pfmt+rfmt);
						sio.sockets.emit('wand', {text: pfmt+rfmt, pos:[e.posx, e.posy, e.posz],
												rot:[RAD_TO_DEGREE * r_pitch, RAD_TO_DEGREE * r_yaw, RAD_TO_DEGREE * r_roll]});
					}
					if (e.sourceId == 2) {
						//console.log("wand2> ", pfmt+rfmt);
						sio.sockets.emit('wand2', {text: pfmt+rfmt, pos:[e.posx, e.posy, e.posz],
												rot:[RAD_TO_DEGREE * r_pitch, RAD_TO_DEGREE * r_yaw, RAD_TO_DEGREE * r_roll]});
					}
					emit++;
				}
			}
			if (emit>2) { dstart = Date.now(); emit = 0; }
		}
	});

	udp.on("listening", function () {
		var address = udp.address();
		console.log("UDP> listening " + address.address + ":" + address.port);
	});
	
	udp.bind(pdataPort);
});

// client.on('data', function(data) {
//   console.log("OMicron> got: ", data);
//   client.end();
// });
client.on('end', function() {
  console.log('OMicron> client disconnected');
});
/////////////////////////////////////////////////////////////////////////


// Start the http server
server.listen(hport);

console.log('Now serving the app at http://localhost:' + hport);
