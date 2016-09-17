var levelHeight;
var levelWidth;

var backgroundTile = 0;
var tileSize = 33;

var tileGrid = [];
var tempGrid = [];
var moveGrid = [];

var character = {sprite:'sprites/fighter2.png', name:'Shanna', moveX:-1, moveY: -1, doneMoving: true, gold: 0, fame: 0, inventory: [], damage: 2, hp:15, faction: 'human', actions: []};

// move or inspect on mouse click
var mouseMode = "move"

var loaded = false;

var fame = 0;
var inventory = [];

var tileTypes = [];
var entities = [];

var actions = [];
var events = [];
/*
var entityTypes = [];
entityTypes[0] = {name:"gold", solid: false};
entityTypes[1] = {name:"container", solid: true};
entityTypes[2] = {name:"item", solid: false};
entityTypes[3] = {name:"npc", solid:true};
entityTypes[4] = {name:"decor", solid:false};
entityTypes[5] = {name:"door", solid:true};
*/

var renderer = new PIXI.autoDetectRenderer(2 * tileSize , 2 * tileSize, {backgroundColor:"0x444444"});
renderer.roundPixels = true;
var stage = new PIXI.Container();
var tileLayer = new PIXI.Container();
var highlightLayer = new PIXI.Container();
var entityLayer = new PIXI.Container();
var charLayer = new PIXI.Container();
var overLayer = new PIXI.Container();
var messages = new PIXI.Container();
stage.addChild(tileLayer);
stage.addChild(highlightLayer);
stage.addChild(entityLayer);
stage.addChild(charLayer);
stage.addChild(overLayer);
overLayer.addChild(messages);

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
		
	$.ajax({url: "map1.xml", success: loadMap, cache: false});
	
	//Make arrow keys move character
	$(window).keypress(function(e) {
	  if (loaded && character.moveX == -1) {
       	var ev = e || window.event;
       	var key = ev.keyCode || ev.which;
       	if (key == "38")
       		moveChar(character.x, character.y - 1);
		if (key == "40")
			moveChar(character.x, character.y + 1);
		if (key == "37")
			moveChar(character.x - 1, character.y);
		if (key == "39")
			moveChar(character.x + 1, character.y);
	  }
	});
	
	//$("#game-area-wrapper canvas").mousedown(function(e){ e.preventDefault(); });

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
		console.log("x: " + xClickPos + "y: " + yClickPos);
		inspectTile(xClickPos, yClickPos);
		if (character.moveX == -1) {
			//findPath(xClickPos, yClickPos);
			character.moveX = xClickPos;
			character.moveY = yClickPos;
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
	var spawnX = parseInt($(xml).find('spawnX').text(), 10);
	var spawnY = parseInt($(xml).find('spawnY').text(), 10);
	//characterPos = [spawnX,spawnY];
	character.x = spawnX;
	character.y = spawnY;
	
	//Load entities
	var boolTypes = ['solid','active'];
	var intTypes = ['quantity','gold', 'posX', 'posY'];
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
     			entity[name] = parseInt(value, 10);
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
			if (action.trigger == "entityNear") {
				new Action(entity, "entityNear", null, action.text, true);
			}
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
     			tileType[name] = parseInt(value, 10);
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
	resourceLoader();
	drawTiles();
	//drawEntities();
	$("#gold-count").text(character.gold);
	GameTimer.registerService(eachTick);
	GameTimer.domReady();
	loaded = true;
}

function drawTiles() {
	
	PIXI.loader.load(function (loader, resources) {
		for (var i=0;i<tileGrid.length;i++) {
			for (var j=0;j<tileGrid[i].length;j++) {
				var colorMatrix = new PIXI.filters.ColorMatrixFilter();
 				//Add slight random +/- contrast to tiles
 				colorMatrix.contrast((getRandomInt(0,10))/100, true);
 				//colorMatrix.hue(getRandomInt(0,6)-3, true);
				var texture = new PIXI.Texture.fromImage(tileTypes[tileGrid[i][j]].sprite);
				var tile = new PIXI.Sprite(texture);
				tile.position.x = i * tileSize + Math.abs(tileSize/2) + 2;
				tile.position.y = j * tileSize + Math.abs(tileSize/2) + 2;
				tile.scale.x = 1;
				tile.scale.y = 1;
				tile.anchor.x = 0.5;
				tile.anchor.y = 0.5;
				if (tileTypes[tileGrid[i][j]].hasOwnProperty("randomrotate")) {
					rotateDeg = getRandomInt(0,3) * 90;
					tile.rotation = rotateDeg * Math.PI / 180;
				}
				tile.filters = [colorMatrix];
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
			entities[i].spriteContainer = new PIXI.Container();
			if (entities[i].hasOwnProperty('animate')) {
				console.log("animating " + entities[i].name);
				var frames = entities[i].sprite.split(',');
				var textures = [];
				for (var f=0;f<frames.length;f++) {
					textures.push(PIXI.Texture.fromFrame(frames[f]));
				}
				//var texture = new PIXI.Texture.fromImage(entities[i].sprite);
				//entitySprite = new PIXI.Sprite(texture);
				//frames.push(PIXI.Texture.fromFrame('rollSequence00' + val + '.png'));
				entitySprite = new PIXI.extras.MovieClip(textures);
				entitySprite.animationSpeed = 0.1;
				entitySprite.play();
			} else {
				var texture = new PIXI.Texture.fromImage(entities[i].sprite);
				entitySprite = new PIXI.Sprite(texture);
			}
			entitySprite.position.x = entities[i].posX * tileSize + Math.round(tileSize/2) + 1;
			entitySprite.position.y = entities[i].posY * tileSize + Math.round(tileSize/2) + 1;
			if (entities[i].hasOwnProperty('randomOffset')) {
				entitySprite.position.x += getRandomInt(0,entities[i].randomOffset * 2) - entities[i].randomOffset;
				entitySprite.position.y += getRandomInt(0,entities[i].randomOffset * 2) - entities[i].randomOffset;
			}
			entitySprite.scale.x = 1;
			entitySprite.scale.y = 1;
			entitySprite.anchor.x = 0.5;
			entitySprite.anchor.y = 0.5;
			//shadows[i] = entitySprites[i];
			//entityLayer.addChild(entitySprites[i]);
			if (entities[i].hasOwnProperty('shadow')) {
				shadow = new PIXI.Sprite(texture);
				shadow.position.x = entitySprite.position.x;
				shadow.position.y = entitySprite.position.y + 5;
				shadow.anchor.x = 0.5;
				shadow.anchor.y = 0.5;
				shadow.alpha = 0.3;
				shadow._tint = 0x000000;
				shadow.filters = [colorMatrix,blurFilter];
				entities[i].shadow = shadow;
				entities[i].spriteContainer.addChild(entities[i].shadow);
			}
			//entityLayer.addChild(shadows[i]);
			//entityLayer.swapChildren(entitySprites[i], shadows[i]);\
			entities[i].spriteObj = entitySprite;
			entities[i].spriteContainer.addChild(entities[i].spriteObj);
			entityLayer.addChild(entities[i].spriteContainer);
		}
		var texture = new PIXI.Texture.fromImage(character.sprite);
		character.spriteObj = new PIXI.Sprite(texture);

		character.spriteObj.position.x = character.x * tileSize + Math.round(tileSize/2) + 2;
	    character.spriteObj.position.y = character.y * tileSize + Math.round(tileSize/2) + 2;
	    
	    character.spriteObj.anchor.x = 0.5;
	    character.spriteObj.anchor.y = 0.5;
	    
	    charLayer.addChild(character.spriteObj);

		highlightBox.lineStyle(1, 0xDEDE39);
		highlightBox.drawRect(2, 2, tileSize, tileSize);
		highlightBox.visible = false;
		highlightLayer.addChild(highlightBox);
		
	    // kick off the animation loop (defined below)
	    animate();
	});
}

function moveChar(moveX, moveY) {
	console.log("Moving to " + moveX + "," + moveY)
	if (!loaded)
		return;
	if (moveY < 0 || moveX < 0) {
		console.log("Out of bounds!");
		return;
	}
	if (moveY >= levelHeight || moveX >= levelWidth) {
		console.log("Out of bounds!");
		return;
	}
	if (tileTypes[tileGrid[moveX][moveY]].solid) {
		console.log("Solid at " + moveX + "," + moveY);
		return;
	}
	if (entityIneract([moveX,moveY])) {
		character.x = moveX;
		character.y = moveY;
		console.log("Moved to " + character.x + "," + character.y);
		if (character.x == character.moveX && character.y == character.moveY) {
			character.moveX = -1;
		}
	}
}

function entityIneract(movePos) {
	//Returns false if character movement blocked
	var movedChar = true;
	for (var i=0;i<entities.length;i++) {
		if (entities[i].posX == movePos[0] && entities[i].posY == movePos[1] && entities[i].active) {
			console.log("Entity interaction!");
			if (entities[i].type == "gold") {
				addGold(entities[i].quantity);
				//if (entities[i].name == "Gold") {
					//gold = gold + entities[i].quantity;
					//showMessage("gold +" + entities[i].quantity);
				//}
				entities[i].active = false;
				playSound('sounds/coins.mp3');
			}
			if (entities[i].type == "item") {
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
			if (entities[i].type == "container") {
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
				entities[i].spriteObj.texture = texture;
				if (opened)
					playSound('sounds/chest-open.mp3');
			}
			if (entities[i].type == "decor") {
				if (entities[i].hasOwnProperty("sound"))
					playSound(entities[i].sound, 200);
			}
			if (entities[i].type == "npc") {
				if (entities[i].hasOwnProperty("sound"))
					playSound(entities[i].sound, 200);
				if (isHostile(entities[i].faction, character.faction)) {
					new Action(character, "attack", entities[i], null, true);
					//new Action(entities[i], "attack", character, null, true);
					//attack(entities[i], character);
				}
			}
			if (entities[i].type == "door") {
				if(checkInventory("key", true)) {
					var texture = new PIXI.Texture.fromImage(entities[i].sprite2);
					entities[i].spriteObj.texture = texture;
					entities[i].solid = false;
					movedChar = false;
					//character.doneMoving = true;
					character.moveX = -1;
					playSound('sounds/opendoor.mp3');
				} else if (entities[i].solid == true){
					playSound('sounds/locked.mp3');
				}
			}
			if (entities[i].solid) {
				console.log("solid at: " + entities[i].posX + " " + entities[i].posY);
				moveGrid[entities[i].posY][entities[i].posX] = 1;
				tempGrid = [entities[i].posX, entities[i].posY];
				movedChar = false;
				//character.doneMoving = true;
				character.moveX = -1;
			}
			if (entities[i].hasOwnProperty('actions')) {
				var actions = entities[i].actions;
				for (var j=0;j<actions.length;j++) {
					if (actions[j].trigger == 'interact') {
						doAction(actions[j].action, entities[i].posX, entities[i].posY, entities[i], actions[j].text)
					}
				}
			}
		}
		if (!entities[i].active) {
			moveGrid[entities[i].posY][entities[i].posX] = 0;
			//$("#entity-" + i).fadeOut();
		}
			
	}
	return movedChar;
}

function attack(actionIndex) {
	console.log("Attacking!");
	var action = actions[actionIndex];
	var roll = getRandomInt(1,20);
	var attackSkill = action.entity.attackSkill || 1;
	var defense = action.target.defense || 10;
	var damage = action.entity.damage || 1;
	var damageReduction = action.target.damageReduction || 0;
	if (roll + attackSkill > defense) {
		action.target.hp -= damage;
		playSound("sounds/sword-strike.mp3");
		showMessage("Hit for " + damage + ". " + action.target.hp + "hp left!");
		showText("-" + damage, 0xDD0000, action.target.spriteObj.x, action.target.spriteObj.y - 10);
		if (action.target.hp < 1) {
			action.target.active = false;
			//moveGrid[action.target.x][action.target.y] = 0;
			showMessage(action.target.name + " died.");
		}
	} else {
		playSound("sounds/miss.mp3");
		showMessage("Miss!");
		showText("miss", 0xDDDDDD, action.target.spriteObj.x, action.target.spriteObj.y - 10);
	}
}

function addGold(amount, display = true) {
	character.gold += amount;
	$("#gold-count").text(character.gold);
	if (display) {
		showMessage("Added " + amount + " gold", 2);
		showText(amount + " gold", 0xDEDE39, character.spriteObj.position.x, character.spriteObj.position.y);
	}
}

function addItem(name, quantity = 1) {
	inventory.push({name: name, quantity: quantity});
	drawInv();
	if (quantity > 1) {
		showMessage("Picked up " + name + " x" + quantity, 2);
		showText(name + " x" + quantity, 0xDEDE39, character.spriteObj.position.x, character.spriteObj.position.y + 15);
	} else {
		showMessage("Picked up " + name, 2);
		showText(name, 0xDEDE39, character.spriteObj.position.x, character.spriteObj.position.y + 15);
	}
}

function checkInventory(itemName, remove = false) {
	for (var i=0;i<inventory.length;i++) {
    	if (inventory[i].name == itemName) {
    		if (remove) {
    			inventory.splice(i, 1);
    			showMessage('Removed ' + itemName, 2);
    			drawInv();
    		}
    		return true;
    	}
  	}
  	return false;
}

function drawInv() {
	$("#inventory").empty();
	for(var i=0;i<inventory.length;i++) {
		$("#inventory").append("<div class='item'>" + inventory[i].name + "</div>");
	}
}

function showMessage(text, type = 1, posX = character.spriteObj.position.x, posY = character.spriteObj.position.y) {
	text = text.charAt(0).toUpperCase() + text.slice(1);
	var message = '<div>' + text +'</div>';
	if (type == 2)
		message = '<div style="color:rgb(255, 255, 121);">' + text +'</div>';
	$('#message-log').append(message);
	$('#message-log').scrollTop($('#message-log')[0].scrollHeight);
	/*
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
	*/
}

function showText(text, color = 0xDEDE39, posX = character.spriteObj.position.x, posY = character.spriteObj.position.y) {
	var message = new PIXI.Text(text,{fontFamily : 'Lucida Console, Monaco, monospace', fontSize: 14, fill : color, align : 'center', dropShadow: true, dropShadowDistance: 2,});
	message.position.x = posX;
	message.position.y = posY;
	message.anchor.x = 0.5;
	message.anchor.y = 0.5;
	messages.addChild(message);
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

function findPath(xPos, yPos, entityID = null) {
	if (entityID) {
		//get entityPos
	} else {
		var easystar = new EasyStar.js();
        easystar.setGrid(moveGrid);
        easystar.setAcceptableTiles([0]);
        
        //If next to solid entity, interact instead of pathfinding
        if (Math.abs(character.x - xPos) == 1 && character.y == yPos && checkForEntity(xPos, yPos)) {
        	moveChar(xPos, yPos);
        	character.moveX = -1;
        	return;
        }
        if (Math.abs(character.y - yPos) == 1 && character.x == xPos && checkForEntity(xPos, yPos)) {
        	moveChar(xPos, yPos);
        	character.moveX = -1;
        	return;
        }
        easystar.findPath(character.x, character.y, xPos, yPos, function( path ) {
        	try {
        		if (path[1] != null) {
        			moveChar(path[1].x, path[1].y);
        		} else {
        			character.moveX = -1;
        			return;
        		}
        	}
        	catch(err) {
        		console.log('Invalid path;');
        		character.moveX = -1;
        		return;
        	}
        	/*
       		if (path[2] != null && !character.doneMoving) {
    			//setTimeout( function() {
    			//	findPath(xPos, yPos);
  				//}, 200);
  			} else {
  				character.doneMoving = true;
  				character.moveX = -1;
  			} */
		});
		easystar.calculate();
		if (tempGrid.length > 0) {
			moveGrid[tempGrid[1]][tempGrid[0]] = 0;
			tempGrid = [];
		}
	}
}

function checkForEntity(x, y) {
	//console.log("Checking...!");
	for (var i=0;i<entities.length;i++) {
		if (entities[i].posX == x && entities[i].posY == y && entities[i].active && entities[i].solid) {
			return entities[i];
		}
	}
	if (character.x == x && character.y == y) {
			return character;
	}
	return false;
}

function isHostile(faction, ownFaction) {
	if (faction == "undead")
		return true;
	if (ownFaction == "undead")
		return true;
	return false;
}

function playSound(fileLoc, delay = 0) {
	if (sounds.hasOwnProperty(fileLoc)) {
		console.log("Playing cached sound.")
		sounds[fileLoc].volume = 0.5 + (getRandomInt(0, 5)/10);
		sounds[fileLoc].volume *= sound;
		sounds[fileLoc].playbackRate = 1 + ((getRandomInt(0, 4) - 2)/10);
		setTimeout(function() { sounds[fileLoc].play(); }, delay);
	} else {
		var audio = new Audio(fileLoc);
		audio.volume = 0.5 + (getRandomInt(0, 5)/10);
		audio.volume *= sound;
		audio.playbackRate = 1 + ((getRandomInt(0, 4) - 2)/10);
		setTimeout(function() { audio.play(); }, delay);
	}
}

function playMusic(fileLoc) {
	music = new Audio(fileLoc);
	music.loop = true;
	if (getCookie('music') != 'mute')
		music.play();
}

var Action = function(entity, type, target = null, data = null, repeat = false) {
	this.entity = entity;
	this.target = target;
	this.type = type;
	this.data = data;
	this.repeat = repeat;
	this.lastRun = 0;
	this.active = true;

	actions.push(this);
}

var EntityAction = function(entityID, type, target = null, data = null, repeat = false) {
	this.entity = entity;
	this.target = target;
	this.type = type;
	this.data = data;
	this.repeat = repeat;
	this.lastRun = 0;
	this.active = true;

	entities[entityID].actions.push(this);
}

function doAction(type, x, y, entity = null, text = '', repeat = false) {
	if (type == "say") {
		if (entity)
			showMessage(entity.name + ': ' + text);
		else
			showMessage(text);
	}
}

function animate() {
	    // start the timer for the next animation loop
	    requestAnimationFrame(animate);
	
	    //charSprite.rotation += 0.01;

	    var charSpriteX = (character.spriteObj.position.x - 2 - Math.round(tileSize/2))/tileSize;
	    var charSpriteY = (character.spriteObj.position.y - 2 - Math.round(tileSize/2))/tileSize;
	    //if (Math.abs(charSpriteX - character.x) > 0.01) {
	    //	character.spriteObj.position.x += (character.x - charSpriteX) * 4.0;
	    //}// else if (character.spriteObj.position.x != character.x * tileSize + Math.round(tileSize/2) + 2) {
	    //	character.spriteObj.position.x = character.x * tileSize + Math.round(tileSize/2) + 2;
	    //}
	    if (charSpriteX != character.x) {
	    	character.spriteObj.position.x += (character.x - charSpriteX) * 4.0;
	    }
	    if (charSpriteY != character.y) {
	    	character.spriteObj.position.y += (character.y - charSpriteY) * 4.0;
	    }
	    
	    for (var i=0;i<entities.length;i++) {
	    	//Fade out inactive entities
	    	if (entities[i].active == false && entities[i].spriteObj.visible == true) {
	    		entities[i].spriteContainer.alpha += -0.1;
	    		if (entities[i].spriteContainer.alpha < 0.1) {
	    			entities[i].spriteContainer.visible == false;
	    		}
	    	}
	    }
	    
	    for (var i=0;i<messages.children.length;i++) {
	    	var message = messages.getChildAt(i);
	    	message.alpha += -0.001 * (10/message.alpha);
	    	if (message.alpha < 0.1) {
				message.visible = false;
			}
	    }
	    /* //Fade text
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
		*/
	    // this is the main render call that makes pixi draw your container and its children.
	    renderer.render(stage);
}


//From http://stackoverflow.com/questions/7193011/javascript-game-loop-that-runs-at-the-same-speed/7193571#7193571
var GameTimer = (function () {
    var gameTimer = function (opts) {
        var self = this;
        opts = opts || {};
        opts.stepInterval = opts.stepInterval || 200;

        var callbacks = {};
        var stepInterval= opts.stepInterval; // ms

        this.domReady = function () {
            setInterval(step, stepInterval);
        };
        
        this.registerService = function(callback){
            callbacks[callback] = callback;
        };
        
        this.removeService = function(){
            delete callbacks[callback];
        };

        var step = function () {
            for(var id in callbacks){
                callbacks[id]();
            }
        };
    };

    return new gameTimer;
})();

var eachTick = function(){
    //console.log(new Date().getTime());
    if (character.moveX != -1) {
    	//character.x = character.moveX;
    	//character.y = character.moveY;
    	findPath(character.moveX, character.moveY);
    }
    
    /*
    for (var i=0;i<entities.length;i++) {
    	if (entities[i].hasOwnProperty('actions')) {
			var actions = entities[i].actions;
			for (var j=0;j<actions.length;j++) {
				if (actions[j].trigger == 'entityNear') {
					var radius = actions[j].text;
					for (var x = entities[i].x - radius; x < entites[i].x + radius; x++) {
						for (var y = entities[i].y - radius; y < entites[i].y + radius; y++) {
							if(check)
						}
					}
					//doAction(actions[j].action, entities[i].posX, entities[i].posY, entities[i], actions[j].text)
				}
			}
		}
	} */
    
    for (var i=0;i<entities.length;i++) {
    	if(entities[i].actions.length > 0) {
    		runEntityActions(i);
    	}
    }
    
    runActions();
    console.log(actions.length);
    
    for (var i=0;i<events.length;i++) {
    
    }
};

function runEntityActions(entityID) {
	
}

function runActions() {
	for (var i=0;i<actions.length;i++) {
		if (actions[i].active == false)
			continue;
		var currentTime = new Date().getTime();
    	//console.log(actions[i].type);
    	//console.log(currentTime - actions[i].lastRun);
    	switch(actions[i].type) {
    		case 'attack':
    			if(actions[i].target.hp < 1 || actions[i].entity.hp < 1)
    				actions[i].active = false;
    			if(currentTime - actions[i].lastRun > 1000 && actions[i].active == true) {
    				attack(i);
    				actions[i].lastRun = currentTime;
    			}
    			break;
    		case 'say':
    		
    			break;
    		case 'entityNear':
    			//console.log('entityNear');
    			var radius = parseInt(actions[i].data,10);
    			//console.log(radius + " " + actions[i].entity.posX + " " + actions[i].entity.posY);
    			
				for (var x = actions[i].entity.posX - radius; x <= actions[i].entity.posX + radius; x++) {
					//console.log(x + " " + (actions[i].entity.posX + radius));
					for (var y = actions[i].entity.posY - radius; y <= actions[i].entity.posY + radius; y++) {
						//console.log(x + ' ' + y);
						if(checkForEntity(x,y) && !(actions[i].entity.posY == y && actions[i].entity.posX == x)) {
							target = checkForEntity(x,y);
							if (isHostile(target.faction, actions[i].entity.faction)) {
								new Action(actions[i].entity, "attack", target, null, true);
								actions[i].active = false;
							}
						} 
					}
				} 
    			break;
    		default:
    			console.log("Unknown action type!");
    			break;
    	}
    }
}

function resourceLoader() {
	var sprites = [];
	for (var i=0;i<tileTypes.length;i++) {
		if (sprites.indexOf(tileTypes[i].sprite) == -1) {
			sprites.push(tileTypes[i].sprite);
		}
	}
	for (var i=0;i<entities.length;i++) {
		if (sprites.indexOf(entities[i].sprite) == -1 && !entities[i].hasOwnProperty('animate')) {
			sprites.push(entities[i].sprite);
		} else {
			var frames = entities[i].sprite.split(",");
			for (var f=0;f<frames.length;f++) {
				if (sprites.indexOf(frames[f]) == -1) {
					sprites.push(frames[f]);
				}
			}
		}
		if (entities[i].hasOwnProperty('sprite2')) {
			if (sprites.indexOf(entities[i].sprite2) == -1) {
				sprites.push(entities[i].sprite2);
			}
		}
		if (entities[i].hasOwnProperty('sound')) {
			//Preload entity sounds
			cacheSound(entities[i].sound);
			/*
			if (!sounds.hasOwnProperty(entities[i].sound)) {
				var audio = new Audio();
    			audio.src = entities[i].sound;
    			audio.preload = "auto";
    			sounds[entities[i].sound] = audio;
				//var entitySound = new sound();
				//sounds.push(entitySound);
				
			} */
		}
	}
	for (var i=0;i<sprites.length;i++) {
		console.log(sprites[i]);
		PIXI.loader.add(sprites[i]);
	}
	/*
	PIXI.loader.add('sprites/torch-fr1.png');
	PIXI.loader.add('sprites/torch-fr2.png');
	PIXI.loader.add('sprites/torch-fr3.png');
	*/
	//for (var i=0;i<entities.length;i++) {
	//	PIXI.loader.add(entities[i].sprite);
	//}
	PIXI.loader.add(character.sprite);


	//Load sounds TODO
	cacheSound('sounds/bag-open.mp3');
	cacheSound('sounds/chest-open.mp3');
	cacheSound('sounds/coins.mp3');
	cacheSound('sounds/grunt.mp3');
	cacheSound('sounds/opendoor.mp3');
	cacheSound('sounds/locked.mp3');
	cacheSound('sounds/miss.mp3');
	cacheSound('sounds/sword-strike.mp3');
}

function cacheSound(fileLoc) {
	if (!sounds.hasOwnProperty(fileLoc)) {
		var audio = new Audio();
		audio.src = fileLoc;
		audio.preload = "auto";
		sounds[fileLoc] = audio;
		//var entitySound = new sound();
		//sounds.push(entitySound);
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