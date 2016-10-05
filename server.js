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
        }
        if (!error) {
            //cheerio loads html to prepare for dom manipulation
            var $ = cheerio.load(html);

            //variables for holding data
            var title, tag;
            var paragraphs = [];
            var code = [];
            var json = []

            $('body').children().filter(function produceSections(index, element) {
                var data = $(element);
                var next = $(element[index + 1])
                var length = json.length;

                if (data.is('h1') || data.is('h2')|| data.is('h3') || data.is('h4') ||data.is('h5') && data.text()) {
                    json.push({
                        title: data.text(),
                        tag: data.text().replace(/[^0-9a-zA-Z]/g, ''),
                        paragraphs: [{
                            code:[]
                        }]
                    })
                }

                if (data.is('p') && data.text()) {
                    //bold: css('font-weight') == '700'
                    if (data.children().css('color') == '#ff0000') {
                            json[length - 1].paragraphs[0].code.push(
                                data.text()
                            );
                    } else {
                        json[length - 1].paragraphs.push({
                            text: data.html()
                        });
                    }
                }
            })

            Underscore.each(json, function(section){
                Underscore.each(section.paragraphs, function(paragraph){
                    if(paragraph.code){
                        paragraph.code = paragraph.code.join('\n').replace('UTF-8', 'UTF-8\n');
                    }
                    if(paragraph.text){
                        
                    }
                })
            })


        }
        fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err) {
                //use file system to write, output to output.json on root
                console.log('File successfully written! - Check your project directory for the output.json file');
            })
            // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
        res.send('Check your console!')

    });
})

switch (env) {
    case 'production':
        console.log('*** PROD ***');
        app.use(express.static(config.root + config.compile.replace('.', '')));
        app.get('/*', function(req, res) {
            res.sendFile(config.root + config.compile.replace('.', '') + 'index.html');
        });
        break;
    default:
        console.log('*** DEV ***');
        app.use(express.static(config.root + config.build.replace('.', '')));
        app.use(express.static(config.root + config.src.replace('.', '') + 'app/'));
        app.use(express.static(config.root));
        app.use(express.static(config.root + config.components.dir));
        app.get('/*', function(req, res) {
            res.sendFile(config.root + config.build.replace('.', '') + 'index.html');
        });
        break;
}

app.listen(port);
console.log('Listening on port ' + port + '...');