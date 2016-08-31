var levelHeight = 8;
var levelWidth = 16;

var backgroundTile = 0;

//var tileGrid = [[],[],[],[],[],[],[],[]];
var tileGrid = [];

var tempGrid = [];

var moveGrid = [];
//var newArray = [];

//var graph;

//var easystar = new EasyStar.js();

var spawnPoint = [4,6];

var characterPos = spawnPoint;

var characterSprite = "fighter2.png";

// move or inspect on mouse click
var mouseMode = "move"

var tileSize = 33;

var loaded = false;

var doneMoving = true;

var gold = 0;

var fame = 0;

var inventory = [];

var blockProps = [];
blockProps[0] = { name: "Grass", solid: false, z: 0};
blockProps[1] = { name: "Rocks", solid: true, z: 0};
blockProps[2] = { name: "Wall", solid: true, z: 0};
blockProps[3] = { name: "Wall", solid: true, z: 0};
blockProps[4] = { name: "Wall", solid: true, z: 101};

var entities = [];
entities[0] = { posX: 2, posY: 4, sprite: "gold-coins.png", type: 0, name: "Gold", quantity: 7, active: true};
entities[1] = { posX: 4, posY: 2, sprite: "gold-coins.png", type: 0, name: "Gold", quantity: 9, active: true};
entities[2] = { posX: 10, posY: 1, sprite: "chest-closed.png", sprite2: "chest-open.png", type: 1, name: "Chest", item: "key", quantity: 1, gold: 3, active: true};
entities[3] = { posX: 10, posY: 6, sprite: "dagger.png", type: 2, name: "Dagger", quantity: 1, active: true};
entities[4] = { posX: 1, posY: 6, sprite: "kobold.png", type: 3, name: "Kobold Prisoner", quantity: 1, active: true, onInteract: "say:Hello!"};

var entityTypes = [];
entityTypes[0] = {name:"gold", solid: false};
entityTypes[1] = {name:"container", solid: true};
entityTypes[2] = {name:"item", solid: false};
entityTypes[3] = {name:"npc", solid:true};

var msgID = 0;

var tempSolid = [];

var renderer = new PIXI.WebGLRenderer(levelWidth * tileSize + 3, levelHeight * tileSize + 3, {backgroundColor:"0x444444"});
renderer.roundPixels = true;
//var loader = new PIXI.loaders.Loader();
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

var bunny = null;
var charSprite = null;
var highlightBox = new PIXI.Graphics();
var entitySprites = [];
var shadows = [];
var messages = [];

resourceLoader();

$(document).ready(function(){
	
	//document.body.appendChild(renderer.view);
	
	$('#game-area-wrapper').append(renderer.view);
	
	$("<style type='text/css'> .tile{background-image:url('t-" + backgroundTile + ".png')} </style>").appendTo("head");
	//$("#input").text("Hello!");
	for (var i=0;i<levelHeight;i++) {
		for (var j=0;j<levelWidth;j++) {
			$("#tile-layer").append("<div class='tile column-" + (j) + " row-" + (i) + "'></div>");
		}	
	}
	//$("#character").css("background-image", "url('" + characterSprite + "')");
	$("#character").append("<img src='" + characterSprite + "' />");
	$("#character").css("left", characterPos[0] * tileSize - 11);
	$("#character").css("top", characterPos[1] * tileSize - 11);
	$("#game-area-wrapper, #tile-layer, #entity-layer, #character-layer, #top-layer").css("height", levelHeight * (tileSize) + 1);
	$("#game-area-wrapper, #tile-layer, #entity-layer, #character-layer, #top-layer").css("width", levelWidth * (tileSize) + 1);
	//drawTiles();
	
	$.ajax({url: "map1.xml", success: loadMap, cache: false});
	
	$(window).keypress(function(e) {
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
		
	});
	
	$("#game-area").mousedown(function(e){ e.preventDefault(); });
	
	$("#top-layer").click(function(e){
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
			$(".highlight").removeClass("highlight");
			$(".column-" + xClickPos + ".row-" + yClickPos).addClass("highlight");
		}
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
		if (doneMoving) {
			moveTo(xClickPos, yClickPos);
			highlightBox.position.x = xClickPos * tileSize;
			highlightBox.position.y = yClickPos * tileSize - 1;
			highlightBox.visible = true;
		}


	});
}); 

function loadMap(xml) {
	var title = $(xml).find('title').text();
	$("#top-menu h3").text(title);
	var rawMap = $(xml).find('map').text();
	console.log(rawMap);
	var rows  = rawMap.split("\n");  
	for (var i=0;i<rows.length;i++) {
		var values = rows[i].split(",");
		tileGrid[i] = values;
		moveGrid.push([]);
		for (var j=0;j<values.length;j++) {
			//console.log("I; " + i + " " + j);
			//tileGrid[i][j] = values[j];
			if (blockProps[values[j]].solid) {
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
	
	/*
	$("<style type='text/css'>").appendTo("head");
	for (var i=0;i<tileGrid.length;i++) {
		for (var j=0;j<tileGrid[i].length;j++) {
			if (tileGrid[i][j] > 0) {
				$(".column-" + i + ".row-" + j).css("background-image", "url('t-" + tileGrid[i][j] + ".png')");
				if (blockProps[tileGrid[i][j]].z > 0)
					$(".column-" + i + ".row-" + j).css("z-index", blockProps[tileGrid[i][j]].z);
			}
		}	
	}
	$("</style>").appendTo("head");
	*/

	PIXI.loader.load(function (loader, resources) {
		for (var i=0;i<tileGrid.length;i++) {
			for (var j=0;j<tileGrid[i].length;j++) {
				var texture = new PIXI.Texture.fromImage('t-' + tileGrid[i][j] + '.png');
				//var resourceName = 'resources.tile' + tileGrid[i][j] + '.textures';
				var tile = new PIXI.Sprite(texture);
				tile.position.x = i * tileSize + 2;
				tile.position.y = j * tileSize + 2;
				tile.scale.x = 1;
				tile.scale.y = 1;
				if (blockProps[tileGrid[i][j]].z == 0) {
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
			//position = entityLayer.get
			entityLayer.addChild(shadows[i]);
			entityLayer.swapChildren(entitySprites[i], shadows[i]);
			//shadowLayer.addChild(shadows[i]);
			/*
			$("#entity-layer").append("<div class='entity' id='entity-" + i +"'></div>");
			$("#entity-" + i).append("<span class='aligner'></span>");
			$("#entity-" + i).append("<img src='" + entities[i].sprite + "' />");
			$("#entity-" + i).css("left", entities[i].posX * tileSize - 11);
			$("#entity-" + i).css("top", entities[i].posY * tileSize - 11);
			*/
		}

		/*		
		shadowLayer = JSON.parse(JSON.stringify(entityLayer));
		shadowLayer.position.x += 5;
		shadowLayer.position.y += 5; 
		shadowLayer.filters = [blurFilter];
		*/

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
		
	    // This creates a texture from a 'bunny.png' image.
	    bunny = new PIXI.Sprite(resources.tile0.texture);
	
	    // Setup the position and scale of the bunny
	    bunny.position.x = 200;
	    bunny.position.y = 100;
	
	    bunny.scale.x = 0.5;
	    bunny.scale.y = 0.5;
	
	    // Add the bunny to the scene we are building.
	    stage.addChild(bunny);
	
	    // kick off the animation loop (defined below)
	    animate();
	});
}

/*
function drawEntities() {
	for (var i=0;i<entities.length;i++) {
		$("#entity-layer").append("<div class='entity' id='entity-" + i +"'></div>");
		$("#entity-" + i).append("<span class='aligner'></span>");
		$("#entity-" + i).append("<img src='" + entities[i].sprite + "' />");
		$("#entity-" + i).css("left", entities[i].posX * tileSize - 11);
		$("#entity-" + i).css("top", entities[i].posY * tileSize - 11);
	}
}
*/

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
	if (blockProps[tileGrid[charX][charY]].solid) {
		console.log("Solid at " + charX + "," + charY);
		return;
	}
	if (updateEntities([charX,charY])) {
		characterPos = [charX,charY];
		console.log("Moved to " + characterPos[0] + "," + characterPos[1]);
		redrawChar();
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

			}
			if (entityTypes[entities[i].type].name == "container") {
				if (entities[i].hasOwnProperty("item")) {
					if (entities[i].hasOwnProperty("quantity")) {
						addItem(entities[i].item, entities[i].quantity);
					} else {
						addItem(entities[i].item);
					}
					delete entities[i].item;
				}
				if (entities[i].hasOwnProperty("gold")) {
					addGold(entities[i].gold);
					delete entities[i].gold;
				}
				//$("#entity-" + i + " img").attr("src", entities[i].sprite2);
				var texture = new PIXI.Texture.fromImage(entities[i].sprite2);
				entitySprites[i].texture = texture;
			}
			if (entityTypes[entities[i].type].solid) {
				console.log(entities[i].posX + " " + entities[i].posY);
				moveGrid[entities[i].posY][entities[i].posX] = 1;
				tempGrid = [entities[i].posX, entities[i].posY];
				movedChar = false;
				doneMoving = true;
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

function redrawChar() {
	$("#character").css("left", characterPos[0] * tileSize - 11);
	$("#character").css("top", characterPos[1] * tileSize - 11);
}

function drawInv() {
	$("#inventory").empty();
	for(var i=0;i<inventory.length;i++) {
		$("#inventory").append("<div class='item'>" + inventory[i].name + "</div>");
	}
}

function showMessage(text) {
	/*
	$("#char-message").append("<div id='msg-" + msgID + "'>" + text + "</div>");
	$('#msg-' + msgID).animate({
        'marginTop' : "-=30px" //moves up
    }, 1500);
	$('#msg-' + msgID).fadeOut(1500, function() {
            $(this).remove();
	}); */
	var text = new PIXI.Text(text,{fontFamily : 'Lucida Console, Monaco, monospace', fontSize: 12, fill : 0xDEDE39, align : 'center', dropShadow: true, dropShadowDistance: 1,});
	text.position.x = charSprite.position.x;
	text.position.y = charSprite.position.y;
	if (messages.length > 0) {
		if (messages[messages.length - 1].position.y == charSprite.position.y) {
			text.position.y = charSprite.position.y + 15;
		}
	}
	text.anchor.x = 0.5;
	text.anchor.y = 0.5;
	messages.push(text);
	stage.addChild(messages[messages.length - 1]);
	msgID++;
}

function inspectTile(xPos, yPos) {
	for (var i=0;i<entities.length;i++) {
		if (entities[i].posX == xPos && entities[i].posY == yPos) {
			console.log(entities[i].name + " at " + xPos + "," + yPos);
		}
	}
	var tileID = tileGrid[xPos][yPos];
	console.log(blockProps[tileID].name + "(" + tileID + ") Solid: " + blockProps[tileID].solid)
}

function moveTo(xPos, yPos, entityID = null) {
	if (entityID) {
		//get entityPos
	} else {
		var easystar = new EasyStar.js();
        easystar.setGrid(moveGrid);
        easystar.setAcceptableTiles([0]);
        //console.log(characterPos[0] + " " + characterPos[1] + " " + xPos + " " + yPos);
        //console.log(typeof characterPos[0] + " " + typeof characterPos[1] + " " + typeof xPos + " " + typeof yPos);
        
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

function animate() {
	    // start the timer for the next animation loop
	    requestAnimationFrame(animate);
	
	    // each frame we spin the bunny around a bit
	    bunny.rotation += 0.01;
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
	
	// load the textures we need
	for (var i=0;i<blockProps.length;i++) {
		PIXI.loader.add('tile' + i, 't-' + i + '.png');
	}
	//for (var i=0;i<entities.length;i++) {
	//	PIXI.loader.add(entities[i].sprite);
	//}
	PIXI.loader.add('charSprite', 'fighter2.png');

}
