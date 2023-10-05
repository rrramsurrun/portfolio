import React, { useState, useEffect } from "react";
import { Select, MenuItem, Box } from "@mui/material";
import {
  Table,
  TableContainer,
  TableCell,
  TableBody,
  TableRow,
  TableHead,
} from "@mui/material";
import { IconLogout, IconCopy } from "@tabler/icons-react";

const CodeNames = ({ mysocket, game }) => {
  const [clue, setclue] = useState("");
  const [clueCount, setclueCount] = useState("");
  const [leaveGameCheck, setleaveGameCheck] = useState(false);
  const [clipboardNote, setclipboardNote] = useState(false);

  useEffect(() => {
    if (leaveGameCheck) {
      setTimeout(() => {
        setleaveGameCheck(false);
      }, 10000);
    }
  }, [leaveGameCheck]);

  useEffect(() => {
    if (clipboardNote) {
      setTimeout(() => {
        setclipboardNote(false);
      }, 3000);
    }
  }, [clipboardNote]);

  const clickWord = (i) => {
    if (game.revealed[i] === "" && game.role % 2 !== 0 && game.turn % 2 !== 0) {
      mysocket.clickWord(i);
    }
  };
  const endTurn = () => {
    mysocket.endTurn();
  };
  const sendClue = () => {
    mysocket.sendClue(clue, clueCount);
    setclue("");
    setclueCount("");
  };
  const resetGame = () => {
    mysocket.resetGame();
  };

  const leaveGame = () => {
    mysocket.leaveGame();
  };

  const playerCardPlain = (i, colour) => {
    return (
      <div className={`playerdetails-plain playercard-${colour}`}>
        <div className={`playertitle playertitle-${colour}`}>
          {i % 2 === 0 ? "Spymaster" : "Operative"}
        </div>
        <div className={"playername"}>
          {game.nicknames[i] ? `${game.nicknames[i]}` : "Awaiting player"}
        </div>
      </div>
    );
  };
  const playerCard = (i, colour) => {
    return (
      <div
        className={`playercard playercard-${colour} ${
          game.turn === i ? "playercard-turn" : ""
        }`}
      >
        <div className={`playerdetails playercard-${colour}`}>
          <div className={`playertitle playertitle-${colour}`}>
            {i % 2 === 0 ? "Spymaster" : "Operative"}
          </div>
          <div className={"playername"}>
            {game.nicknames[i] ? `${game.nicknames[i]}` : "Awaiting player"}
          </div>
        </div>
        {game.role === i ? leaveGameButton(colour) : null}
      </div>
    );
  };

  const leaveGameButton = (colour) => {
    if (leaveGameCheck) {
      let warningMsg;
      if (game.nicknames.filter((name) => name !== null).length === 1) {
        warningMsg = "End this game?";
      } else {
        warningMsg = "Leave this game?";
      }
      return (
        <div className="leavegamebox">
          <div className="leavegamemsg">{warningMsg}</div>
          <IconLogout
            className={`confirmexitbutton playertitle-${colour}`}
            onClick={() => leaveGame()}
          />
        </div>
      );
    } else {
      return (
        <IconLogout
          className={`exitbutton playertitle-${colour}`}
          onClick={() => setleaveGameCheck(true)}
        />
      );
    }
  };
  const cluecountCard = (colour) => {
    let total;
    if (game.firstTurn === 0) {
      total = colour === "red" ? 9 : 8;
    } else {
      total = colour === "red" ? 8 : 9;
    }
    const guessed = game.revealed.filter((arr) => arr[1] === colour).length;
    return (
      <div className={`cluecounter`}>{`${total - guessed} words left`}</div>
    );
  };

  const wordCard = (i) => {
    return (
      <button
        key={`word ${i}`}
        // codex present means matrix visible, all cards colored.
        // revealed words also colored
        className={`wordcard wordcard--${
          game.codex
            ? game.codex[game.words[i]] === undefined
              ? "cream"
              : game.codex[game.words[i]]
            : game.revealed[i][1]
        } ${game.revealed[i] ? "revealed" : ""} ${
          game.win === null ? "" : "wordcard--end"
        }`}
        onClick={() => clickWord(i)}
      >
        {game.words[i]}
      </button>
    );
  };

  const winBox = () => {
    return (
      <div className={`winbox winbox-${game.win}`}>{`${
        game.win.charAt(0).toUpperCase() + game.win.slice(1)
      } Team Wins!`}</div>
    );
  };
  const clueInputBox = () => {
    return (
      <div className="clueInput">
        <div className="clueInputSpacer">Your one word clue:</div>
        <input
          className="clueInputBox"
          type="text"
          placeholder="Enter your clue here"
          value={clue}
          onChange={(e) => setclue(e.target.value)}
        />
        <div className="clueInputSpacer">to find</div>
        <Select
          className="clueCountDD"
          label="clueCountDD"
          value={clueCount}
          onChange={(e) => setclueCount(e.target.value)}
        >
          {[...Array(9).keys()].map((e) => (
            <MenuItem key={`item ${e}`} value={e}>
              {e}
            </MenuItem>
          ))}
        </Select>
        <div className="clueInputSpacer">words</div>
        <button
          className="clueInputSubmit"
          disabled={!clue || clueCount === ""}
          onClick={() => sendClue()}
        >
          Submit
        </button>
      </div>
    );
  };

  const lastClueBox = () => {
    return (
      <div className="lastcluebox">
        {game.turn - 1 === 0
          ? playerCardPlain(0, "red")
          : playerCardPlain(2, "blue")}
        <div>gave the clue</div>
        <div className="guess guess--last">
          {game.clues[game.clues.length - 1][0]}
        </div>
        <div>{`to reveal ${game.clues[game.clues.length - 1][1]} words`}</div>
        {game.turn === game.role ? (
          <button onClick={() => endTurn()}>End Turn</button>
        ) : (
          ""
        )}
      </div>
    );
  };

  const waitBox = () => {
    return (
      <div className="waitbox">{`Waiting for a clue from ${
        game.nicknames[game.turn]
      }`}</div>
    );
  };

  const clueBox = () => {
    if (game.win !== null) {
      return winBox();
    }
    if (game.role % 2 === 0 && game.turn === game.role) {
      return clueInputBox();
    }
    if (game.turn % 2 !== 0) {
      return lastClueBox();
    }
    return waitBox();
  };

  const resetGameButton = () => {
    if (game.resetGameSurvey[game.role]) {
      return <div>Awaiting other players' confirmation</div>;
    }

    if (game.resetGameSurvey.includes(true)) {
      const resetMsg =
        game.win !== null
          ? "Rematch?"
          : "Someone has requested a reset. Do you wish to reset as well?";

      const resetFunction =
        game.win !== null
          ? () => setleaveGameCheck(true)
          : () => mysocket.resetConfirm(false);
      return (
        <div>
          <div>{resetMsg}</div>
          <div className="resetresponses">
            <div
              className="resetgamebutton"
              onClick={() => mysocket.resetConfirm(true)}
            >
              Reset!
            </div>
            <div className="resetgamebutton" onClick={resetFunction}>
              Keep playing
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="resetresponses">
        <div className="resetgamebutton" onClick={() => resetGame()}>
          {game.win !== null
            ? "Click here for a rematch"
            : "Click here to reset the game"}
        </div>
      </div>
    );
  };

  const clipboardFunction = () => {
    const URL =
      process.env.NODE_ENV === "production"
        ? "https://ramsurrun-portfolio.com/projects/codenames/?roomname="
        : "localhost:3000/?roomname=";
    navigator.clipboard.writeText(`${URL}${game.room}`);
    setclipboardNote(true);
  };
  return (
    <div>
      <div className="headerbox">
        <div className="roomname">{`You are in room ${game.room}`}</div>
        <IconCopy className="shareButton" onClick={() => clipboardFunction()} />

        <div className="clipboardnotice">
          {clipboardNote
            ? "Linked copied to clipboard"
            : "Click here for a link to share"}
        </div>
      </div>
      <div className="gamescreen">
        <div className="players">
          <div className="players-red">
            {playerCard(0, "red")}
            {playerCard(1, "red")}
            {cluecountCard("red")}
          </div>
        </div>

        <div className="cards">
          {[...Array(5).keys()].map((e) => (
            <div key={`wordrow ${e}`} className="wordsrow">
              {[...Array(5).keys()].map((ee) =>
                wordCard((e + 1) * 5 - (5 + -ee))
              )}
            </div>
          ))}
          {clueBox()}

          <TableContainer className="turnstable">
            <Table stickyHeader aria-label="simple table">
              <colgroup>
                <col width="15%" />
                <col width="10%" />
                <col width="75%" />
              </colgroup>
              <TableHead>
                <TableRow>
                  <TableCell align="left">Clue</TableCell>
                  <TableCell align="left">To Find</TableCell>
                  <TableCell align="left">Guesses Made</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {game.clues
                  .slice(0)
                  .reverse()
                  .map((oldclue, index) => (
                    <TableRow
                      key={`${oldclue}${index}`}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <TableCell align="left">
                        <Box className="guess guess--last">{oldclue[0]}</Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box className="cluecount">{oldclue[1]}</Box>
                      </TableCell>
                      <TableCell align="left">
                        <Box
                          className="guesses"
                          sx={{
                            display: "flex",
                            alignContent: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          {oldclue.length > 2
                            ? oldclue[2].map((i) => (
                                <Box
                                  className={`guess guess--${
                                    game.revealed.filter(
                                      (arr) => arr[0] === i
                                    )[0][1]
                                  }`}
                                >
                                  {
                                    game.revealed.filter(
                                      (arr) => arr[0] === i
                                    )[0][0]
                                  }
                                </Box>
                              ))
                            : ""}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div className="players">
          <div className="players-blue">
            {playerCard(2, "blue")}
            {playerCard(3, "blue")}
            {cluecountCard("blue")}
          </div>
          {resetGameButton()}
        </div>
      </div>
    </div>
  );
};

export default CodeNames;
