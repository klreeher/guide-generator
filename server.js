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
    Underscore = require('underscore');

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
    var apiurl = 'https://www.googleapis.com/drive/v3/files/' + req.params.docID + '/export?mimeType=text/html'
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
        }
        if (!error) {
            //cheerio loads html to prepare for dom manipulation
            var $ = cheerio.load(html);
            //variables for holding data
            var title, tag;
            var json = [];
            //variables for establishing code position
            var count,
                codeSet,
                codePoint;
            $('body').children().filter(function produceSections(index, element) {
                var data = $(element);
                var length = json.length;
                //get headings and anchor tags
                if (data.is('h1') || data.is('h2') || data.is('h3') || data.is('h4') || data.is('h5') && data.text()) {
                    count = 0;
                    codeSet = false;
                    json.push({
                        title: data.text(),
                        tag: data.text().replace(/[^0-9a-zA-Z]/g, ''),
                        paragraphs: []
                    })
                }
                //get ordered list elements
                if(data.is('ol') && data.text()){
                    var arr = [];
                    data.children('li').each(function(){
                        arr.push($(this).html())
                    })
                    json[length - 1].paragraphs.push({
                        orderedList:arr
                    })
                }
                //get unordered list elements
                if(data.is('ul') && data.text()){
                    var arr = [];
                    data.children('li').each(function(){
                        arr.push($(this).html())
                    })
                    json[length - 1].paragraphs.push({
                        unOrderedList:arr
                    })
                }
                if (data.is('p') && data.text()) {
                    //get code
                    if (data.children().css('color') == '#ff0000') {
                        if (!codeSet) {
                            codeSet = true;
                            codePoint = count;
                            json[length - 1].paragraphs.push({
                                code: ""
                            })
                        }
                        if(data.text() == 'Content-Type: application/json; charset=UTF-8'){
                            json[length - 1].paragraphs[codePoint].code += data.text() + "\n\n";
                        }else{
                            json[length - 1].paragraphs[codePoint].code += data.text() + "\n";
                        }
                    } 
                    else {
                        data.children('span').each(function(){
                            if($(this).css('font-weight') == 700){
                                $(this).wrap('<strong></strong>');
                            }
                            if($(this).css('font-style') == 'italic'){
                                $(this).wrap('<em></em>');
                            }
                        })
                        if(data.children().children('a').attr('href')){
                            var originalUrl = data.children().children('a').attr('href').replace('https://www.google.com/url?q=', '').split('&sa=')[0];
                            data.children().children('a').attr('href', originalUrl);
                        }
                        json[length - 1].paragraphs.push({
                            text: data.html()
                        });
                    }
                    count++;
                }
            })
        }
        fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
            //use file system to write, output to output.json on root for testing purpose
            console.log('File successfully written! - Check your project directory for the output.json file');
        })
        res.send({ parsedhtml: json })
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