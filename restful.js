var restify = require('restify');

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
	console.log('StartDate: ' + req.params.startDate);
	console.log('EndDate: ' + req.params.endDate);

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
