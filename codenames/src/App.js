import "./App.css";
import React from "react";
import { useEffect, useState, useReducer } from "react";
// import SocketHandler from "./socketHandler";
import { mysocket } from "./socketHandler";
import FrontPage from "./frontpage";
import Codenames from "./codeNames";
import _ from "lodash";

function App(args) {
  const [foundgame, setfoundgame] = useState(null);
  const [errormsg, seterrormsg] = useState(null);
  const [gamestatus, setGamestatus] = useState("frontpage");
  const [game, setGame] = useReducer(gameUpdate, null);

  function gameUpdate(state, action) {
    if (action.type === "clear") {
      return null;
    }
    if (action.type === "update") {
      if (state) {
        const newergame = _.cloneDeep(state);
        for (const k in action.payload) {
          newergame[k] = action.payload[k];
        }
        return newergame;
      } else {
        return action.payload;
      }
    }
  }

  useEffect(() => {
    const keysArr = ["nicknames", "words", "revealed"];
    if (game) {
      if (keysArr.every((key) => Object.keys(game).includes(key))) {
        setGamestatus("playgame");
        setfoundgame(null);
      }
    }
  }, [game]);

  useEffect(() => {
    if (localStorage.getItem("codenamesUserId") !== null) {
      mysocket.rejoinGame(localStorage.getItem("codenamesUserId"));
    }

    if (args.roomname !== null) {
      mysocket.findGame(args.roomname);
    }
  }, [args.roomname]);

  useEffect(() => {
    if (gamestatus === "cancelJoin") {
      setfoundgame(null);
      setGame({ type: "clear", payload: null });
      window.location.href = "/";
      return;
    }
    if (gamestatus !== "frontpage") {
      return;
    }
  }, [gamestatus]);

  useEffect(() => {
    mysocket.on("joinGameResponse", (msg) => {
      const data = JSON.parse(msg);
      localStorage.setItem("codenamesUserId", data.userId);
      mysocket.userId = data.userId;
      setGame({ type: "update", payload: data });
    });
    mysocket.on("findGameResponse", (msg) => {
      const data = JSON.parse(msg);
      setfoundgame(data);
      setGame({ type: "update", payload: data });
      setGamestatus("selectrole");
    });

    mysocket.on("leaveGameResponse", (msg) => {
      const data = JSON.parse(msg);
      if (data.userId === localStorage.getItem("codenamesUserId")) {
        localStorage.removeItem("codenamesUserId");
        setGame({ type: "clear", payload: null });
        setGamestatus("frontpage");
        window.location.href = "/";
      } else {
        seterrormsg("Leave game failed, please try again");
      }
    });
    mysocket.on("gameUpdate", (msg) => {
      const data = JSON.parse(msg);
      setGame({ type: "update", payload: data });
      // setGamedata(data);
    });
    mysocket.on("resetGameResponse", () => {
      mysocket.requestNewWords();
    });

    mysocket.on("errormsg", (msg) => {
      if (msg.startsWith("Could not find")) {
        localStorage.removeItem("codenamesUserId");
      }
      console.log(msg);
      seterrormsg(msg);
    });
    return () => {
      mysocket.off("joinGameResponse");
      mysocket.off("findGameResponse");
      mysocket.off("resetGameResponse");
      mysocket.off("leaveGameResponse");
      mysocket.off("gameUpdate");
      mysocket.off("errormsg");
    };
  }, []);

  return (
    <div>
      <div className="App">
        <header className="App-header"></header>
        <div className="App-body">
          {gamestatus === "playgame" || gamestatus === "resetgame" ? (
            <Codenames mysocket={mysocket} game={game} />
          ) : (
            <FrontPage
              gamestatus={gamestatus}
              mysocket={mysocket}
              foundgame={foundgame}
              errormsg={errormsg}
              setGamestatus={setGamestatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
