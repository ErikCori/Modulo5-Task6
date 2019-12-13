package com.codeoftheweb.salvo.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.GenericGenerator;


import javax.persistence.*;
import java.util.*;
import java.util.stream.Collectors;

@Entity
public class GamePlayer {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO, generator = "native")
    @GenericGenerator(name = "native", strategy = "native")
    private long id;

    private Date joinDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "player_id")
    private Player player;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "game_id")
    private Game game;

    @OneToMany(mappedBy = "gamePlayer", fetch = FetchType.EAGER)
    private Set<Ship> ships;

    @OneToMany(mappedBy = "gamePlayer", fetch = FetchType.EAGER)
    private Set<Salvo> salvoes;

    //Constructor
    public GamePlayer(){}
    public GamePlayer(Game game, Player player){
        this.joinDate = new Date();
        this.player = player;
        this.game = game;
    }

    //Getters
    public Date getJoinDate() {
        return joinDate;
    }
    public long getId(){
        return id;
    }
    @JsonIgnore
    public Player getPlayer(){
        return player;
    }
    @JsonIgnore
    public Game getGame(){
        return game;
    }
    public Set<Ship> getShips() {
        return ships;
    }
    public Set<Salvo> getSalvoes() {
        return salvoes;
    }

    //Controller

    public Map<String, Object> makeGamePlayerDto(){
        Map<String, Object> dto= new LinkedHashMap<>();
        dto.put("id", this.getId());
        dto.put("player", this.player.makePlayerDto());
        if(this.getShips().size()>0){
            dto.put("hasShips", "YES");
        }else{
            dto.put("hasShips", "NO");
        }
        return dto;
    }

    public Map<String, Object> gameViewDto(){
        GamePlayer opponent = getOpponent().orElse(null);
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", this.getGame().getId());
        dto.put("created", this.getGame().getCreationDate());
        dto.put("gamePlayers", this.getGame().getGamePlayers().stream().map(g ->g.makeGamePlayerDto()));
        dto.put("ships", getShipList());
        dto.put("salvoes", this.getGame().getGamePlayers().stream()
                .flatMap(gp->gp.getSalvoes()
                        .stream()
                        .sorted(Comparator.comparing(Salvo::getTurn))
                        .map(salvo -> salvo.makeSalvoDto())
                )
                .collect(Collectors.toList())
        );
        if(opponent == null){
            dto.put("hits", null);
        }else {
            dto.put("hits", hits(this, opponent));
        }
        return dto;
    }

    public List<Map<String, Object>> getShipList(){
        return this.getShips().stream().map(ship-> ship.makeShipDto()).collect(Collectors.toList());
    }
    public Optional<GamePlayer>getOpponent(){
        return this.getGame().getGamePlayers().stream().filter(gamePlayer -> this.getId() != gamePlayer.getId()).findFirst();
    }

    private Map<String, Object>hits(GamePlayer self,
                                    GamePlayer enemy){
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("self",getHits(self, enemy));
        dto.put("opponent", getHits(enemy, self));
        return dto;
    }
    public List<Map> getHits(GamePlayer self,
                   GamePlayer enemy){
        List<Map> dto = new ArrayList<>();
        int carrierDamage = 0;
        int patrolBoatDamage = 0;
        int submarineDamage = 0;
        int destroyerDamage = 0;
        int battleshipDamage = 0;

        List<String> carrierLocations = new ArrayList<>();
        List<String> patrolBoatLocations = new ArrayList<>();
        List<String> submarineLocations = new ArrayList<>();
        List<String> destroyerLocations = new ArrayList<>();
        List<String> battleshipLocations = new ArrayList<>();


        for (Ship ship: self.getShips()){
            switch(ship.getType()){
                case "carrier":
                    carrierLocations = ship.getShipLocations();
                    break;
                case "patrol_boat":
                    patrolBoatLocations = ship.getShipLocations();
                    break;
                case "submarine":
                    submarineLocations = ship.getShipLocations();
                    break;
                case "destroyer":
                    destroyerLocations = ship.getShipLocations();
                    break;
                case "battleship":
                    battleshipLocations = ship.getShipLocations();
                    break;
            }
        }
        List<Salvo> enemySalvo = enemy.getSalvoes().stream().sorted(Comparator.comparing(Salvo::getTurn)).collect(Collectors.toList());
        for (Salvo salvo : enemySalvo) {
            int carrierHitsInTurn = 0;
            int patrolBoatHitsInTurn = 0;
            int submarineHitsInTurn = 0;
            int destroyerHitsInTurn = 0;
            int battleshipHitsInTurn = 0;

            int missedShots = salvo.getLocations().size();

            Map<String, Object> hitsPerTurn = new LinkedHashMap<>();
            Map<String, Object> damagesPerTurn = new LinkedHashMap<>();

            List<String> salvoLocations = new ArrayList<>();
            List<String> hitsLocations = new ArrayList<>();

            salvoLocations.addAll(salvo.getLocations());

            for (String shot : salvoLocations) {
                if (carrierLocations.contains(shot)) {
                    carrierDamage++;
                    carrierHitsInTurn++;
                    hitsLocations.add(shot);
                    missedShots--;
                }
                if (patrolBoatLocations.contains(shot)) {
                    patrolBoatDamage++;
                    patrolBoatHitsInTurn++;
                    hitsLocations.add(shot);
                    missedShots--;
                }
                if (submarineLocations.contains(shot)) {
                    submarineDamage++;
                    submarineHitsInTurn++;
                    hitsLocations.add(shot);
                    missedShots--;
                }
                if (destroyerLocations.contains(shot)) {
                    destroyerDamage++;
                    destroyerHitsInTurn++;
                    hitsLocations.add(shot);
                    missedShots--;
                }
                if (battleshipLocations.contains(shot)) {
                    battleshipDamage++;
                    battleshipHitsInTurn++;
                    hitsLocations.add(shot);
                    missedShots--;
                }

            }

            damagesPerTurn.put("carrierHits", carrierHitsInTurn);
            damagesPerTurn.put("patrolBoatHits", patrolBoatHitsInTurn);
            damagesPerTurn.put("submarineHits", submarineHitsInTurn);
            damagesPerTurn.put("destroyerHits", destroyerHitsInTurn);
            damagesPerTurn.put("battleshipHits", battleshipHitsInTurn);

            damagesPerTurn.put("carrier", carrierDamage);
            damagesPerTurn.put("patrolBoat", patrolBoatDamage);
            damagesPerTurn.put("submarine", submarineDamage);
            damagesPerTurn.put("destroyer", destroyerDamage);
            damagesPerTurn.put("battleship", battleshipDamage);

            hitsPerTurn.put("turn", salvo.getTurn());
            hitsPerTurn.put("hitLocations", hitsLocations);
            hitsPerTurn.put("damages", damagesPerTurn);
            hitsPerTurn.put("missed", missedShots);

            dto.add(hitsPerTurn);
        }

        return dto;
    }

    //status
    public String gameState(GamePlayer opponent){
        Set<Ship> myShips = this.getShips();
        Set<Salvo> mySalvoes = this.getSalvoes();
        Set<Ship> enemyShips = opponent.getShips();
        Set<Salvo> enemySalvoes = opponent.getSalvoes();

        if(myShips.size() == 0){
            return "Need to place ships";
        }
        if(enemyShips.size() == 0){
            return "Waiting for enemy player";
        }
        long turn = currentTurn(opponent);

        if(mySalvoes.size() != turn){
            return "Play";
        }

    }
    public long currentTurn(GamePlayer opponent){
        int mySalvoes = this.getSalvoes().size();
        int enemySalvoes =  opponent.getSalvoes().size();

        int totalSalvoes = mySalvoes + enemySalvoes;

        if(totalSalvoes % 2 == 0){
            return (totalSalvoes / 2) + 1;
        }
        return (int) ((totalSalvoes / 2.0) + 0.5);

    }

}
