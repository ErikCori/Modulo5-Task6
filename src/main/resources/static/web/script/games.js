var url = "http://localhost:8080/api/games"
var urlLeader = "http://localhost:8080/api/leaderboard"
var app = new Vue({
    el:'#app',
    data:{
        player: "",
        gpId: "",
        games:[],
        scores:[],
    }
})
fetch(urlLeader)
.then(function(myData){
    return myData.json();
})
.then(function(myData){
    data = myData;
    app.scores = data;
})

fetch(url)
.then(function(myData){
    return myData.json();
})
.then(function(myData){
    data = myData;
    app.games = data.games;
    app.player = data.player;
    done();
})

//********************************************Crear tabla de datos******************************************************
function done(){
    var table = document.getElementById('salvo-table');
    table.innerHTML="";
    var tableContent = createTableContent(app.games);
    table.innerHTML = tableContent;
    changeForm(app.player);
    console.log(app.games);
}
//*******************************************Crear el contenido de la tabla**********************************************
function createTableContent(games){
    var table = '<thead class="thead"><tr><th></th><th>DateGame</th><th>Player1</th><th>Player2</th><th>Status</th></tr></thead>';
    table +='<tbody>';
    games.forEach(function(game){
        table += '<tr>';
        table += '<td>'+ game.id +'</td>';
        table += '<td>'+new Date(game.created).toLocaleString()+'</td>';
        if(game.gamePlayers[0] == null){
            table += '<td>'+"N/A"+'</td>';
        }else{
            table += '<td>'+game.gamePlayers[0].player.email+'</td>';
        }
        if(game.gamePlayers[1] == null){
            table += '<td>'+"N/A"+'</td>';
        }else{
            table += '<td>'+game.gamePlayers[1].player.email+'</td>';
        }
        if(app.player != null){
            //Si hay estoy en el juego
            if(game.gamePlayers[0].player.id == app.player.id || game.gamePlayers[1] && game.gamePlayers[1].player.id == app.player.id){
                var gamePlayerId = game.gamePlayers[0].player.id == app.player.id ? game.gamePlayers[0].id : game.gamePlayers[1].id;
                    
                table += '<td><button type="button" class="btn-secondary" data-id="'+gamePlayerId+'" id="playButton" onclick="playGame(event)">Play</button></td>';
            }else{
                if(game.gamePlayers.length == 1){ //Hay uno esperando por mi
                    table += '<td><button type="button" class="btn-secondary" data-id="'+game.id+'" id="joinButton" onclick="joinGame(event)">Join</button></td>';
                }
            }
        }
        table += '</tr>';
    });
    table += '</tbody>';
    return table;
}
//****************************************Login***********************************************************
$("#loginButton").click(
    function(){
        data ={username: document.forms['loginForm'].elements['username'].value, 
                password: document.forms['loginForm'].elements['password'].value};
        login(data);
    }
)
function login(data){
    $.post("/api/login", data)
    .done(function(){
        location.reload();
        
    })
    .fail(function(){
        alert("User does not exist");
        location.reload();
    })
}
//***************************************Logout***********************************************************
$("#logoutButton").click(
    function(){
        $.post("/api/logout")
        .done(function(){
            location.reload();
            //$("#logoutForm").hide();
        })
    }
)
//***********************************************SigIn********************************************************
$("#signinButton").click(
    function(){
        data = {username: document.forms['loginForm'].elements['username'].value,
                password: document.forms['loginForm'].elements['password'].value};
        $.post("/api/players", data)
        .done(function(dt){
            login(data);
            alert(dt.responseJSON.username)
        })
        .fail(function(error){
            alert(error.responseJSON.error);
        })
    }
)
//*****************************************Create new Game ******************************************************
function createNewGame(){
    $.post("/api/games")
    .done(function(data){
        alert("Game created");
        redirect(data);
    })
    .fail(function(error){
        alert(error.responseJSON.error);
    })
}
function redirect(data){
    location.reload();
    window.location.replace('/web/game.html?gp=' + data.gpid);
}
//*********************************************Join a Game ************************************************
function joinGame(event){
    var idGame =event.target.dataset.id;
    console.log(idGame)
    $.post('/api/games/'+idGame+'/players')
    .done(function(data){
        alert("Enter game");
        redirect(data);
    })
    .fail(function(error){
        alert(error.responseJSON.error);
    })
}
//**********************************************Play Game *******************************************************/
function playGame(event){
    var gpId = event.target.dataset.id;
    window.location.replace('/web/game.html?gp=' + gpId);
}
//*****************************************Change Form *********************************************************
function changeForm(player){
    if(player == null){
        $('#loginForm').show();
        $('#logoutForm').hide();
    }else{
        $('#loginForm').hide();
        $('#logoutForm').show();
    }
}