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
    var getGuideContentUrl = 'https://www.googleapis.com/drive/v3/files/' + req.params.docID + '/export?mimeType=text/plain';
    var getGuideTitleUrl = 'https://www.googleapis.com/drive/v3/files/' + req.params.docID;
    var getHTML = {
        url: getGuideContentUrl,
        headers: {
            'Content-Type': 'text/html',
            'Authorization': 'Bearer ' + req.params.token
        }
    }
    var getGuideTitle = {
        url: getGuideTitleUrl,
        headers: {
            'Content-Type': 'text/html',
            'Authorization': 'Bearer ' + req.params.token
        }
    }
    var parsedHtml;
    request(getHTML, function(error, response, html) {
        if (error) {
            console.log('There was an error', error);
            res.send('There was an error parsing your guide');
        } else {
            var anchorTags = [];
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
            $('h2').each(function(){
                var name = $(this).text();
                var tag = $(this).attr('id');
                anchorTags.push({name:name, tag:tag})
            })
            parsedHtml = $.html()
        }
        request(getGuideTitle, function(error, response, html){
            if(error){
                console.log('There was an error', error);
                res.send('There was an error parsing your guide');
            } else{
                var guideTitle = JSON.parse(html).name;
                var guideID = guideTitle.toLowerCase().replace(/ /g, '-');
                
                var guideContent = {
                    guideTitle:guideTitle,
                    parsedHtml:parsedHtml
                }
                var navContent = {
                    name:guideTitle, chapter:'Base Use Cases', 
                    stateLink:{name:'guides',params:{sectionID:'base-use-cases', guideID:guideID}},
                    anchorTags:anchorTags
                }
            }
            res.status(200).json({ guideContent:guideContent, navContent: JSON.stringify(navContent) })
        }) 
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