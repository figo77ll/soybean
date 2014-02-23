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
		},
		responseObject : res
	};

	// call expedia and fill the response JSON object
	var expediaReq = http.request(options, function(res) {
		var msg = '';

		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			msg += chunk;
		});

		res.on('end', function() {
			var response = new Array();

			//console.log(JSON.parse(msg));
			//console.log(msg);
			console.log("^^^^^^^ ^^^^^^^^^");
			var jHotelRes = JSON.parse(msg);
			var jHotelList = jHotelRes.HotelListResponse.HotelList.HotelSummary
			//console.log(jHotelList);

			var k = 0;
			for (var i in jHotelList) {
				var jHotel = jHotelList[i];

				var jRoomList = jHotelList[i].RoomRateDetailsList.RoomRateDetails;

				console.log('>>>>> ' + jHotel.name);
				console.log(jHotel.address1);
				jHotel.thumbNailUrl = 'http://images.travelnow.com/' + jHotel.thumbNailUrl;
				console.log(jHotel.thumbNailUrl);

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
					if (roomDescription.match(/[2-5]/gi) != null) {
					//if (roomDescription.indexOf('2') != -1) {
						console.log(roomDescription);

						var jRateInfos = jRoomDetails.RateInfos;
						var jChargeRateDetails = null;
						if (isArray(jRateInfos)) {
							console.log("not supported: multi rate");
						} else {
							jChargeRateDetails = jRateInfos.RateInfo.ChargeableRateInfo;
							console.log(jChargeRateDetails);
							for (var key in jChargeRateDetails) {
								if (key == '@total') {
									var price = jChargeRateDetails[key];
									console.log("total: " + jChargeRateDetails[key]);

									response[k] = new Object();
									response[k].name = jHotel.name;
									response[k].stars = jHotel.hotelRating;
									response[k].address = jHotel.address1;
									response[k].city = jHotel.city;
									response[k].stateProvinceCode = jHotel.stateProvinceCode;
									response[k].hotelPicture = jHotel.thumbNailUrl;
									response[k].roomDescription = roomDescription;
									response[k].priceTotalIncludeTax = price;
									response[k].roomTypeCode = jRoomDetails.roomTypeCode;
									k++;

									console.log("target roomTypeCode: " + jRoomDetails.roomTypeCode);
									console.log("hotel id: " + jHotel.hotelId);
								}
							}
						}
					}
				}
				console.log('<<<<<');
			}

			options.responseObject.send(response);
		});
	});

	expediaReq.write("");
	expediaReq.end();
}

function api_getRoomImage(req, res, next) {
	// this serves as the API doc
	var roomTypeCode = req.params.roomTypeCode;
	var hotelId = req.params.hotelId;
	console.log("code: " + roomTypeCode + " - hotelId: " + hotelId);

	var getImageOptions = {
		host: 'api.ean.com',
		port: '80',
		path: '/ean-services/rs/hotel/v3/roomImages?&minorRev=22&apiKey=7tu87e3uys7v6wmh4v9tgye9&customerUserAgent=MOBILE_SITE&locale=en_US&hotelId=' + hotelId,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Length': 0 
		},
		targetCode : roomTypeCode,
		responseObject : res
	};
	// retrieve room images
	var imageRequest = http.request(getImageOptions, function(res) {
		console.log("Got response: " + res.statusCode);
		var msg = '';
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			msg += chunk;
		});

		res.on('end', function() {
			console.log("####");
			var response = new Object();
			//console.log(msg);
			// filer by rootTypeCode
			var jRoomImages = JSON.parse(msg).HotelRoomImageResponse.RoomImages.RoomImage;
			console.log(jRoomImages);

			function getRoomImageURL(jRoomImage) {
				//console.log("code: " + jRoomImage.roomTypeCode + " vs. " + getImageOptions.targetCode);
				if (jRoomImage.roomTypeCode == getImageOptions.targetCode) {
					console.log("Find match!");
					console.log(jRoomImage.url);
					return jRoomImage.url;
				} else {
					return "";
				}
			}

			var imageURL;
			if (isArray(jRoomImages)){
				for (var i in jRoomImages) {
					imageURL = getRoomImageURL(jRoomImages[i]);
					if (imageURL != "") {
						break
					}
				}
			} else {
				imageURL = getRoomImageURL(jRoomImages);
			}

			getImageOptions.responseObject.send({ 'imageURL' : imageURL});
		});
	});

	imageRequest.on('error', function(e) {
	 	console.log("Got error: " + e.message);
	});

	imageRequest.write("");
	imageRequest.end();
}

function api_plannerBook(req, res, next) {
	// all of these are required fields
	var hotelName = req.params.name;
	var hotelStars = req.params.stars;
	var city = req.params.city;
	var address = req.params.address;
	var hotelPic = req.params.hotelPic;
	var roomPic = req.params.roomPic;
	var roomDescription = req.params.roomDescription;
	var arrivalDate = req.params.arrivalDate;
	var departureDate = req.params.departureDate;
	var userId = req.params.uid;
	var price = req.params.price;

	console.log("planner booking: " + hotelName + " " + hotelStars + " " + city + " " + address);
	console.log(req);
	res.send({ status: 'ok'});
}

var server = restify.createServer();

server.use(restify.queryParser()); // to support hotel?location=...
server.use(restify.bodyParser());

server.get('/get/user/:name', api_getUser);
server.get('/get/hotels/', api_getHotels);
server.get('/get/roomImage/', api_getRoomImage);
server.post('/book/planner/', api_plannerBook);

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});
