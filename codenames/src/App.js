import "./App.css";
import React from "react";
import { useEffect, useState } from "react";
// import SocketHandler from "./socketHandler";
import { mysocket } from "./socketHandler";
import FrontPage from "./frontpage";
import Codenames from "./codeNames";
import _ from "lodash";

function App(args) {
  const [foundgame, setfoundgame] = useState(null);
  const [errormsg, seterrormsg] = useState(null);
  const [gamestatus, setGamestatus] = useState("frontpage");
  const [game, setgame] = useState(null);
  const [gamedata, setGamedata] = useState(null);

  useEffect(() => {
    if (gamestatus !== "frontpage") {
      return;
    }
    if (localStorage.getItem("codenamesUserId") !== null) {
      mysocket.rejoinGame(localStorage.getItem("codenamesUserId"));
    }

    if (args.roomname !== null) {
      mysocket.findGame(args.roomname);
    }
  }, [gamestatus]);

  useEffect(() => {
    if (game) {
      // console.log(game);
      if (
        Object.keys(game).includes("nicknames") &&
        Object.keys(game).includes("words")
      ) {
        setGamestatus("playgame");
        setfoundgame(null);
      }
    }
  }, [game]);

  // Update game when gamedata comes through
  useEffect(() => {
    if (gamedata) {
      if (game) {
        // console.log(`Overwriting ${game.header} with ${gamedata.header}`);
        const newergame = _.cloneDeep(game);
        for (const k in gamedata) {
          newergame[k] = gamedata[k];
        }
        setgame(newergame);
        console.log(newergame);
      } else {
        setgame(gamedata);
      }
    }
  }, [gamedata]);

  useEffect(() => {
    mysocket.on("joinGameResponse", (msg) => {
      const data = JSON.parse(msg);
      localStorage.setItem("codenamesUserId", data.userId);

      mysocket.userId = data.userId;
      setGamedata(data);
    });
    mysocket.on("findGameResponse", (msg) => {
      const data = JSON.parse(msg);
      setfoundgame(data);
      setGamestatus("selectrole");
    });

    mysocket.on("leaveGameResponse", (msg) => {
      const data = JSON.parse(msg);

      if (data.userId === localStorage.getItem("codenamesUserId")) {
        localStorage.removeItem("codenamesUserId");
        setgame(null);
        setGamestatus("frontpage");
        // window.location.href = "/";
      } else {
        seterrormsg("Leave game failed, please try again");
      }
    });
    mysocket.on("gameUpdate", (msg) => {
      const data = JSON.parse(msg);
      setGamedata(data);
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
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
