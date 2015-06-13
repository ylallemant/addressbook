# [addressbook](https://github.com/ylallemant/addressbook)

[![David](https://img.shields.io/david/ylallemant/addressbook.svg?style=flat)](https://david-dm.org/ylallemant/addressbook)
[![David](https://img.shields.io/david/dev/ylallemant/addressbook.svg?style=flat)](https://david-dm.org/ylallemant/addressbook#info=devDependencies)

Address Book Task (see PDF file): this is about showing off knowledge, I made my best...

here is a solution using only native Node.js modules for the sake of sports - using packages like [express](https://www.npmjs.com/package/express) would be to easy

## Advanced Feature

### Datafile Handling

 - reading datafile with [Stream Module](https://nodejs.org/api/stream.html) line by line - who knows maybe you have some GB address file laying around
 - update data on datafile changes using [fs.watchFile](https://nodejs.org/api/fs.html#fs_fs_watchfile_filename_options_listener)
 - parsing text format entries into an Array of Objects
 - both reading and parsing are done in a child process to avoid blocking
 - entry objects are streamed one by one to the parent process for storage and indexing
 
### Database
 
 - storage and indexing performed by our own "database" modules
 - any insert or index update changes a database revision number
 - detection and filtering of duplicate entries
 - auto indexing on insert
 
### Web Service
 
 - implement simple Web service with the [HTTP Module](https://nodejs.org/api/http.html)
 - opens the broswer on Windows and OSX upon [net::listening event](https://nodejs.org/api/net.html#net_event_listening)
 - cache response for performance based on database revision number
 - caching and debugging can be enabled/disabled [through url query parameters](#query_params)
 

## Installation

    git clone https://github.com/ylallemant/addressbook
    cd addressbook

### Install Dependencies

    npm install
    
### Run Tests

    npm test

### Run Address Book Service

    node lib/addressbook.js [datafile_absolute_path1] [datafile_absolute_path2] ... [datafile_absolute_pathN]

Loads a test datafile if none was provided.

## Web Service

On Windows and OSX the application should open the browser at the correct url when the service is up and running.

Otherwise, here is the url (also logged to the console)

    http://localhost:8080/questions

### <a name="query_params"></a>Query Parameters

#### debug

To make the processing visible, you may add the parameter `debug`

    http://localhost:8080/questions?debug=true
    http://localhost:8080/questions?debug=false (default)

#### cache

Caching can be disabled with the parameter `cache` or the header `Cache-Control: no-cache`

    http://localhost:8080/questions?cache=false
    http://localhost:8080/questions?cache=true (default)
    

------------

Copyright (c) 2015 Yann Lallemant (yann.lallemant@gmx.net)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
