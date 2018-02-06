/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
const absURL = 'http://127.0.0.1:3000/classes/messages';
const testObj = { 
  results: [],
};

const defaultCorsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10 // Seconds.
};

var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.

// **************************************
  // set conditions that check if request is POST/GET/etc


  console.log(`Serving request type ${request.method} for url ${request.url}`, (request.type));
  // The outgoing status.
  var statusCode = 200;
  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;
  // Tell the client we are sending them plain text.
  //
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.
  headers['Content-Type'] = 'text/plain';

  
  //check error first
  // request.on('error', (err) => {
  //   console.error(err);
  //   statusCode = 400;
  //   response.writeHead(statusCode, headers);
  //   response.end();
  // });
  // If get
  if (absURL.includes(request.url)) {
    if (request.method === 'GET') {
      //   check for errors GET related
      response.writeHead(statusCode, headers);
      //   end with JSON String of obj
      console.log(`-------------> sending`, testObj);
      response.end(JSON.stringify(testObj));
    } else if (request.method === 'POST') {
      // else if post
      // check for errors POST related
      let body = [];
      // chunk the data together
      request.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        // concat the data
        body = Buffer.concat(body).toString();
        // push the parse into textObj.results
        testObj.results.push(JSON.parse(body));
        console.log(`++++++++++++++> posting`, testObj);
        // write head for code 201
        statusCode = 201;
        response.writeHead(statusCode, headers);
        // call end
        response.end();
      });  
    } else if (request.method === 'OPTIONS') {
      response.writeHead(statusCode, headers);
      response.end();
    }
  } else {
    statusCode = 404;
    response.writeHead(statusCode, headers);
    // call end
    response.end();
  }
  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  // response.writeHead(statusCode, headers);

  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
  // make end end a JSON string
  // response.end(JSON.stringify(testObj));
};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.

// add export of the handle function
exports.requestHandler = requestHandler;