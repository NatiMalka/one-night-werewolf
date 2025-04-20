# One Night Werewolf

A digital implementation of the popular social deduction party game "One Night Ultimate Werewolf." This web application lets you play with friends online, taking the roles of villagers and werewolves in a quick single-night game where deception and deduction are key.

## Features

- **Real-time Multiplayer**: Create or join game rooms to play with friends
- **Role Assignment**: Automatic random distribution of roles
- **Night Phase**: Guided night actions for each role (Werewolf, Seer, Robber, etc.)
- **Day Phase**: Discussion with in-game chat
- **Voting System**: Vote for who you think is a werewolf
- **Responsive Design**: Playable on both desktop and mobile devices

## Roles Implemented

- **Werewolf**: Wake at night to see other werewolves
- **Villager**: No special abilities
- **Seer**: Look at one player's role or two center cards
- **Robber**: Swap roles with another player
- **Troublemaker**: Switch two other players' roles
- **Drunk**: Exchange your card with a center card without looking
- **Insomniac**: Wake at the end of night to see your final role
- **Tanner**: You win if you get voted out
- **Hunter**: If killed, you also kill the player you voted for
- **Mason**: Wake to see other masons

## Technologies Used

- **Frontend**: React, TypeScript, TailwindCSS
- **State Management**: React Context API
- **Backend**: Firebase Realtime Database
- **Routing**: React Router

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/NatiMalka/one-night-werewolf.git
   cd one-night-werewolf
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) to view the app in your browser.

### Building for Production

```
npm run build
```

## How to Play

1. Create a new game room or join an existing one with a room code
2. Wait for all players to join (minimum 3 players recommended)
3. The host selects roles and starts the game
4. During the night phase, players perform their role's actions when prompted
5. During the day phase, discuss who might be a werewolf using the in-game chat
6. Vote for who you think is a werewolf
7. See the results and find out who won!

## Game Rules

- The village team wins if at least one werewolf is eliminated
- The werewolf team wins if no werewolf is eliminated
- The tanner wins if they are eliminated (independent)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on the board game "One Night Ultimate Werewolf" by Bézier Games
- Card artwork inspired by the original game 