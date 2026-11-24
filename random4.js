const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
const ranks = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
const deck = suits.flatMap(suit => ranks.map(rank => ({
  rank,
  name: `${rank} of ${suit}`,
  imagePath: `cards/${rank.toLowerCase()}_of_${suit.toLowerCase()}.svg`
})));
const deckRanks = {
  32: new Set(['7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace']),
  20: new Set(['10', 'Jack', 'Queen', 'King', 'Ace'])
};
const deckSelect = document.getElementById('deck');
const hand = document.getElementById('hand');
const stopButton = document.getElementById('stop-card');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const spinInterval = 500;
let replacementTimers = [];
let nextSlotToStop = 0;

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

  replacementTimers.forEach(timer => clearTimeout(timer));
  replacementTimers = slots.map((slot, index) => {
    function updateSlot() {
      replaceCard(slot, activeDeck);
      replacementTimers[index] = setTimeout(updateSlot, spinInterval);
    }

    return setTimeout(updateSlot, 700 - index * 100);
  });
}

function stopNextCard() {
  const slot = hand.children[nextSlotToStop];
  clearTimeout(replacementTimers[nextSlotToStop]);

  const outgoingCard = slot.querySelector('.outgoing-card');
  if (outgoingCard) {
    outgoingCard.getAnimations().forEach(animation => animation.cancel());
    outgoingCard.classList.remove('outgoing-card');
    outgoingCard.removeAttribute('aria-hidden');
    slot.replaceChildren(outgoingCard);
  }

  nextSlotToStop++;
  stopButton.disabled = nextSlotToStop === hand.children.length;
}

document.getElementById('deal').addEventListener('click', dealHand);
deckSelect.addEventListener('change', dealHand);
stopButton.addEventListener('click', stopNextCard);
dealHand();
