# Night Phase Voice Narration

This directory contains audio files used for narrating the night phase in One Night Werewolf game.

## Required Audio Files

Place the following audio files in this directory:

1. `Werewolves.wav` - Instructions for werewolves to wake up and look for other werewolves
2. `Minion.wav` - Instructions for the minion to wake up and identify the werewolves
3. `Seer.wav` - Instructions for the seer to look at someone's card or two center cards
4. `Robber.wav` - Instructions for the robber to exchange cards with another player
5. `Troublemaker.wav` - Instructions for the troublemaker to switch other players' cards
6. `Drunk.wav` - Instructions for the drunk to exchange their card with a center card
7. `Insomniac.wav` - Instructions for the insomniac to check their card
8. `Mason.wav` - Instructions for the masons to identify each other
9. `Doppelganger.wav` - Instructions for the doppelganger to copy another player's role

## Audio Format

Audio files should be in WAV format for better compatibility across browsers. Make sure the files have clear instructions with appropriate timing for each role's action during the night phase.

## Example Content

For example, the Werewolves.wav file could contain:
"Werewolves, wake up and look for other werewolves. If there is only one werewolf, you may look at a card from the center."

## Implementation Details

These audio files are automatically preloaded when the game starts and played by the host player during the night phase as each role's turn comes up. 