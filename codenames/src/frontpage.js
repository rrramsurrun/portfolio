import React, { useState, useEffect } from "react";
// import ReactDOM from "react-dom";

const FrontPage = ({ gamestatus, mysocket, foundgame, errormsg }) => {
  const [requestType, setrequestType] = useState(null);
  const [room, setroom] = useState(null);

  const [tempnickname, settempnickname] = useState("");
  const [temprole, settemprole] = useState("");

  const submitRequest = () => {
    switch (requestType) {
      case "newGame":
        mysocket.newGame(temprole, tempnickname);
        break;
      case "joinGame":
        mysocket.joinGame(foundgame.room, temprole, tempnickname);
        break;
      case "findGame":
        const cleanedRoom = room.includes("roomname=")
          ? room.slice(room.indexOf("roomname=") + 9)
          : room;
        setroom(cleanedRoom);
        mysocket.findGame(cleanedRoom);
        break;
      default:
        console.log("no such requestType");
    }
  };

  useEffect(() => {
    if (gamestatus === "selectrole") {
      // setroom(foundgame.room);
      setrequestType("joinGame");
    }
  }, [gamestatus]);

  const selectPlayer = (colour, role) => {
    const buttonRole = colour + " " + role;
    return (
      <button
        className={`usercard select-player-${colour} ${
          buttonRole === temprole ? "selected" : ""
        }`}
        onClick={() => settemprole(buttonRole)}
      >
        {role}
      </button>
    );
  };
  const selectedPlayer = (nickname, colour, role) => {
    // const buttonRole = colour + " " + role;
    return (
      <div className={`select-player-${colour}`}>
        <div className={`playertitle playertitle-${colour}`}>{role}</div>
        <div className={"playername"}>{nickname}</div>
      </div>
    );
  };

  if (gamestatus === "selectrole") {
    const nicknames = foundgame.nicknames;
    return (
      <div className="introbuttons">
        <input
          className="nameinput"
          placeholder="Username"
          onChange={(e) => settempnickname(e.target.value)}
          key="nameinput"
        />
        <div className="userroles">
          <div className="select-player-column">
            {nicknames[0] !== null
              ? selectedPlayer(nicknames[0], "red", "Spymaster")
              : selectPlayer("red", "Spymaster")}
            {nicknames[1] !== null
              ? selectedPlayer(nicknames[1], "red", "Operative")
              : selectPlayer("red", "Operative")}
          </div>
          <div className="select-player-column">
            {nicknames[2] !== null
              ? selectedPlayer(nicknames[2], "blue", "Spymaster")
              : selectPlayer("blue", "Spymaster")}
            {nicknames[3] !== null
              ? selectedPlayer(nicknames[3], "blue", "Operative")
              : selectPlayer("blue", "Operative")}
          </div>
        </div>

        <button
          type="button"
          className="frontbutton"
          disabled={tempnickname === "" || temprole === ""}
          onClick={submitRequest}
        >
          Join Game
        </button>
        <button
          className="frontbutton"
          onClick={() => console.log("not yet determined")}
        >
          Cancel join
        </button>
        {errormsg ? <div>{errormsg}</div> : ""}
      </div>
    );
  }

  if (requestType === "newGame") {
    return (
      <div className="introbuttons">
        <input
          className="nameinput"
          placeholder="Username"
          onChange={(e) => settempnickname(e.target.value)}
        />

        <div className="userroles">
          <div className="select-player-column">
            {selectPlayer("red", "Spymaster")}
            {selectPlayer("red", "Operative")}
          </div>
          <div className="select-player-column">
            {selectPlayer("blue", "Spymaster")}
            {selectPlayer("blue", "Operative")}
          </div>
        </div>

        <button
          className="frontbutton"
          type="button"
          disabled={tempnickname === "" || temprole === ""}
          onClick={submitRequest}
        >
          Create game with these details
        </button>

        {errormsg ? <div>{errormsg}</div> : ""}
        <button
          className="frontbutton"
          onClick={() => setrequestType("findGame")}
        >
          Join Game Instead
        </button>
      </div>
    );
  }

  if (requestType === "findGame") {
    return (
      <div className="introbuttons">
        <input
          className="nameinput"
          placeholder="Game ID"
          onChange={(e) => setroom(e.target.value)}
          key="roomname"
        />

        <button
          className="frontbutton"
          type="button"
          disabled={!room}
          onClick={submitRequest}
        >
          Find game
        </button>

        {errormsg ? <div>{errormsg}</div> : ""}
        <button
          className="frontbutton"
          onClick={() => setrequestType("newGame")}
        >
          Create game instead
        </button>
      </div>
    );
  }

  //before user has selected create vs join
  return (
    <div className="introbuttons">
      <button className="frontbutton" onClick={() => setrequestType("newGame")}>
        New Game
      </button>
      <button
        className="frontbutton"
        onClick={() => setrequestType("findGame")}
      >
        Join Game
      </button>
      {errormsg ? <div>{errormsg}</div> : ""}
    </div>
  );
};

export default FrontPage;
