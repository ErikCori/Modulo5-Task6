var shipsPlayer =[]; 
var gpId = getParameterByName('gp');
$(function () {
  loadData();
});

function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};

function loadData() {
  $.get('/api/game_view/' + getParameterByName('gp'))
    .done(function (data) {
      //console.log(data);
      shipsPlayer = data.ships;
      //console.log(shipsPlayer);
      gameData = data;
      
      users();
      var player = {};
      data.gamePlayers.forEach(function(gamePlayer){
        if(gamePlayer.id == gpId){
          player = gamePlayer.player
        }
      })
      var salvoPlayer = [];
      data.salvoes.forEach(function(salvo){
        if(salvo.player == player.id){
          salvoPlayer.push(salvo);
        }
      })
      if(data.ships.length !=0){
        loadShips(data.ships, true)
        loadSalvoes(salvoPlayer,true);
        data.hits.opponent.forEach(function(playTurn){
          playTurn.hitLocations.forEach(function(hit){
            x = +(hit.substring(1)) - 1;
            y = hit.charCodeAt(0) - 65;

            cellIDSalvo = "#salvoPlaced" + y + x;
            $(cellIDSalvo).addClass("hitCell");
          });
        });

      data.hits.self.forEach(function(playTurn){
        playTurn.hitLocations.forEach(function(hit){
          x = +(hit.substring(1) - 1);
          y = hit.charCodeAt(0) -65;
          cellIDShip = "#shipsPlaced" + y + x;
          $(cellIDShip).addClass("shipHit");
        })
      })
        makeGameRecordTable(data.hits.opponent, "tableOpponent");
        makeGameRecordTable(data.hits.self, "tableSelf");
      }
      else{
      loadShips(data.ships, false);
      }
      
    })
    .fail(function (jqXHR, textStatus) {
      alert('Failed: ' + textStatus);//Especificar cada error y  mensaje
    });
}

/*****************************************************Users **************************/
function users(){
  for(i=0; i< gameData.gamePlayers.length; i++){
    if(gameData.gamePlayers[i].id == gpId){
      currentPlayer = gameData.gamePlayers[i].player
    }else{
      opponent = gameData.gamePlayers[i].player
    }
  }
  $("#playerInfo").text(currentPlayer.email + ' (you) VS ' + opponent.email);
}

/**********************************Function load Grid*********************************/
let loadShips = function(datos,isStatic){
  changeOptions(shipsPlayer);
  var options ={
    width: 10,
    height: 10,
    verticalMargin: 0,
    cellHeight: 45,
    disableResize: true,
    float: true,
    disableOneColumnMode: true,
    staticGrid: isStatic,
    animate:true
  }
  $('.grid-stack').gridstack(options);
  grid = $('#gridPlaced').data('gridstack');
  const dataShips = {
    carrier : {width:5, height:1},
    battleship : {width:4, height:1},
    submarine : {width:3, height:1},
    destroyer : {width:3, height:1},
    patrol_boat : {width:2,height:1}
  }
  if(datos.length != 0){

    datos.forEach(function(ship){
      var orientation;
      var width;
      var height;
      if(ship.shipLocations[0].charCodeAt(0)< ship.shipLocations[1].charCodeAt(0)){
        orientation = "Vertical"
        width = dataShips[ship.type].height;
        height = dataShips[ship.type].width;
      }
      else{
        orientation = "Horizontal"
        width = dataShips[ship.type].width;
        height = dataShips[ship.type].height;
      }
      grid.addWidget($('<div id='+ship.type+'><div class="grid-stack-item-content '+ship.type+orientation+'"></div><div/>'),
      ship.shipLocations[0].charAt(1)-1, ship.shipLocations[0].charCodeAt(0) - 65, width, height);
    })
  }
  else{
    grid.addWidget($('<div id="patrol_boat"><div class="grid-stack-item-content patrol_boatHorizontal"></div><div/>'),
      0, 1, 2, 1);

    grid.addWidget($('<div id="carrier"><div class="grid-stack-item-content carrierHorizontal"></div><div/>'),
      1, 5, 5, 1);

    grid.addWidget($('<div id="battleship"><div class="grid-stack-item-content battleshipHorizontal"></div><div/>'),
      3, 1, 4, 1);

    grid.addWidget($('<div id="submarine"><div class="grid-stack-item-content submarineVertical"></div><div/>'),
      8, 2, 1, 3);

    grid.addWidget($('<div id="destroyer"><div class="grid-stack-item-content destroyerHorizontal"></div><div/>'),
      7, 8, 3, 1);

      rotateShips("carrier", 5)
      rotateShips("battleship", 4)
      rotateShips("submarine",3)
      rotateShips("destroyer", 3)
      rotateShips("patrol_boat",2)
  }
  
  createGrid(11, $(".grid-shipsPlaced"), 'shipsPlaced')
  
  listenBusyCells('shipsPlaced')
  $('.grid-stack').on('change', () => listenBusyCells('shipsPlaced'))
}

const createGrid = function(size, element, id){
  // definimos un nuevo elemento: <div></div>
  let wrapper = document.createElement('DIV')

  // le agregamos la clase grid-wrapper: <div class="grid-wrapper"></div>
  wrapper.classList.add('grid-wrapper')

  //vamos armando la tabla fila por fila
  for(let i = 0; i < size; i++){
      //row: <div></div>
      let row = document.createElement('DIV')
      //row: <div class="grid-row"></div>
      row.classList.add('grid-row')
      //row: <div id="ship-grid-row0" class="grid-wrapper"></div>
      row.id =`${id}-grid-row${i}`
      /*
      wrapper:
              <div class="grid-wrapper">
                  <div id="ship-grid-row-0" class="grid-row">

                  </div>
              </div>
      */
      wrapper.appendChild(row)

      for(let j = 0; j < size; j++){
          //cell: <div></div>
          let cell = document.createElement('DIV')
          //cell: <div class="grid-cell"></div>
          cell.classList.add('grid-cell')
          //aqui entran mis celdas que ocuparan los barcos
          if(i > 0 && j > 0){
              //cell: <div class="grid-cell" id="ships00"></div>
              cell.id = `${id}${i - 1}${ j - 1}`
          }
          //aqui entran las celdas cabecera de cada fila
          if(j===0 && i > 0){        
              // textNode: <span></span>
              let textNode = document.createElement('SPAN')
              /*String.fromCharCode(): método estático que devuelve 
              una cadena creada mediante el uso de una secuencia de
              valores Unicode especificada. 64 == @ pero al entrar
              cuando i sea mayor a cero, su primer valor devuelto 
              sera "A" (A==65)
              <span>A</span>*/
              textNode.innerText = String.fromCharCode(i+64)
              //cell: <div class="grid-cell" id="ships00"></div>
              cell.appendChild(textNode)
          }
          // aqui entran las celdas cabecera de cada columna
          if(i === 0 && j > 0){
              // textNode: <span>A</span>
              let textNode = document.createElement('SPAN')
              // 1
              textNode.innerText = j
              //<span>1</span>
              cell.appendChild(textNode)
          }
          /*
          row:
              <div id="ship-grid-row0" class="grid-row">
                  <div class="grid-cell"></div>
              </div>
          */
          row.appendChild(cell)
      }
  }

  element.append(wrapper)
}

/*manejador de evento para rotar los barcos, el mismo se ejecuta al hacer click
sobre un barco
function(tipoDeBarco, celda)*/
const rotateShips = function(shipType, cells){

      $(`#${shipType}`).click(function(){
          document.getElementById("alert-text").innerHTML = `Rotaste: ${shipType}`
          console.log($(this))
          //Establecemos nuevos atributos para el widget/barco que giramos
          let x = +($(this).attr('data-gs-x'))
          let y = +($(this).attr('data-gs-y'))
      /*
      this hace referencia al elemento que dispara el evento (osea $(`#${shipType}`))
      .children es una propiedad de sólo lectura que retorna una HTMLCollection "viva"
      de los elementos hijos de un elemento.
      https://developer.mozilla.org/es/docs/Web/API/ParentNode/children
      El método .hasClass() devuelve verdadero si la clase existe como tal en el 
      elemento/tag incluso si tal elemento posee mas de una clase.
      https://api.jquery.com/hasClass/
      Consultamos si el barco que queremos girar esta en horizontal
      children consulta por el elemento contenido en "this"(tag que lanza el evento)
      ej:
      <div id="carrier" data-gs-x="0" data-gs-y="3" data-gs-width="5" 
      data-gs-height="1" class="grid-stack-item ui-draggable ui-resizable 
      ui-resizable-autohide ui-resizable-disabled">
          <div class="grid-stack-item-content carrierHorizontal ui-draggable-handle">
          </div>
          <div></div>
          <div class="ui-resizable-handle ui-resizable-se ui-icon 
          ui-icon-gripsmall-diagonal-se" style="z-index: 90; display: none;">
          </div>
      </div>
      */
      if($(this).children().hasClass(`${shipType}Horizontal`)){
          // grid.isAreaEmpty revisa si un array esta vacio**
          // grid.isAreaEmpty(fila, columna, ancho, alto)
        if(grid.isAreaEmpty(x,y+1,1,cells) || y + cells < 10){
            if(y + cells - 1 < 10){
                  // grid.resize modifica el tamaño de un array(barco en este caso)**
                  // grid.resize(elemento, ancho, alto)
                grid.resize($(this),1,cells);
                $(this).children().removeClass(`${shipType}Horizontal`);
                $(this).children().addClass(`${shipType}Vertical`);
            } else{
                      /* grid.update(elemento, fila, columna, ancho, alto)**
                      este metodo actualiza la posicion/tamaño del widget(barco)
                      ya que rotare el barco a vertical, no me interesa el ancho sino
                      el alto
                      */
                grid.update($(this), null, 10 - cells)
                  grid.resize($(this),1,cells);
                  $(this).children().removeClass(`${shipType}Horizontal`);
                  $(this).children().addClass(`${shipType}Vertical`);
            }
              
              
          }else{
              document.getElementById("alert-text").innerHTML = "A ship is blocking the way!"
          }
          
      //Este bloque se ejecuta si el barco que queremos girar esta en vertical
      }else{

          if(x + cells - 1  < 10){
              grid.resize($(this),cells,1);
              $(this).children().addClass(`${shipType}Horizontal`);
              $(this).children().removeClass(`${shipType}Vertical`);
          } else{
              /*en esta ocasion para el update me interesa el ancho y no el alto
              ya que estoy rotando a horizontal, por estoel tercer argumento no lo
              declaro (que es lo mismo que poner null o undefined)*/
              grid.update($(this), 10 - cells)
              grid.resize($(this),cells,1);
              $(this).children().addClass(`${shipType}Horizontal`);
              $(this).children().removeClass(`${shipType}Vertical`);
          }
          
      }
  });

}

//Bucle que consulta por todas las celdas para ver si estan ocupadas o no
const listenBusyCells = function(id){
  /* id vendria a ser ships. Recordar el id de las celdas del tablero se arma uniendo 
  la palabra ships + fila + columna contando desde 0. Asi la primer celda tendra id
  ships00 */
  for(let i = 0; i < 10; i++){
      for(let j = 0; j < 10; j++){
          if(!grid.isAreaEmpty(i,j)){
              $(`#${id}${j}${i}`).addClass('busy-cell').removeClass('empty-cell')
          } else{
              $(`#${id}${j}${i}`).removeClass('busy-cell').addClass('empty-cell')
          }
      }
  }
}
/***************************************Load salvoes*********************************/
let loadSalvoes = function(datos,isTimeToFire){
  var options ={
    width: 10,
    height: 10,
    verticalMargin: 0,
    cellHeight: 45,
    disableResize: true,
    float: true,
    disableOneColumnMode: true,
    staticGrid: isTimeToFire,
    animate:true
  }
  $('.grid-stack').gridstack(options);
  grid = $('#gridSalvoPlaced').data('gridstack');
  createGrid(11, $(".grid-salvoPlaced"), 'salvoPlaced');
  const salvoData ={
    width: 1,
    height: 1
  }
  if(datos.length !=0){
    datos.forEach(function(salvo){
      salvo.salvoLocations.forEach(function(salvoLocation){
        var j = salvoLocation.charCodeAt(0) - 65;
        var i = parseInt(salvoLocation.charAt(1)-1);
        $(`#salvoPlaced${j}${i}`).addClass('boom').removeClass("fireSalvo");
      })
    })
  }
  $('div[id^="salvoPlaced"].grid-cell').click(function(event){
    if(!$(this).hasClass("boom") && !$(this).hasClass("targetCell") && $(".targetCell").length <5){
      $(this).addClass("targetCell");
    }else if($(this).hasClass("targetCell")){
      $(this).removeClass("targetCell");
    }
  })

  //createGrid(11, $(".grid-salvoPlaced"), 'salvoPlaced');
}
/************************************Back **************************************/
function back(){
  window.location.replace('/web/games.html');
}

/**************************************Place ships **************************************/
function placeShips(){
  
  var destroyer = getShipData("destroyer");
  var submarine = getShipData("submarine");
  var patrol_boat = getShipData("patrol_boat");
  var carrier = getShipData("carrier");
  var battleship = getShipData("battleship");

  var shipsToPlace =[destroyer, submarine, patrol_boat, carrier, battleship];
  

  $.ajax({
    type: 'POST',
    contentType: 'application/json; charset=utf-8',
    url: '/api/games/players/'+getParameterByName('gp')+'/ships',
    data: JSON.stringify(shipsToPlace),
    success: function(){
      alert( "Saved");
      location.reload();
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      alert("Something wrong");
    }
  });

}
//***********************************Data ships ******************/
const getShipData = function (shipType) {
  var ship = new Object();
  ship["name"] = $("#" + shipType).attr('id');
  ship["x"] = $("#" + shipType).attr('data-gs-x');
  ship["y"] = $("#" + shipType).attr('data-gs-y');
  ship["width"] = $("#" + shipType).attr('data-gs-width');
  ship["height"] = $("#" + shipType).attr('data-gs-height');
  ship["positions"] = [];
  if (ship.height == 1) {
      for (i = 1; i <= ship.width; i++) {
          ship.positions.push(String.fromCharCode(parseInt(ship.y) + 65) + (parseInt(ship.x) + i))
      }
  } else {
      for (i = 0; i < ship.height; i++) {
          ship.positions.push(String.fromCharCode(parseInt(ship.y) + 65 + i) + (parseInt(ship.x) + 1))
      }
  }
  var objShip = new Object();
  objShip["type"] = ship.name;
  objShip["shipLocations"] = ship.positions;
  return objShip;
}

function changeOptions(data){
  if(data.length != 0){
    $('#titlePlace').hide();
    $('#placeShips').hide();
  }
  else{
    $('#titleGame').hide();
  }
}

/*$(document).on("click", ".grid-cell", function(){
  var shots = 0;
  if(shots<6){
  $(this).addClass("fireSalvo");
  shots ++;
  }
})*/
//*****************************Data salvoes ***********************/
const shotSalvo = function(){
  var newSalvoes =[];
  $(".targetCell").each(function(){
    let location = $(this).attr("id").substring(11);
    let locationConverted = String.fromCharCode(parseInt(location[0]) + 65) + (parseInt(location[1])+1);
    newSalvoes.push(locationConverted);
  })
  console.log(newSalvoes);
  $.post({
    url: "/api/games/players/"+getParameterByName("gp")+"/salvoes",
    data: JSON.stringify(newSalvoes),
    dataType: "text",
    contentType: "application/json",
  })
  .done(function(){
    alert("Salvo added")
    location.reload();
  })
  .fail(function(error){
    alert(JSON.parse(error.responseText).error);
  })
}
//*******************************************record table************************************* */
function makeGameRecordTable(hits, tableID){
  var tableId = "#"+ tableID + " tbody";
  $(tableId).empty();
  var ships = 5;

  hits.forEach(function(playTurn){
    var hitsReport = "";
    if(playTurn.damages.carrierHits >0){
      hitsReport += "Carrier " + addDamageIcons(playTurn.damages.carrierHits, "hit") + " ";
      if(playTurn.damages.carrier === 5){
        hitsReport += "Sunk! ";
        ships--;
      }
    }
    if(playTurn.damages.patrolBoatHits >0){
      hitsReport += "Patrol Boat " + addDamageIcons(playTurn.damages.patrolBoatHits, "hit") + " ";
      if(playTurn.damages.patrolBoat === 2){
        hitsReport += "Sunk! ";
        ships--;
      }
    }
    if(playTurn.damages.submarineHits >0){
      hitsReport += "Submarine " + addDamageIcons(playTurn.damages.submarineHits, "hit") + " ";
      if(playTurn.damages.submarine === 3){
        hitsReport += "Sunk! ";
        ships--;
      }
    }
    if(playTurn.damages.destroyerHits >0){
      hitsReport += "Destroyer " + addDamageIcons(playTurn.damages.destroyerHits, "hit") + " ";
      if(playTurn.damages.destroyer === 3){
        hitsReport += "Sunk! ";
        ships--;
      } 
    }
    if(playTurn.damages.battleshipHits > 0){
      hitsReport += "Battleship " + addDamageIcons(playTurn.damages.battleshipHits, "hit") + " ";
      if(playTurn.damages.battleship === 4){
        hitsReport += "Sunk! ";
        ships--;
      }
    }
    if(playTurn.missed > 0){
      hitsReport += "MissedShot "+ addDamageIcons(playTurn.missed, "missed") + " ";
    }
    if(hitsReport === " "){
      hitsReport += "All salvoes missed"
    }
    $('<tr><td class="textCenter">' + playTurn.turn + '</td><td>' + hitsReport + '</td></tr>').prependTo(tableId);
  });
}

function addDamageIcons(numberOfHits, type){
  var damageIcon = "";
  if(type === "missed"){
    for(var i=0; i<numberOfHits; i++){
      damageIcon += '<img class="hitblast" src="style/ships/missed.png">';
    }
  }
  if(type === "hit"){
    for(var i=0; i<numberOfHits; i++){
      damageIcon += '<img class="hitblast" src="style/ships/hit.png">';
    }
  }
  return damageIcon;
}