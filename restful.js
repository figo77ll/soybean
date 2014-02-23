var restify = require('restify');
var http = require('http');
var fs = require('fs');
var jsdom = require('jsdom');
var mustache= require('mustache');

// helper functions
function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}

function api_getLanding(req, res, next) {
	// simply return the landing page	
	html = fs.readFileSync('./Login.html');
    res.writeHeader(200, {"Content-Type": "text/html"});  
    res.write(html);  
    res.end();
}

function api_postSearch(req, res, next) {

	username = req.params.username;

	console.log('username ' + username);

	// Retrieve
	var MongoClient = require('mongodb').MongoClient;

	// Connect to the db
	MongoClient.connect("mongodb://localhost:27017/soybean", function(err, db) {
		console.log('connecting to mongdb..');
	 	if(err) {
	 	 	console.log("fail to connect to mongdb");
	 		return console.dir(err); 
	 	}

	  	var collection = db.collection('profiles');

		collection.find({'username': username}).toArray(function(err, items) {
			console.log(items);
			var doc = items[0];
			console.log(doc);
			//res.send( doc );

			var page = fs.readFileSync('./Search.html');
			//console.log(page);
			var document = jsdom.jsdom(page);
	        var window = document.createWindow();
	        jsdom.jQueryify(window, './js/libs/jquery.js', function() {
		        //window.$('html').html(page);
	        	//console.log('in jsdom ' + window.$('html').html());
                //window.$('h2').html("Content Added to DOM by Node.js Server");
                //for (var i=0; i < products.length; i++) {
                    //productSummaryHtml = mustache.to_html(productSummaryTemplate, products[i]);
                console.log('doc email' + doc.email);
                window.$('#form').append('<input type="hidden" name="uid" value="' + doc.uid + '">');
                //window.$('#form').append("<label>" + doc.email +"</label>");
                //window.$('#form').data('data', {'email' : doc.email});
                //var myData = $('#form').data('data');
                //console.log(myData);  
                //}
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end("<!DOCTYPE html>\n" + window.$('html').html());	
                console.log(window.$('html').text());
	        });
			//res.writeHeader(200, {"Content-Type": "text/html"});  
			//res.write(html);
		});

	});


/*
	html = fs.readFileSync('./Search.html');
    res.writeHeader(200, {"Content-Type": "text/html"});  
    res.write(html);  
    res.end();
    */
}

// return a user profile given username
// e.g. Mark
function api_getUser(req, res, next) {
	// call our internal db to get user profile
	uid = req.params.uid;

	console.log('uid ' + uid);
	// Retrieve
	var MongoClient = require('mongodb').MongoClient;

	// Connect to the db
	MongoClient.connect("mongodb://localhost:27017/soybean", function(err, db) {
		console.log('connecting to mongdb..');
	 	if(err) {
	 	 	console.log("fail to connect to mongdb");
	 		return console.dir(err); 
	 	}

	  	var collection = db.collection('profiles');

		collection.find({'uid': uid}).toArray(function(err, items) {
			console.log(items);
			var doc = items[0];
			console.log(doc);
			//res.send( doc );

			var page = fs.readFileSync('./WebContent/profile.html');
			console.log(page);
			var document = jsdom.jsdom(page);
	        var window = document.createWindow();
	        jsdom.jQueryify(window, './js/libs/jquery.js', function() {
		        //window.$('html').html(page);
	        	console.log('in jsdom ' + window.$('html').html());
                //window.$('h2').html("Content Added to DOM by Node.js Server");
                //for (var i=0; i < products.length; i++) {
                    //productSummaryHtml = mustache.to_html(productSummaryTemplate, products[i]);
                console.log('doc email' + doc.email);
                window.$('#profile').append("<label>" + doc.email +"</label>");
                //}
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end("<!DOCTYPE html>\n" + window.$('html').html());	
                console.log(window.$('html').text());
	        });
			//res.writeHeader(200, {"Content-Type": "text/html"});  
			//res.write(html);
		});

	});
}

// return a list of hotels given location, start/end dates
// e.g. new york
function api_getHotels(req, res, next) {
	// this serves as the API doc
	var moment = require('moment');
	var arrivalDate = moment(req.params.arrivalDate).format('MM/DD/YYYY');
	var departureDate = moment(req.params.departureDate).format('MM/DD/YYYY');
	var pid = req.params.uid;

	var hotelName = req.params.name;
	var hotelStars = req.params.stars;
	var city = req.params.city;
	var address = req.params.address;
	var roomDescription = req.params.roomDescription;
	// planner user id
	var price = req.params.price;

	console.log('pid ' + pid);
	console.log('arrivalDate: ' + arrivalDate);
	console.log('departureDate: ' + departureDate);


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
									console.log("target roomTypeCode: " + jRoomDetails.roomTypeCode);
									console.log("hotel id: " + jHotel.hotelId);
									response[k].hotelId = jHotel.hotelId;
									response[k].arrivalDate = arrivalDate;
									response[k].departureDate = departureDate;
									response[k].pid = pid;
									k++;

								}
							}
						}
					}
				}
				console.log('<<<<<');
			}

			// at this point we have all the data to construct the hotel listings
			var listings_page = fs.readFileSync('./Hotel_list.html');
			// encoding make it return a string
			hotelTemplate = fs.readFileSync('./Hotel_listingTemplate.html', 'utf-8');
			//var hotelTemplate = '<li><h2>{{name}}</h2></li>';
			//console.log(listings_page);
			var document = jsdom.jsdom(listings_page);
	        var window = document.createWindow();
	        jsdom.jQueryify(window, './js/libs/jquery.js', function() {
	        	console.log('@@@@@@');
	        	//console.log(response);
		        //window.$('html').html(page);
	        	//console.log('in jsdom ' + window.$('html').html());
                //window.$('h2').html("Content Added to DOM by Node.js Server");
                //for (var i=0; i < products.length; i++) {
                    //productSummaryHtml = mustache.to_html(productSummaryTemplate, products[i]);
                for (var i=0; i < response.length; i++) {
                	console.log('templating..');
                	//console.log(response[i]);
					hotelHtml = mustache.to_html(hotelTemplate, response[i]);
					//console.log('hotelHtml ' + hotelHtml);
					//console.log('hotel: ' + hotelHtml);
                    //window.$('#hotelList').append('<li><h2>test</h2></li>');
                    window.$('#hotelList').append(hotelHtml);
                }
                //window.$('#form').append("<label>" + doc.email +"</label>");
                //window.$('#form').data('data', {'email' : doc.email});
                //var myData = $('#form').data('data');
                //console.log(myData);  
                //}
                options.responseObject.writeHead(200, {'Content-Type': 'text/html'});
                options.responseObject.end("<!DOCTYPE html>\n" + window.$('html').html());	
                //console.log(window.$('html').text());
	        });

			//options.responseObject.send(response);
		});
	});

	expediaReq.write("");
	expediaReq.end();
}

function api_getRoomImage(req, res, next) {
	// this serves as the API doc
	var arrivalDate = req.params.arrivalDate;
	var departureDate = req.params.departureDate;
	var pid = req.params.pid;

	var hotelName = req.params.name;
	var hotelStars = req.params.stars;
	var city = req.params.city;
	var address = req.params.address;
	var roomDescription = req.params.roomDescription;
	// planner user id
	var price = req.params.price;

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

			if (imageURL) {

				// at this point we have all the data to construct the hotel listings
				var hotelDetails_page = fs.readFileSync('./Hotel_details.html');
				// encoding make it return a string
				var hotelImage = '<img src="'+ imageURL +'">';
				//console.log(listings_page);
				var document = jsdom.jsdom(hotelDetails_page);
		        var window = document.createWindow();
		        jsdom.jQueryify(window, './js/libs/jquery.js', function() {
		        	console.log('@@@@@@');
		        	console.log(response);
			        //window.$('html').html(page);
		        	//console.log('in jsdom ' + window.$('html').html());
	                //window.$('h2').html("Content Added to DOM by Node.js Server");
	                //for (var i=0; i < products.length; i++) {
	                    //productSummaryHtml = mustache.to_html(productSummaryTemplate, products[i]);
                	console.log('templating..');
	                	//console.log(response[i]);
						//hotelHtml = mustache.to_html(hotelTemplate, response[i]);
						//console.log('hotelHtml ' + hotelHtml);
						//console.log('hotel: ' + hotelHtml);
	                    //window.$('#hotelList').append('<li><h2>test</h2></li>');
                    window.$('#roomslot').append('<h2>' + hotelName + '</h2>');
                    window.$('#roomslot').append('<p>' + roomDescription + '</p>');
                    window.$('#roomslot').append(hotelImage);
                    window.$('#roomslot').append('<h4>' + price + '</h4>');
	                //window.$('#form').append("<label>" + doc.email +"</label>");
	                //window.$('#form').data('data', {'email' : doc.email});
	                //var myData = $('#form').data('data');
	                //console.log(myData);  
	                //}
	                getImageOptions.responseObject.writeHead(200, {'Content-Type': 'text/html'});
	                getImageOptions.responseObject.end("<!DOCTYPE html>\n" + window.$('html').html());	
	                console.log(window.$('html').text());
	        });
			}

			//getImageOptions.responseObject.send({ 'imageURL' : imageURL});
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
	// planner user id
	var pid = req.params.pid;
	var price = req.params.price;

	console.log("planner booking: " + hotelName + " " + hotelStars + " " + city + " " + address);
	//console.log(req);

	// Retrieve
	var MongoClient = require('mongodb').MongoClient;

	// Connect to the db
	MongoClient.connect("mongodb://localhost:27017/soybean", function(err, db) {
		console.log('connecting to mongdb..');
	 	if(err) {
	 		console.log("fail to connect to mongdb");
	 		return console.dir(err); 
	 	}

	  	var collection = db.collection('trips');
	  	var trip = { 'hotelName' : hotelName, 'hotelStars' : hotelStars, 'city' : city, 
	  				 'address' : address, 'hotelPic' : hotelPic, 'roomPic' : roomPic,
	  				 'roomDescription' : roomDescription, 'arrivalDate' : arrivalDate,
	  				 'departureDate' : departureDate, 'pid' : pid, 'price' : price} ;

	  	collection.insert(trip, {w:1}, function(err, result) {
	  		if (err)
		  		console.log('fail to insert: ' + err + result)
	  	});

	});

	res.send({ status: 'ok'});
}

function api_getBookings(req, res, next) {
	// all of these are required fields
	var city = req.params.city;
	var arrivalDate = req.params.arrivalDate;
	var departureDate = req.params.departureDate;

	console.log('city' + city + 'arrival' + arrivalDate + 'departureDate' + departureDate);

	// Retrieve
	var MongoClient = require('mongodb').MongoClient;

	// Connect to the db
	MongoClient.connect("mongodb://localhost:27017/soybean", function(err, db) {
		console.log('connecting to mongdb..');
	 	if(err) {
	 	 	console.log("fail to connect to mongdb");
	 		return console.dir(err); 
	 	}

	  	var collection = db.collection('trips');

		collection.find({'city': city}).toArray(function(err, items) {
			console.log(items);
			res.send( items );
		});

	});

}

function api_followerBook(req, res, next) {
	var _id = req.params._id;
	var fid = req.params.fid;

	console.log('_id ' + _id + ' fid ' + fid);

	// Retrieve
	var MongoClient = require('mongodb').MongoClient;

	// Connect to the db
	MongoClient.connect("mongodb://localhost:27017/soybean", function(err, db) {
		console.log('connecting to mongdb..');
	 	if(err) {
	 	 	console.log("fail to connect to mongdb");
	 		return console.dir(err); 
	 	}

	  	var collection = db.collection('trips');
	  	var ObjectId = require('mongodb').ObjectID;

		collection.find({'_id':ObjectId(_id)}).toArray(function(err, items) {
			doc = items[0]; // should only be one
			// once we find the entry we append the fid
			collection.update(doc, {$set : {'fid' : fid}}, {w:1}, function(err, result) {});
			console.log(items);
			res.send( doc );
		});

	});
}

var server = restify.createServer();

server.use(restify.queryParser()); // to support hotel?location=...
server.use(restify.bodyParser());

// static serving
server.get(/\/js\/?.*/, restify.serveStatic({
  directory: './js'
}));
server.get(/\/samplePics\/?.*/, restify.serveStatic({
  directory: './samplePics'
}));

// dynamic serving
server.get('/landing/', api_getLanding);
server.post('/search/', api_postSearch);

// restful
server.get('/profile/get/user/', api_getUser);
server.post('/planHotel/', api_getHotels);
server.get('/roomDetails/', api_getRoomImage);
server.post('/planner/book/', api_plannerBook);
server.get('/follower/get/bookings/', api_getBookings);
server.get('/follower/book/', api_followerBook);

server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});
