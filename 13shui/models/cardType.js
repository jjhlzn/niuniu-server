/*
public static string HIGH = "high";
public static string ONE_PAIR = "onepair";
public static string TWO_PAIR = "twopair";
public static string TRIPLE = "triple";
public static string STRAIGHT = "straight";
public static string FLUSH = "flush";
public static string FULLHOURSE = "fullhourse";
public static string QUARD = "quard";
public static string FLUSHSTRAIGHT = "flushstraight";
 */ 
class Card {
    point
    type
    constructor(value) {
        this.point = value[0]
        this.type = value[1]
    }

    pointValue() {
        switch(this.point) {
            case 'T':
                return 10
            case 'J':
                return 11
            case 'Q':
                return 12
            case 'K': 
                return 13
            case 'A':
                return 14
            default:
                return parseInt(this.point)
        }
    }
}

class OnePairCardType {
    identify(cards) {
        cards = cards.map(card => new Card(card))
        var points = cards.map(card => card.point)
        var set = new Set(point)
        return set.size < cards.length
    }

    getMainPoint() {
        return 1
    }

    sort() {

    }

    getPoint() {

    }

    getDaos(daoNo) {
        return 1
    }
}

class TwoPairCardType {
    
}

class TripleCardType {

}

class StraightCardType {

}

class FLushCardType {

}

class FullHourseCardType {

}

class QuardCardType {

}

class FlushStraightCardType {

}


function getCardType(cards) {

}

function compare(cardType1, cardType2, daoNo) {
    var diff = cardType1.getMainPoint() - cardType2.getMainPoint()
    
    if (diff > 0) {
        return cardType1.getDaos(daoNo)
    } else if (diff < 0) {
        return cardType2.getDaos(daoNo)
    } else {
        diff = cardType1.getPoint() - cardType2.getPoint()
        if (diff > 0) {
            return cardType1.getDaos(daoNo)
        } else if (diff < 0) {
            return cardType2.getDaos(daoNo)
        } else {
            diff = cardType1.getPoint() - cardType2.getPoint()
            return 0
        }
    }
}

var card = new Card('Ts')
console.log(card.type)
console.log(card.point)
console.log(card.pointValue())