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
    mysocket.clickWord(i);
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
    if (game.playercount === 2) {
      colour = "green";
    }
    return (
      <div className={`playerdetails-plain playercard-${colour}`}>
        <div className={`playertitle playertitle-${colour}`}>
          {game.playercount === 2
            ? "Spy"
            : i % 2 === 0
            ? "Spymaster"
            : "Operative"}
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
            {game.playercount === 2
              ? "Spy"
              : i % 2 === 0
              ? "Spymaster"
              : "Operative"}
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
    let guessed;
    if (game.firstTurn === 0) {
      total = colour === "red" ? 9 : 8;
    } else {
      total = colour === "red" ? 8 : 9;
    }

    if (game.revealed.length === 0) {
      guessed = 0;
    } else {
      guessed = game.revealed.filter((arr) => arr === colour).length;
    }
    return (
      <div className={`cluecounter`}>{`${total - guessed} words left`}</div>
    );
  };

  const wordCard = (i) => {
    let clickable;
    let revealedToggle = "unrevealed";
    let codexcolor = "";
    const word = game.words[i];
    let leftcolor;
    let rightcolor;
    let finalcolor;

    if (game.playercount === 4) {
      clickable = game.role % 2 === 1 && game.turn === game.role ? true : false;

      if (game.codex) {
        codexcolor =
          game.codex[word] === undefined
            ? "light-cream"
            : game.codex[word] === "black"
            ? "black"
            : `light-${game.codex[word]}`;
      }
      if (game.revealed[i] !== null && game.revealed[i] !== undefined) {
        clickable = false;
        revealedToggle = "revealed";
      }
      if (game.win !== null) {
        clickable = false;
      }
      //In a 4-player game the revealed word overrules the codex
      finalcolor = game.revealed[i] ?? codexcolor;
      return singleColorCard(i, word, clickable, finalcolor, revealedToggle);
    }

    if (game.playercount === 2 && game.win === null) {
      //Default a card to clickable, amend later
      clickable = game.turn + game.role === 3 ? true : false;
      //Find user position in Revealed array
      const userpos = game.role === 2 ? 1 : 0;
      const otherpos = userpos === 1 ? 0 : 1;
      //Use a lighter shade for your own codex
      if (game.codex) {
        codexcolor =
          game.codex[word] === "black" ? "black" : `light-${game.codex[word]}`;
      }
      //If there is a non-null value for a word, it has been revealed on one or both sides
      if (game.revealed[i] !== null && game.revealed[i] !== undefined) {
        leftcolor =
          game.revealed[i][0] === undefined ? null : game.revealed[i][0];
        rightcolor =
          game.revealed[i][1] === undefined ? null : game.revealed[i][1];
      }
      // const splitcolor =
      //   game.role === 0
      //     ? `${codexcolor}-${revealcolor}`
      //     : `${revealcolor}-${codexcolor}`;

      if (leftcolor === "green" || rightcolor === "green") {
        //If a card is revealed as green for either side, it is green for both
        finalcolor = "green";
        clickable = false;
        revealedToggle = "revealed";
      } else if (leftcolor === "cream" && rightcolor === null) {
        //Right player has clicked on a word that was cream in the left's codex
        //Left player has not clicked this word
        //Right player can no longer click it, the right one can
        //If a card is revealed as cream, it lies partially over your own colour
        if (game.role === 2) {
          return splitColorCard(
            i,
            word,
            false,
            false,
            "cream revealed",
            codexcolor
          );
        } else {
          return splitColorCard(
            i,
            word,
            clickable,
            false,
            codexcolor,
            "cream revealed"
          );
        }
      } else if (leftcolor === null && rightcolor === "cream") {
        //left player has clicked on a word that was cream in the right's codex
        //right player has not clicked this word
        //left player can no longer click it, the left one can
        clickable = game.role === 0 ? false : true;
        //If a card is revealed as cream, it lies partially over your own colour
        if (game.role === 0) {
          //The left player cannot click, but sees their codex underneath
          return splitColorCard(
            i,
            word,
            false,
            false,
            codexcolor,
            "cream revealed"
          );
        } else {
          //The right player will see cream overlaying their codex color
          return splitColorCard(
            i,
            word,
            false,
            clickable,
            "cream revealed",
            codexcolor
          );
        }
      } else if (leftcolor === "cream" && rightcolor === "cream") {
        return singleColorCard(i, word, false, "cream", "revealed");
      }
    }

    if (game.playercount === 2 && game.win !== null) {
      //In a 2 player game the revealed is full populated at the end of the game
      return splitColorCard(
        i,
        word,
        false,
        false,
        game.revealed[i][0],
        game.revealed[i][1]
      );
    }

    return singleColorCard(
      i,
      word,
      clickable,
      finalcolor ?? codexcolor,
      revealedToggle
    );
  };

  const splitColorCard = (
    i,
    word,
    leftclickable,
    rightclickable,
    leftcolor,
    rightcolor
  ) => {
    return (
      <div className={`wordcard--split`}>
        <button
          key={`word ${i}-left`}
          // codex present means matrix visible, all cards colored.
          // revealed words also colored
          className={`wordcard__half wordcard__half--left ${
            leftclickable ? "clickable" : ""
          } wordcard--${leftcolor}`}
          onClick={leftclickable ? () => clickWord(i) : undefined}
        />
        <span
          key={`word ${i}-middle`}
          className={`wordcard--split__word ${
            leftcolor === "black" || rightcolor === "black"
              ? "wordcard--split__word--whitetext"
              : ""
          }`}
        >
          {word}
        </span>
        <button
          key={`word ${i}-right`}
          // codex present means matrix visible, all cards colored.
          // revealed words also colored
          className={`wordcard__half wordcard__half--right ${
            rightclickable ? "clickable" : ""
          } wordcard--${rightcolor}`}
          onClick={rightclickable ? () => clickWord(i) : undefined}
        />
      </div>
    );
  };
  const singleColorCard = (i, word, clickable, finalcolor, revealedToggle) => {
    return (
      <button
        key={`word ${i}`}
        // codex present means matrix visible, all cards colored.
        // revealed words also colored
        className={`wordcard ${
          clickable ? "clickable" : ""
        } wordcard--${finalcolor} ${
          game.win === null ? "" : "wordcard--end"
        }${revealedToggle}`}
        onClick={clickable ? () => clickWord(i) : undefined}
      >
        {word}
      </button>
    );
  };

  const winBox = () => {
    if (game.playercount === 4) {
      return (
        <div className={`winbox winbox-${game.win}`}>{`${
          game.win.charAt(0).toUpperCase() + game.win.slice(1)
        } Team Wins!`}</div>
      );
    }
    if (game.win === "win") {
      return <div className={`winbox`}>{`You Both Win!`}</div>;
    }
    if (game.win === "lose") {
      return <div className={`winbox`}>{`You Both Lose!`}</div>;
    }
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
    if (game.clues.length > 0) {
      const lastClue = game.clues[game.clues.length - 1];
      const yourturn =
        game.playercount === 2
          ? game.turn + game.role === 3
          : game.turn === game.role;
      return (
        <div className="lastcluebox">
          {game.turn - 1 === 0
            ? playerCardPlain(lastClue[0], "red")
            : playerCardPlain(lastClue[0], "blue")}
          <div>gave the clue</div>
          <div className="guess guess--last">{lastClue[1]}</div>
          <div>{`to reveal ${lastClue[2]} words`}</div>
          {yourturn ? (
            <button className="endturnbox" onClick={() => endTurn()}>
              End Turn
            </button>
          ) : (
            ""
          )}
        </div>
      );
    }
  };

  const waitBox = () => {
    if (game.playercount === 4) {
      return (
        <div className="waitbox">{`Waiting for a clue from ${
          game.nicknames[game.turn] && game.turn === 0
            ? "Red Spymaster"
            : "Blue Spymaster"
        }`}</div>
      );
    }
    if (game.playercount === 2) {
      return (
        <div className="waitbox">{`Waiting for a clue from ${
          game.nicknames[game.turn]
        }`}</div>
      );
    }
  };

  const clueBox = () => {
    //If game win condition then present winbox
    if (game.win !== null) {
      return winBox();
    }
    //If turn is 0 or 2 it is time for a clue
    if (game.turn % 2 === 0) {
      if (game.role % 2 === 0 && game.turn === game.role) {
        return clueInputBox();
      } else {
        return waitBox();
      }
    }
    //If turn is 1 or 3 it is guess time (for thee)
    if (game.turn % 2 !== 0) {
      return lastClueBox();
    }
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
        ? "https://ramsurrun-portfolio.com/codenames/?roomname="
        : "localhost:3000/?roomname=";
    navigator.clipboard.writeText(`${URL}${game.room}`);
    setclipboardNote(true);
  };

  const playersBox = (colour) => {
    if (colour === "left" || colour === "right") {
      return (
        <div className="players">
          <div className={`players-green`}>
            {playerCard(colour === "left" ? 0 : 2, "green")}
          </div>
        </div>
      );
    }
    const firstPlayer = colour === "red" ? 0 : 2;
    return (
      <div className="players">
        <div className={`players-${colour}`}>
          {playerCard(firstPlayer, colour)}
          {playerCard(firstPlayer + 1, colour)}
          {cluecountCard(colour)}
        </div>
      </div>
    );
  };

  const codexClueBox = () => {
    return (
      <div className="codex-guide">
        <div className="codex-guide__row">
          <Box
            key={`codex-guide-upper-cell-start`}
            className={`codex-guide__cell-start`}
          >
            Colours as your partner sees them:
          </Box>
          {[
            "black",
            "cream",
            "cream",
            "cream",
            "cream",
            "cream",
            "green",
            "green",
            "green",
            "green",
            "green",
            "green",
            "green",
            "green",
            "green",
            "cream",
            "black",
            "cream",
            "cream",
            "cream",
            "cream",
            "cream",
            "cream",
            "cream",
            "black",
          ].map((i, index) => (
            <Box
              key={`codex-guide-upper-cellbox-${index}`}
              className={`codex-guide__cell codex-guide__cell--${i}`}
            />
          ))}
        </div>
        <div className="codex-guide__row codex-guide__row--middle">
          <Box
            key={`codex-guide-middle-cell-start`}
            className={`codex-guide__cell-start`}
          >
            {" "}
          </Box>
          {Array(25)
            .fill("")
            .map((x, index) => (
              <Box
                key={`codex-guide-middle-cellbox-${index}`}
                className={`codex-guide__cell codex-guide__cell--middle`}
              >
                &#x2195;
              </Box>
            ))}
        </div>
        <div className="codex-guide__row">
          <Box
            key={`codex-guide-lower-cell-start`}
            className={`codex-guide__cell-start`}
          >
            Colours as you see them:
          </Box>
          {[
            "green",
            "green",
            "green",
            "green",
            "green",
            "green",
            "green",
            "green",
            "green",
            "cream",
            "cream",
            "cream",
            "cream",
            "cream",
            "black",
            "black",
            "black",
            "cream",
            "cream",
            "cream",
            "cream",
            "cream",
            "cream",
            "cream",
            "cream",
          ].map((i, index) => (
            <Box
              key={`codex-guide-lower-cellbox-${index}`}
              className={`codex-guide__cell codex-guide__cell--${i}`}
            />
          ))}
        </div>
      </div>
    );
  };

  const findCluesColor = (word, oldclue) => {
    const i = game.words.indexOf(word);
    if (game.playercount === 4) {
      return game.revealed[i];
    }
    if (game.playercount === 2) {
      if (game.revealed[i] !== undefined) {
        return game.revealed[i][oldclue[0] === 0 ? 0 : 1];
      }
    }
  };
  const cluesHistoryBox = (oldclue) => {
    return (
      <Box
        className="guesses"
        sx={{
          display: "flex",
          alignContent: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {oldclue.length > 3
          ? oldclue[3].map((i, index) => (
              <Box
                key={`oldclue-box-${index}`}
                className={`guess guess--${findCluesColor(i, oldclue)}`}
              >
                {i}
              </Box>
            ))
          : ""}
      </Box>
    );
  };
  const cluesHistory = () => {
    return (
      <TableContainer className="turnstable">
        <Table stickyHeader aria-label="simple table">
          <colgroup>
            <col width="15%" />
            <col width="15%" />
            <col width="5%" />
            <col width="65%" />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell align="left">Spy</TableCell>
              <TableCell align="left">Clue</TableCell>
              <TableCell align="left">To Find</TableCell>
              <TableCell align="left">Guesses Made</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {game.clues.length > 0
              ? game.clues
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
                        <Box className="guess guess--last">
                          {game.nicknames[oldclue[0]]}
                        </Box>
                      </TableCell>
                      <TableCell align="left">
                        <Box className="guess guess--last">{oldclue[1]}</Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box className="cluecount">{oldclue[2]}</Box>
                      </TableCell>
                      <TableCell align="left">
                        {cluesHistoryBox(oldclue)}
                      </TableCell>
                    </TableRow>
                  ))
              : ""}
          </TableBody>
        </Table>
      </TableContainer>
    );
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
        {game.playercount === 4 ? playersBox("red") : playersBox("left")}

        <div className="cards">
          {[...Array(5).keys()].map((e) => (
            <div key={`wordrow ${e}`} className="wordsrow">
              {[...Array(5).keys()].map((ee) =>
                wordCard((e + 1) * 5 - (5 + -ee))
              )}
            </div>
          ))}
          {clueBox()}

          {game.playercount === 2 ? codexClueBox() : ""}

          {cluesHistory()}
          {resetGameButton()}
        </div>
        {game.playercount === 4 ? playersBox("blue") : playersBox("right")}
      </div>
    </div>
  );
};

export default CodeNames;
