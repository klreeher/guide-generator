'use strict';
var config = require('./gulp.config');

/*
    manage api key - https://console.developers.google.com
    google drive api - https://developers.google.com/drive/v3/reference/
    list files query docs- https://developers.google.com/drive/v3/web/search-parameters
    cheerio reference - https://github.com/cheeriojs/cheerio/blob/master/Readme.md
*/

var express = require('express'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'dev',
    app = express(),
    port = process.env.PORT || 451;

var bodyParser = require('body-parser'), //parses html body
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
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); //parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); //parse application/vnd.api+json as json


app.get('/api/googledocs-folder/:folderID/:token', function(req, res){
    var getFolderContentUrl = "https://www.googleapis.com/drive/v3/files/?q='" + req.params.folderID + "'+in+parents";
    var requestBody = {
        url: getFolderContentUrl,
        headers: {
            'Content-Type': 'text/html',
            'Authorization': 'Bearer ' + req.params.token
        }
    };
    request(requestBody, function(error, response, json){
        if(error){
            console.log('There was an error', error);
            res.send('There was an error retrieving files');
        } else {
            fs.access('generatedGuides', function(err) {
                if (err && err.code === 'ENOENT') {
                    fs.mkdir('generatedGuides');
                }
                fs.writeFile('generatedGuides/navContent.json', '', function(){});
                res.send(json);
            });
        }
    });

});

// scraping endpoint =========================
app.get('/api/googledocs/:docID/:token/:chapter', function(req, res) {
    var getGuideContentUrl = 'https://www.googleapis.com/drive/v3/files/' + req.params.docID + '/export?mimeType=text/plain';
    var getGuideTitleUrl = 'https://www.googleapis.com/drive/v3/files/' + req.params.docID;
    var getHTML = {
        url: getGuideContentUrl,
        headers: {
            'Content-Type': 'text/html',
            'Authorization': 'Bearer ' + req.params.token
        }
    };
    var getGuideTitle = {
        url: getGuideTitleUrl,
        headers: {
            'Content-Type': 'text/html',
            'Authorization': 'Bearer ' + req.params.token
        }
    };
    var parsedHtml;
    request(getHTML, function(error, response, html) {
        if (error) {
            console.log('There was an error', error);
            res.send('There was an error parsing your guide');
        } else {
            html = html.replace(/”|“/g, '"');
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
                    codeToHighlight = $(this).text();
                    var jsCode = Prism.highlight(codeToHighlight, Prism.languages.javascript);
                    $(this).html(jsCode);
                    $(this).addClass('language-javascript');
                }
            })
            $('h2').each(function(){
                var name = $(this).text();
                var tag = $(this).attr('id');
                anchorTags.push({name:name, tag:tag})
            });
            $('a').each(function(){
                var stringUrl = $(this).attr('href'); //use to check if value exists in url;

                //Error Reporting
                console.log('\x1b[36m%s\x1b[0m', 'link to guide. check here if there is an error:');
                console.log('\x1b[36m%s\x1b[0m', 'https://docs.google.com/document/d/' + req.params.docID);
                console.log('');
                console.log("\x1b[35m", 'link causing issue:');
                console.log("\x1b[35m", stringUrl);
                console.log("\x1b[0m", '');

                var url = $(this).attr('href').split('/');
                var sref;
                if(stringUrl.indexOf('api-reference') < 0 && stringUrl.indexOf('ordercloud' > -1)){
                    var anchorLink = null;
                    if(url[5].indexOf('#') > -1) anchorLink = url[5].split('#');  //determine whether link also includes anchor tag

                    if(!anchorLink) sref = url[3] + "({sectionID:'" + url[4] + "', guideID:'" + url[5] + "'})"; 
                    if(anchorLink) sref = url[3] + "({sectionID:'" + url[4] + "', guideID:'" + anchorLink[0] + "', '#':'" + anchorLink[1] + "'})";
                }
                if(stringUrl.indexOf('api-reference') > -1) {
                    var apiLink = url[3].split('#');
                    if(apiLink[1]) sref = apiLink[0] + "({'#':'" + apiLink[1] + "'})";
                }
                $(this).attr('ui-sref', sref);
                console.log('***************************************************');
                console.log('');
                console.log('');
                $(this).attr('href', '#');
            });

            parsedHtml = $.html();
        }
        request(getGuideTitle, function(error, response, html){
            if(html.error){
                console.log('There was an error', error);
                console.log(html);
                console.log('*****************************************\n*****************************************');
            } else{
                var guideTitle = JSON.parse(html).name;
                var guideID = guideTitle.toLowerCase().replace(/ /g, '-');
                var guideContent = {
                    name: guideTitle,
                    id: JSON.parse(html).id,
                    html: parsedHtml
                };

                var chapterMapping = {};
                chapterMapping['product-catalog-management'] = 'Product Catalog Management';
                chapterMapping['buyer-and-seller-organization-management'] = 'Buyer and Seller Organization Management';
                chapterMapping['order-management'] = 'Order Management';

                var navContent = {
                    name:guideTitle, chapter: chapterMapping[req.params.chapter], 
                    stateLink:{name:'use-case-guides.content', params:{sectionID: req.params.chapter, guideID:guideID}},
                    anchorTags:anchorTags
                };
                guideContent.navContent = navContent;
                guideContent.chapter = navContent.chapter;
            }
            fs.access('generatedGuides', function(err) {
                if (err && err.code === 'ENOENT') {
                    fs.mkdir('generatedGuides');
                }
                fs.writeFile('generatedGuides/' + guideID + '.tpl.html', '<div class="oc-docs-content-wrap"><section class="guides-section">', function(err){
                    if(!err){
                        fs.appendFile('generatedGuides/' + guideID + '.tpl.html', parsedHtml, function(err2){
                            if(!err2){
                                fs.appendFile('generatedGuides/' + guideID + '.tpl.html', '</section></div>', function(){});
                            }
                        });
                    }
                    });
                fs.appendFile('generatedGuides/navContent.json', JSON.stringify(navContent), function(){});
                fs.appendFile('generatedGuides/navContent.json', ',', function(){});
                res.status(200).json({ guideContent:guideContent});
            });
            
        });
    });
});

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