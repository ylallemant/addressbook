
var fs        = require('fs');
var readline  = require('readline');
var parser    = require('./parser');

/**
 * Handler processing lines found in the opened files
 * if the line could successfully be parsed,
 * the resulting {@link AddressBookEntry} Object is sended to the parent process
 *
 * @param {string} line
 */
exports.onLine = function onLine (line) {

  // ignore empty lines
  if (line.length) {

    // transform text line into JSON entry
    var entry = parser.parseLine(line);

    if (entry === null) {
      //TODO invalid line handler
    }
    else {

      // send entry to the parent process
      process.send(entry);
    }
  }
};

/**
 * Opens a read stream to parse the provided file line by line
 * when the file has entirely been read, a "done" message is sended to the parent process
 *
 * @param {string} datafile absolute path to the datafile
 */
exports.read = function read (datafile) {

  // create a stream for the data - more performance on large files
  var fileStream = fs.createReadStream(datafile, {
    encoding: 'utf8'
  });

  // we want to read the stream line by line
  var lineStream = readline.createInterface({
    input: fileStream
  });

  // set line handler
  lineStream.on('line', exports.onLine);

  // EOF handler
  fileStream.on('end', function closeStreams () {

    // closing both streams
    lineStream.close();
    fileStream.destroy();

    // send status
    process.send('handler:done');
  });
};

// set message event handler to listen on parent process
process.on('message', exports.read);
