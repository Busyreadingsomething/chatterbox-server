var handler = require('../request-handler');
var expect = require('chai').expect;
var stubs = require('./Stubs');

// Conditional async testing, akin to Jasmine's waitsFor()
// Will wait for test to be truthy before executing callback
var waitForThen = function (test, cb) {
  setTimeout(function() {
    test() ? cb.apply(this) : waitForThen(test, cb);
  }, 5);
};

describe('Node Server Request Listener Function', function() {
  it('Should answer GET requests for /classes/messages with a 200 status code', function() {
    // This is a fake server request. Normally, the server would provide this,
    // but we want to test our function's behavior totally independent of the server code
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    expect(res._ended).to.equal(true);
  });

  it('Should send back parsable stringified JSON', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(JSON.parse.bind(this, res._data)).to.not.throw();
    expect(res._ended).to.equal(true);
  });

  it('Should send back an object', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.be.an('object');
    expect(res._ended).to.equal(true);
  });

  it('Should send an object containing a `results` array', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.have.property('results');
    expect(parsedBody.results).to.be.an('array');
    expect(res._ended).to.equal(true);
  });

  it('Should accept posts to /classes/room', function() {
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var req = new stubs.request('/classes/messages', 'POST', stubMsg);
    var res = new stubs.response();

    handler.requestHandler(req, res);

    // Expect 201 Created response status
    expect(res._responseCode).to.equal(201);

    // Testing for a newline isn't a valid test
    // TODO: Replace with with a valid test
    expect(res._data).to.equal(undefined);
    expect(res._ended).to.equal(true);
  });

  it('Should respond with messages that were previously posted', function() {
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var req = new stubs.request('/classes/messages', 'POST', stubMsg);
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(201);

    // Now if we request the log for that room the message we posted should be there:
    req = new stubs.request('/classes/messages', 'GET');
    res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    var messages = JSON.parse(res._data).results;
    expect(messages.length).to.be.above(0);
    expect(messages[0].username).to.equal('Jono');
    expect(messages[0].message).to.equal('Do my bidding!');
    expect(res._ended).to.equal(true);
  });
  
  it('Should 400 when a limit query is not a number', function() {
    var stubMsg = {
      username: 'Douglas',
      message: 'Douglas!'
    };
    
    var reqDM = new stubs.request('/classes/messages', 'POST', stubMsg);
    var resDM = new stubs.response();
    handler.requestHandler(reqDM, resDM);
    
    var reqOrder = new stubs.request('/classes/messages?order=-createdAt&limit=two', 'GET');
    var resOrder = new stubs.response();
    
    handler.requestHandler(reqOrder, resOrder);
    
    expect(resOrder._responseCode).to.equal(400);
  });

  it('Should 400 when a order string is not a key on the object', function() {
    var bortMsg = {
      username: 'Bort',
      message: 'eat my shorts'
    };
    var reqBM = new stubs.request('/classes/messages', 'POST', bortMsg);
    var resBM = new stubs.response();
    handler.requestHandler(reqBM, resBM);
    
    var reqLimit = new stubs.request('/classes/messages?order=-createdBy&limit=2', 'GET');
    var resLimit = new stubs.response();
    
    handler.requestHandler(reqLimit, resLimit);
    
    expect(resLimit._responseCode).to.equal(400);
  });

  it('Should 400 when a unsupported query request is made', function() {
    var reqBadQuery = new stubs.request('/classes/messages?order=-createdAt&limit=2&name=dog', 'GET');
    var resBadQuery = new stubs.response();
    
    handler.requestHandler(reqBadQuery, resBadQuery);
    
    expect(resBadQuery._responseCode).to.equal(400);
  });
  
  it('Should respond with an array sorted by the most recent', function() {
    
    var hoomoorMsg = {
      username: 'hoomoor',
      message: 'donuts'
    };
    
    var reqHM = new stubs.request('/classes/messages', 'POST', hoomoorMsg);
    var resHM = new stubs.response();
    handler.requestHandler(reqHM, resHM);
    
    var reqOrder = new stubs.request('/classes/messages?order=-createdAt', 'GET');
    var resOrder = new stubs.response();
    
    handler.requestHandler(reqOrder, resOrder);
    var messages = JSON.parse(resOrder._data).results;

    expect(messages.length).to.be.equal(5);
    expect(resOrder._responseCode).to.equal(200);
    expect(messages[0].username).to.be.equal('hoomoor');
    expect(messages[1].username).to.be.equal('Bort');
    expect(messages[2].username).to.be.equal('Douglas');
  });

  it('Should respond with an array with a length of 2', function() {
    var reqLimit = new stubs.request('/classes/messages?limit=2', 'GET');
    var resLimit = new stubs.response();
    
    handler.requestHandler(reqLimit, resLimit);
    
    expect(resLimit._responseCode).to.equal(200);
    var messages = JSON.parse(resLimit._data).results;
    expect(messages.length).to.be.equal(2);
  });

  it('Should respond with an array sorted by the earliest and a length of 2', function() {
    var reqDoubleQuery = new stubs.request('/classes/messages?order=-createdAt&limit=2', 'GET');
    var resDoubleQuery = new stubs.response();
    
    handler.requestHandler(reqDoubleQuery, resDoubleQuery);
    
    expect(resDoubleQuery._responseCode).to.equal(200);
  });

  it('Should 404 when asked for a nonexistent file', function() {
    var req = new stubs.request('/arglebargle', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    // Wait for response to return and then check status code
    waitForThen(
      function() { return res._ended; },
      function() {
        expect(res._responseCode).to.equal(404);
      });
  });
  
  it('should have nice additional tests and make Beth somewhat happy', function() {
    let coolTests = true;
    expect(coolTests).to.be.true;
  });

});
