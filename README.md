# Random Four Cards

Random Four Cards is a browser game where four playing cards scroll like reels. Stop them one at a time to reveal a four-card hand. The project also includes a viewer for all 52 cards. Both use the same SVG card artwork and run in the browser with plain HTML, CSS, and JavaScript.

## Get started

Download or clone the repository and open [index.html](index.html) in a modern browser. Keep the HTML, JavaScript, and `cards/` directory together. No installation, build step, or server is required.

- [index.html](index.html) is the main game. It shows a 2×2 grid in phone portrait mode and a single row in landscape or on wider screens.
- [random4.html](random4.html) runs the same game with a single-row layout at all screen sizes.
- [deck.html](deck.html) opens the full-deck viewer.

## How to play

1. Choose a deck. The game starts automatically with four distinct cards. Each position starts at a different time and scrolls to a random replacement every 500 ms.
2. Select **Stop Card** to freeze the next position in reading order, from position 1 through position 4. If a card is mid-slide, the outgoing card is restored and held while the other reels keep moving.
3. Select **Deal again** to start a fresh round with the same deck. Changing the deck also starts a fresh round and restarts all four reels.

Each draw excludes cards already on display, including stopped cards and cards moving in or out of view. The game respects your device’s reduced-motion setting by swapping cards without the slide animation.

| Deck | Ranks in each of the four suits |
| --- | --- |
| 52 cards (default) | 2 through 10, Jack, Queen, King, Ace |
| 32 cards | 7 through 10, Jack, Queen, King, Ace |
| 20 cards | 10, Jack, Queen, King, Ace |

## Full-deck viewer

Browse all 52 cards by suit, by rank, or in one grid. Select a card to inspect its artwork, suit, rank, and blackjack value. The viewer also supports filtering, shuffling, flipping cards, and switching themes. Turn on **Auto Mode** to see an animated deal, card spotlights, and a demonstration of the card backs.

## Project files

- [random4.js](random4.js) contains the shared rules, reel animation, and controls for both game pages.
- [cards/](cards/) contains the 52 SVG card faces used in the game and viewer. The artwork is based on David Bellot’s vector playing cards.
