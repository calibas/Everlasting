//var tileSize = 32;
//var gridLine = 1;
//var levelTitle = "Generic Level";
//var levelMusic = "music/Enchanted Festival.mp3";
//var width = 8;
//var height = 8;
//var bgColor = 0x444444;
//var padding = 4;
var bgTileID = 0;
var loaded = false;
var tileSelection = 0;

var tileList = [];
var spriteList = [];

//var tileMap = [];

var tileSet = [];

var entities = [];
var events = [];
var factions = {};

var level = {
		"title" : "Generic Level",
		"height" : 8,
		"width" : 8,
		"backgroundTile" : 0,
		"spawnX" : 1,
		"spawnY" : 1,
		"music" : "music/Enchanted Festival.mp3",
		"tileSize" : 32,
		"gridLine" : 1,
		"bgColor" : 0x444444,
		"padding" : 4,
		"tileMap" : [],
		"tileSet" : tileSet,
		"entities" : entities,
		"events" : events
	};

var Entity = function(obj) {
	this.name = obj.name || "generic entity";
	this.posX = obj.posX;
	this.posY = obj.posY;
	this.moveX = obj.moveX || -1;
	this.moveY = obj.moveY || -1;
	this.moveSpeed = obj.moveSpeed || 10;
	this.target = -1;
	this.sprite = obj.sprite || null;
	this.sprite2 = obj.sprite2 || null;
	this.animateSprite = obj.animateSprite ? true : false;
	this.shadow = obj.shadow ? true : false;
	//console.log(obj.shadow + " " + this.shadow);
	this.solid = obj.solid ? true : false;
	this.active = obj.active || true;
	this.type = obj.type || "decor";
	this.quantity = obj.quantity || 1;
	this.randomOffset = obj.randomOffset || 0;
	this.sound = obj.sound || null;
	this.item = obj.item || null;
	this.gold = obj.gold || null;
	this.faction = obj.faction || null;
	this.hp = obj.hp || 1;
	this.sightRange = obj.sightRange || 0;
	this.attackSkill = obj.attackSkill || 1;
	this.damage = obj.damage || 1;
	this.damageReduction = obj.damageReduction || 0;
	this.attackRange = obj.attackRange || 1;
	this.attackSpeed = obj.attackSpeed || 10;
	this.defense = obj.defense || 5;
	//"none", "attack", "farm", "merchant", 
	this.currentAction = obj.currentAction || "none";
	this.lastActionTick = 0;
	this.actions = obj.actions || [];
	this.animation = {"time" : 0, "duration" : 0, "type" : "sine", "direction" : [0,0]};

	entities.push(this);
};

var Faction = function(name, f = [], n = [], h = []) {
	this.friendly = f;
	this.neutral = n;
	this.hostile = h;

	factions[name] = this;
}

var TileType = function(obj) {
	this.name = obj.name || "generic type";
	this.solid = obj.solid || false;
	this.z = obj.z || 0;
	this.sprite = obj.sprite || "";
	this.rotate = obj.rotate || 0;
	this.hue = obj.hue || 0;
	this.brightness = obj.brightness || 1.0;
	this.contrast = obj.contrast || 0;

	tileSet.push(this);
}


new TileType({"name" : "stone floor", "hue" : 50,"brightness" : 1.5, "contrast" : -0.5, "sprite" : "tiles/hyptosis-stone-floor.png"});
new TileType({"name" : "stone floor", "sprite" : "tiles/hyptosis-stone-floor.png"});
new TileType({"name" : "grass", "sprite" : "tiles/hyptosis-grass.png"});
new TileType({"name" : "brick wall", "sprite" : "tiles/hyptosis-brickwall.png"});

new Entity({"name" : "kobold", "posX" : 4, "posY" : 4, "sprite" : "sprites/kobold.png", "shadow": true});

//{"name" : "stone floor", "hue" : 50,"brightness" : 1.5, "contrast" : -0.5, "sprite" : "tiles/hyptosis-stone-floor.png"}

var renderer = new PIXI.autoDetectRenderer(8 * (level.tileSize + level.gridLine) + (2 * level.padding) , 8 * (level.tileSize + level.gridLine) + (2 * level.padding), {backgroundColor:level.bgColor});
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
//var loader = PIXI.loader;
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

	$("#whForm").change(function(e) {
		e.preventDefault();
        level.width = $("#levelWidth").val();
        level.height = $("#levelHeight").val();
        level.gridLine = parseInt($("#gridLine").val());
        level.bgColor = parseInt($("#bgColor").val(), 16);
        level.padding = parseInt($("#levelPadding").val());
        //bgTileID = $("#bgTileID").val();
        //console.log($("#tileGridJSON").val());
        //level.tileMap = JSON.parse($("#tileGridJSON").val());
        //console.log(bgColor);
        renderer.backgroundColor = level.bgColor;
        renderer.resize(level.width * (level.tileSize + level.gridLine) + ( 2 * level.padding), level.height * (level.tileSize + level.gridLine) + ( 2 * level.padding));

        createTileGrid();
        drawTiles();
    });

    $("#tileSet").change(function(){
    	for (var i=0;i<tileSet.length;i++) {
    		tileSet[i].brightness = parseFloat($("#tileset-" + i + " .tsBright").val());
    		tileSet[i].hue = parseInt($("#tileset-" + i + " .tsHue").val());
    		tileSet[i].contrast = parseFloat($("#tileset-" + i + " .tsContrast").val());
    		tileSet[i].sprite = $("#tileset-" + i + " .tsSprite").val();
    		tileSet[i].z = parseInt($("#tileset-" + i + " .tsZ").val());
    		tileSet[i].solid = JSON.parse($("#tileset-" + i + " .tsSolid").val());
    		tileSet[i].rotate = parseInt($("#tileset-" + i + " .tsRotate").val());
    		console.log(tileSet[i]);
    	}
    	refreshTileSetImg();
    	createTileGrid();
        drawTiles();
    });

	$.when (
		$.getJSON('tile-list.json', {}, function() {}),
		$.getJSON('sprite-list.json', {}, function() {}),
		$.getJSON('entities.json', {}, function() {})
		//$.getJSON('character.json', {}, function() {}),
		//$.getJSON('map1.json', {}, function() {})
		//$.ajax({url: "map1.xml", success: function() {}, cache: false})
	).done(function(arg1, arg2, arg3){//arg1, arg2){
		loadTiles(arg1[0]);
		loadSprites(arg2[0]);
		loadEntities(arg3[0]);
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
		var xClickPos = Math.floor((e.pageX - this.offsetLeft) / (level.tileSize + level.gridLine));
    	var yClickPos = Math.floor((e.pageY - this.offsetTop) / (level.tileSize + level.gridLine));
    	if (xClickPos > level.width - 1)
    		xClickPos--;
    	if (yClickPos > level.height - 1)
    		yClickPos--;
    	var text = "x: " + xClickPos + "y: " + yClickPos;
		//console.log("x: " + xClickPos + "y: " + yClickPos);
		var message = '<div style="color:rgb(255, 255, 121);">' + text +'</div>';
		$('#message-log').append(message);
		$('#message-log').scrollTop($('#message-log')[0].scrollHeight);
			if (loaded) {
				level.tileMap[xClickPos][yClickPos] = tileSelection;
				//console.log(tileMap[xClickPos][yClickPos]);
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

	var dragging = false;
	$("#game-area-wrapper canvas")
	.mousedown(function(e) {
		dragging = true;
	})
	.mousemove(function(e) {
		if (loaded && dragging) {
			console.log(dragging);
				var xClickPos = Math.floor((e.pageX - this.offsetLeft) / (level.tileSize + level.gridLine));
    			var yClickPos = Math.floor((e.pageY - this.offsetTop) / (level.tileSize + level.gridLine));
    			if(level.tileMap[xClickPos][yClickPos] != tileSelection) {
    				level.tileMap[xClickPos][yClickPos] = tileSelection;
					//console.log(tileMap[xClickPos][yClickPos]);
					createTileGrid();
					drawTiles();
    			}
		}
 	})
	.mouseup(function() {
		dragging = false;
	});

	$("#tileSet").click(function(e){
		var liID;
		if (e.target.tagName == "LI") {
			liID = e.target.id;
			tileSelection = parseInt(liID.substr(8));
			$("#tileSelection").html(createTileSetImg(tileSelection));
		} else if (e.target.tagName == "IMG"){
			liID = e.target.parentElement.id;
			tileSelection = parseInt(liID.substr(8));
			$("#tileSelection").html(createTileSetImg(tileSelection));
		}
		//tileSelection = parseInt(liID.substr(8));
		//console.log(tileSelection);
		//$("#tileSelection").html('<img src="' + tileSet[tileSelection].sprite + '">');
	});
	$("#tileList").click(function(e){
		if (e.target.tagName == "BUTTON") {
			var liID = e.target.parentElement.id.substr(5);
			console.log(e.target.parentElement.id.substr(5));
			new TileType({"name" : tileList[liID].name, "sprite" : tileList[liID].path});
			updateTileSet();
		}
		//tileSelection = parseInt(liID.substr(5));
		//$("#tileSelection").html('<img src="' + tileList[tileSelection].path + '">');
	});
	$("#levelJSONSubmit").click(function(e){
		level = JSON.parse($("#levelJSONinput").val());
		tileSet = [];
		for (var i=0;i<level.tileSet.length;i++) {
			new TileType(level.tileSet[i]);
		}
		entities = []
		for (var i=0;i<level.entities.length;i++) {
			new Entity(level.entities[i]);
		}
		//level.tileMap = invertGrid(level.tileMap);
		level.tileSet = tileSet;
		level.entities = entities;
		console.log(level);
		renderer.backgroundColor = level.bgColor;
        renderer.resize(level.width * (level.tileSize + level.gridLine) + ( 2 * level.padding), level.height * (level.tileSize + level.gridLine) + ( 2 * level.padding));

		updateTileSet();
		createTileGrid();
		drawTiles();
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
		var tileInfo = '<li class="tileInfo" id="tile-' + i + '"><img src="'+ tileList[i].path + '"> ' + i + ' ' + tileList[i].name + '<button>Add</button></li>';
		loader.add(tileList[i].path, tileList[i].path);
		$("#tileList").append(tileInfo);
	}
}

function loadSprites(spriteListJSON) {
	console.log("loadSprites()");
	spriteList = spriteListJSON;
	for (var i=0;i<spriteList.length;i++) {
		var spriteInfo = '<li class="spriteInfo" id="sprite-' + i + '"><img src="'+ spriteList[i].path + '"> ' + i + ' ' + spriteList[i].name + '<button>Add</button></li>';
		loader.add(spriteList[i].path, spriteList[i].path);
		$("#spriteList").append(spriteInfo);
	}
}

function loadEntities(entityList) {
	console.log("loadEntities()");
	for (var i=0;i<entities.length;i++) {
		var entityInfo = '<li class="entityInfo" id="entity-' + i + '"><img src="'+ entities[i].sprite + '"> ' + i + ' ' + entities[i].name + '<button>+</button></li>';
		//loader.add(tileList[i].path, tileList[i].path);
		$("#entities").append(entityInfo);
	}
	//onLoad();
	loader.on('complete', onLoad);
	loader.load();
}

function updateTileSet() {
	$("#tileSet").empty();
	for (var i=0;i<tileSet.length;i++) {
		var tileSetInfo = '<li class="tileSetInfo" id="tileset-' + i + '">' + createTileSetImg(i) + ' ' + i + ' ' + tileSet[i].name;
		tileSetInfo += '<button onclick="toggleTileSettings(' + i + ')">+</button>';
		tileSetInfo += '<div class="tileSetting" id="tileSetting-' + i + '" style="display:none;">'
		tileSetInfo += 'Bright:<input type="text" class="tsBright" value="' + tileSet[i].brightness + '">'
		tileSetInfo += 'Hue:<input type="text" class="tsHue" value="' + tileSet[i].hue + '">';
		tileSetInfo += 'Contrast:<input type="text" class="tsContrast" value="' + tileSet[i].contrast + '"><br>'
		tileSetInfo += 'Sprite:<input type="text" class="tsSprite" value="' + tileSet[i].sprite + '"><br>';
		tileSetInfo += 'Z:<input type="text" class="tsZ" value="' + tileSet[i].z + '">';
		tileSetInfo += 'Solid:<input type="text" class="tsSolid" value="' + tileSet[i].solid + '">';
		tileSetInfo += 'Rotate:<input type="text" class="tsRotate" value="' + tileSet[i].rotate + '">';
		tileSetInfo += '</div></li>';
		console.log("tileSetInfo");
		//loader.add(i,tileSet[i].sprite);
		$("#tileSet").append(tileSetInfo);
	}
	$("#tileGridJSON").val(JSON.stringify(level, stringifyReplacer));
}

function createTileSetImg(tsID) {
	var imgHTML = '<img class="tileSetImg" data-id="' + tsID + '" src="'+ tileSet[tsID].sprite + '" style="filter:contrast(' + ((tileSet[tsID].contrast < -1.0) ? 0 : tileSet[tsID].contrast + 1.0) * 100 + '%) hue-rotate(' + tileSet[tsID].hue + 'deg) brightness(' + tileSet[tsID].brightness * 100 + '%);">';
	return imgHTML;
}

function refreshTileSetImg() {
	console.log("refreshTileSetImg()");
	$(".tileSetImg").each(function(index) {
		var tsID = parseInt($(this).attr("data-id"));
		$(this).replaceWith(createTileSetImg(tsID));
		//console.log($(this).attr("data-id"));
	});
}

function onLoad() {
	console.log("onLoad()");

	updateTileSet();
	createTileGrid();
	loaded = true;
	//console.log(level.tileMap);
	//animate();
	drawTiles();
	$("#tileSelection").html(createTileSetImg(tileSelection));
}

function createTileGrid() {
	for (var i=0;i<level.width;i++) {
		if (typeof level.tileMap[i] === 'undefined') {
			level.tileMap.push([]);
		}
		for (var j=0;j<level.height;j++) {
			if (typeof level.tileMap[i][j] === 'undefined') {
				level.tileMap[i][j] = 0;
			}
		}
	}
	$("#tileGridJSON").val(JSON.stringify(level, stringifyReplacer));
}

function drawTiles() {
	console.log("drawTiles()");
	if (loaded){
		backgroundLayer.removeChildren();
		backgroundLayer.cacheAsBitmap = false;
		tileLayer.removeChildren();
		charLayer.removeChildren();
		tileLayer.cacheAsBitmap = false;
		var halfPadding = Math.floor(level.padding/2);
		for (var i=0;i<level.width;i++) {
			for (var j=0;j<level.height;j++) {
				//var colorMatrix = new PIXI.filters.ColorMatrixFilter();
 				//Add slight random +/- contrast to tiles
 				//colorMatrix.contrast((getRandomInt(0,10))/100, true);
 				//colorMatrix.hue(getRandomInt(0,6)-3, true);
				
				//var texture = new PIXI.Texture.fromImage(tileSet[bgTileID].sprite);
				//console.log(loader);
				var tile = new PIXI.Sprite(loader.resources[tileSet[bgTileID].sprite].texture);
				tile.position.x = i * (level.tileSize + level.gridLine) + Math.floor((level.tileSize + level.gridLine)/2) + level.padding;
				tile.position.y = j * (level.tileSize + level.gridLine) + Math.floor((level.tileSize + level.gridLine)/2) + level.padding;
				tile.scale.x = 1;
				tile.scale.y = 1;
				tile.anchor.x = 0.5;
				tile.anchor.y = 0.5;


				var contrast = new PIXI.filters.ColorMatrixFilter();
 				//Add slight random +/- contrast to tiles
 				contrast.contrast(tileSet[bgTileID].contrast, true);
 				var hue = new PIXI.filters.ColorMatrixFilter();
 				hue.hue(tileSet[bgTileID].hue);
 				var brightness = new PIXI.filters.ColorMatrixFilter();
 				brightness.brightness(tileSet[bgTileID].brightness);
				tile.filters = [contrast, hue, brightness];

				//if (tileTypes[tileGrid[i][j]].z == 0) {
				backgroundLayer.addChild(tile);
				//} else {
				//overLayer.addChild(tile);
				//}
				if (level.tileMap[i][j] != 0) {
					//var texture2 = new PIXI.Texture.fromImage(tileSet[level.tileMap[i][j]].sprite);
					//var tile2 = new PIXI.Sprite(texture2);
					var tile2 = new PIXI.Sprite(loader.resources[tileSet[level.tileMap[i][j]].sprite].texture);
					tile2.position.x = i * (level.tileSize + level.gridLine) + Math.floor((level.tileSize + level.gridLine)/2) + level.padding;
					tile2.position.y = j * (level.tileSize + level.gridLine) + Math.floor((level.tileSize + level.gridLine)/2) + level.padding;
					tile2.scale.x = 1;
					tile2.scale.y = 1;
					tile2.anchor.x = 0.5;
					tile2.anchor.y = 0.5;

					var contrast2 = new PIXI.filters.ColorMatrixFilter();
 					//Add slight random +/- contrast to tiles
 					contrast2.contrast(tileSet[level.tileMap[i][j]].contrast, true);
 					var hue2 = new PIXI.filters.ColorMatrixFilter();
 					hue2.hue(tileSet[level.tileMap[i][j]].hue);
 					var brightness2 = new PIXI.filters.ColorMatrixFilter();
 					brightness2.brightness(tileSet[level.tileMap[i][j]].brightness);
					tile2.filters = [contrast2, hue2, brightness2];

					//tile2.filters = [colorMatrix];
					tileLayer.addChild(tile2);
				}
			}
		}

		for (var i=0;i<entities.length;i++) {
			entities[i].spriteContainer = new PIXI.Container();
			console.log(entities[i].name);
			
			// Animated sprites
			if (entities[i].animateSprite) {
				console.log("animating " + entities[i].name);
				var frames = entities[i].sprite.split(',');
				var textures = [];
				for (var f=0;f<frames.length;f++) {
					textures.push(PIXI.Texture.fromFrame(frames[f]));
				}
				entitySprite = new PIXI.extras.MovieClip(textures);
				entitySprite.animationSpeed = 0.1;
				entitySprite.play();
			} else {
				var texture = new PIXI.Texture.fromImage(entities[i].sprite);
				entitySprite = new PIXI.Sprite(texture);
			}
			entities[i].spriteContainer.position.x = entities[i].posX * (level.tileSize + level.gridLine) + Math.floor((level.tileSize + level.gridLine)/2) + level.padding;
			entities[i].spriteContainer.position.y = entities[i].posY * (level.tileSize + level.gridLine) + Math.floor((level.tileSize + level.gridLine)/2) + level.padding;
			//entitySprite.position.x = entities[i].posX * tileSize + Math.round(tileSize/2) + 1;
			//entitySprite.position.y = entities[i].posY * tileSize + Math.round(tileSize/2) + 1;
			if (entities[i].randomOffset) {
				entitySprite.position.x += getRandomInt(0,entities[i].randomOffset * 2) - entities[i].randomOffset;
				entitySprite.position.y += getRandomInt(0,entities[i].randomOffset * 2) - entities[i].randomOffset;
			}
			//entitySprite.position.x = entities[i].spriteContainer.position.x;
			//entitySprite.position.y = entities[i].spriteContainer.position.y;
			entitySprite.scale.x = 1;
			entitySprite.scale.y = 1;
			entitySprite.anchor.x = 0.5;
			entitySprite.anchor.y = 0.5;
			if (entities[i].shadow) {
				//Blur & brightness filters for shadows
			var blurFilter = new PIXI.filters.BlurFilter();
        	blurFilter.blur    = 0.5;
        	//blurFilter.enabled = true;
        	var colorMatrix = new PIXI.filters.ColorMatrixFilter();
 			colorMatrix.brightness(0);

				shadow = new PIXI.Sprite(texture);
				shadow.position.x = entitySprite.position.x + 2;
				shadow.position.y = entitySprite.position.y + 2;
				shadow.anchor.x = 0.5;
				shadow.anchor.y = 0.5;
				shadow.alpha = 0.3;
				shadow._tint = 0x000000;
				shadow.filters = [colorMatrix,blurFilter];
				entities[i].shadow = shadow;
				entities[i].spriteContainer.addChild(entities[i].shadow);
			}
			entities[i].spriteObj = entitySprite;
			entities[i].spriteContainer.addChild(entities[i].spriteObj);
			charLayer.addChild(entities[i].spriteContainer);
		}
	backgroundLayer.cacheAsBitmap = true;
	tileLayer.cacheAsBitmap = true;
	animate();
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

function openTab(e, tabName, context) {
    // Declare all variables
    var i, tabcontent, tablinks;

    console.log(e.currentTarget);
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

function openTab2(e, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    console.log(e.currentTarget);
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent2");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks2");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabName).style.display = "block";
    e.currentTarget.className += " active";
}

function openTab3(e, tabName) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent3");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks3");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    e.currentTarget.className += " active";
}

function toggleTileSettings(elementID) {
	$('#tileSetting-' + elementID).toggle();
}

function stringifyReplacer(key, value) {
  // Filtering out properties
  //if (key == "tileSet") {
  //  return JSON.stringify(tileSet);
  //}
  if (key == "spriteContainer") {
  //	return false;
    return false;
  }
  if (key == "spriteObj") {
  //	return false;
    return false;
  }
  if (key == "shadow" && typeof value === "boolean") {
  //	return false;
    return value;
  }
  if (key == "shadow") {
  //	return false;
    return null;
  }
  //if (key == "events") {
  //  return JSON.stringify(events);
  //}
  return value;
}

function invertGrid(grid) {
	var newGrid = grid[0].map(function(col, i) { 
  		return grid.map(function(row) { 
    		return row[i]; 
  		})
	});
	return newGrid;
}

function animate() {
	    // start the timer for the next animation loop
	    requestAnimationFrame(animate);


	    // this is the main render call that makes pixi draw your container and its children.
	    renderer.render(stage);
	    //backgroundLayer.cacheAsBitmap = true;
	    //tileLayer.cacheAsBitmap = true;
}