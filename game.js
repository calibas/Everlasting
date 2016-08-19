var levelHeight = 8;
var levelWidth = 16;

var backgroundTile = 0;

var tileGrid = [[],[],[],[],[],[],[],[]];

var spawnPoint = [4,6];

var characterPos = spawnPoint;
//var movePos = spawnPoint;

var characterSprite = "fighter2.png";

var tileSize = 33;

var loaded = false;

var gold = 0;

var fame = 0;

var inventory = [];

var blockProps = [];
blockProps[0] = { solid: false, z: 0};
blockProps[1] = { solid: true, z: 0};
blockProps[2] = { solid: true, z: 0};
blockProps[3] = { solid: true, z: 0};
blockProps[4] = { solid: true, z: 101};

var entities = [];
entities[0] = { posX: 2, posY: 4, sprite: "gold-coins.png", type: 0, name: "Gold", quantity: 7, active: true};
entities[1] = { posX: 4, posY: 2, sprite: "gold-coins.png", type: 0, name: "Gold", quantity: 9, active: true};
entities[2] = { posX: 10, posY: 1, sprite: "chest-closed.png", sprite2: "chest-open.png", type: 1, name: "Chest", item: "key", quantity: 1, gold: 3, active: true};
entities[3] = { posX: 10, posY: 6, sprite: "dagger.png", type: 2, name: "dagger", quantity: 1, active: true};

var entityTypes = [];
entityTypes[0] = {name:"gold", solid: false};
entityTypes[1] = {name:"container", solid: true};
entityTypes[2] = {name:"item", solid: false};
entityTypes[3] = {name:"npc", solid:true};

var msgID = 0;

$(document).ready(function(){
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
	$("#game-area-wrapper, #tile-layer, #entity-layer, #character-layer").css("height", levelHeight * (tileSize) + 1);
	$("#game-area-wrapper, #tile-layer, #entity-layer, #character-layer").css("width", levelWidth * (tileSize) + 1);
	//drawTiles();
	
	$.ajax({url: "map1.xml", success: loadMap, cache: false});
	
	$(window).keypress(function(e) {
       	var ev = e || window.event;
       	var key = ev.keyCode || ev.which;
       	if (key == "38")
       		moveChar([characterPos[0], characterPos[1] - 1]);
		if (key == "40")
			moveChar([characterPos[0], characterPos[1] + 1]);
		if (key == "37")
			moveChar([characterPos[0] - 1, characterPos[1]]);
		if (key == "39")
			moveChar([characterPos[0] + 1, characterPos[1]]);
		
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
		for (var j=0;j<values.length;j++) {
			//console.log("I; " + i + " " + j);
			tileGrid[i][j] = values[j];
		}
	}
	drawTiles();
	drawEntities();
	$("#gold-count").text(gold);
	loaded = true;
}

function drawTiles() {
	$("<style type='text/css'>").appendTo("head");
	for (var i=0;i<tileGrid.length;i++) {
		for (var j=0;j<tileGrid[i].length;j++) {
			if (tileGrid[i][j] > 0) {
				$(".column-" + j + ".row-" + i).css("background-image", "url('t-" + tileGrid[i][j] + ".png')");
				if (blockProps[tileGrid[i][j]].z > 0)
					$(".column-" + j + ".row-" + i).css("z-index", blockProps[tileGrid[i][j]].z);
			}
		}	
	}
	$("</style>").appendTo("head");
}

function drawEntities() {
	for (var i=0;i<entities.length;i++) {
		$("#entity-layer").append("<div class='entity' id='entity-" + i +"'></div>");
		$("#entity-" + i).append("<span class='aligner'></span>");
		$("#entity-" + i).append("<img src='" + entities[i].sprite + "' />");
		$("#entity-" + i).css("left", entities[i].posX * tileSize - 11);
		$("#entity-" + i).css("top", entities[i].posY * tileSize - 11);
	}
}

function moveChar(movePos) {
	console.log("Moving to " + movePos[0] + "," + movePos[1])
	if (!loaded)
		return;
	if (movePos[1] < 0 || movePos[0] < 0) {
		console.log("Out of bounds " + movePos[0] + "," + movePos[1]);
		return;
	}
	if (movePos[1] >= levelHeight || movePos[0] >= levelWidth) {
		console.log("Out of bounds " + movePos[0] + "," + movePos[1]);
		return;
	}
	if (blockProps[tileGrid[movePos[1]][movePos[0]]].solid) {
		console.log("Solid at " + movePos[0] + "," + movePos[1]);
		return;
	}
	if (updateEntities(movePos)) {
		characterPos = movePos;
		console.log("Moved to " + characterPos[0] + "," + characterPos[1]);
		redrawChar();
	}
}

function updateEntities(movePos) {
	var moveChar = true;
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
				$("#entity-" + i + " img").attr("src", entities[i].sprite2);
			}
			if (entityTypes[entities[i].type].solid)
				moveChar = false;
		}
		if (!entities[i].active)
			$("#entity-" + i).fadeOut();
			
	}
	return moveChar;
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
	$("#char-message").append("<div id='msg-" + msgID + "'>" + text + "</div>");
	$('#msg-' + msgID).animate({
        'marginTop' : "-=30px" //moves up
    }, 1500);
	$('#msg-' + msgID).fadeOut(1500, function() {
            $(this).remove();
	});

	msgID++;
}
