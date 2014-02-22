var restify = require('restify');
var http = require('http');

// helper functions
function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

// return a user profile given username
// e.g. Mark
function api_getUser(req, res, next) {
	// call our internal db to get user profile

    res.send({user : req.params.name});
}

// return a list of hotels given location, start/end dates
// e.g. new york
function api_getHotels(req, res, next) {
	// this serves as the API doc
	var arrivalDate = req.params.arrivalDate;
	var departureDate = req.params.departureDate;
	console.log('ArrivalDate: ' + arrivalDate);
	console.log('DepartureDate: ' + departureDate);

	var options = {
		host: 'api.ean.com',
		port: '80',
		path: '/ean-services/rs/hotel/v3/list?&minorRev=22&apiKey=7tu87e3uys7v6wmh4v9tgye9&customerUserAgent=MOBILE_SITE&locale=en_US&currencyCode=USD&city=Seattle&stateProvinceCode=WA&countryCode=US&supplierCacheTolerance=MED&arrivalDate='+ arrivalDate +'&departureDate=' + departureDate + '&room1=2&supplierCacheTolerance=MED_ENHANCED&numberOfResults=2&maxRatePlanCount=10&includeDetails=true',
		method: 'GET',
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Length': 0 
		}
	};

	var expediaReq = http.request(options, function(res) {
		var msg = '';

		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			msg += chunk;
		});

		res.on('end', function() {
			//console.log(JSON.parse(msg));
			//console.log(msg);
			console.log("^^^^^^^ ^^^^^^^^^");
			var jHotel = JSON.parse(msg);
			var jHotelList = jHotel.HotelListResponse.HotelList.HotelSummary
			//console.log(jHotelList);

			for (var i in jHotelList) {
				var jRoomList = jHotelList[i].RoomRateDetailsList.RoomRateDetails;
				console.log('>>>>> ' + jHotelList[i].name);
				//console.log(jHotelList[i]);
				//console.log(jRoomList);
				for (var j in jRoomList) {
					var jRoomDetails = jRoomList[j];
					console.log('--------');
					//console.log(jRoomDetails.roomDescription);
					//console.log(jRoomDetails.BedTypes);
					var roomTypes = jRoomDetails.BedTypes;
					//console.log(roomTypes);
					var roomType = null;
					if (isArray(roomTypes)) {
						roomType = roomTypes[0];
					} else {
						roomType = roomTypes;
					}
					//console.log(roomType);
					var roomDescription = roomType.BedType.description;
					//console.log(roomDescription);
					// we are only interested in two beds per room
					if (roomDescription.indexOf('2') != -1) {
						console.log(roomDescription);
					}
				}
				console.log('<<<<<');
			}
		});
	});

	expediaReq.write("");
	expediaReq.end();

	// call expedia to get hotel room listings

    res.send(
      	{
      		hotels : 
	      	[
	      		{
	     			"name" : "W Hotel",
	      			"location" : req.params.location,
	      			"RoomDescription" : "Two Queens",
	      			"Price" : "$998",
	      			"Stars" : "4"
	      		}
	      	]
	      }
	);
}

var server = restify.createServer();

server.use(restify.queryParser()); // to support hotel?location=...

server.get('/get/user/:name', api_getUser);
server.get('/get/hotels/', api_getHotels);

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});
