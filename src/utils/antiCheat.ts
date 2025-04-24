/**
 * Anti-cheat utilities to prevent players from using browser console to cheat
 */

/**
 * Sanitizes logs to prevent game information leakage to the console
 * @param message - The log message
 * @param data - Optional data to log
 */
export const sanitizeLogForProduction = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    // In development, log everything normally
    console.log(message, data);
    return;
  }

  // In production, sanitize sensitive information
  const sanitizedMessage = message.replace(/role|card|werewolf|seer|robber|troublemaker|drunk|insomniac|tanner|hunter|mason|minion|doppelganger|villager/gi, '[HIDDEN]');
  
  // Only log if it's an error or non-game related info
  if (message.toLowerCase().includes('error') || 
      message.toLowerCase().includes('failed') || 
      !message.match(/role|card|werewolf|seer|robber|troublemaker|drunk|insomniac|tanner|hunter|mason|minion|doppelganger|villager|night action|swap|vote/i)) {
    
    if (data) {
      const sanitizedData = JSON.parse(JSON.stringify(data));
      
      // Sanitize player information
      if (sanitizedData.players) {
        sanitizedData.players = sanitizedData.players.map((player: any) => ({
          ...player,
          originalRole: player.originalRole ? '[HIDDEN]' : null,
          currentRole: player.currentRole ? '[HIDDEN]' : null,
          votedFor: player.votedFor ? '[HIDDEN]' : null
        }));
      }
      
      // Sanitize center cards
      if (sanitizedData.centerCards) {
        sanitizedData.centerCards = sanitizedData.centerCards.map(() => '[HIDDEN]');
      }
      
      // Sanitize role-related data
      if (sanitizedData.role || sanitizedData.action || sanitizedData.selectedRoles) {
        if (sanitizedData.role) sanitizedData.role = '[HIDDEN]';
        if (sanitizedData.action) sanitizedData.action = '[HIDDEN]';
        if (sanitizedData.selectedRoles) sanitizedData.selectedRoles = sanitizedData.selectedRoles.map(() => '[HIDDEN]');
      }
      
      console.log(sanitizedMessage, sanitizedData);
    } else {
      console.log(sanitizedMessage);
    }
  }
};

/**
 * Sets up console anti-cheat measures
 * @param onConsoleOpened - Callback function when console is detected
 */
export const setupConsoleAntiCheat = (onConsoleOpened: () => void) => {
  if (process.env.NODE_ENV === 'production') {
    // Display anti-cheat warning
    const warningStyle = 
      'color: red; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);';
    const messageStyle = 
      'color: white; background: #333; font-size: 14px; padding: 5px;';
    
    console.clear();
    console.log('%c⚠️ ANTI-CHEAT WARNING', warningStyle);
    console.log(
      '%cAttempting to view game information through the console is considered cheating.\n' + 
      'Game-related logs are hidden for fair play.\n' + 
      'Clipboard operations (copy/paste) are allowed for room codes.\n' +
      'Enjoy the game as it was meant to be played! 🐺', 
      messageStyle
    );
    
    // Store original console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error
    };

    // Track UI interaction state
    let recentUIInteraction = false;
    let uiInteractionTimer: NodeJS.Timeout | null = null;

    // Filter to check if a message contains game-sensitive information
    const isGameInfo = (args: any[]) => {
      const gamePatterns = [
        /role/i, /werewolf/i, /seer/i, /robber/i, /troublemaker/i, 
        /drunk/i, /insomniac/i, /tanner/i, /hunter/i, /mason/i, 
        /minion/i, /doppelganger/i, /villager/i, /night action/i,
        /player.*card/i, /center.*card/i, /swapped/i, /original/i,
        /🎵/i, /audio/i, /narration/i, /currentNightAction/i,
        /game state/i, /vote/i
      ];
      
      const logText = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      return gamePatterns.some(pattern => pattern.test(logText));
    };

    // Create a list of allowed console message patterns (common framework/UI logging)
    const allowedPatterns = [
      /click/i, /button/i, /input/i, /react/i, /render/i, /component/i, 
      /event/i, /listener/i, /state/i, /prop/i, /navigate/i, /route/i,
      /room/i, /join/i, /create/i, /lobby/i, /firebase/i, /connecting/i,
      /bootstrap/i, /loaded/i, /initialized/i, /chunk/i,
      // Additional commonly logged framework messages that shouldn't trigger warnings
      /warning/i, /deprecated/i, /browser/i, /document/i, /window/i,
      /script/i, /resource/i, /load/i, /network/i, /request/i, /response/i,
      /mobile/i, /desktop/i, /screen/i, /view/i, /pixel/i, /media/i,
      /form/i, /submit/i, /change/i, /value/i, /text/i, /field/i,
      // Firebase and React specific messages
      /firebase/i, /firestore/i, /database/i, /auth/i, /token/i, /hook/i,
      /component/i, /render/i, /effect/i, /memo/i, /callback/i, /ref/i,
      // Audio and night phase related messages - to avoid warnings during voice narration
      /audio/i, /sound/i, /play/i, /playing/i, /pause/i, /stopped/i, /canplay/i,
      /voice/i, /narration/i, /night/i, /phase/i, /werewolves/i, /seer/i, /robber/i, 
      /troublemaker/i, /drunk/i, /insomniac/i, /tanner/i, /hunter/i, /mason/i,
      /minion/i, /doppelganger/i, /villager/i, /🎵/i, /ready/i, /ended/i
    ];

    // Check if a message matches allowed UI interaction patterns
    const isAllowedInteraction = (args: any[]) => {
      const logText = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      return allowedPatterns.some(pattern => pattern.test(logText));
    };
    
    // Check if the current page is a room-related page
    const isRoomRelatedPage = () => {
      const path = window.location.pathname.toLowerCase();
      return path.includes('room') || path.includes('lobby') || path === '/';
    };
    
    // Check if the current page is a game page (where audio would play)
    const isGamePage = () => {
      const path = window.location.pathname.toLowerCase();
      // Room page typically has room code in URL and would handle night phase
      return path.includes('/room/');
    };
    
    // Setup special handling for night phase audio
    let isNightPhase = false;
    
    // Function to check if we're likely in the night phase
    const checkNightPhase = () => {
      // Look for night phase indicators in the DOM
      const nightElements = document.querySelectorAll('[class*="night"], [id*="night"], h2, h3');
      for (const elem of nightElements) {
        const text = elem.textContent?.toLowerCase() || '';
        if (text.includes('night phase') || text.includes('night time') || 
            text.includes('werewolf') || text.includes('seer') || 
            text.includes('robber') || text.includes('night action')) {
          isNightPhase = true;
          return true;
        }
      }
      return false;
    };
    
    // Add special handling for audio events to prevent false positives during night phase narration
    const handleAudioEvents = (e: Event) => {
      if (e.type.includes('play') || e.type.includes('audio') || e.type.includes('sound')) {
        // If audio event detected, set a longer immunity period
        recentUIInteraction = true;
        
        // Clear any existing timer
        if (uiInteractionTimer) {
          clearTimeout(uiInteractionTimer);
        }
        
        // Set a timer to reset the flag after 10 seconds - extended for audio playback
        uiInteractionTimer = setTimeout(() => {
          recentUIInteraction = false;
        }, 10000);
      }
    };
    
    // Add listeners for audio-related events
    document.addEventListener('play', handleAudioEvents, true);
    document.addEventListener('playing', handleAudioEvents, true);
    document.addEventListener('canplay', handleAudioEvents, true);
    document.addEventListener('canplaythrough', handleAudioEvents, true);
    
    // Check for night phase every 2 seconds when in a game
    if (isGamePage()) {
      setInterval(checkNightPhase, 2000);
    }
    
    // Start with UI interaction flag true for 5 seconds on room pages
    // This gives a grace period when first loading the page
    if (isRoomRelatedPage()) {
      recentUIInteraction = true;
      setTimeout(() => {
        recentUIInteraction = false;
      }, 5000);
    }

    // Track number of console accesses to avoid triggering on clipboard operations
    let consoleAccessCount = 0;
    const detectThreshold = 5;  // Increased threshold from 3 to 5
    let lastAccessTime = 0;
    const accessTimeWindow = 1000;  // Decreased window from 2000ms to 1000ms
    
    // Set up listener for UI interactions to prevent false positives
    const uiInteractionListener = (e: Event) => {
      recentUIInteraction = true;
      
      // Special handling for room joining/creation
      // If the user clicks on anything with "join", "room", or "create" in it
      if (e.type === 'click' && e.target instanceof HTMLElement) {
        const targetElement = e.target;
        const targetText = (targetElement.textContent || '').toLowerCase();
        const targetClassNames = (targetElement.className || '').toLowerCase();
        
        // Check for room-related interactions
        if (
          targetText.includes('join') || 
          targetText.includes('room') || 
          targetText.includes('create') ||
          targetText.includes('lobby') ||
          targetClassNames.includes('room') ||
          targetClassNames.includes('join') ||
          targetClassNames.includes('create') ||
          targetClassNames.includes('lobby')
        ) {
          // Set a longer immunity period for room actions
          recentUIInteraction = true;
          
          // Clear any existing timer
          if (uiInteractionTimer) {
            clearTimeout(uiInteractionTimer);
          }
          
          // Set a timer to reset the flag after 3 seconds - longer immunity for room actions
          uiInteractionTimer = setTimeout(() => {
            recentUIInteraction = false;
          }, 3000);
          
          return; // Skip the regular timer below
        }
      }
      
      // Clear any existing timer
      if (uiInteractionTimer) {
        clearTimeout(uiInteractionTimer);
      }
      
      // Set a timer to reset the flag after 1 second
      uiInteractionTimer = setTimeout(() => {
        recentUIInteraction = false;
      }, 1000);
    };

    // Add listeners for common UI interactions
    document.addEventListener('click', uiInteractionListener);
    document.addEventListener('input', uiInteractionListener);
    document.addEventListener('change', uiInteractionListener);

    // Function to determine if this is likely a real console access vs clipboard
    const isLikelyConsoleAccess = (args: any[]) => {
      const now = Date.now();
      
      // Don't trigger during night phase
      if (isNightPhase) {
        return false;
      }
      
      // If this is a recent UI interaction or allowed pattern, don't count it
      if (recentUIInteraction || isAllowedInteraction(args)) {
        return false;
      }
      
      // Reset counter if it's been a while since last access
      if (now - lastAccessTime > accessTimeWindow) {
        consoleAccessCount = 0;
      }
      
      lastAccessTime = now;
      consoleAccessCount++;
      
      // Only trigger if we've had multiple accesses in a short time
      return consoleAccessCount >= detectThreshold;
    };

    // Override console methods to filter game information
    console.log = function(...args) {
      if (!isGameInfo(args)) {
        originalConsole.log(...args);
      }
      
      // Only trigger alert on likely console access
      if (isLikelyConsoleAccess(args)) {
        onConsoleOpened();
      }
    };
    
    console.info = function(...args) {
      if (!isGameInfo(args)) {
        originalConsole.info(...args);
      }
      
      if (isLikelyConsoleAccess(args)) {
        onConsoleOpened();
      }
    };
    
    console.debug = function(...args) {
      if (!isGameInfo(args)) {
        originalConsole.debug(...args);
      }
      
      if (isLikelyConsoleAccess(args)) {
        onConsoleOpened();
      }
    };
    
    console.warn = function(...args) {
      originalConsole.warn(...args);
      
      if (isLikelyConsoleAccess(args)) {
        onConsoleOpened();
      }
    };
    
    console.error = function(...args) {
      originalConsole.error(...args);
      
      if (isLikelyConsoleAccess(args)) {
        onConsoleOpened();
      }
    };
    
    // Setup additional console detection methods - only use more reliable methods
    const detectDevTools = () => {
      // Don't trigger if audio is playing (likely voice narration)
      const audioElements = document.querySelectorAll('audio');
      let isAudioPlaying = false;
      audioElements.forEach(audio => {
        if (!audio.paused) {
          isAudioPlaying = true;
        }
      });
      
      if (isAudioPlaying) {
        return;
      }
      
      // More aggressive detection - only use for actual DevTools opening
      // This threshold is large enough to avoid clipboard operations
      const widthThreshold = window.outerWidth - window.innerWidth > 250; // Increased threshold
      const heightThreshold = window.outerHeight - window.innerHeight > 250; // Increased threshold
      
      // Don't trigger if there was a recent UI interaction
      if (!recentUIInteraction && (widthThreshold || heightThreshold)) {
        onConsoleOpened();
      }
    };

    // Add listeners for console detection
    window.addEventListener('resize', detectDevTools);
    
    return () => {
      // Cleanup function to restore original console
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      window.removeEventListener('resize', detectDevTools);
      document.removeEventListener('click', uiInteractionListener);
      document.removeEventListener('input', uiInteractionListener);
      document.removeEventListener('change', uiInteractionListener);
      // Remove audio event listeners
      document.removeEventListener('play', handleAudioEvents, true);
      document.removeEventListener('playing', handleAudioEvents, true);
      document.removeEventListener('canplay', handleAudioEvents, true);
      document.removeEventListener('canplaythrough', handleAudioEvents, true);
      if (uiInteractionTimer) {
        clearTimeout(uiInteractionTimer);
      }
    };
  }
  
  // Return empty cleanup function for non-production
  return () => {};
}; 