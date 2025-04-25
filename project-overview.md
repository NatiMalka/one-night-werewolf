# One Night Werewolf Web Game - Project Overview

## Project Structure

The project is a web implementation of the popular party game "One Night Ultimate Werewolf" built with React, TypeScript, and Firebase.

### Key Directories/Files

- `/src/components/` - React components
- `/src/contexts/` - React context providers
- `/src/hooks/` - Custom React hooks
- `/src/pages/` - Page components
- `/src/utils/` - Utility functions
- `/src/types/` - TypeScript type definitions

## Core Game Functionality

### Game Flow
1. Players join a lobby
2. Host configures game roles
3. Game starts with night phase
4. Players perform night actions in sequence
5. Day phase begins with discussion
6. Voting phase determines outcome
7. Results shown, players can play again

### Game Phases
- `lobby` - Players join and get ready
- `night` - Night actions occur in sequence
- `day` - Players discuss
- `voting` - Players vote
- `results` - Game outcome displayed

## Key Components

### GameContext
The central state management for the game found in `/src/contexts/GameContext.tsx`.

- Manages game state, player info, and socket connections
- Provides game actions (join, leave, vote, etc.)
- Controls voice narration settings
- Handles Firebase communication

### Voice Narration System
The game includes voice narration during the night phase.

- `enableVoiceNarration` in GameContext controls whether narration plays
- `useNightNarrator` hook in `/src/hooks/useNightNarrator.ts` handles narration logic
- `useAudio` hook in `/src/hooks/useAudio.ts` handles audio playback
- `NightAudioControls` component displays audio controls during night phase

### Anti-Cheat System
The game includes measures to prevent cheating via browser console.

- Console logs are filtered to hide game-sensitive information
- Game-related data is sanitized in production logs
- Console-opening detection alerts other players
- Warning banner displayed when console activity is detected
- Special exception for clipboard operations (copy/paste) for room codes
- Implemented in `/src/utils/antiCheat.ts`

### Night Phase Implementation
- Sequential actions for different roles
- Auto-progression with timers
- Voice narration announces each role's turn
- Special UI for each role's action

## Game Roles

The game supports various roles, each with different night actions:

- Werewolf - Wakes and identifies other werewolves
- Seer - Can look at another player's card or two center cards
- Robber - Swaps card with another player and sees new role
- Troublemaker - Swaps two other players' cards
- Drunk - Swaps card with a center card without looking
- Insomniac - Wakes to see final role after all swaps
- Villager - No special abilities
- Tanner - Wins by getting voted out
- Hunter - If killed, also kills the player they voted for
- Mason - Wakes to see other masons
- Minion - Wakes to see werewolves but is on the werewolf team
- Doppelganger - Copies another player's role

## Key Files to Know

- `/src/pages/GamePage.tsx` - Main game interface
- `/src/pages/LobbyPage.tsx` - Lobby interface
- `/src/contexts/GameContext.tsx` - Central game state management
- `/src/hooks/useNightNarrator.ts` - Voice narration logic
- `/src/hooks/useAudio.ts` - Audio playback control
- `/src/components/NightAudioControls.tsx` - Audio UI component
- `/src/utils/antiCheat.ts` - Anti-cheat utilities

## Game Settings

### Voice Narration
Voice narration can be toggled on/off:
- Setting is stored in localStorage as 'enableVoiceNarration'
- Default is enabled (true)
- When disabled, all audio playback is stopped
- Fixed implementation ensures audio doesn't play when disabled

## Firebase Integration

The game uses Firebase for:
- Real-time synchronization between players
- Room/lobby management
- Chat messaging
- Game state persistence

## Recently Fixed Issues

- **Voice Narration Toggle Fix**: Fixed issue where voice narration would continue playing even when toggled off.
  - Modified `useNightNarrator` to check `enableVoiceNarration` throughout the narration process
  - Added logic to stop audio when setting is disabled
  - Added safeguard in `useAudio` to stop playback when `autoPlay` changes to false

- **Anti-Cheat System**: Implemented measures to prevent cheating via browser console.
  - Added console logging filters to hide game information
  - Created warning system for when console is opened
  - Added sanitization for sensitive game data in logs
  - Implemented console detection mechanisms
  
- **Anti-Cheat Clipboard Fix**: Improved anti-cheat system to allow clipboard operations.
  - Added exception for copy/paste actions to avoid false positives
  - Modified detection thresholds to be less sensitive
  - Added auto-dismissal of warnings after clipboard operations
  - Improved warning message to explain allowed clipboard usage
  - Added 5-second auto-dismiss for warnings to avoid disrupting gameplay

- **Anti-Cheat UI Interaction Fix**: Enhanced anti-cheat system to prevent false positives during normal gameplay.
  - Added special handling for room joining, creation, and lobby actions
  - Implemented smart detection for UI interactions to avoid false warnings
  - Added grace periods for form inputs and button clicks
  - Made warning message less intrusive with reduced display time
  - Added whitelisting for common React/Firebase framework messages
  - Created special immunity periods for room-related pages

- **Anti-Cheat Night Phase Audio Fix**: Eliminated false warnings during night phase voice narration.
  - Added detection for audio playback to suppress warnings during narration
  - Implemented night phase detection to create immunity period during voice explanations
  - Added rapid warning dismissal when audio is playing
  - Created special handling for game page audio events
  - Expanded whitelist to include all narration and role-related terms
  - Added active monitoring of audio elements to prevent disruption

## Planned Improvements

From `improvement.txt`:
- Accessibility features (keyboard navigation, screen reader compatibility)
- Enhanced UX (animations, sound effects, timers)
- Additional game features (spectator mode, more roles, custom roles)
- Social features (friend system, profiles, matchmaking)
- Technical improvements (offline mode, reconnection handling)
- Game variations (timed mode, tournament mode)
- Educational features (tutorials, AI bots) 

## Sound Effects Implementation

The game includes a sound effects system for enhanced user experience:

- **UI Sound Effects**: Subtle audio feedback for user interactions
  - Button Clicks: Subtle click/tap sound when pressing buttons in lobbies and game controls
  - Toggle Sounds: Distinct sounds for toggle on/off actions
  - Notification Sounds: Different sounds for success, error, and alert events

- **Sound Management**:
  - Implemented in `/src/utils/soundEffects.ts`
  - Volume controls per sound category (UI, Game, Ambient, Voice)
  - Mute/unmute functionality for all sound categories
  - Settings stored in localStorage for persistence

- **Sound Files**:
  - Located in `/public/sounds/` directory
  - UI sounds in `/public/sounds/ui/` include:
    - button-click.mp3
    - toggle-on.mp3
    - toggle-off.mp3
    - error.mp3
    - success.mp3
    - alert.mp3

- **Integration**:
  - Button component automatically plays click sounds when pressed
  - Toggle components play appropriate sounds when state changes
  - Notification system uses corresponding sounds for different message types 