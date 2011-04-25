
// Include the necessary modules.
var sys = require( "sys" );
var http = require( "http" );
var fs = require( "fs" );

// This is the static file server module for our site.
var static = require( "node-static" );


// ---------------------------------------------------------- //
// ---------------------------------------------------------- //


// Load the Tumblr RSS proxy. When that is done, we have everything
// that we need to start running the server. 
// 
// NOTE: The RSS feed might not be available right away (requires an 
// ansynchronous HTTP request); however, as this happens only at the
// beginning of the application, I don't feel a need to use the
// available callback.
var tumblr = require( "./lib/tumblr" ).load(
	function(){
		
		// Log that the data has loaded.
		sys.puts( "Tumblr RSS data has loaded." );
		
	}
);


// Read in the output template. This site is only going to serve up
// this one page. Since this will only be read in once, just read it
// in SYNChronously - this way we can get the file contents back 
// immediately and don't have to use a callback.
var htmlTemplate = fs.readFileSync( 
	(__dirname + "/views/index.htm"), 
	"utf8" 
);


// Create our static file server. We can use this to facilitate the
// serving of static assets with proper mime-types and caching.
var staticFileServer = new static.Server( "." );


// Create an instance of the HTTP server. While we are using a static
// file server, we will need at HTTP server to handle the one dynamic 
// page (the homepage) and to hand requests off to the static file
// server when necessary.
var server = http.createServer(
	function( request, response ){

		// Parse the requested URL.
		var url = require( "url" ).parse( request.url );
		
		// Get requested script.
		var scriptName = url.pathname;

		// Check to see if the homepage was requested. If so, then we
		// need to load it and serve it. If not, then we can just 
		// pass the request off to the static file server (which will
		// handle any necessary 404 responses for us).
		if (scriptName.search( /^\/(index\.htm)?$/i ) == 0){

			// Get the next RSS feed item (might return NULL).
			var rssItem = tumblr.next();
	
			// Set the 200-OK header.
			response.writeHead(
				200,
				{ "Content-Type": "text/html" }
			);
	
			// Write the index page to the response and then 
			// close the output stream.
			response.end( 
				htmlTemplate.replace(
					new RegExp( "\\$\\{rssItem\\}", "" ), 
					(rssItem || "Oops - No data found.")
				)
			);

		} else {

			// If this isn't the index file, pass the control 
			// off to the static file server.
	        staticFileServer.serve( request, response );

		}

	}
);

// Point the server to listen to the given port for incoming
// requests.
server.listen( 8080 );


// ---------------------------------------------------------- //
// ---------------------------------------------------------- //


// Output fully loaded message.
sys.puts( "Server is running on 8080." );




