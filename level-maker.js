var tileSize = 33;
var levelWidth = 8;
var levelHeight = 8;
var bgTileID = 0;
var loaded = false;
var tileSelection = 0;

var tileList = [];

var tileGrid = [];

var renderer = new PIXI.autoDetectRenderer(8 * tileSize + 3 , 8 * tileSize + 3, {backgroundColor:"0x444444"});
renderer.roundPixels = true;
var stage = new PIXI.Container();
var backgroundLayer = new PIXI.Container();
var tileLayer = new PIXI.Container();
var highlightLayer = new PIXI.Container();
var entityLayer = new PIXI.Container();
var charLayer = new PIXI.Container();
var overLayer = new PIXI.Container();
var messages = new PIXI.Container();
stage.addChild(backgroundLayer);
stage.addChild(tileLayer);
stage.addChild(highlightLayer);
stage.addChild(entityLayer);
stage.addChild(charLayer);
stage.addChild(overLayer);
stage.addChild(messages);

//PIXI.loader.add("tiles/hyptosis-grass.png");
var loader = PIXI.loader;
var loader = new PIXI.loaders.Loader(); // you can also create your own if you want

var highlightBox = new PIXI.Graphics();

var music;
var sound = 1;
var sounds = {};

$(document).ready(function(){
	
	//document.body.appendChild(renderer.view);
	$('#game-area-wrapper').append(renderer.view);
	
	if (getCookie('music') != '') {
		$('#mute-music img').css('opacity', 0.4);
		//music.pause();
	}
	if (getCookie('sound') != '') {
		$('#mute-sound img').css('opacity', 0.4);
		sound = 0;
	}

	$("#whForm").submit(function(e) {
		e.preventDefault();
        levelWidth = $("#levelWidth").val();
        levelHeight = $("#levelHeight").val();
        bgTileID = $("#bgTileID").val();
        //console.log($("#tileGridJSON").val());
        tileGrid = JSON.parse($("#tileGridJSON").val());
        renderer.resize(levelWidth * tileSize + 3, levelHeight * tileSize + 3);
        createTileGrid();
        drawTiles();
    });

	$.when (
		$.getJSON('tiles.json', {}, function() {}),
		$.getJSON('entities.json', {}, function() {})
		//$.getJSON('character.json', {}, function() {}),
		//$.getJSON('map1.json', {}, function() {})
		//$.ajax({url: "map1.xml", success: function() {}, cache: false})
	).done(function(arg1, arg2){//arg1, arg2){
		loadTiles(arg1[0]);
		loadEntities(arg2[0]);
    	//loadCharacter(arg1);
    	//loadMapJson(arg2);
    	//loadMap(arg3);
	});
	
	//Make arrow keys move character
	$(window).keypress(function(e) {
	  //if (loaded && character.moveX == -1) {
       	var ev = e || window.event;
       	var key = ev.keyCode || ev.which;
       	if (key == "38") {
       	}
		if (key == "40") {
       	}
		if (key == "37") {
       	}
		
		if (key == "39") {
       	}
	 // }
	});
	
	//No right click on canvas (Add custom menu?)
	$('#game-area-wrapper canvas').bind('contextmenu', function(e){
    	return false;
	}); 

	$("#game-area-wrapper canvas").click(function(e){
		var xClickPos = Math.floor((e.pageX - this.offsetLeft) / tileSize);
    	var yClickPos = Math.floor((e.pageY - this.offsetTop) / tileSize);
    	if (xClickPos > levelWidth - 1)
    		xClickPos--;
    	if (yClickPos > levelHeight - 1)
    		yClickPos--;
    	var text = "x: " + xClickPos + "y: " + yClickPos;
		//console.log("x: " + xClickPos + "y: " + yClickPos);
		var message = '<div style="color:rgb(255, 255, 121);">' + text +'</div>';
		$('#message-log').append(message);
		$('#message-log').scrollTop($('#message-log')[0].scrollHeight);
		if (loaded) {
			tileGrid[xClickPos][yClickPos] = tileSelection;
			console.log(tileGrid[xClickPos][yClickPos]);
			createTileGrid();
			drawTiles();
		}
		//TODO: Optional inspect
		//inspectTile(xClickPos, yClickPos);
		/*
		if (entities[characterID].moveX == -1) {
			entities[characterID].moveX = xClickPos;
			entities[characterID].moveY = yClickPos;
			highlightBox.position.x = xClickPos * tileSize;
			highlightBox.position.y = yClickPos * tileSize - 1;
			highlightBox.visible = true;
		} */
	});
	$("#tileList").click(function(e){
		console.log(e.target.tagName);
		var liID;
		if (e.target.tagName == "IMG") {
			liID = e.target.parentElement.id;
		} else {
			liID = e.target.id;
		}
		tileSelection = parseInt(liID.substr(5));
		$("#tileSelection").html('<img src="' + tileList[tileSelection].path + '">');
	});
	$("#mute-music").click(function(e){
		if (music.paused) {
			music.play();
			$('#mute-music img').css('opacity', 1.0);
			setCookie('music', '');
		} else {
			music.pause();
			$('#mute-music img').css('opacity', 0.4);
			setCookie('music', 'mute');
		}
	});
	$("#mute-sound").click(function(e){
		if (sound == 0) {
			sound = 1;
			$('#mute-sound img').css('opacity', 1.0);
			setCookie('sound', '');
		} else {
			sound = 0;
			$('#mute-sound img').css('opacity', 0.4);
			setCookie('sound', '0');
		}
	});
}); 

function loadTiles(tileListJSON) {
	console.log("loadTiles()");
	//console.log(tileList);
	tileList = tileListJSON;
	for (var i=0;i<tileList.length;i++) {
		var tileInfo = '<li class="tileInfo" id="tile-' + i + '"><img src="'+ tileList[i].path + '"> ' + i + ' ' + tileList[i].name + '<button>+</button></li>';
		loader.add(tileList[i].name,tileList[i].path);
		$("#tileList").append(tileInfo);
	}
	//loader.add('grass',"tiles/hyptosis-grass.png");
	//loader.once('complete',onAssetsLoaded);
	loader.on('complete', onLoad);
	loader.load();
	console.log(loader);
}

function loadEntities(entityList) {
	console.log("loadEntities()");

	animate();
}

function onLoad() {
	console.log("onLoad()");

	loaded = true;
	createTileGrid();
	drawTiles();
}

function createTileGrid() {
	for (var i=0;i<levelWidth;i++) {
		if (typeof tileGrid[i] === 'undefined') {
			tileGrid.push([]);
		}
		for (var j=0;j<levelHeight;j++) {
			if (typeof tileGrid[i][j] === 'undefined') {
				tileGrid[i][j] = 0;
			}
		}
	}
	$("#tileGridJSON").val(JSON.stringify(tileGrid));
}

function drawTiles() {
	console.log("drawTiles()");
	if (loaded){
	backgroundLayer.removeChildren();
	backgroundLayer.cacheAsBitmap = false;
	for (var i=0;i<levelWidth;i++) {
			for (var j=0;j<levelHeight;j++) {
				//var colorMatrix = new PIXI.filters.ColorMatrixFilter();
 				//Add slight random +/- contrast to tiles
 				//colorMatrix.contrast((getRandomInt(0,10))/100, true);
 				//colorMatrix.hue(getRandomInt(0,6)-3, true);
				
				var tile = new PIXI.Sprite(loader.resources[tileList[bgTileID].name].texture);
				tile.position.x = i * tileSize + Math.floor(tileSize/2) + 2;
				tile.position.y = j * tileSize + Math.floor(tileSize/2) + 2;
				tile.scale.x = 1;
				tile.scale.y = 1;
				tile.anchor.x = 0.5;
				tile.anchor.y = 0.5;
				/*
				if (tileTypes[tileGrid[i][j]].hasOwnProperty("randomrotate")) {
					var rotateDeg = getRandomInt(0,3) * 90;
					tile.rotation = rotateDeg * Math.PI / 180;
				} */
				//tile.filters = [colorMatrix];
				//if (tileTypes[tileGrid[i][j]].z == 0) {
				backgroundLayer.addChild(tile);
				//} else {
				//overLayer.addChild(tile);
				//}
				if (tileGrid[i][j] != 0) {
					var tile2 = new PIXI.Sprite(loader.resources[tileList[tileGrid[i][j]].name].texture);
					tile2.position.x = i * tileSize + Math.floor(tileSize/2) + 2;
					tile2.position.y = j * tileSize + Math.floor(tileSize/2) + 2;
					tile2.scale.x = 1;
					tile2.scale.y = 1;
					tile2.anchor.x = 0.5;
					tile2.anchor.y = 0.5;
					//tile2.filters = [colorMatrix];
					backgroundLayer.addChild(tile2);
				}
			}
	}
	backgroundLayer.cacheAsBitmap = true;
	}
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Modified from http://www.w3schools.com/js/js_cookies.asp
function setCookie(cname, cvalue, years = 5) {
    var d = new Date();
    d.setTime(d.getTime() + (years*365*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function openTab(e, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabName).style.display = "block";
    e.currentTarget.className += " active";
}

function animate() {
	    // start the timer for the next animation loop
	    requestAnimationFrame(animate);

	    // this is the main render call that makes pixi draw your container and its children.
	    renderer.render(stage);
}