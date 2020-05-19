/**
 * 使用MongoDB和Redis。
 * MongoDB用于持久化，Redis用于缓存。
 * Redis用于一句中的·
 * 
 */
class Game {
  id = "";
  roomNo = "";
  state = "";
  totalRoundCount = 20;
  currentRoundNo = 1;
  players = []; //在房间的玩家
  sitDownPlayers = {}; //在座位上的玩家, 需要redis
  rounds = [];
  scores = {}; 
}

class Round {
  banker = "";
  players = {
    "jinjunhang": {  //放到redis
      robBanker: 1,
      bet: 0,
      cards: [], 
      niu: 1,
      cardSequences: [],
      multiple: 1,
      winOrLoss: 10
    }
  };
}

class Player {
  userId = "";
  name = "";
  image = "";
  coin = 0;
  winGames = 0;
  losGames = 0;
  tieGames = 0;
  winScore = 0;
  loseScore = 0;
  gameHistory = []; //最近玩过的30场游戏
}

