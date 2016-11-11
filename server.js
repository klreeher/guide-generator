'use strict';
var config = require('./gulp.config');

var express = require('express'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'dev',
    app = express(),
    port = process.env.PORT || 451;

var mongoose = require('mongoose'), //mongoose for mongo db
    bodyParser = require('body-parser'), //parses html body
    request = require('request'), //make authenticated http requests
    fs = require('fs'), //internal file system, enables saving files
    cheerio = require('cheerio'), //jquery-like functions to filter response bodies
    Underscore = require('underscore'),
    stripBom = require('strip-bom'),
    marked = require('marked'),
    Prism = require('prismjs')
    ;
require('prismjs/components/prism-http');

// configuration ==============================
mongoose.connect('mongodb://cramirez:fails345@ds017256.mlab.com:17256/cat-feeder'); //connect to mongoDB database
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); //parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); //parse application/vnd.api+json as json

// scraping endpoint =========================
app.get('/api/googledocs/:docID/:token', function(req, res) {
    var apiurl = 'https://www.googleapis.com/drive/v3/files/' + req.params.docID + '/export?mimeType=text/plain'
    var options = {
        url: apiurl,
        headers: {
            'Content-Type': 'text/html',
            'Authorization': 'Bearer ' + req.params.token
        }
    }

    request(options, function(error, response, html) {
        if (error) {
            console.log('There was an error', error);
            res.send('There was an error parsing your guide');
        } else {
            var $ = cheerio.load(marked(stripBom(html)));
            $('pre').each(function(){
                if($(this).text().indexOf('Authentication: Bearer put_access_token_here') > -1){
                    var codeToHighlight = $(this).text();
                    var httpCode = Prism.highlight(codeToHighlight, Prism.languages.http);
                    $(this).html(httpCode);
                    $(this).addClass('language-http');
                }
                else{
                    var codeToHighlight = $(this).text();
                    var jsCode = Prism.highlight(codeToHighlight, Prism.languages.javascript);
                    $(this).html(jsCode);
                    $(this).addClass('language-javascript');
                }
            })
            res.status(200).json({parsedhtml: $.html() })
        } 
    });
})

switch (env) {
    case 'production':
        console.log('*** PROD ***');
        app.use(express.static(config.root + config.compile.replace('.', '')));
        app.get('/*', function (req, res) {
            res.sendFile(config.root + config.compile.replace('.', '') + 'index.html');
        });
        break;
    default:
        console.log('*** DEV ***');
        app.use(express.static(config.root + config.build.replace('.', '')));
        app.use(express.static(config.root + config.src.replace('.', '') + 'app/'));
        app.use(express.static(config.root));
        app.use(express.static(config.root + config.components.dir));
        app.get('/*', function (req, res) {
            res.sendFile(config.root + config.build.replace('.', '') + 'index.html');
        });
        break;
}

app.listen(port);
console.log('Listening on port ' + port + '...');