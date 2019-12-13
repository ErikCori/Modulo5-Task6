package com.codeoftheweb.salvo.Model;

import com.codeoftheweb.salvo.Model.GamePlayer;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Entity
public class Ship {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO, generator = "native")
    @GenericGenerator(name = "native", strategy = "native")
    private long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gamePlayer_id")
    private GamePlayer gamePlayer;

    private String type;

    @ElementCollection
    @Column(name = "locations")
    private List<String> shipLocations = new ArrayList<>();

    //Constructor
    public Ship(){}
    public Ship(GamePlayer gamePlayer, String type, List shipLocations) {
        this.gamePlayer = gamePlayer;
        this.type = type;
        this.shipLocations = shipLocations;
    }

    //Getters
    public long getId() {
        return id;
    }
    public String getType() {
        return type;
    }
    public List getShipLocations() {
        return shipLocations;
    }
    public GamePlayer getGamePlayer() {
        return gamePlayer;
    }

    //Controller

    public Map<String, Object> makeShipDto(){
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("type", this.getType());
        dto.put("shipLocations", this.getShipLocations());
        return dto;
    }
}
