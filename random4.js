const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
const ranks = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
const deck = suits.flatMap(suit => ranks.map(rank => ({
  rank,
  suit,
  name: `${rank} of ${suit}`,
  imagePath: `cards/${rank.toLowerCase()}_of_${suit.toLowerCase()}.svg`
})));
const cardsByName = new Map(deck.map(card => [card.name, card]));
const faceCardPoints = { Jack: 12, Queen: 13, King: 14, Ace: 15 };
const deckRanks = {
  32: new Set(['7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace']),
  20: new Set(['10', 'Jack', 'Queen', 'King', 'Ace'])
};
const deckSelect = document.getElementById('deck');
const hand = document.getElementById('hand');
const stopButton = document.getElementById('stop-card');
const dealButton = document.getElementById('deal');
const handScore = document.getElementById('hand-score');
const gameTotal = document.getElementById('game-total');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const spinInterval = 500;
const incomingCardStopThreshold = 0.8;
const handsPerGame = 5;
const gameOverDuration = 3000;
let replacementTimers = [];
let nextSlotToStop = 0;
let completedHands = 0;
let totalPoints = 0;
let gameOverTimer;

function drawCard(cards) {
  const index = Math.floor(Math.random() * cards.length);
  const [card] = cards.splice(index, 1);
  const image = document.createElement('img');
  image.src = card.imagePath;
  image.alt = card.name;
  return image;
}

function replaceCard(slot, activeDeck) {
  const outgoingCard = slot.firstElementChild;
  const displayedNames = new Set(Array.from(hand.querySelectorAll('img'), image => image.alt));
  const availableCards = activeDeck.filter(card => !displayedNames.has(card.name));
  const incomingCard = drawCard(availableCards);
  slot.replaceChildren(incomingCard);

  if (reducedMotion.matches) return;

  outgoingCard.classList.add('outgoing-card');
  outgoingCard.setAttribute('aria-hidden', 'true');
  slot.append(outgoingCard);

  const timing = { duration: spinInterval, easing: 'linear' };
  incomingCard.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], timing);
  const exit = outgoingCard.animate(
    [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
    { ...timing, fill: 'forwards' }
  );
  exit.onfinish = () => {
    if (slot.firstElementChild !== outgoingCard) outgoingCard.remove();
  };
}

function dealHand() {
  const allowedRanks = deckRanks[deckSelect.value];
  const activeDeck = allowedRanks ? deck.filter(card => allowedRanks.has(card.rank)) : deck;
  const remainingCards = [...activeDeck];
  const slots = Array.from({ length: 4 }, () => {
    const slot = document.createElement('div');
    slot.className = 'card-slot';
    slot.append(drawCard(remainingCards));
    return slot;
  });
  hand.replaceChildren(...slots);
  nextSlotToStop = 0;
  stopButton.disabled = false;
  handScore.textContent = '';

  replacementTimers.forEach(timer => clearTimeout(timer));
  replacementTimers = slots.map((slot, index) => {
    function updateSlot() {
      replaceCard(slot, activeDeck);
      replacementTimers[index] = setTimeout(updateSlot, spinInterval);
    }

    return setTimeout(updateSlot, 700 - index * 100);
  });
}

function scoreHand(cards) {
  const rankCounts = new Map();
  for (const { rank } of cards) {
    rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
  }

  const counts = [...rankCounts.values()].sort((a, b) => b - a);
  const sameSuit = cards.every(card => card.suit === cards[0].suit);
  const royalRanks = ['Ace', 'King', 'Queen', 'Jack'].every(rank => rankCounts.has(rank));
  const rankOrder = [...rankCounts.keys()].map(rank => ranks.indexOf(rank));
  const consecutive = rankCounts.size === 4 &&
    (royalRanks || Math.max(...rankOrder) - Math.min(...rankOrder) === 3);

  if (sameSuit && royalRanks) return { name: 'Royal Flush', points: 50 };
  if (sameSuit && consecutive) return { name: 'Straight Flush', points: 45 };
  if (counts[0] === 4) return { name: 'Four Of a Kind', points: 40 };
  if (sameSuit) return { name: 'Flush', points: 35 };
  if (consecutive) return { name: 'Straight', points: 35 };
  if (counts[0] === 3) return { name: 'Three Of a Kind', points: 30 };
  if (counts[0] === 2 && counts[1] === 2) return { name: 'Two Pairs', points: 25 };
  if (counts[0] === 2) return { name: 'Pair', points: 20 };

  const points = Math.max(...cards.map(({ rank }) => faceCardPoints[rank] ?? Number(rank)));
  return { name: 'High Card', points };
}

function showPoints(element, points, label) {
  const detail = document.createElement('small');
  detail.textContent = label;
  element.replaceChildren(`${points} points`, detail);
}

function startGame() {
  clearTimeout(gameOverTimer);
  completedHands = 0;
  totalPoints = 0;
  gameTotal.textContent = '';
  dealButton.classList.remove('game-over');
  dealButton.textContent = 'Deal Again';
  dealButton.disabled = false;
  dealHand();
}

function showGameOver() {
  dealButton.textContent = 'Game Over';
  dealButton.disabled = true;
  dealButton.classList.add('game-over');
  gameOverTimer = setTimeout(() => {
    dealButton.classList.remove('game-over');
    dealButton.textContent = 'Play Again';
    dealButton.disabled = false;
  }, gameOverDuration);
}

function stopNextCard() {
  const slot = hand.children[nextSlotToStop];
  clearTimeout(replacementTimers[nextSlotToStop]);

  const outgoingCard = slot.querySelector('.outgoing-card');
  if (outgoingCard) {
    const incomingCard = slot.firstElementChild;
    const slotBounds = slot.getBoundingClientRect();
    const cardBounds = incomingCard.getBoundingClientRect();
    const visibleHeight = Math.max(0,
      Math.min(slotBounds.bottom, cardBounds.bottom) - Math.max(slotBounds.top, cardBounds.top)
    );
    const selectedCard = visibleHeight > cardBounds.height * incomingCardStopThreshold
      ? incomingCard
      : outgoingCard;

    selectedCard.getAnimations().forEach(animation => animation.cancel());
    selectedCard.classList.remove('outgoing-card');
    selectedCard.removeAttribute('aria-hidden');
    slot.replaceChildren(selectedCard);
  }

  nextSlotToStop++;
  stopButton.disabled = nextSlotToStop === hand.children.length;
  if (stopButton.disabled) {
    const cards = Array.from(hand.children, slot => cardsByName.get(slot.firstElementChild.alt));
    const { name, points } = scoreHand(cards);
    showPoints(handScore, points, name);
    completedHands++;
    totalPoints += points;
    showPoints(gameTotal, totalPoints, 'Total');
    if (completedHands === handsPerGame) showGameOver();
  }
}

dealButton.addEventListener('click', () => {
  if (completedHands === handsPerGame) startGame();
  else dealHand();
});
deckSelect.addEventListener('change', startGame);
stopButton.addEventListener('click', stopNextCard);
startGame();
