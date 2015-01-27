//placeholders
var START_URL = "http://www.nga.gov/content/ngaweb/collection-search-result.html?artobj_lifespan=1700_2014&artobj_vbnationality=American%2CBritish%2CEnglish%2CFrench%2CItalian&pageNumber=1&lastFacet=artobj_vbnationality";
var TARGET_COUNT = 500;

var casper = require('casper').create();
var fs = require('fs');

var art_json = new Array();
var artist_json = new Array();
var artist = new Array();
var art_links = new Array();
var artist_links = new Array();
var n = 0;

function create_record(){
	var IGNORE_ARTIST = ["British 18th Century", "British 19th Century", "British 20th Century", "American 18th Century", "American 19th Century", "American 20th Century", "French 18th Century", "French 19th Century", "French 20th Century"]
	var record = new Object();	
	record["title"] = document.getElementsByClassName('title')[0].innerHTML
	record["created"] = document.getElementsByClassName('created')[0].innerHTML.replace("c.","").trim()
	record["nationality"] = document.getElementsByClassName('nationality')[0].textContent.split(",")[0]
	record["artist"] = new Array();
	var artist_intro = document.getElementsByClassName('artist-details')[0].getElementsByClassName('artist')
	for(var i=0; i<artist_intro.length; i++){
		try{
				artist_value = artist_intro[i].getElementsByTagName('a')[0].textContent.trim()
				if(IGNORE_ARTIST.indexOf(artist_value)==-1){
				    		record["artist"].push(artist_value)
				  }
		}
		catch(err){continue;}
	}
	record["medium"] = document.getElementsByClassName('medium')[0].innerHTML
	record["dimensions"] = document.getElementsByClassName('dimensions')[0].innerHTML.replace("overall: ","").trim()
	record["collection"] = document.getElementsByClassName('credit')[0].getElementsByTagName('a')[0].textContent
	record["accession"] = document.getElementsByClassName('accession')[0].innerHTML
	try{
		record["onview"] = document.getElementsByClassName('onview')[0].getElementsByTagName('a')[0].href
	}
	catch(err){}
	record["image"] = document.getElementsByClassName('mainImg')[0].src
	other_fields = ["overview","inscription","provenance","history","bibliography"]
	for(var j=0; j<other_fields.length;j++){
		try{
			record[other_fields[j]] = document.getElementById(other_fields[j]).getElementsByTagName('p')[0].textContent.trim().replace(/(?:\\[rn]|[\r\n]+)+/g, "");
		} catch(err){}
	}
	try{
		record["technical_summary"] = document.getElementById("consvNotes").getElementsByTagName('p')[0].textContent.trim().replace(/(?:\\[rn]|[\r\n]+)+/g, "");
	} catch(err){}

	return record
}

function create_artist_record(){
	record = new Object();	
	record["name"] = document.getElementsByClassName('artist')[0].innerHTML
	try{
		var tmp = document.getElementsByClassName('lifespan')[0].innerHTML.split(",")
		record["nationality"] = tmp[0]
		record["lifespan"] = tmp[1].trim()
	}
	catch(err){}
	try{
		record["biography"] = document.getElementById('biography').getElementsByTagName('div')[0].textContent.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
	}
	catch(err){}
	try{
		record["bibliography"] = document.getElementById('bibliography').getElementsByTagName('div')[0].textContent.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
	}
	catch(err){}
	return record
}

function extract_links(){
	var resultjson = new Object();
	resultjson["art_links"] = new Array();
	resultjson["artist_links"] = new Array();
	var list = document.getElementsByClassName('art');
	resultjson["n"] = list.length;
	for(var i=0; i<list.length;i++)
	{
		if(list[i].getElementsByClassName('title')[0].childNodes[0].href)
		{
		resultjson["art_links"].push(list[i].getElementsByClassName('title')[0].childNodes[0].href)
		}
		if(list[i].getElementsByClassName('artist')[0].childNodes[0].href)
		{
			resultjson["artist_links"].push(list[i].getElementsByClassName('artist')[0].childNodes[0].href)
		}
	}

	return resultjson
}

casper.start(START_URL, function() {

	this.then( function(){
			this.waitUntilVisible("li.art", function(){
				    resultjson = this.evaluate(extract_links)
				    n = n + resultjson["n"]
				    art_links = art_links.concat(resultjson["art_links"])
				    for(i=0;i<resultjson["artist_links"].length;i++){
				    	if(artist_links.indexOf(resultjson["artist_links"][i])==-1){
				    		artist_links.push(resultjson["artist_links"][i])
				    	}
				    }
				    //artist_links = artist_links.concat(resultjson["artist_links"])
				    this.echo(n);
				});
		});
	this.repeat(49, function(){
		this.clickLabel("next");
		this.waitWhileVisible("li.art", function(){},function(){}, 50000);
		this.then( function(){
			this.waitUntilVisible("li.art", function(){
				    resultjson = this.evaluate(extract_links)
				    n = n + resultjson["n"]
				    art_links = art_links.concat(resultjson["art_links"])
				    for(i=0;i<resultjson["artist_links"].length;i++){
				    	if(artist_links.indexOf(resultjson["artist_links"][i])==-1){
				    		artist_links.push(resultjson["artist_links"][i])
				    	}
				    }
				    this.echo(n)
				}, function(){}, 500000);
			});
		});
});

casper.then(function() {
	this.eachThen(art_links, function(response) {
        this.thenOpen(response.data , function() {
		    record = this.evaluate(create_record)
		    if(record!=null)
		    	record["url"] = this.getCurrentUrl()
		    require('utils').dump(record)
		    art_json.push(record)
        });
    });
});

casper.then(function() {
	this.eachThen(artist_links, function(response) {
        this.thenOpen(response.data , function() {
		    record = this.evaluate(create_artist_record)
		    if(record!=null)
		    	record["url"] = this.getCurrentUrl()
		    require('utils').dump(record)
		    artist_json.push(record);
        });
    });
});

casper.run(function(){
	 fs.write('json/art.json', JSON.stringify(art_json, null, 2), 'w');
	 fs.write('json/artist.json', JSON.stringify(artist_json, null, 2), 'w');
	 this.exit();
});
//require('utils').dump(