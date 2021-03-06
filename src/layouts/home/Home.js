import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { ContractData } from 'drizzle-react-components';
import Typography from '@material-ui/core/Typography';
import {
  Button, FormControl, InputLabel, Input,
} from '@material-ui/core';
import { weiToEther, etherToWei } from '../../util/ethereum';

import {
  OuterWrapper, Header, AccWrapper, Balance, Body, BodyCol,
} from './style';
import { parseGame } from '../../util/speedCheckers';
import Game from '../../components/Game';
import Row from '../../components/Row';

class Home extends Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props, context) {
    super(props);
    this.state = { games: [], wagerInput: 0 };
    this.SpeedCheckers = context.drizzle.contracts.SpeedCheckers;
    this.gameListLenKey = this.SpeedCheckers.methods.gameListLen.cacheCall();
    this.newGame = this.newGame.bind(this);
    this.joinGame = this.joinGame.bind(this);
    this.withdraw = this.withdraw.bind(this);
    this.changeWager = this.changeWager.bind(this);
    this.makeMove = this.makeMove.bind(this);
  }

  componentWillUpdate(nextProps) {
    const { SpeedCheckers, accounts } = this.props;
    // on account change reload the page to enforce metamask will use the
    // correct acc to sign txns
    if (accounts[0] !== nextProps.accounts[0]) {
      window.location.reload(); // eslint-disable-line no-undef
    }

    // as soon as we get the game list length, request the game and board info
    // save keys to access this info from props in state
    // console.log(SpeedCheckers);
    if
    (
      (!SpeedCheckers.gameListLen[this.gameListLenKey]
      && nextProps.SpeedCheckers.gameListLen[this.gameListLenKey])
      || (SpeedCheckers.gameListLen[this.gameListLenKey]
      && (SpeedCheckers.gameListLen[this.gameListLenKey].value
        !== nextProps.SpeedCheckers.gameListLen[this.gameListLenKey].value))
    ) {
      const gameListLen = parseInt(
        nextProps.SpeedCheckers.gameListLen[this.gameListLenKey].value,
        10,
      );
      const newGames = [];
      for (let i = gameListLen - 1; i >= 0; i -= 1) {
        const curGameKey = this.SpeedCheckers.methods.gameList.cacheCall(i);
        const curBoardKey = this.SpeedCheckers.methods.getGameBoard.cacheCall(i);
        newGames.push({ gameKey: curGameKey, boardKey: curBoardKey, index: i });
      }
      this.setState({ games: newGames }); // eslint-disable-line
    }
  }

  newGame() {
    const { wagerInput } = this.state;
    this.SpeedCheckers.methods.newGame.cacheSend({ value: etherToWei(wagerInput) });
  }

  joinGame(i, wager) {
    this.SpeedCheckers.methods.joinGame(i).send({ value: wager });
  }

  makeMove(i, fromX, fromY, destX, destY) {
    this.SpeedCheckers.methods.makeMove(i, fromX, fromY, destX, destY).send();
  }

  withdraw(i) {
    this.SpeedCheckers.methods.withdraw(i).send();
  }

  changeWager(e) {
    this.setState({ wagerInput: e.target.value });
  }

  render() {
    const { games, wagerInput } = this.state;
    const { accounts, accountBalances, SpeedCheckers } = this.props;
    const balance = weiToEther(accountBalances[accounts[0]]);
    if (!SpeedCheckers.gameListLen[this.gameListLenKey]) {
      return <Typography variant="display4">Synchronizing...</Typography>;
    }

    const waitingForPlayer = [];
    const yourGames = [];
    games.forEach((game) => {
      const { gameKey, boardKey, index } = game;
      if (!SpeedCheckers.gameList[gameKey] || !SpeedCheckers.getGameBoard[boardKey]) return;
      const gameVal = SpeedCheckers.gameList[gameKey].value;
      const boardVal = SpeedCheckers.getGameBoard[boardKey].value;
      const parsedGame = parseGame(gameVal, boardVal, index);
      if (parsedGame.state === 'WaitingForPlayer') {
        waitingForPlayer.push({ ...parsedGame });
      } else if (parsedGame.red === accounts[0] || parsedGame.black === accounts[0]) {
        yourGames.push({ ...parsedGame });
      }
    });
    return (
      <OuterWrapper>
        <Header>
          <Typography variant="display3">
            Speed Checkers
          </Typography>
          <AccWrapper>
            <Typography variant="display1">
              Active acc
            </Typography>
            <Typography variant="headline">
              {accounts[0]}
            </Typography>
            <Balance>
              <Typography variant="title">
                {`Balance: ${balance.toFixed(6)} ETH`}
              </Typography>
            </Balance>
          </AccWrapper>
        </Header>
        <Body>
          <BodyCol>
            <Typography variant="display1">
              Your commenced games
            </Typography>
            {
              yourGames.map(game => (
                <Game
                  key={game.index}
                  withdraw={() => this.withdraw(game.index)}
                  makeMove={
                    (fromX, fromY, destX, destY) => this.makeMove(
                      game.index,
                      fromX,
                      fromY,
                      destX,
                      destY,
                    )}
                  {...game}
                  playerAddress={accounts[0]}
                />
              ))
            }
            {
              yourGames.length === 0
              && (
              <Typography variant="headline">
                {"You aren't in any games"}
              </Typography>
              )
            }
          </BodyCol>
          <BodyCol>
            <Typography variant="display1">
              Games awaiting players
            </Typography>
            <Row style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
              <FormControl style={{ flex: '1' }}>
                <InputLabel htmlFor="wager">Wager (Ether)</InputLabel>
                <Input
                  type="number"
                  id="wager"
                  value={wagerInput}
                  onChange={this.changeWager}
                />
              </FormControl>
              <Button
                variant="contained"
                onClick={this.newGame}
              >
              + Create game
              </Button>
            </Row>
            {
              waitingForPlayer.map(game => (
                <Game
                  joinGame={() => this.joinGame(game.index, game.wager)}
                  key={game.index}
                  {...game}
                  playerAddress={accounts[0]}
                />
              ))
            }
            {
              waitingForPlayer.length === 0
              && (
              <Typography variant="headline">
                {'There are no games open to join, consider creating one'}
              </Typography>
              )
            }
          </BodyCol>
        </Body>
      </OuterWrapper>
    );
  }
}

export default Home;

Home.propTypes = {
  accounts: PropTypes.objectOf(PropTypes.string).isRequired,
  accountBalances: PropTypes.objectOf(PropTypes.string).isRequired,
  SpeedCheckers: PropTypes.any.isRequired, // eslint-disable-line
};

Home.contextTypes = {
  drizzle: PropTypes.object, // eslint-disable-line
};
