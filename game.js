var levelHeight;
var levelWidth;

var backgroundTile = 0;
var tileSize = 33;

var tileGrid = [];
var tempGrid = [];
var moveGrid = [];

var characterPos;
var characterSprite = "fighter2.png";

// move or inspect on mouse click
var mouseMode = "move"

var loaded = false;
var doneMoving = true;

var gold = 0;
var fame = 0;
var inventory = [];

var tileTypes = [];
var entities = [];

var entityTypes = [];
entityTypes[0] = {name:"gold", solid: false};
entityTypes[1] = {name:"container", solid: true};
entityTypes[2] = {name:"item", solid: false};
entityTypes[3] = {name:"npc", solid:true};
entityTypes[4] = {name:"decor", solid:false};

var tempSolid = [];

var renderer = new PIXI.autoDetectRenderer(2 * tileSize , 2 * tileSize, {backgroundColor:"0x444444"});
renderer.roundPixels = true;
var stage = new PIXI.Container();
var tileLayer = new PIXI.Container();
var highlightLayer = new PIXI.Container();
var entityLayer = new PIXI.Container();
var charLayer = new PIXI.Container();
var overLayer = new PIXI.Container();
stage.addChild(tileLayer);
stage.addChild(highlightLayer);
stage.addChild(entityLayer);
stage.addChild(charLayer);
stage.addChild(overLayer);

//var bunny = null;
var charSprite = null;
var highlightBox = new PIXI.Graphics();
var entitySprites = [];
var shadows = [];
var messages = [];

var music;
var sound = 1;

resourceLoader();

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
		
	$.ajax({url: "map1.xml", success: loadMap, cache: false});
	
	//Make arrow keys move character
	$(window).keypress(function(e) {
	  if (loaded && doneMoving) {
       	var ev = e || window.event;
       	var key = ev.keyCode || ev.which;
       	if (key == "38")
       		moveChar(characterPos[0], characterPos[1] - 1);
		if (key == "40")
			moveChar(characterPos[0], characterPos[1] + 1);
		if (key == "37")
			moveChar(characterPos[0] - 1, characterPos[1]);
		if (key == "39")
			moveChar(characterPos[0] + 1, characterPos[1]);
	  }
	});
	
	$("#game-area-wrapper canvas").mousedown(function(e){ e.preventDefault(); });

	$("#game-area-wrapper canvas").click(function(e){
		var xClickPos = Math.floor((e.pageX - this.offsetLeft) / tileSize);
    	var yClickPos = Math.floor((e.pageY - this.offsetTop) / tileSize);
    	if (xClickPos > levelWidth - 1)
    		xClickPos--;
    	if (yClickPos > levelHeight - 1)
    		yClickPos--;
		console.log("x: " + xClickPos + "y: " + yClickPos);
		inspectTile(xClickPos, yClickPos);
		if (doneMoving) {
			moveTo(xClickPos, yClickPos);
			highlightBox.position.x = xClickPos * tileSize;
			highlightBox.position.y = yClickPos * tileSize - 1;
			highlightBox.visible = true;
		}
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

function loadMap(xml) {
	var title = $(xml).find('title').text();
	$("#top-menu h3").text(title);
	levelHeight = $(xml).find('levelHeight').text();
	levelWidth = $(xml).find('levelWidth').text();
	renderer.resize(levelWidth * tileSize + 3, levelHeight * tileSize + 3);
	backgroundTile = $(xml).find('backgroundTile').text();
	playMusic($(xml).find('music').text());

	//Set spawn point
	var spawnX = parseInt($(xml).find('spawnX').text());
	var spawnY = parseInt($(xml).find('spawnY').text());
	characterPos = [spawnX,spawnY];
	
	//Load entities
	var boolTypes = ['solid','active'];
	var intTypes = ['quantity','gold'];
	$(xml).find('entities').children().each(function(i) {
		var entity = {};
		entity.actions = []
		 $.each(this.attributes, function(index, attrib){
     		var name = attrib.name;
     		var value = attrib.value;
     		if (boolTypes.indexOf(name) != -1) {
     			if (value == 'true')
     				entity[name] = true;
     			else
     				entity[name] = false;
     		} else if (intTypes.indexOf(name) != -1) {
     			entity[name] = parseInt(value);
     		} else {
     			entity[name] = value;
     		}
		});
		$(this).find('actions').children().each(function(i) {
			console.log($(this).text());
			var action = {};
			action.text = $(this).text();
			$.each(this.attributes, function(index, attrib){
     			action[attrib.name] = attrib.value;
     		});
			//var action
			entity['actions'].push(action);
		});
		entities.push(entity);
	});
	
	//Load tiletypes
	$(xml).find('tileTypes').children().each(function(i) {
		var tileType = {};
		 $.each(this.attributes, function(index, attrib){
     		var name = attrib.name;
     		var value = attrib.value;
     		if (boolTypes.indexOf(name) != -1) {
     			if (value == 'true')
     				tileType[name] = true;
     			else
     				tileType[name] = false;
			} else if (intTypes.indexOf(name) != -1) {
     			tileType[name] = parseInt(value);
     		} else {
     			tileType[name] = value;
     		}
		});
		tileTypes[tileType.index] = tileType;		
	});
	
	var rawMap = $(xml).find('map').text();
	console.log(rawMap);
	var rows  = rawMap.split("\n");  
	for (var i=0;i<rows.length;i++) {
		var values = rows[i].split(",");
		tileGrid[i] = values;
		moveGrid.push([]);
		for (var j=0;j<values.length;j++) {
			//tileGrid[i][j] = values[j];
			if (tileTypes[values[j]].solid) {
				moveGrid[i].push(1);
			} else {
				moveGrid[i].push(0);
			}
		}
	}
	// Switch x and y values
	var newArray = tileGrid[0].map(function(col, i) { 
  		return tileGrid.map(function(row) { 
    		return row[i] 
  		})
	});
	tileGrid = newArray;
	drawTiles();
	//drawEntities();
	$("#gold-count").text(gold);
	loaded = true;
}

function drawTiles() {
	
	PIXI.loader.load(function (loader, resources) {
		for (var i=0;i<tileGrid.length;i++) {
			for (var j=0;j<tileGrid[i].length;j++) {
				var texture = new PIXI.Texture.fromImage('t-' + tileGrid[i][j] + '.png');
				var tile = new PIXI.Sprite(texture);
				tile.position.x = i * tileSize + 2;
				tile.position.y = j * tileSize + 2;
				tile.scale.x = 1;
				tile.scale.y = 1;
				if (tileTypes[tileGrid[i][j]].z == 0) {
					tileLayer.addChild(tile);
				} else {
					overLayer.addChild(tile);
				}
			}
		}
		
		var blurFilter = new PIXI.filters.BlurFilter();
        blurFilter.blur    = .5;
        blurFilter.enabled = true;
        
        var colorMatrix = new PIXI.filters.ColorMatrixFilter();
 		colorMatrix.brightness(0);
		
		for (var i=0;i<entities.length;i++) {
			var texture = new PIXI.Texture.fromImage(entities[i].sprite);
			entitySprites[i] = new PIXI.Sprite(texture);
			entitySprites[i].position.x = entities[i].posX * tileSize + Math.round(tileSize/2) + 1;
			entitySprites[i].position.y = entities[i].posY * tileSize + Math.round(tileSize/2) + 1;
			if (entities[i].hasOwnProperty('randomOffset')) {
				entitySprites[i].position.x += getRandomInt(0,entities[i].randomOffset * 2) - entities[i].randomOffset;
				entitySprites[i].position.y += getRandomInt(0,entities[i].randomOffset * 2) - entities[i].randomOffset;
			}
			entitySprites[i].scale.x = 1;
			entitySprites[i].scale.y = 1;
			entitySprites[i].anchor.x = 0.5;
			entitySprites[i].anchor.y = 0.5;
			//shadows[i] = entitySprites[i];
			entityLayer.addChild(entitySprites[i]);
			shadows[i] = new PIXI.Sprite(texture);
			shadows[i].position.x = entitySprites[i].position.x;
			shadows[i].position.y = entitySprites[i].position.y + 5;
			shadows[i].anchor.x = 0.5;
			shadows[i].anchor.y = 0.5;
			shadows[i].alpha = 0.3;
			shadows[i]._tint = 0x000000;
			shadows[i].filters = [colorMatrix,blurFilter];
			entityLayer.addChild(shadows[i]);
			entityLayer.swapChildren(entitySprites[i], shadows[i]);
		}

		charSprite = new PIXI.Sprite(resources.charSprite.texture);

		charSprite.position.x = characterPos[0] * tileSize + Math.round(tileSize/2) + 2;
	    charSprite.position.y = characterPos[1] * tileSize + Math.round(tileSize/2) + 2;
	    
	    charSprite.anchor.x = 0.5;
	    charSprite.anchor.y = 0.5;
	    
	    charLayer.addChild(charSprite);

		highlightBox.lineStyle(1, 0xDEDE39);
		highlightBox.drawRect(2, 2, tileSize, tileSize);
		highlightBox.visible = false;
		highlightLayer.addChild(highlightBox);
		
	    // kick off the animation loop (defined below)
	    animate();
	});
}

function moveChar(charX, charY) {
	console.log("Moving to " + charX + "," + charY)
	if (!loaded)
		return;
	if (charY < 0 || charX < 0) {
		console.log("Out of bounds " + movePos[0] + "," + movePos[1]);
		return;
	}
	if (charY >= levelHeight || charX >= levelWidth) {
		console.log("Out of bounds " + movePos[0] + "," + movePos[1]);
		return;
	}
	if (tileTypes[tileGrid[charX][charY]].solid) {
		console.log("Solid at " + charX + "," + charY);
		return;
	}
	if (updateEntities([charX,charY])) {
		characterPos = [charX,charY];
		console.log("Moved to " + characterPos[0] + "," + characterPos[1]);
	}
}

function updateEntities(movePos) {
	var movedChar = true;
	for (var i=0;i<entities.length;i++) {
		if (entities[i].posX == movePos[0] && entities[i].posY == movePos[1] && entities[i].active) {
			console.log("Entity interaction!");
			if (entityTypes[entities[i].type].name == "gold") {
				addGold(entities[i].quantity);
				//if (entities[i].name == "Gold") {
					//gold = gold + entities[i].quantity;
					//showMessage("gold +" + entities[i].quantity);
				//}
				entities[i].active = false;
				playSound('sounds/coins.mp3');
			}
			if (entityTypes[entities[i].type].name == "item") {
				var itemQuantity = 1;
				if (entities[i].hasOwnProperty("quantity")) {
					itemQuantity = entities[i].quantity;
				}
				//inventory.push({name: entities[i].name});
				//drawInv();
				//showMessage("item +" + entities[i].name);
				addItem(entities[i].name, itemQuantity);
				entities[i].active = false;
				playSound('sounds/bag-open.mp3');

			}
			if (entityTypes[entities[i].type].name == "container") {
				var opened = false;
				if (entities[i].hasOwnProperty("item")) {
					if (entities[i].hasOwnProperty("quantity")) {
						addItem(entities[i].item, entities[i].quantity);
					} else {
						addItem(entities[i].item);
					}
					delete entities[i].item;
					opened = true;
				}
				if (entities[i].hasOwnProperty("gold")) {
					addGold(entities[i].gold);
					delete entities[i].gold;
					opened = true;
				}
				//$("#entity-" + i + " img").attr("src", entities[i].sprite2);
				var texture = new PIXI.Texture.fromImage(entities[i].sprite2);
				entitySprites[i].texture = texture;
				if (opened)
					playSound('sounds/chest-open.mp3');
			}
			if (entityTypes[entities[i].type].name == "decor") {
				playSound('sounds/crunch.mp3', 200);
			}
			if (entityTypes[entities[i].type].name == "npc") {
				playSound('sounds/grunt.mp3', 200);
			}
			if (entityTypes[entities[i].type].solid) {
				console.log(entities[i].posX + " " + entities[i].posY);
				moveGrid[entities[i].posY][entities[i].posX] = 1;
				tempGrid = [entities[i].posX, entities[i].posY];
				movedChar = false;
				doneMoving = true;
			}
			if (entities[i].hasOwnProperty('actions')) {
				var actions = entities[i].actions;
				for (var j=0;j<actions.length;j++) {
					if (actions[j].trigger == 'interact') {
						doAction(actions[j].action, entities[i].posX, entities[i].posY, actions[j].text)
					}
				}
			}
		}
		if (!entities[i].active)
			$("#entity-" + i).fadeOut();
			
	}
	return movedChar;
}

function isSolid(tileID) {
	if(tileID == 1 || tileID == 2 || tileID == 3)
		return true;
	return false;
}

function addGold(amount, display = true) {
	gold = gold + amount;
	$("#gold-count").text(gold);
	if (display)
		showMessage("gold +" + amount);
}

function addItem(name, quantity = 1) {
	inventory.push({name: name, quantity: quantity});
	drawInv();
	if (quantity > 1) {
		showMessage("item +" + name + "x" + quantity);
	} else {
		showMessage("item +" + name);
	}
}

function drawInv() {
	$("#inventory").empty();
	for(var i=0;i<inventory.length;i++) {
		$("#inventory").append("<div class='item'>" + inventory[i].name + "</div>");
	}
}

function showMessage(text, posX = charSprite.position.x, posY = charSprite.position.y, type = 1) {
	var text;
	if (type == 1) 
		text = new PIXI.Text(text,{fontFamily : 'Lucida Console, Monaco, monospace', fontSize: 12, fill : 0xDEDE39, align : 'center', dropShadow: true, dropShadowDistance: 1,});
	if (type == 2)
		text = new PIXI.Text(text,{fontFamily : 'Arial, Gadget, sans-serif', fontSize: 16, fill : 0xFFFFFF, align : 'center', dropShadow: true, dropShadowDistance: 1,});
	text.position.x = posX;
	text.position.y = posY;
	if (messages.length > 0) {
		if (messages[messages.length - 1].position.y == charSprite.position.y) {
			text.position.y = charSprite.position.y + 15;
		}
	}
	text.anchor.x = 0.5;
	text.anchor.y = 0.5;
	messages.push(text);
	stage.addChild(messages[messages.length - 1]);
}

function inspectTile(xPos, yPos) {
	for (var i=0;i<entities.length;i++) {
		if (entities[i].posX == xPos && entities[i].posY == yPos) {
			console.log(entities[i].name + " at " + xPos + "," + yPos);
		}
	}
	var tileID = tileGrid[xPos][yPos];
	console.log(tileTypes[tileID].name + "(" + tileID + ") Solid: " + tileTypes[tileID].solid)
}

function moveTo(xPos, yPos, entityID = null) {
	if (entityID) {
		//get entityPos
	} else {
		var easystar = new EasyStar.js();
        easystar.setGrid(moveGrid);
        easystar.setAcceptableTiles([0]);
        
        //If next to solid entity, interact instead of pathfinding
        if (Math.abs(characterPos[0] - xPos) == 1 && characterPos[1] == yPos && checkForEntity(xPos, yPos)) {
        	moveChar(xPos, yPos);
        	return;
        }
        if (Math.abs(characterPos[1] - yPos) == 1 && characterPos[0] == xPos && checkForEntity(xPos, yPos)) {
        	moveChar(xPos, yPos);
        	return;
        }
        easystar.findPath(characterPos[0], characterPos[1], xPos, yPos, function( path ) {
        	try {
        		if (path[1] != null) {
        			moveChar(path[1].x, path[1].y);
        			doneMoving = false;
        		}
        	}
        	catch(err) {
        		console.log('Invalid path;');
        		return;
        	}
       		if (path[2] != null && !doneMoving) {
    			setTimeout( function() {
    				moveTo(xPos, yPos);
  				}, 200);
  			} else {
  				doneMoving = true;
  			}
		});
		easystar.calculate();
		if (tempGrid.length > 0) {
			moveGrid[tempGrid[1]][tempGrid[0]] = 0;
			tempGrid = [];
		}
	}
}

function checkForEntity(x, y) {
	console.log("Checking...!");
	for (var i=0;i<entities.length;i++) {
		if (entities[i].posX == x && entities[i].posY == y && entities[i].active && entityTypes[entities[i].type].solid) {
			return true;
		}
	}
	return false;
}

function playSound(fileLoc, delay = 0) {
	var audio = new Audio(fileLoc);
	audio.volume = 0.5 + (getRandomInt(0, 5)/10);
	audio.volume *= sound;
	audio.playbackRate = 1 + ((getRandomInt(0, 4) - 2)/10);
	setTimeout(function() { audio.play(); }, delay);
	//audio.play();
}

function playMusic(fileLoc) {
	music = new Audio(fileLoc);
	music.loop = true;
	if (getCookie('music') != 'mute')
		music.play();
}

function doAction(type, x, y, text, repeat = false) {
	if (type == "say") {
		showMessage(text, x * tileSize + tileSize/2, y * tileSize, 2);
	}
}

function animate() {
	    // start the timer for the next animation loop
	    requestAnimationFrame(animate);
	
	    //charSprite.rotation += 0.01;

	    var charSpriteX = (charSprite.position.x - 2 - Math.round(tileSize/2))/tileSize;
	    var charSpriteY = (charSprite.position.y - 2 - Math.round(tileSize/2))/tileSize;
	    if (Math.abs(charSpriteX - characterPos[0]) > 0.01) {
	    	charSprite.position.x += (characterPos[0] - charSpriteX) * 4.0;
	    	//console.log('Moving x: ' + (characterPos[0] - charSpriteX));
	    	//console.log(characterPos[0] + ' ' + charSpriteX);
	    	//charSprite.position.x = Math.round(charSprite.position.x);
	    } else if (charSprite.position.x != characterPos[0] * tileSize + Math.round(tileSize/2) + 2) {
	    	charSprite.position.x = characterPos[0] * tileSize + Math.round(tileSize/2) + 2;
	    }
	    
	    if (charSpriteY != characterPos[1]) {
	    	charSprite.position.y += (characterPos[1] - charSpriteY) * 4.0;
	    	//console.log('Moving y: ' + (characterPos[1] - charSpriteY));
	    	//charSprite.position.y = Math.round(charSprite.position.y);
	    }
	    
	    for (var i=0;i<entities.length;i++) {
	    	if (entities[i].active == false && entitySprites[i].visible == true) {
	    		entitySprites[i].alpha += -0.1;
	    		shadows[i].alpha += -0.1;
	    		if (entitySprites[i].alpha < 0.1) {
	    			entitySprites[i].visible == false;
	    			shadows[i].visible == false;
	    		}
	    	}
	    }
	    
	    for (var i=0;i<messages.length;i++) {
			messages[i].alpha += -0.002 * (1/messages[i].alpha);
			if (messages[i].alpha < 0.1) {
				messages[i].visible = false;
			}
		}
		if (messages.length > 0) {
			if (messages[0].visible == false) {
				stage.removeChild(messages[0]);
				messages.splice(0,1);
			}
		}
	    // this is the main render call that makes pixi draw your container and its children.
	    renderer.render(stage);
}

function resourceLoader() {
	
	// Load all sprites (TODO: add entities controlling for duplicates)
	for (var i=0;i<tileTypes.length;i++) {
		PIXI.loader.add('tile' + i, 't-' + i + '.png');
	}
	//for (var i=0;i<entities.length;i++) {
	//	PIXI.loader.add(entities[i].sprite);
	//}
	PIXI.loader.add('charSprite', 'fighter2.png');


	//Load sounds TODO
	
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Modified from http://www.w3schools.com/js/js_cookies.asp (don't hate)
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