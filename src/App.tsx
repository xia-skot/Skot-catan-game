import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Stage, Layer, RegularPolygon, Text, Group, Circle, Line, Path, Image, Rect } from 'react-konva';
import { useCatanGame, getHexesForEdge, getHexesForVertex } from './useCatanGame';
import { HexType, ResourceType, DevCardType, MapType, GameState } from './types';
import { HEX_RESOURCES, RESOURCE_NAMES, HEX_NAMES, RESOURCE_COLORS, PLAYER_COLORS, COSTS, RESOURCE_EMOJIS } from './constants';
import { GameOverModal } from './components/GameOverModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, 
  User, 
  Ship as ShipIcon, 
  Home, 
  Map as MapIcon, 
  ChevronRight,
  ChevronDown,
  Trophy,
  Hammer,
  Repeat,
  Info,
  Settings,
  X,
  BookOpen,
  Users,
  Play,
  AlertTriangle,
  Bot,
  Check,
  Copy,
  LogOut,
  Trash2,
  Maximize,
  Minimize,
  RotateCw
} from 'lucide-react';
import { ResourceSelector } from './components/ResourceSelector';
import { GoldSelectionPanel } from './components/GoldSelectionPanel';
import { socketService, RoomState } from './socketService';
import { FOREST_IMG, FIELDS_IMG, PASTURE_IMG, Desert_IMG, Mountains_IMG } from './images';

const HEX_RADIUS = 40;
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_HEIGHT = 2 * HEX_RADIUS;

const OrientationOverlay = () => (
  <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center p-8 text-center sm:hidden">
    <motion.div 
      animate={{ rotate: 90 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="mb-8"
    >
      <Repeat size={64} className="text-indigo-400 opacity-20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Maximize size={32} className="text-white" />
      </div>
    </motion.div>
    <h2 className="text-2xl font-black text-white mb-4">请旋转设备</h2>
    <p className="text-slate-400 text-sm max-w-[240px] leading-relaxed">
      为了获得最佳的卡坦岛游戏体验，建议您使用横屏模式。
    </p>
  </div>
);

const PortIcon = ({ type, x, y, flip }: { type: string, x: number, y: number, flip: boolean }) => {
  let path = "";
  let fill = "";
  let scale = 0.55;

  switch (type) {
    case ResourceType.Lumber:
      path = "M12 2 L5 10 H9 L5 18 H10 V22 H14 V18 H19 L15 10 H19 Z";
      fill = "#2E8B57";
      break;
    case ResourceType.Brick:
      path = "M4 8 L12 4 L20 8 L12 12 Z M4 10 V16 L12 20 V14 Z M14 13 V19 L22 15 V9 Z";
      fill = "#CD5C5C";
      break;
    case ResourceType.Wool:
      path = "M17.5 19C19.985 19 22 16.985 22 14.5C22 12.132 20.177 10.204 17.857 10.017C17.433 6.623 14.536 4 11 4C7.134 4 4 7.134 4 11C4 11.137 4.004 11.274 4.012 11.41C1.728 11.852 0 13.861 0 16.25C0 18.873 2.127 21 4.75 21H17.5Z";
      fill = "#778899";
      break;
    case ResourceType.Grain:
      path = "M12 22C12 22 11 16 7 12C3 8 2 2 2 2C2 2 8 3 12 7C16 11 22 12 22 12C22 12 21 18 17 22C13 26 12 22 12 22Z";
      fill = "#DAA520";
      break;
    case ResourceType.Ore:
      path = "M6 20 L10 12 L14 20 Z M12 20 L17 10 L22 20 Z M2 20 L5 15 L8 20 Z";
      fill = "#708090";
      break;
    default: // '3:1'
      path = "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z";
      fill = "#FFA500";
      break;
  }

  return (
    <Path
      x={x}
      y={y}
      data={path}
      fill={fill}
      scale={{ x: scale, y: scale }}
      offsetX={12}
      offsetY={12}
      rotation={flip ? 180 : 0}
    />
  );
};

const Port = ({ port, cx, cy, nx, ny }: { port: any, cx: number, cy: number, nx: number, ny: number }) => {
  const distance = 18; // Distance from edge to pill center
  const angleRad = Math.atan2(ny, nx);
  let rotation = angleRad * 180 / Math.PI + 90;
  rotation = (rotation + 360) % 360;
  
  // Flip the content if it would be upside down
  const flip = rotation > 90 && rotation < 270;

  return (
    <Group x={cx} y={cy} rotation={rotation} listening={false}>
      {/* Pier / Dock lines */}
      <Line
        points={[-4, 0, -4, -distance]}
        stroke="#8B5A2B"
        strokeWidth={3}
        perfectDrawEnabled={false}
      />
      <Line
        points={[4, 0, 4, -distance]}
        stroke="#8B5A2B"
        strokeWidth={3}
        perfectDrawEnabled={false}
      />

      {/* Pill Group */}
      <Group y={-distance} rotation={flip ? 180 : 0}>
        {/* Pill Background */}
        <Rect
          x={-22}
          y={-11}
          width={44}
          height={22}
          cornerRadius={11}
          fill="#FFFDF7"
          stroke="#C8A97E"
          strokeWidth={2}
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={4}
          shadowOffsetY={2}
        />

        {/* Icon */}
        <PortIcon type={port.type} x={-11} y={0} flip={flip} />

        {/* Text */}
        <Text
          text={port.type === '3:1' ? '3:1' : '2:1'}
          fontSize={12}
          fontStyle="bold"
          fill="#5C4033"
          x={9}
          y={0}
          width={24}
          height={12}
          offsetX={12}
          offsetY={6}
          align="center"
          verticalAlign="middle"
          fontFamily="Inter"
          rotation={flip ? 180 : 0}
        />
      </Group>
    </Group>
  );
};




const RobberToken = ({ x, y, isPhaseRobber }: { x: number, y: number, isPhaseRobber: boolean }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const image = new window.Image();
    image.src = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/edEzQKj - Imgur.png');
    image.referrerPolicy = 'no-referrer';
    image.crossOrigin = 'Anonymous';
    image.onload = () => setImg(image);
  }, []);

  useEffect(() => {
    if (!isPhaseRobber) return;
    let animationFrame: number;
    const animate = () => {
      setPulse((Date.now() % 1200) / 1200);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [isPhaseRobber]);

  return (
    <Group x={x} y={y}>
      {isPhaseRobber && (
        <Circle 
          radius={18 + pulse * 12} 
          stroke="#EF4444" 
          strokeWidth={4 * (1 - pulse)} 
          opacity={1 - pulse} 
          listening={false} 
        />
      )}
      {img ? (
        <Image 
          image={img} 
          width={36} 
          height={36} 
          x={-18} 
          y={-18} 
          shadowColor="black"
          shadowBlur={8}
          shadowOpacity={0.6}
          shadowOffsetX={2}
          shadowOffsetY={4}
        />
      ) : (
        <Text text="👤" fontSize={24} offsetX={12} offsetY={12} />
      )}
    </Group>
  );
};

const PirateToken = ({ x, y, isPhaseRobber }: { x: number, y: number, isPhaseRobber: boolean }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const image = new window.Image();
    image.src = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/8M3QNSd - Imgur.png');
    image.referrerPolicy = 'no-referrer';
    image.crossOrigin = 'Anonymous';
    image.onload = () => setImg(image);
  }, []);

  useEffect(() => {
    if (!isPhaseRobber) return;
    let animationFrame: number;
    const animate = () => {
      setPulse((Date.now() % 1200) / 1200);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [isPhaseRobber]);

  return (
    <Group x={x} y={y}>
      {isPhaseRobber && (
        <Circle 
          radius={18 + pulse * 12} 
          stroke="#EF4444" 
          strokeWidth={4 * (1 - pulse)} 
          opacity={1 - pulse} 
          listening={false} 
        />
      )}
      {img ? (
        <Image 
          image={img} 
          width={36} 
          height={36} 
          x={-18} 
          y={-18} 
          shadowColor="black"
          shadowBlur={8}
          shadowOpacity={0.6}
          shadowOffsetX={2}
          shadowOffsetY={4}
        />
      ) : (
        <Text text="🏴‍☠️" fontSize={24} offsetX={12} offsetY={12} />
      )}
    </Group>
  );
};

export default function App() {
  const [devCardOverlay, setDevCardOverlay] = useState<{ playerName: string, actionStr: string } | null>(null);
  const [confirmDevCard, setConfirmDevCard] = useState<DevCardType | null>(null);
  
  const { 
    gameState, 
    syncGameState,
    initGame, 
    toggleBot,
    rollDice, 
    resolveInitialRoll,
    nextTurn, 
    buildRoad, 
    buildShip,
    buildSettlement, 
    upgradeToCity, 
    tradeWithBank,
    buyDevCard,
    playDevCard,
    cancelDevCard,
    resolveYearOfPlenty,
    resolveMonopoly,
    moveRobber,
    movePirate,
    selectStealTarget,
    stealResource,
    doSteal,
    selectGoldResource,
    addResources,
    generateMapTopology,
    distributeResources,
    discardCards,
    setPlayerResource,
    setDice,
    setBuildModeSync,
    proposeTrade,
    reactToTrade,
    cancelTrade,
    finalizeTrade,
    resetGame
  } = useCatanGame();

  const [hasResolvedGameOver, setHasResolvedGameOver] = useState(false);

  const handleReturnToLobby = () => {
    const roomId = roomState?.roomId || inputRoomId;
    if (roomState?.hostId === socketService.playerId) {
      socketService.returnToLobby(roomId);
    } else {
      socketService.leaveRoom(roomId);
      // Handle local reset immediately for non-host
      setRoomState(null);
      setGameStarted(false);
      setShowGameOver(false);
      setHasResolvedGameOver(false);
      setIsJoinedLobby(false);
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleReturnToMap = () => {
    setShowGameOver(false);
    setHasResolvedGameOver(true);
  };

  const isRemoteUpdateRef = useRef(false);
  const playerBarRef = useRef<HTMLDivElement>(null);
  
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('catan_player_name') || `玩家-${Math.floor(Math.random()*1000)}`);
  const [inputRoomId, setInputRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || Math.random().toString().slice(2, 8);
  });
  const [isJoinedLobby, setIsJoinedLobby] = useState(false);

  useEffect(() => {
    socketService.connect();
    
    // Auto-fill room ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setInputRoomId(roomParam);
    }
    
    socketService.onRoomState((state) => {
      if (!state) return;
      setRoomState(state);
      setPlayerCount(state.settings.playerCount);
      setMapType(state.settings.mapType as MapType);
      setBotConfig(state.settings.botConfig);
    });

    socketService.onGameInit((newState) => {
      isRemoteUpdateRef.current = true;
      syncGameState(newState);
      setGameStarted(true);
      setHasManuallyInteracted(false);
    });

    socketService.onGameUpdate((newState) => {
      isRemoteUpdateRef.current = true;
      syncGameState(newState);
      setGameStarted(true); // Always ensure UI switches to game
    });

    socketService.onGameReset(() => {
      console.log('Game reset received from server - Cleaning up...');
      
      setRoomState(prevRoom => {
        const isSelfReset = prevRoom?.hostId === socketService.playerId;
        if (!isSelfReset && prevRoom) {
          setTimeout(() => alert('房间已被房主解散。'), 100);
        }
        return null; // implicitly clears the room state
      });

      // 1. Clear local game state first to prevent re-sync
      syncGameState(null as any);
      
      // 3. Reset UI flags
      setGameStarted(false);
      setShowGameOver(false);
      setHasResolvedGameOver(false);
      setIsJoinedLobby(false); // Force back to room search screen
      
      // 4. Remove room param from URL
      window.history.replaceState({}, '', window.location.pathname);
    });

    socketService.onReturnedToLobby(() => {
      console.log('Returned to lobby...');
      syncGameState(null as any);
      setGameStarted(false);
      setShowGameOver(false);
      setHasResolvedGameOver(false);
    });

    return () => {
      socketService.disconnect();
    };
  }, [syncGameState]);

  useEffect(() => {
    if (gameState) {
      if (isRemoteUpdateRef.current) {
        isRemoteUpdateRef.current = false;
      } else {
        socketService.sendGameState(roomState?.roomId || inputRoomId, gameState);
      }
    }
  }, [gameState, roomState, inputRoomId]);

  const handleJoinRoom = () => {
    let finalRoomId = inputRoomId.trim();
    if (!finalRoomId || finalRoomId.length < 1) {
      finalRoomId = Math.floor(100000 + Math.random() * 900000).toString();
      setInputRoomId(finalRoomId);
    }
    
    localStorage.setItem('catan_player_name', playerName);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('room', finalRoomId);
    window.history.replaceState({}, '', newUrl);

    socketService.joinRoom(finalRoomId, playerName);
    setIsJoinedLobby(true);
  };

  const handleToggleReady = () => {
    // Optimistically update the UI before the server response
    setRoomState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map(p => 
          p.id === socketService.playerId ? { ...p, isReady: !p.isReady } : p
        )
      };
    });
    socketService.toggleReady(roomState!.roomId);
  };

  const syncSettings = (newSettings: Partial<RoomState['settings']>) => {
    if (!roomState) return;
    socketService.updateSettings(roomState.roomId, { ...roomState.settings, ...newSettings });
  };

  const activePlayerId = gameState?.phase === 'discard' && (gameState?.pendingDiscards?.length || 0) > 0 
    ? gameState!.pendingDiscards[0].playerId 
    : gameState?.currentPlayerIndex ?? 0;

  const myPlayerIndex = useMemo(() => {
    if (!gameState) return -1;
    return gameState.players.findIndex(p => p.sessionId === socketService.playerId);
  }, [gameState]);

  const amIActivePlayer = useMemo(() => {
    if (!gameState) return true;
    const player = gameState.players[activePlayerId];
    if (!player) return false;
    
    // If it's a bot's turn, only the host "is" the active player for processing purposes
    if (player.isBot) {
      const isHost = !gameState.players[0].sessionId || gameState.players[0].sessionId === socketService.playerId;
      return isHost;
    }
    
    return player.sessionId === socketService.playerId;
  }, [gameState, activePlayerId]);

  const me = useMemo(() => {
    if (!gameState || myPlayerIndex === -1) return gameState?.players[0]; 
    return gameState.players[myPlayerIndex];
  }, [gameState, myPlayerIndex]);

  useEffect(() => {
    if (gameState?.lastDevCardEvent) {
      // Show overlay if event is recent
      if (Date.now() - gameState.lastDevCardEvent.timestamp < 1500) {
        setDevCardOverlay({ 
          playerName: gameState.lastDevCardEvent.playerName, 
          actionStr: gameState.lastDevCardEvent.cardType 
        });
        const timer = setTimeout(() => {
          setDevCardOverlay(null);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState?.lastDevCardEvent?.timestamp]);

  const isMyHumanTurn = useMemo(() => {
    if (!gameState) return false;
    const player = gameState.players[activePlayerId];
    return player?.sessionId === socketService.playerId;
  }, [gameState, activePlayerId]);

  const canBuild = ((gameState?.phase === 'main' && gameState.hasRolled) || 
    gameState?.phase === 'setup' || 
    gameState?.phase === 'road_building') && isMyHumanTurn;

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isMobile = windowSize.width < 1024;

  // Auto-scroll to active player on mobile
  useEffect(() => {
    if (isMobile && playerBarRef.current && activePlayerId !== undefined && gameState) {
      // Small delay to ensure DOM is ready and layout is stable
      const timer = setTimeout(() => {
        const container = playerBarRef.current;
        const activeCard = container?.querySelector(`[data-player-index="${activePlayerId}"]`) as HTMLElement;
        
        if (activeCard && container) {
          // Calculate the target scroll position to center the active card
          // We use scrollTo on the specific container to ensure ONLY the player bar moves
          const targetX = activeCard.offsetLeft - (container.clientWidth / 2) + (activeCard.clientWidth / 2);
          
          container.scrollTo({
            left: targetX,
            behavior: 'smooth'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activePlayerId, isMobile, !!gameState]);

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const lastCenter = useRef<{x: number, y: number} | null>(null);
  const lastDist = useRef<number>(0);

  const getDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getCenter = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  };

  const handleTouchMove = (e: any) => {
    // IMPORTANT: Always prevent default to stop native browser behavior (scrolling/zoom)
    // especially inside the map area where elements might try to handle touch.
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const touches = e.evt.touches;
    const numTouches = touches.length;

    if (numTouches >= 2) {
      setHasManuallyInteracted(true);
      
      // Stop any pending drag operation to allow smooth zoom
      if (stage.isDragging()) {
        stage.stopDrag();
      }

      const touch1 = touches[0];
      const touch2 = touches[1];
      const p1x = touch1.clientX;
      const p1y = touch1.clientY;
      const p2x = touch2.clientX;
      const p2y = touch2.clientY;
      
      const dist = Math.sqrt((p2x - p1x)**2 + (p2y - p1y)**2);
      const centerX = (p1x + p2x) / 2;
      const centerY = (p1y + p2y) / 2;

      if (!lastDist.current) {
        lastDist.current = dist;
        lastCenter.current = { x: centerX, y: centerY };
        return;
      }
      
      const stageScale = stage.scaleX();
      const stageX = stage.x();
      const stageY = stage.y();

      // Point relative to the stage coordinate system
      const pointToX = (lastCenter.current!.x - stageX) / stageScale;
      const pointToY = (lastCenter.current!.y - stageY) / stageScale;

      const newScale = stageScale * (dist / lastDist.current);
      // Reasonable scale limits for mobile
      const clampedScale = Math.max(0.15, Math.min(4, newScale));

      stage.scale({ x: clampedScale, y: clampedScale });

      stage.position({
        x: centerX - pointToX * clampedScale,
        y: centerY - pointToY * clampedScale,
      });
      
      lastDist.current = dist;
      lastCenter.current = { x: centerX, y: centerY };
    } else {
      if (lastDist.current !== 0) {
        lastDist.current = 0;
        lastCenter.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
    lastCenter.current = null;
    // Ensure dragging is re-enabled when touches end
    const stage = stageRef.current;
    if (stage && !stage.draggable()) stage.draggable(true);
  };

  const handleTouchStart = () => {
    lastDist.current = 0;
    lastCenter.current = null;
  };

  const [showPlayerTradeModal, setShowPlayerTradeModal] = useState(false);
  const [playerTradeOffer, setPlayerTradeOffer] = useState<Record<ResourceType, number>>({} as any);
  const [playerTradeRequest, setPlayerTradeRequest] = useState<Record<ResourceType, number>>({} as any);
  const [playerTradeTarget, setPlayerTradeTarget] = useState<number | null>(null);

  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showDebugButton, setShowDebugButton] = useState(false);
  const [debugModeEnabled, setDebugModeEnabled] = useState(false);
  const logoClickCountRef = useRef(0);
  const logoStartTimeRef = useRef<number>(0);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    if (now - logoStartTimeRef.current > 3000) {
      logoClickCountRef.current = 1;
      logoStartTimeRef.current = now;
    } else {
      logoClickCountRef.current += 1;
    }

    if (logoClickCountRef.current === 5) {
      setShowDebugButton(prev => {
        const newState = !prev;
        if (!newState) {
          setDebugModeEnabled(false);
          setShowDebugConsole(false);
        }
        return newState;
      });
      logoClickCountRef.current = 0;
      logoStartTimeRef.current = 0;
    }
  }, []);
  const [gameStarted, setGameStarted] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(window.innerWidth < window.innerHeight);
  const [showDissolveRoomConfirm, setShowDissolveRoomConfirm] = useState(false);

  // Auto-request fullscreen on first interaction and handle orientation
  useEffect(() => {
    const handleOrientation = () => {
      setIsPortrait(window.innerWidth < window.innerHeight);
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Set meta tags for "Desktop" scaling feel on mobile
  useEffect(() => {
    if (isMobile) {
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover');
    }
  }, [isMobile]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const elem = document.documentElement as any;
      const request = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
      if (request) {
        request.call(elem).catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      const exit = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
      if (exit) {
        exit.call(document);
      }
      setIsFullscreen(false);
    }
  }, []);

  // Force fullscreen on first click/touch in game/lobby
  useEffect(() => {
    if (isJoinedLobby || gameStarted) {
      const triggerFullscreen = () => {
        if (!document.fullscreenElement) {
          toggleFullscreen();
        }
        window.removeEventListener('click', triggerFullscreen);
        window.removeEventListener('touchstart', triggerFullscreen);
      };
      window.addEventListener('click', triggerFullscreen);
      window.addEventListener('touchstart', triggerFullscreen);
      return () => {
        window.removeEventListener('click', triggerFullscreen);
        window.removeEventListener('touchstart', triggerFullscreen);
      };
    }
  }, [isJoinedLobby, gameStarted, toggleFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const [isInitializingGame, setIsInitializingGame] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);
  const [botConfig, setBotConfig] = useState<boolean[]>(Array(6).fill(false));
  const [mapType, setMapType] = useState<MapType>('standard');
  const [tradeGive, setTradeGive] = useState<ResourceType | null>(null);
  const [tradeReceive, setTradeReceive] = useState<ResourceType | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const buildMode = gameState?.activeBuildMode ?? null;
  const isHost = roomState?.hostId === socketService.playerId;

  const handleSetBuildMode = useCallback((mode: typeof buildMode) => {
    if (isMyHumanTurn) {
      setBuildModeSync(mode);
    }
  }, [isMyHumanTurn, setBuildModeSync]);
  const stageRef = useRef<any>(null);
  const [imageElements, setImageElements] = useState<Record<string, HTMLImageElement>>({});

  const [connectedPlayers, setConnectedPlayers] = useState<string[]>([]);


  const [discardSelection, setDiscardSelection] = useState<Record<ResourceType, number>>({
    [ResourceType.Lumber]: 0,
    [ResourceType.Brick]: 0,
    [ResourceType.Wool]: 0,
    [ResourceType.Grain]: 0,
    [ResourceType.Ore]: 0,
  });

  useEffect(() => {
    // Reset discard selection when the discarding player changes
    setDiscardSelection({
      [ResourceType.Lumber]: 0,
      [ResourceType.Brick]: 0,
      [ResourceType.Wool]: 0,
      [ResourceType.Grain]: 0,
      [ResourceType.Ore]: 0,
    });
  }, [gameState?.pendingDiscards[0]?.playerId]);

  useEffect(() => {
    if (!gameState) {
      setHasResolvedGameOver(false);
      return;
    }
    
    if (gameState.phase === 'finished' && !hasResolvedGameOver && !showGameOver) {
      setShowGameOver(true);
    }

    if (gameState.phase !== 'finished') {
      setHasResolvedGameOver(false);
    }
  }, [gameState?.phase, hasResolvedGameOver, showGameOver]);

  const hexCoords = useMemo(() => {
    if (!gameState) return [];
    return gameState.board.map(hex => {
      const x = HEX_WIDTH * (hex.q + hex.r / 2);
      const y = HEX_HEIGHT * 0.75 * hex.r;
      return { ...hex, x, y, radius: HEX_RADIUS };
    });
  }, [gameState?.board]);

  const hasManuallyInteractedRef = useRef(false);

  const setHasManuallyInteracted = useCallback((val: boolean) => {
    hasManuallyInteractedRef.current = val;
  }, []);

  const centerMap = useCallback((force = false) => {
    if (!stageRef.current || hexCoords.length === 0) return;
    if (hasManuallyInteractedRef.current && !force) return;

    const stage = stageRef.current;
    const bounds = {
      minX: Infinity, minY: Infinity,
      maxX: -Infinity, maxY: -Infinity
    };

    // Find the bounding box of the actual land/sea hexes, ignoring the outer sea buffer
    hexCoords.forEach(hex => {
      if (hex.isOuterSea) return;
      bounds.minX = Math.min(bounds.minX, hex.x - hex.radius);
      bounds.minY = Math.min(bounds.minY, hex.y - hex.radius);
      bounds.maxX = Math.max(bounds.maxX, hex.x + hex.radius);
      bounds.maxY = Math.max(bounds.maxY, hex.y + hex.radius);
    });

    const mapWidth = bounds.maxX - bounds.minX;
    const mapHeight = bounds.maxY - bounds.minY;
    const stageWidth = stage.width();
    const stageHeight = stage.height();

    if (mapWidth === 0 || mapHeight === 0 || stageWidth === 0 || stageHeight === 0) return;

    const scaleX = stageWidth / mapWidth;
    const scaleY = stageHeight / mapHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // Use 90% of the space for a bit more padding

    stage.scale({ x: scale, y: scale });

    // Center the map within the stage
    const newX = (stageWidth - mapWidth * scale) / 2 - bounds.minX * scale;
    const newY = (stageHeight - mapHeight * scale) / 2 - bounds.minY * scale;
    
    stage.position({ x: newX, y: newY });
    stage.batchDraw();
  }, [hexCoords]);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      
      // Force panels to always show
      setShowLeftPanel(true);
      setShowRightPanel(true);
      
      setTimeout(() => centerMap(), 50);
    };
    window.addEventListener('resize', handleResize);
    
    // Recenter when the window is resized or the map data changes.
    // Use multiple timeouts to ensure layout has settled
    const t1 = setTimeout(() => centerMap(), 100);
    const t2 = setTimeout(() => centerMap(), 300);
    const t3 = setTimeout(() => centerMap(), 800);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [centerMap, gameStarted, isInitializingGame, assetsLoaded]);

  const handleWheel = (e: any) => {
    setHasManuallyInteracted(true);
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Limit scale
    if (newScale < 0.1 || newScale > 5) return;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();
  };
  const [savedMaps, setSavedMaps] = useState<any[]>(() => {
    const saved = localStorage.getItem('catan_saved_maps');
    return saved ? JSON.parse(saved) : [];
  });
  const [showMapGenerator, setShowMapGenerator] = useState(false);
  const [showMapAlbum, setShowMapAlbum] = useState(false);
  const [albumFilter, setAlbumFilter] = useState<'2-4' | '5' | '6'>('2-4');
  const [previewTopology, setPreviewTopology] = useState<any>(null);

  const filteredMaps = useMemo(() => {
    return savedMaps.filter(map => {
      if (albumFilter === '2-4') return map.playerCount >= 2 && map.playerCount <= 4;
      if (albumFilter === '5') return map.playerCount === 5;
      if (albumFilter === '6') return map.playerCount === 6;
      return true;
    });
  }, [savedMaps, albumFilter]);
  const [previewBoard, setPreviewBoard] = useState<any[]>([]);

  const canAfford = useCallback((cost: Record<string, number>) => {
    if (!gameState || !me) return false;
    return Object.entries(cost).every(([res, amt]) => me.resources[res as ResourceType] >= amt);
  }, [gameState, me]);

  // Auto-exit build mode if resources are insufficient (unless it's setup or road building card)
  useEffect(() => {
    if (buildMode && gameState?.phase === 'main') {
      const freeRoads = gameState.freeRoads || 0;
      if (buildMode === 'road' && freeRoads > 0) return;
      
      const costs = {
        road: COSTS.road,
        settlement: COSTS.settlement,
        city: COSTS.city,
        ship: COSTS.ship
      };
      if (!canAfford(costs[buildMode])) {
        handleSetBuildMode(null);
      }
    }
  }, [gameState?.players, gameState?.currentPlayerIndex, buildMode, canAfford, handleSetBuildMode, gameState?.freeRoads, gameState?.phase]);

  const generatePreview = useCallback(() => {
    const topology = generateMapTopology(mapType, playerCount);
    setPreviewTopology(topology);
    const board = distributeResources(topology, mapType, playerCount);
    setPreviewBoard(board);
  }, [mapType, playerCount, generateMapTopology, distributeResources]);

  const saveMapToAlbum = () => {
    if (!previewTopology) return;
    const newMap = {
      id: Date.now().toString(),
      name: `${mapType === 'standard' ? '标准大陆' : '群岛世界'} - ${playerCount}人`,
      playerCount,
      mapType,
      topology: previewTopology,
      date: new Date().toLocaleString()
    };
    const updated = [...savedMaps, newMap];
    setSavedMaps(updated);
    localStorage.setItem('catan_saved_maps', JSON.stringify(updated));
    alert('地图已保存到图册！');
  };

  const startWithPreviewMap = () => {
    initGame(
      playerCount, 
      mapType, 
      previewBoard, 
      roomState?.settings.botConfig, 
      roomState?.players.map(p => p.id),
      roomState?.players.map(p => p.name)
    );
    setGameStarted(true);
    setShowMapGenerator(false);
  };

  const startWithSavedMap = (savedMap: any) => {
    const board = distributeResources(savedMap.topology, savedMap.mapType, savedMap.playerCount);
    initGame(
      savedMap.playerCount, 
      savedMap.mapType, 
      board, 
      roomState?.settings.botConfig, 
      roomState?.players.map(p => p.id),
      roomState?.players.map(p => p.name)
    );
    setGameStarted(true);
    setShowMapAlbum(false);
  };

  const deleteSavedMap = (id: string) => {
    const updated = savedMaps.filter(m => m.id !== id);
    setSavedMaps(updated);
    localStorage.setItem('catan_saved_maps', JSON.stringify(updated));
  };

  // Auto-select build mode during setup phase
  useEffect(() => {
    if (gameState?.phase === 'setup') {
      const pIdx = gameState.currentPlayerIndex;
      const settlementsCount = gameState.settlements.filter(s => s.playerId === pIdx).length;
      const roadsCount = gameState.roads.filter(r => r.playerId === pIdx).length;
      const shipsCount = gameState.ships.filter(s => s.playerId === pIdx).length;
      
      if (settlementsCount > (roadsCount + shipsCount)) {
        if (buildMode !== 'road' && buildMode !== 'ship') handleSetBuildMode('road');
      } else {
        if (buildMode !== 'settlement') handleSetBuildMode('settlement');
      }
    } else if (gameState?.phase === 'initial_dice_roll' || gameState?.phase === 'discard') {
      if (buildMode !== null) handleSetBuildMode(null);
    }
  }, [gameState?.phase, gameState?.currentPlayerIndex, gameState?.settlements.length, gameState?.roads.length, gameState?.ships.length, handleSetBuildMode, buildMode]);

  const checkIsValidEdge = useCallback((edgeId: string, mode: 'road' | 'ship') => {
    if (!gameState) return false;
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Check limits
    const numRoads = gameState.roads.filter(r => r.playerId === player.id).length;
    const numShips = gameState.ships.filter(s => s.playerId === player.id).length;
    if (mode === 'road' && numRoads >= 15) return false;
    if (mode === 'ship' && numShips >= 15) return false;

    // Check if occupied
    if (gameState.roads.some(r => r.edgeId === edgeId) || gameState.ships.some(s => s.edgeId === edgeId)) return false;


    const hexes = getHexesForEdge(gameState.board, edgeId);
    
    // Pirate check - only blocks SHIPS
    if (mode === 'ship' && hexes.some(h => h.id === gameState.pirateHexId)) return false;

    // Robber check - usually doesn't block roads, but let's keep consistency if needed. 
    // In standard Catan, robber doesn't block building, but let's assume it doesn't here.

    if (mode === 'road') {
      // Road: Must have at least one land hex adjacent
      if (hexes.length > 0 && hexes.every(h => h.type === HexType.Sea || h.isOuterSea)) return false;
      if (hexes.length === 0) return false;
    } else {
      // Ship: Must have at least one sea hex adjacent
      if (!hexes.some(h => h.type === HexType.Sea || h.isOuterSea)) return false;
    }

    // Connectivity
    const [v1Id, v2Id] = edgeId.split('|');
    
    // Setup phase logic
    if (gameState.phase === 'setup') {
        if (mode === 'ship') return false; // No ships in setup
        // In setup, road must connect to the last placed settlement
        const lastSettlement = gameState.settlements.filter(s => s.playerId === player.id).pop();
        if (!lastSettlement) return false;
        return lastSettlement.vertexId === v1Id || lastSettlement.vertexId === v2Id;
    }

    // Main phase connectivity
    const hasSettlementAtV1 = gameState.settlements.some(s => s.playerId === player.id && s.vertexId === v1Id);
    const hasSettlementAtV2 = gameState.settlements.some(s => s.playerId === player.id && s.vertexId === v2Id);
    
    const oppSettlementAtV1 = gameState.settlements.some(s => s.playerId !== player.id && s.vertexId === v1Id);
    const oppSettlementAtV2 = gameState.settlements.some(s => s.playerId !== player.id && s.vertexId === v2Id);

    const hasRoadAtV1 = gameState.roads.some(r => r.playerId === player.id && r.edgeId !== edgeId && r.edgeId.split('|').includes(v1Id));
    const hasRoadAtV2 = gameState.roads.some(r => r.playerId === player.id && r.edgeId !== edgeId && r.edgeId.split('|').includes(v2Id));
    
    const hasShipAtV1 = gameState.ships.some(s => s.playerId === player.id && s.edgeId !== edgeId && s.edgeId.split('|').includes(v1Id));
    const hasShipAtV2 = gameState.ships.some(s => s.playerId === player.id && s.edgeId !== edgeId && s.edgeId.split('|').includes(v2Id));

    if (mode === 'road') {
      // Roads can connect to other roads OR ships (at coastal vertices)
      const canConnectV1 = hasSettlementAtV1 || (hasRoadAtV1 && !oppSettlementAtV1) || (hasShipAtV1 && !oppSettlementAtV1);
      const canConnectV2 = hasSettlementAtV2 || (hasRoadAtV2 && !oppSettlementAtV2) || (hasShipAtV2 && !oppSettlementAtV2);
      return canConnectV1 || canConnectV2;
    } else {
      // Ships can connect to other ships OR roads (at coastal vertices)
      const canConnectV1 = hasSettlementAtV1 || (hasShipAtV1 && !oppSettlementAtV1) || (hasRoadAtV1 && !oppSettlementAtV1);
      const canConnectV2 = hasSettlementAtV2 || (hasShipAtV2 && !oppSettlementAtV2) || (hasRoadAtV2 && !oppSettlementAtV2);
      return canConnectV1 || canConnectV2;
    }
  }, [gameState]);

  const checkIsValidVertex = useCallback((vertexId: string, mode: 'settlement' | 'city') => {
    if (!gameState) return false;
    const player = gameState.players[gameState.currentPlayerIndex];

    const hexes = getHexesForVertex(gameState.board, vertexId);
    
    // Pirate check - only blocks settlements if they are on a pure sea hex (which shouldn't happen for land settlements)
    // In standard Seafarers, the Pirate moved to a sea hex blocks that hex's production and ships.
    // It usually doesn't block building settlements on islands.

    if (mode === 'city') {
      // Must be own settlement and not city
      const settlement = gameState.settlements.find(s => s.vertexId === vertexId);
      return settlement && settlement.playerId === player.id && !settlement.isCity;
    }

    // Settlement mode
    // Must be empty
    if (gameState.settlements.some(s => s.vertexId === vertexId)) return false;

    // Must not be all sea
    if (hexes.every(h => h.type === HexType.Sea)) return false;

    // Distance rule
    const [vx, vy] = vertexId.split(',').map(Number);
    const isTooClose = gameState.settlements.some(s => {
      const [sx, sy] = s.vertexId.split(',').map(Number);
      const dist = Math.sqrt(Math.pow(vx - sx, 2) + Math.pow(vy - sy, 2));
      return dist < 50;
    });
    if (isTooClose) return false;

    // Setup phase
    if (gameState.phase === 'setup') {
        // Check if Gold (forbidden in setup)
        if (hexes.some(h => h.type === HexType.Gold)) return false;
        // Must be starting land
        if (!hexes.some(h => h.isStartingLand)) return false;
        return true;
    }

    // Main phase connectivity
    const hasRoadConnection = 
      gameState.roads.some(r => r.playerId === player.id && r.edgeId.split('|').includes(vertexId)) ||
      gameState.ships.some(s => s.playerId === player.id && s.edgeId.split('|').includes(vertexId));
      
    return hasRoadConnection;
  }, [gameState]);

  const handleVertexClick = useCallback((vertexId: string, hexIds: string[]) => {
    if (!canBuild) return;
    
    if (buildMode === 'settlement') {
        if (checkIsValidVertex(vertexId, 'settlement')) {
            buildSettlement(vertexId, hexIds);
        }
    } else if (buildMode === 'city') {
        if (checkIsValidVertex(vertexId, 'city')) {
            upgradeToCity(vertexId);
        }
    }
  }, [canBuild, buildMode, checkIsValidVertex, buildSettlement, upgradeToCity, gameState?.phase, handleSetBuildMode]);

  const handleEdgeClick = useCallback((edgeId: string) => {
    if (!canBuild) return;

    if (buildMode === 'road') {
        if (checkIsValidEdge(edgeId, 'road')) {
            buildRoad(edgeId);
        }
    } else if (buildMode === 'ship') {
        if (checkIsValidEdge(edgeId, 'ship')) {
            buildShip(edgeId);
        }
    }
  }, [canBuild, buildMode, checkIsValidEdge, buildRoad, buildShip, gameState?.phase, handleSetBuildMode]);

  const handleHexClick = useCallback((hexId: string, type: HexType) => {
      // Only allow phase-related hex clicks (robber/pirate movement) if it's the active player's turn
      if (gameState?.phase === 'robber' && amIActivePlayer) {
          if (type === HexType.Sea) {
              movePirate(hexId);
          } else {
              moveRobber(hexId);
          }
      } else {
          setSelectedHex(hexId);
      }
  }, [gameState?.phase, amIActivePlayer, movePirate, moveRobber]);

  const vertices = useMemo(() => {
    const vMap = new Map<string, { x: number, y: number, hexIds: string[], id: string }>();
    hexCoords.forEach(hex => {
      for (let i = 0; i < 6; i++) {
        const angle_rad = (Math.PI / 180) * (60 * i + 30);
        const vx = hex.x + HEX_RADIUS * Math.cos(angle_rad);
        const vy = hex.y + HEX_RADIUS * Math.sin(angle_rad);
        const key = `${Math.round(vx)},${Math.round(vy)}`;
        
        if (!vMap.has(key)) {
          vMap.set(key, { x: vx, y: vy, hexIds: [hex.id], id: key });
        } else {
          const v = vMap.get(key)!;
          if (!v.hexIds.includes(hex.id)) v.hexIds.push(hex.id);
        }
      }
    });
    // Filter out vertices that only touch OuterSea
    return Array.from(vMap.values()).filter(v => {
      return v.hexIds.some(id => {
        const hex = hexCoords.find(h => h.id === id);
        return hex && !hex.isOuterSea;
      });
    });
  }, [hexCoords]);

  const edges = useMemo(() => {
    const eMap = new Map<string, { x1: number, y1: number, x2: number, y2: number, id: string, hexIds: string[] }>();
    hexCoords.forEach(hex => {
      for (let i = 0; i < 6; i++) {
        const a1 = (Math.PI / 180) * (60 * i + 30);
        const a2 = (Math.PI / 180) * (60 * ((i + 1) % 6) + 30);
        const x1 = hex.x + HEX_RADIUS * Math.cos(a1);
        const y1 = hex.y + HEX_RADIUS * Math.sin(a1);
        const x2 = hex.x + HEX_RADIUS * Math.cos(a2);
        const y2 = hex.y + HEX_RADIUS * Math.sin(a2);
        
        const v1 = `${Math.round(x1)},${Math.round(y1)}`;
        const v2 = `${Math.round(x2)},${Math.round(y2)}`;
        const key = [v1, v2].sort().join('|');
        if (!eMap.has(key)) {
          eMap.set(key, { x1, y1, x2, y2, id: key, hexIds: [hex.id] });
        } else {
          const e = eMap.get(key)!;
          if (!e.hexIds.includes(hex.id)) e.hexIds.push(hex.id);
        }
      }
    });
    
    // Filter out edges that only touch OuterSea
    return Array.from(eMap.values()).filter(e => {
      return e.hexIds.some(id => {
        const hex = hexCoords.find(h => h.id === id);
        return hex && !hex.isOuterSea;
      });
    });
  }, [hexCoords]);

  const openPlayerTradeModal = () => {
    setPlayerTradeOffer({
        [ResourceType.Lumber]: 0,
        [ResourceType.Brick]: 0,
        [ResourceType.Wool]: 0,
        [ResourceType.Grain]: 0,
        [ResourceType.Ore]: 0
    });
    setPlayerTradeRequest({
        [ResourceType.Lumber]: 0,
        [ResourceType.Brick]: 0,
        [ResourceType.Wool]: 0,
        [ResourceType.Grain]: 0,
        [ResourceType.Ore]: 0
    });
    setPlayerTradeTarget(null);
    setShowPlayerTradeModal(true);
  };

  const handleTrade = () => {
    if (tradeGive && tradeReceive) {
      for (let i = 0; i < tradeQuantity; i++) {
        tradeWithBank(tradeGive, tradeReceive);
      }
      setTradeGive(null);
      setTradeReceive(null);
      setTradeQuantity(1);
      setShowTradeModal(false);
    }
  };

  const getTradeRatio = useCallback((resource: ResourceType) => {
    if (!gameState) return 4;
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // Find player's settlements
    const playerSettlements = gameState.settlements.filter(s => s.playerId === player.id);
    const playerVertexIds = new Set(playerSettlements.map(s => s.vertexId));
    
    // Check ports
    const playerPorts = gameState.ports.filter(p => 
        p.vertexIds.some(v => playerVertexIds.has(v))
    );
    
    const specificPort = playerPorts.find(p => p.type === resource);
    if (specificPort) return 2;
    
    const genericPort = playerPorts.find(p => p.type === '3:1');
    if (genericPort) return 3;
    
    return 4;
  }, [gameState]);

  const maxTradeQuantity = useMemo(() => {
    if (!tradeGive || !gameState) return 0;
    const player = gameState.players[gameState.currentPlayerIndex];
    const ratio = getTradeRatio(tradeGive);
    return Math.floor(player.resources[tradeGive] / ratio);
  }, [tradeGive, gameState, getTradeRatio]);

  const currentTradeRatio = tradeGive ? getTradeRatio(tradeGive) : 4;

  useEffect(() => {
    if (tradeQuantity > maxTradeQuantity && maxTradeQuantity > 0) {
      setTradeQuantity(maxTradeQuantity);
    } else if (maxTradeQuantity === 0) {
      setTradeQuantity(1);
    }
  }, [maxTradeQuantity, tradeQuantity]);

  // --- BOT WATCHDOG LOGIC ---
  useEffect(() => {
    if (!gameState || !roomState) return;
    const isHost = roomState.hostId === socketService.playerId;
    if (!isHost) return;

    const interval = setInterval(() => {
      const activePlayer = gameState.players[gameState.currentPlayerIndex];
      // Only forcibly end turn if it's main phase, bot is active, and they exceeded 10s.
      if (activePlayer?.isBot && gameState.phase === 'main' && botTurnStartRef.current > 0) {
        if (Date.now() - botTurnStartRef.current > 10000) {
          nextTurn();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, roomState?.hostId, nextTurn]);

  // --- BOT LOGIC ---
  const isProcessingBotRef = useRef(false);
  const botTurnStartRef = useRef<number>(0);
  const lastBotStateKeyRef = useRef<string>('');

  useEffect(() => {
    if (!gameState || isProcessingBotRef.current) return;
    const activePlayer = gameState.players[activePlayerId];
    if (!activePlayer?.isBot) {
        lastBotStateKeyRef.current = '';
        return;
    }
    
    // Use roomState host check to ensure only one client processes bots
    const isHost = roomState?.hostId === socketService.playerId;
    if (!isHost) return;

    const currentStateKey = `${activePlayerId}-${gameState.phase}-${gameState.hasRolled}-${gameState.roads.length}-${gameState.settlements.length}-${gameState.ships.length}-${Object.values(activePlayer.resources).join(',')}`;
    if (lastBotStateKeyRef.current !== currentStateKey) {
      botTurnStartRef.current = Date.now();
      lastBotStateKeyRef.current = currentStateKey;
    }

    isProcessingBotRef.current = true;
    const timer = setTimeout(() => {
      isProcessingBotRef.current = false;
      const { phase } = gameState;

      if (phase === 'initial_dice_roll') {
        rollDice();
        return;
      }

      if (phase === 'setup') {
        const setupSettlementsThisTurn = gameState.settlements.filter(s => s.playerId === activePlayerId).length;
        const setupRoadsThisTurn = gameState.roads.filter(r => r.playerId === activePlayerId).length;
        const setupShipsThisTurn = gameState.ships.filter(s => s.playerId === activePlayerId).length;
        const totalPaths = setupRoadsThisTurn + setupShipsThisTurn;

        if (setupSettlementsThisTurn === totalPaths) {
          // Build settlement
          const validVertices = vertices.filter(v => checkIsValidVertex(v.id, 'settlement'));
          if (validVertices.length > 0) {
            const scoredVertices = validVertices.map(v => {
              const adjacentHexes = v.hexIds.map(id => gameState.board.find(h => h.id === id)).filter(Boolean);
              const probSum = adjacentHexes.reduce((sum, hex) => {
                const dots = (hex!.type === HexType.Sea || hex!.type === HexType.Desert) ? 0 : 6 - Math.abs(7 - hex!.number);
                return sum + dots;
              }, 0);
              return { vertex: v, score: probSum + Math.random() * 2 };
            });
            scoredVertices.sort((a, b) => b.score - a.score);
            const bestV = scoredVertices[0].vertex;
            buildSettlement(bestV.id, bestV.hexIds);
          }
        } else {
          // Build road or ship
          const lastSettlement = gameState.settlements.filter(s => s.playerId === activePlayerId).pop();
          if (lastSettlement) {
            const validRoadEdges = edges.filter(e => e.id.includes(lastSettlement.vertexId) && checkIsValidEdge(e.id, 'road'));
            const validShipEdges = edges.filter(e => e.id.includes(lastSettlement.vertexId) && checkIsValidEdge(e.id, 'ship'));
            
            if (validRoadEdges.length > 0) {
              buildRoad(validRoadEdges[Math.floor(Math.random() * validRoadEdges.length)].id);
            } else if (validShipEdges.length > 0) {
              buildShip(validShipEdges[Math.floor(Math.random() * validShipEdges.length)].id);
            }
          }
        }
      } else if (phase === 'main' || phase === 'road_building') {
        if (Date.now() - botTurnStartRef.current > 10000) {
           nextTurn();
           return;
        }

        if (!gameState.hasRolled) {
          // Bot: Should I play a Knight card before rolling?
          if (!gameState.hasPlayedDevCardThisTurn && activePlayer.devCards.includes(DevCardType.Knight)) {
            // If the robber is on one of our high-yield hexes, play Knight
            const myProductiveHexIds = gameState.settlements
              .filter(s => s.playerId === activePlayerId)
              .flatMap(s => s.hexIds);
            if (myProductiveHexIds.includes(gameState.robberHexId)) {
              playDevCard(DevCardType.Knight);
              return;
            }
          }

          rollDice();
          return;
        }

        // Try actions (using local check to avoid gameState.currentPlayerIndex mismatch)
        const canAffordLocal = (cost: Record<string, number>) => Object.entries(cost).every(([res, amt]) => (activePlayer.resources as any)[res] >= amt);

        const playerRoadsCount = gameState.roads.filter(r => r.playerId === activePlayerId).length;
        const playerShipsCount = gameState.ships.filter(s => s.playerId === activePlayerId).length;
        const playerSettlementsCount = gameState.settlements.filter(s => s.playerId === activePlayerId).length;
        const playerCitiesCount = gameState.settlements.filter(s => s.playerId === activePlayerId && s.isCity).length;

        if (canAffordLocal(COSTS.city) && playerCitiesCount < 4) {
          const upgradable = gameState.settlements.filter(s => s.playerId === activePlayerId && !s.isCity);
          if (upgradable.length > 0) {
            upgradeToCity(upgradable[0].vertexId);
            return;
          }
        }

        if (canAffordLocal(COSTS.settlement) && playerSettlementsCount < 5) {
          const validV = vertices.filter(v => checkIsValidVertex(v.id, 'settlement'));
          if (validV.length > 0) {
            buildSettlement(validV[0].id, validV[0].hexIds);
            return;
          }
        }

        if (canAffordLocal(COSTS.devCard) && gameState.bankDevCards.length > 0) {
          buyDevCard();
          return;
        }

        if (canAffordLocal(COSTS.road) && playerRoadsCount < 15) {
          const validE = edges.filter(e => checkIsValidEdge(e.id, 'road'));
          if (validE.length > 0) {
            buildRoad(validE[0].id);
            return;
          }
        }

        if (canAffordLocal(COSTS.ship) && playerShipsCount < 15) {
          const validS = edges.filter(e => checkIsValidEdge(e.id, 'ship'));
          if (validS.length > 0) {
            buildShip(validS[0].id);
            return;
          }
        }

        if (phase === 'road_building' && gameState.freeRoads && gameState.freeRoads > 0) {
           // We are in road building mode, should have already built one if we were in main before.
           // This block handles the second road if we didn't exit.
           const validE = edges.filter(e => checkIsValidEdge(e.id, 'road'));
           if (validE.length > 0) {
             buildRoad(validE[0].id);
             return;
           }
        }

        // Try bank trade if we have a lot of one resource
        const surplusEntries = Object.entries(activePlayer.resources).filter(([_, count]) => (count as number) >= 4);
        if (surplusEntries.length > 0) {
          const giveRes = surplusEntries[0][0] as ResourceType;
          const needed = [ResourceType.Ore, ResourceType.Grain, ResourceType.Brick, ResourceType.Lumber, ResourceType.Wool]
            .find(r => activePlayer.resources[r] === 0);
          if (needed && gameState.bankResources[needed] > 0) {
            tradeWithBank(giveRes, needed);
            return;
          }
        }

        nextTurn();
      } else if (phase === 'discard') {
        const pendingDiscard = gameState.pendingDiscards.find(p => p.playerId === activePlayerId);
        if (pendingDiscard) {
          const resPool = Object.entries(activePlayer.resources).flatMap(([res, count]) => Array(count).fill(res as ResourceType));
          const toDiscard: Record<ResourceType, number> = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
          for (let i = 0; i < pendingDiscard.amount; i++) {
            if (resPool.length > 0) {
              const idx = Math.floor(Math.random() * resPool.length);
              toDiscard[resPool[idx]]++;
              resPool.splice(idx, 1);
            }
          }
          discardCards(activePlayerId, toDiscard);
        }
      } else if (phase === 'robber' || phase === 'robber_move') {
        // Find a hex where opponent has buildings and move robber there
        const validH = gameState.board.filter(h => h.type !== HexType.Sea && h.id !== gameState.robberHexId);
        // Pirate can move to sea
        const validSeaH = gameState.board.filter(h => h.type === HexType.Sea && h.id !== gameState.pirateHexId);

        if (phase === 'robber_move' || phase === 'robber') {
           // Decide between robber and pirate move if applicable, here we just pick one
           const activePlayer = gameState.players[activePlayerId];
           // Simple logic: if we have coastal settlements, maybe move pirate? 
           // For now, let's just move the robber to a productive opponent hex.
           
           if (validH.length > 0) {
              const scoredH = validH.map(h => {
                 let score = 0;
                 const adjS = gameState.settlements.filter(s => s.hexIds.includes(h.id));
                 adjS.forEach(s => {
                   if (s.playerId === activePlayerId) score -= 10;
                   else score += (s.isCity ? 5 : 2);
                 });
                 if (h.type === HexType.Desert) score -= 5;
                 return { id: h.id, score: score + Math.random() };
              });
              scoredH.sort((a,b) => b.score - a.score);
              moveRobber(scoredH[0].id);
           }
        }
      } else if (phase === 'stealing') {
        if (gameState.pendingStealFrom.length > 0) {
          // Steal from player with most points
          const targets = gameState.pendingStealFrom.map(pid => ({ id: pid, points: gameState.players[pid].victoryPoints + (gameState.settlements.filter(s=>s.playerId===pid).length) }));
          targets.sort((a,b) => b.points - a.points);
          
          if (gameState.selectedStealTarget == null) {
            selectStealTarget(targets[0].id);
            setTimeout(() => stealResource(targets[0].id), 1000);
          }
        }
      } else if (phase === 'gold_selection') {
        selectGoldResource({ lumber: 0, brick: 0, wool: 0, grain: 0, ore: 1 });
      } else {
        // Fallback for other subphases
        nextTurn();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      isProcessingBotRef.current = false;
    };
  }, [gameState, activePlayerId, vertices, edges, checkIsValidVertex, checkIsValidEdge, buildSettlement, buildRoad, buildShip, upgradeToCity, rollDice, nextTurn, discardCards, moveRobber, movePirate, stealResource, selectStealTarget, selectGoldResource, resolveYearOfPlenty, resolveMonopoly, playDevCard, tradeWithBank, buyDevCard, canAfford, roomState?.hostId]);

  // --- INITIAL DICE ROLL DELAY LOGIC ---
  useEffect(() => {
    if (gameState?.phase === 'initial_dice_roll' && gameState.hasRolled) {
      if (roomState?.hostId === socketService.playerId) {
        const timer = setTimeout(() => {
          resolveInitialRoll();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState?.phase, gameState?.hasRolled, roomState?.hostId, resolveInitialRoll]);

  // --- BOT TRADE EVALUATION LOGIC ---
  const botTradeEvaluatedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!gameState || !roomState) return;
    const isHost = roomState.hostId === socketService.playerId;
    if (!isHost) return;

    if (gameState.tradeOffers) {
      gameState.tradeOffers.forEach(offer => {
        if (offer.status !== 'pending') return;

        gameState.players.forEach(p => {
          if (!p.isBot) return;
          if (p.id === offer.initiatorId) return;

          // If trade targeted to specific player, check bot ID
          if (offer.targetPlayerId !== null && offer.targetPlayerId !== p.id) return;

          // Check if bot has already reacted
          if (offer.acceptedBy.includes(p.id) || offer.rejectedBy.includes(p.id)) return;

          // Check if we already evaluated this combination in current session
          const evaluationKey = `${offer.id}-${p.id}`;
          if (botTradeEvaluatedRef.current.has(evaluationKey)) return;
          
          botTradeEvaluatedRef.current.add(evaluationKey);

          // Give a short delay to make it feel human-like
          setTimeout(() => {
            // Re-evaluate in case state changed
            const canAfford = Object.values(ResourceType).every(
              res => (p.resources[res] || 0) >= (offer.request[res] || 0)
            );

            if (!canAfford) {
              reactToTrade(offer.id, p.id, 'reject');
            } else {
              const totalRequested = Object.values(offer.request).reduce((a, b) => a + (b || 0), 0);
              const totalOffered = Object.values(offer.offer).reduce((a, b) => a + (b || 0), 0);

              const acceptProbability = totalOffered >= totalRequested ? 0.7 : 0.2;
              
              if (Math.random() <= acceptProbability) {
                reactToTrade(offer.id, p.id, 'accept');
              } else {
                reactToTrade(offer.id, p.id, 'reject');
              }
            }
          }, 800 + Math.random() * 1000);
        });
      });
    }
  }, [gameState?.tradeOffers, roomState?.hostId, reactToTrade]);

  useEffect(() => {
    const imagesToPreload = [
      '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/C3eURTs - Imgur.png'),
      FOREST_IMG, FIELDS_IMG, PASTURE_IMG, Desert_IMG, Mountains_IMG,
      '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/nVgige5 - Imgur.png'), // Icon Lumber
      '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/xgqjQo7 - Imgur.png'), // Icon Dev
      '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/TdfNSeV - Imgur.png')  // Icon Road
    ];
    
    let loadedCount = 0;
    imagesToPreload.forEach(src => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === imagesToPreload.length) {
          setAssetsLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === imagesToPreload.length) {
          setAssetsLoaded(true);
        }
      };
    });
  }, []);

  const handleStartGame = async () => {
    setIsStartingGame(true);
    // Yield to the browser so the "世界生成中..." spinner actually renders
    // Map generation can be extremely heavy and blocks the UI thread.
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (!roomState) { setIsStartingGame(false); return; }
    if (roomState.hostId !== socketService.playerId) { setIsStartingGame(false); return; }
    
    const allReady = roomState.players.every(p => p.isReady);
    if (!allReady) {
      console.warn("请等待所有玩家点击'准备'后再开始游戏");
      return;
    }

    const totalBotCount = roomState.settings?.botConfig?.filter(b => b).length || 0;
    const totalPlayersCount = roomState.players.length + totalBotCount;
    const requiredPlayers = roomState.settings?.playerCount || 4;
    
    if (totalPlayersCount !== requiredPlayers) {
        console.warn(`游戏需要配置刚好 ${requiredPlayers} 名玩家（包含真实玩家和机器人）`);
        return;
    }

    const assignedSessions = roomState.players.map(p => p.id);
    const assignedNames = roomState.players.map(p => p.name);
    
    // Instead of directly initGame, set to initial_dice_roll phase
    const initialState = initGame(
      roomState.settings.playerCount, 
      roomState.settings.mapType as MapType, 
      undefined, 
      roomState.settings.botConfig, 
      assignedSessions,
      assignedNames
    );
    
    if (initialState) {
      // Set to initial_dice_roll and initialize empty rolls
      const initialStateWithRolls = {
        ...initialState,
        phase: 'initial_dice_roll' as const,
        initialDiceRolls: {}
      };
      if (roomState) {
        socketService.startGame(roomState.roomId, initialStateWithRolls);
      }
    }
  };

  const isHostInLobby = roomState?.hostId === socketService.playerId;

  if (!isJoinedLobby) {
    const containerStyle: React.CSSProperties = isMobile && isPortrait ? {
      width: '100vh',
      height: '100vw',
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(90deg)',
      transformOrigin: 'center center',
      overflow: 'hidden'
    } : {
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden'
    };

    return (
      <div style={containerStyle}>
        <div className="flex flex-col h-full w-full bg-slate-50 font-sans items-center justify-center p-2 sm:p-4 relative selection:bg-indigo-600 selection:text-white overflow-hidden">
          {isPortrait && isMobile && (
            <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center sm:hidden">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="mb-8"
              >
                <RotateCw size={64} className="text-indigo-400 opacity-50" />
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-4">进入全屏与横屏模式</h2>
              <p className="text-slate-300 text-sm max-w-[240px] leading-relaxed mb-6">
                为了获得最佳游戏体验，请点击下方按钮进入全屏。
              </p>
              <button 
                onClick={toggleFullscreen}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
              >
                立即开始
              </button>
            </div>
          )}
        
        {/* Decorative elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[120px]" />
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-emerald-100 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-200 max-w-[90vw] sm:max-w-md w-full text-center z-10 relative flex flex-col items-center"
        >
          <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-1 sm:mb-2 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100" onClick={handleLogoClick}>
            <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/C3eURTs - Imgur.png')}`} alt="Catan Logo" className="w-6 h-6 sm:w-10 sm:h-10 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-lg sm:text-xl font-serif font-black italic mb-0.5 text-slate-800 tracking-tight leading-none">CATAN</h1>
          <p className="text-[6px] sm:text-[8px] uppercase tracking-[0.4em] opacity-40 font-black mb-2 sm:mb-4 text-indigo-900">Professional Online Edition</p>
          
          <div className="flex flex-col gap-2 sm:gap-3 text-left w-full">
            <div className="group">
              <label className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-0.5 block group-focus-within:text-indigo-500 transition-colors">你的昵称</label>
              <input 
                type="text" 
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="输入你的勇士之名"
                className="w-full bg-slate-50 border border-slate-100 px-3 py-1.5 sm:py-2.5 rounded-lg outline-none font-bold text-center mb-0 transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-xs sm:text-sm"
              />
            </div>
            <div className="group">
              <label className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-0.5 block group-focus-within:text-indigo-500 transition-colors">房间代码</label>
              <input 
                type="text" 
                value={inputRoomId}
                onChange={e => setInputRoomId(e.target.value)}
                placeholder="6位房间代码"
                className="w-full bg-slate-50 border border-slate-100 px-3 py-1.5 sm:py-2.5 rounded-lg outline-none font-bold font-mono tracking-[0.2em] text-center transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-xs sm:text-sm"
              />
            </div>
            
            <button 
              onClick={handleJoinRoom}
              className="w-full bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-black uppercase tracking-[0.2em] hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 active:scale-[0.97] transition-all mt-0.5 shadow-lg shadow-indigo-100 relative overflow-hidden group text-[10px] sm:text-xs"
            >
              <span className="relative z-10">进入海域</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </button>
          </div>
          
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-50 w-full">
            <p className="text-[9px] sm:text-[10px] text-slate-300 font-bold uppercase tracking-widest">© 2024 Catan Online</p>
          </div>
        </motion.div>
      </div>
    </div>
    );
  }

  if (!gameStarted) {
    const containerStyle: React.CSSProperties = isMobile && isPortrait ? {
      width: '100vh',
      height: '100vw',
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(90deg)',
      transformOrigin: 'center center',
      overflow: 'hidden'
    } : {
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden'
    };

    return (
      <div style={containerStyle}>
        <div className="flex flex-col sm:flex-row h-full w-full bg-[#f8fafc] font-sans overflow-hidden relative selection:bg-indigo-600 selection:text-white">
          {isPortrait && isMobile && (
            <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center sm:hidden">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="mb-8"
              >
                <RotateCw size={64} className="text-indigo-400 opacity-50" />
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-4">开启航海之旅</h2>
              <p className="text-slate-300 text-sm max-w-[240px] leading-relaxed mb-6">
                请确认进入全屏以开启多人联机对战。
              </p>
              <button 
                onClick={toggleFullscreen}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
              >
                准备就绪
              </button>
            </div>
          )}
        
        {/* Decorative Background Gradient */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(79,70,229,0.08)_0%,_transparent_60%)] pointer-events-none z-0" />
        
        {/* Left Side: Branding & Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 relative z-10 overflow-hidden min-h-0"
        >
          {/* Header & Logo Section */}
          <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4 px-1 lg:px-2 shrink-0 h-16 sm:h-20 lg:h-24" onClick={handleLogoClick}>
            <div className="w-10 h-10 sm:w-16 lg:w-20 lg:h-20 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-indigo-100 border border-slate-100 relative overflow-hidden group">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-50 to-transparent rounded-b-xl sm:rounded-b-2xl opacity-50" />
              <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/C3eURTs - Imgur.png')}`} alt="Catan Logo" className="w-6 h-6 sm:w-10 lg:w-12 lg:h-12 object-contain relative z-10 drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl sm:text-3xl lg:text-6xl font-serif font-black italic tracking-tighter text-slate-900 leading-none drop-shadow-sm">CATAN</h1>
              <p className="text-[6px] sm:text-[9px] lg:text-[11px] uppercase tracking-[0.5em] text-indigo-600 font-black mt-0.5 sm:mt-1">航海家版 · SEAFARERS</p>
            </div>
          </div>

          <div className="w-full max-w-lg space-y-2 sm:space-y-3 px-1 lg:px-2 flex-1 flex flex-col justify-center min-h-0">
            {/* Map Settings */}
            <div className={!isHostInLobby ? 'opacity-70 pointer-events-none' : ''}>
              <div className="flex items-center justify-between mb-0.5 sm:mb-2 ml-2">
                <h3 className="text-[8px] font-black uppercase tracking-widest text-slate-400">地图选择</h3>
                {isHostInLobby && <span className="text-[7px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">配置中</span>}
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {[
                  { id: 'standard', label: '标准大陆', icon: '🌍', desc: '经典单块大陆' },
                  { id: 'archipelago', label: '群岛世界', icon: '🏝️', desc: '探索独立岛屿' }
                ].map(map => (
                  <button
                    key={map.id}
                    onClick={() => { setMapType(map.id as MapType); syncSettings({ mapType: map.id }); }}
                    className={`flex flex-col items-center gap-0.5 sm:gap-2 p-2 sm:p-4 rounded-xl lg:rounded-2xl transition-all duration-300 border ${mapType === map.id ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100 ring-2 lg:ring-4 ring-indigo-500/5' : 'bg-white/50 border-slate-100 hover:border-indigo-200 text-slate-700'}`}
                  >
                    <div className={`text-xl sm:text-3xl lg:text-4xl transition-transform duration-500 ${mapType === map.id ? 'scale-110' : ''}`}>{map.icon}</div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">{map.label}</span>
                      <span className="text-[6px] sm:text-[8px] opacity-50 font-bold mt-0.5 uppercase tracking-wider">{map.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-1.5 sm:gap-2 pt-1">
              {!roomState?.players.find(p => p.id === socketService.playerId)?.isReady ? (
                <button 
                  onClick={handleToggleReady}
                  className="relative z-50 w-full bg-emerald-600 text-white py-2.5 sm:py-3.5 rounded-lg lg:rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
                >
                  <Play size={isMobile ? 10 : 14} fill="currentColor" />
                  准备启航
                </button>
              ) : (
                <button 
                  onClick={handleToggleReady}
                  className="w-full bg-white text-slate-500 py-2.5 sm:py-3.5 rounded-lg lg:rounded-xl font-black uppercase tracking-[0.2em] border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-[10px]"
                >
                  <X size={isMobile ? 10 : 14} />
                  取消准备
                </button>
              )}
              {isHostInLobby && (
                <button 
                  onClick={handleStartGame}
                  disabled={isStartingGame || !roomState?.players.every(p => p.isReady) || !roomState || (roomState.players.length + (roomState.settings?.botConfig?.filter(b => b).length || 0)) !== roomState.settings?.playerCount}
                  className="w-full bg-slate-900 text-white py-2.5 sm:py-3.5 rounded-lg lg:rounded-xl font-black uppercase tracking-[0.2em] shadow-lg hover:bg-black active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale text-[10px] relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isStartingGame ? (
                      <>
                        <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        世界生成中...
                      </>
                    ) : (
                      roomState?.players.every(p => p.isReady) ? '开启宏伟旅程' : '等待全体领主准备'
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1" />
        </motion.div>


        {/* Right Side: Online Status & Room Info */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full sm:h-full flex flex-col p-3 sm:p-4 lg:p-6 bg-white/80 sm:bg-white/60 backdrop-blur-3xl border-l border-slate-200 z-20 sm:w-[320px] md:w-[400px] lg:w-[480px] shrink-0 overflow-hidden min-h-0 shadow-2xl sm:shadow-none"
        >
          <div className="flex flex-col gap-2 sm:gap-4 w-full max-w-sm mx-auto h-full">
            
            {/* Room Info Section */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base sm:text-lg font-black font-serif italic text-slate-800 tracking-tight">在线势力</h2>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                  <div className="w-0.5 h-0.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">{(roomState?.players.length || 0) + botConfig.filter(b => b).length} / {playerCount}</span>
                </div>
              </div>

              <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-lg shadow-slate-100/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[7px] uppercase font-black tracking-widest text-slate-400 mb-0.5">房间代码</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] sm:text-xs font-mono font-black text-slate-800 tracking-tighter">{roomState?.roomId || inputRoomId}</span>
                        <button 
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('room', roomState?.roomId || inputRoomId);
                            window.focus();
                            navigator.clipboard.writeText(url.toString());
                          }}
                          className="hover:bg-indigo-50 p-0.5 rounded-md transition-all border border-transparent"
                        >
                          <Copy size={10} className="text-indigo-400" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[7px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">征服人数</span>
                      <div className="relative inline-block">
                        <select 
                          value={playerCount} 
                          onChange={e => {
                            const newCount = Number(e.target.value);
                            setPlayerCount(newCount);
                            syncSettings({ playerCount: newCount });
                          }}
                          disabled={!isHostInLobby}
                          className="text-[11px] sm:text-xs font-black text-slate-800 outline-none disabled:opacity-50 appearance-none cursor-pointer pr-3 bg-transparent"
                        >
                          {[2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num} 人</option>)}
                        </select>
                        <ChevronDown size={8} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                      </div>
                    </div>
                  </div>
              </div>
            </div>

            {/* Players List */}
            <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1 no-scrollbar">
              {Array.from({ length: playerCount }).map((_, globalIndex) => {
                const isBot = botConfig[globalIndex];
                const nonBotSlotsBefore = botConfig.slice(0, globalIndex).filter(b => !b).length;
                const p = roomState?.players[nonBotSlotsBefore];

                if (!isBot && p) {
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white border border-slate-100 shadow-sm transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                          <User size={14} className="text-slate-400" />
                          {roomState.hostId === p.id && (
                            <div className="absolute -top-1 -right-1 bg-indigo-600 border border-white text-white p-0.5 rounded-full text-[5px] shadow-lg" title="房主">👑</div>
                          )}
                        </div>
                        <div>
                          <span className="font-black text-[11px] sm:text-xs block leading-none text-slate-800 tracking-tight">{p.name}</span>
                          {p.id === socketService.playerId && <span className="text-[6px] font-black uppercase tracking-widest text-indigo-500 mt-0.5 block">你的势力</span>}
                        </div>
                      </div>
                      {p.isReady ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <Check size={8} className="text-emerald-600" />
                          <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600">已就绪</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                          <div className="w-0.5 h-0.5 rounded-full bg-slate-300 animate-pulse" />
                          <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">筹备中</span>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={`empty-${globalIndex}`} className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-300 ${isBot ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-50/50' : 'border-dashed border-slate-200 opacity-40 hover:opacity-100 hover:border-indigo-200 group'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isBot ? 'bg-indigo-50 border border-indigo-100' : 'border border-dashed border-slate-200 group-hover:bg-slate-50'}`}>
                        {isBot ? <Bot size={14} className="text-indigo-600" /> : <Users size={12} className="text-slate-300" />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-black transition-colors ${isBot ? 'text-slate-800' : 'text-slate-400'}`}>{isBot ? '领主 AI' : '未占领席位'}</span>
                        {isBot && <span className="text-[6px] font-bold text-indigo-400 uppercase tracking-widest">高级AI</span>}
                      </div>
                    </div>
                    {isHostInLobby && (!p) && (
                      <button 
                        onClick={() => {
                          const newConfig = [...botConfig];
                          newConfig[globalIndex] = !newConfig[globalIndex];
                          setBotConfig(newConfig);
                          syncSettings({ botConfig: newConfig });
                        }}
                        className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-all border ${isBot ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'}`}
                      >
                        {isBot ? '撤防' : '入驻'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="pt-2 sm:pt-4 flex flex-col items-center gap-2 border-t border-slate-100">
               <button 
                 onClick={() => {
                   socketService.leaveRoom(roomState!.roomId);
                   setRoomState(null);
                   setIsJoinedLobby(false);
                   window.history.replaceState({}, '', window.location.pathname);
                 }}
                 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2"
               >
                 <LogOut size={12} />
                 离开房间
               </button>
               
               {isHostInLobby && (
                 <button 
                   onClick={() => {
                     if (confirm('确定要解散此房间吗？所有玩家将被移出。')) {
                       socketService.resetGame(roomState!.roomId);
                     }
                   }}
                   className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-red-700 transition-colors flex items-center gap-2 mt-2"
                 >
                   <Trash2 size={12} />
                   解散议事会
                 </button>
               )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    );
  }

  if (!gameState) {
    const containerStyle: React.CSSProperties = isMobile && isPortrait ? {
      width: '100vh',
      height: '100vw',
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(90deg)',
      transformOrigin: 'center center',
      overflow: 'hidden'
    } : {
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden'
    };

    return (
      <div style={containerStyle}>
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#0a0a0a] text-white relative overflow-hidden">
          {isPortrait && isMobile && (
            <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center sm:hidden">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="mb-8"
              >
                <RotateCw size={64} className="text-indigo-400 opacity-50" />
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-4">准备登入海域</h2>
              <p className="text-slate-300 text-sm max-w-[240px] leading-relaxed mb-6">
                请确认进入全屏模式以体验最佳视觉效果。
              </p>
              <button 
                onClick={toggleFullscreen}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
              >
                进入全屏
              </button>
            </div>
          )}
      
      {/* Ocean atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,58,138,0.1)_0%,_transparent_70%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center relative z-10"
      >
        <h1 className="text-6xl sm:text-8xl font-serif italic font-black mb-4 tracking-tighter text-white">CATAN</h1>
        <div className="w-24 h-1 bg-white/20 mx-auto mb-10 overflow-hidden rounded-full">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-full h-full bg-indigo-500"
          />
        </div>
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.5em] font-black text-indigo-400">正在开辟新世界...</p>
      </motion.div>
    </div>
  </div>
  );
}

  const actingPlayer = gameState?.players[activePlayerId];
  const settlementsCount = gameState.settlements.filter(s => s.playerId === activePlayerId).length;
  const roadsCount = gameState.roads.filter(r => r.playerId === activePlayerId).length;
  const shipsCount = gameState.ships.filter(s => s.playerId === activePlayerId).length;
  const totalRoadsAndShips = roadsCount + shipsCount;
  
  const canTrade = gameState?.phase === 'main' && gameState.hasRolled && !gameState.hasBuiltThisTurn && isMyHumanTurn;
  const canPlayDevCard = gameState?.phase === 'main' && gameState.hasRolled && isMyHumanTurn;

  const leftWidth = isMobile ? Math.max(windowSize.width * 0.18, 160) : 280;
  const rightWidth = isMobile ? Math.max(windowSize.width * 0.20, 180) : 280;
  const stageWidth = windowSize.width - leftWidth - rightWidth;
  const headerHeight = isMobile ? 40 : 54;

  const nextAction = (() => {
    if (!gameState) return null;
    const actingPlayerName = actingPlayer?.name || `玩家 ${activePlayerId + 1}`;
    
    if (gameState.phase === 'order_determination' || gameState.phase === 'initial_dice_roll') {
      const myRolls = gameState.initialDiceRolls[myPlayerIndex];
      const hasRolled = myRolls && myRolls.length > 0;
      if (activePlayerId === myPlayerIndex) {
        return hasRolled ? "等待结果..." : "请掷骰决定顺序";
      }
      return hasRolled ? "等待结果..." : `等待 ${actingPlayerName} 掷骰`;
    }

    if (gameState.phase === 'setup') {
      return activePlayerId === myPlayerIndex 
        ? "初始建设：请放置建筑" 
        : `等待 ${actingPlayerName} 建设`;
    }

    if (activePlayerId === myPlayerIndex) {
      if (!gameState.hasRolled && gameState.phase === 'main') return "请掷骰子回合开始";
      if (gameState.phase === 'main') return "交易与建设中";
      if (gameState.phase === 'discard') return "请弃置一半资源";
      if (gameState.phase === 'robber' || gameState.phase === 'robber_move') return "请移动强盗";
      if (gameState.phase === 'stealing') return "请选择窃取对象";
      if (gameState.phase === 'road_building') return "建设道路/船只";
      if (gameState.phase === 'year_of_plenty') return "领取丰收资源";
      if (gameState.phase === 'monopoly') return "执行资源垄断";
      if (gameState.phase === 'gold_selection') return "领取金矿奖励";
    }

    // Waiting for others
    const phaseShortNames: Record<string, string> = {
      'main': '回合中',
      'discard': '弃牌中',
      'robber': '移动强盗',
      'robber_move': '移动强盗',
      'stealing': '窃取中',
      'road_building': '道路/船只建设',
      'year_of_plenty': '丰收之年',
      'monopoly': '垄断中',
      'gold_selection': '奖励确认'
    };
    const phaseDesc = phaseShortNames[gameState.phase] || '行动中';
    return `${actingPlayerName} ${phaseDesc}...`;
  })();

  const containerStyle: React.CSSProperties = isMobile && isPortrait ? {
    width: '100vh',
    height: '100vw',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(90deg)',
    transformOrigin: 'center center',
    overflow: 'hidden'
  } : {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      <div className="flex flex-col h-full w-full bg-[#f5f2ed] text-[#1a1a1a] overflow-hidden font-sans selection:bg-black selection:text-white relative">
        {isPortrait && isMobile && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="mb-8"
            >
              <RotateCw size={64} className="text-indigo-400 opacity-50" />
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-4">进入全屏与横屏模式</h2>
            <p className="text-slate-300 text-sm max-w-[240px] leading-relaxed mb-8">
              为了获得最佳游戏体验，请点击下方按钮进入全屏并开启海岛探险。
            </p>
            <button 
              onClick={toggleFullscreen}
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
            >
              即刻启程
            </button>
          </div>
        )}
      
      {/* Mobile Interaction - Notifications and Toggles Removed */}

      <header className="w-full flex items-center bg-white border-b border-black/5 px-2 z-50 overflow-hidden" style={{ height: headerHeight }}>
        {/* Left: Logo & Room Code */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0 cursor-default lg:absolute lg:left-2" onClick={handleLogoClick}>
          <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center">
            <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/C3eURTs - Imgur.png')}`} alt="Catan Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div className="flex flex-col items-start leading-none pr-4 border-r border-black/5">
            <span className="text-[8px] lg:text-[9px] uppercase font-black tracking-[0.2em] opacity-30">海域代码</span>
            <span className="text-xs lg:text-sm uppercase font-black tracking-tighter opacity-90">{roomState?.roomId || 'OFFLINE'}</span>
          </div>
        </div>

        {/* Center: Player Cards */}
        <div 
          ref={playerBarRef}
          className="flex-1 flex justify-start lg:justify-center overflow-x-auto no-scrollbar py-1 lg:ml-32 lg:mr-32"
        >
          <div className="flex items-center gap-2 lg:gap-4 px-4 lg:px-0">
            {gameState.players.map((p, i) => {
            const isCurrent = i === activePlayerId;
            const resourceCount = Object.values(p.resources).reduce((a, b) => a + b, 0);
            const publicScore = (p.settlements * 1) + (p.cities * 2) + p.victoryPoints;
            return (
              <div 
                key={p.id} 
                data-player-index={i}
                className={`relative shrink-0 group flex items-center ${isMobile ? 'gap-1 px-1.5 py-0.5' : 'gap-2 px-3 py-1'} rounded-full transition-all duration-500 ${isCurrent ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'opacity-60 hover:opacity-100'}`}>
                <div 
                  onClick={() => {
                    if (p.sessionId === socketService.playerId) {
                      toggleBot(p.id);
                    }
                  }}
                  className={`rounded-full border border-white ring-1 ring-black/10 flex items-center justify-center shrink-0 transition-transform ${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${p.sessionId === socketService.playerId ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                  style={{ backgroundColor: p.color }}
                >
                  {p.isBot ? (
                    <Bot size={isMobile ? 10 : 8} color={p.color === '#F1C40F' ? '#000' : '#FFF'} />
                  ) : (
                    <User size={isMobile ? 10 : 8} color={p.color === '#F1C40F' ? '#000' : '#FFF'} />
                  )}
                </div>
                <div className="flex flex-col flex-1 pl-0.5">
                    <div className="flex items-center gap-1">
                      <span className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} font-bold leading-none truncate max-w-[40px] md:max-w-[80px]`}>{p.name}</span>
                      {gameState.longestRoadPlayerId === p.id && (
                        <div className="flex items-center justify-center px-0.5 py-[1px] rounded-sm bg-[#b79148]/20 border border-[#b79148]/40 shadow-sm" title={`最长道路 (${p.longestRoadLength})`}>
                          <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/TdfNSeV - Imgur.png')}`} alt="longest-road" className="w-2.5 h-2.5 object-contain" />
                        </div>
                      )}
                      {gameState.largestArmyPlayerId === p.id && (
                        <div className="flex items-center justify-center px-0.5 py-[1px] rounded-sm bg-slate-500/20 border border-slate-500/40 shadow-sm" title={`最大名望骑士 (${p.knightsPlayed})`}>
                          <span className="text-[8px] leading-none">⚔️</span>
                        </div>
                      )}
                      {((gameState.phase === 'initial_dice_roll' || gameState.phase === 'order_determination' || (gameState.phase === 'setup' && gameState.settlements.length < gameState.players.length)) && gameState.initialDiceRolls[i]) ? (
                        <div className="flex items-center gap-0.5 px-1 rounded-sm bg-orange-500/10 border border-orange-500/20">
                          <span className="text-[8px] font-black text-orange-600">
                            {String(gameState.initialDiceRolls[i][gameState.initialDiceRolls[i].length - 1] || 0)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center mt-0.5 leading-none">
                      <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold opacity-80 whitespace-nowrap`}>{publicScore}分</span>
                      <span className={`flex items-center gap-0.5 ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-mono opacity-80 whitespace-nowrap ml-1`} title="资源">
                        <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/nVgige5 - Imgur.png')}`} alt="res" className="w-2.5 h-2.5 object-contain" />
                        {resourceCount}
                      </span>
                      <span className={`flex items-center gap-0.5 ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-mono opacity-80 whitespace-nowrap ml-1`} title="发展卡">
                        <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/xgqjQo7 - Imgur.png')}`} alt="dev" className="w-2.5 h-2.5 object-contain" />
                        {p.devCards.length + p.playedDevCards.length}
                      </span>
                      <span className={`flex items-center gap-0.5 ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-mono opacity-80 whitespace-nowrap ml-1`} title="最长道路">
                        <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/TdfNSeV - Imgur.png')}`} alt="road" className="w-2.5 h-2.5 object-contain" />
                        {p.longestRoadLength}
                      </span>
                      <span className={`flex items-center gap-0.5 ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-mono opacity-80 whitespace-nowrap ml-1`} title="骑士">
                        <span className="text-[10px]">⚔️</span>
                        {p.knightsPlayed}
                      </span>
                    </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel */}
        <AnimatePresence>
          {showLeftPanel && (
            <motion.aside 
              initial={{ width: leftWidth }}
              animate={{ width: leftWidth }}
              exit={{ width: 0 }}
              className={`border-r border-black/5 ${isMobile ? 'p-1 gap-1' : 'p-4 lg:p-5 gap-6'} flex flex-col bg-white overflow-y-auto no-scrollbar overflow-x-hidden shrink-0 z-50 relative`}
            >
              <section className={isMobile ? 'pt-1' : 'pt-4 border-t border-black/5'}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-4'}`}>
              <h3 className="text-[9px] uppercase tracking-[0.2em] font-black opacity-30">银行库存</h3>
            </div>
            <div className={`grid grid-cols-3 grid-rows-2 ${isMobile ? 'gap-0.5' : 'gap-1'}`}>
              {Object.entries(gameState.bankResources).map(([res, count]) => {
                return (
                <div key={res} className={`flex items-center justify-between ${isMobile ? 'p-0.5 px-1' : 'p-1.5'} rounded-md bg-stone-100/50 border border-black/10`}>
                  <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} leading-none`}>{RESOURCE_EMOJIS[res as ResourceType]}</span>
                  <span className={`${isMobile ? 'text-[7px]' : 'text-[9px]'} font-mono font-bold opacity-60`}>{count}</span>
                </div>
                );
              })}
              <div className={`flex items-center justify-between ${isMobile ? 'p-0.5 px-1' : 'p-1.5'} rounded-md bg-red-600 shadow-sm text-white`}>
                <span className={`${isMobile ? 'text-[7px]' : 'text-[9px]'} font-black`}>发</span>
                <span className={`${isMobile ? 'text-[7px]' : 'text-[9px]'} font-mono font-bold`}>{gameState.bankDevCards.length}</span>
              </div>
            </div>
          </section>

          <section className={`${isMobile ? 'pt-1' : 'pt-4'} border-t border-black/5`}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-1' : 'mb-2'}`}>
              <h3 className="text-[9px] uppercase tracking-[0.2em] font-black opacity-30">
                {gameState.phase === 'discard' && gameState.pendingDiscards[0]?.playerId === myPlayerIndex ? '弃牌阶段' : '我的资源卡'}
              </h3>
              <Info size={12} className="opacity-20" />
            </div>
            {/* Action panels removed from here, now in Central overlay */}
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(me.resources).map(([res, count]) => (
                  <ResourceRow key={res} type={res as ResourceType} count={count} compact={isMobile} />
                ))}
              </div>
          </section>

          <section className="pt-2 border-t border-black/5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30">我的发展卡</h3>
            </div>
            <div className="space-y-1.5">
              {me.devCards.length === 0 && (!me.devCardsBoughtThisTurn || me.devCardsBoughtThisTurn.length === 0) && (!me.playedDevCards || me.playedDevCards.length === 0) ? (
                <p className="text-[10px] opacity-30 italic">暂无发展卡</p>
              ) : (
                <>
                  {/* Playable Cards */}
                  {me.devCards.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-40">可使用</h4>
                      <div className="grid grid-cols-1 gap-1.5">
                        {Object.values(DevCardType).map(type => {
                          const count = me.devCards.filter(c => c === type).length;
                          if (count === 0) return null;
                          
                          return (
                            <div key={`playable-${type}`} className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/5 shadow-sm group hover:border-black/20 transition-all">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-xs relative shadow-inner">
                                  {type === DevCardType.Knight ? '⚔️' : 
                                   type === DevCardType.VictoryPoint ? '🏆' :
                                   type === DevCardType.RoadBuilding ? '🛣️' :
                                   type === DevCardType.YearOfPlenty ? '🎁' : '💎'}
                                  {count > 1 && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center text-[8px] font-bold ring-2 ring-white">
                                      {count}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tight">
                                  {type === DevCardType.Knight ? '骑士' : 
                                   type === DevCardType.VictoryPoint ? '胜利点' :
                                   type === DevCardType.RoadBuilding ? '道路建设' :
                                   type === DevCardType.YearOfPlenty ? '丰收之年' : '垄断'}
                                </span>
                              </div>
                              {type !== DevCardType.VictoryPoint && (
                                <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                  {gameState.playingDevCard === type ? (
                                    <span className="text-[8px] font-black uppercase tracking-widest bg-stone-100 text-stone-400 px-2 py-1 rounded-full">
                                      正在使用
                                    </span>
                                  ) : (
                                    <button 
                                      onClick={() => setConfirmDevCard(type)}
                                      disabled={!canPlayDevCard || gameState.hasPlayedDevCardThisTurn}
                                      className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-1.5 py-0.5 rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                      使用
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bought This Turn */}
                  {me.devCardsBoughtThisTurn && me.devCardsBoughtThisTurn.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-40">本回合购买</h4>
                      {Object.values(DevCardType).map(type => {
                        const count = me.devCardsBoughtThisTurn.filter(c => c === type).length;
                        if (count === 0) return null;
                        
                        return (
                          <div key={`bought-${type}`} className="flex flex-col p-1.5 rounded-lg bg-stone-100 border border-black/5 shadow-sm opacity-60">
                            <div className="flex items-center justify-between mx-0.5">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-md bg-zinc-200 flex items-center justify-center text-[8px] relative">
                                  {type === DevCardType.Knight ? '⚔️' : 
                                   type === DevCardType.VictoryPoint ? '🏆' :
                                   type === DevCardType.RoadBuilding ? '🛣️' :
                                   type === DevCardType.YearOfPlenty ? '🎁' : '💎'}
                                  {count > 1 && (
                                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-black text-white rounded-full flex items-center justify-center text-[7px] font-bold">
                                      {count}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-tight">
                                  {type === DevCardType.Knight ? '骑士' : 
                                   type === DevCardType.VictoryPoint ? '胜利点' :
                                   type === DevCardType.RoadBuilding ? '道路建设' :
                                   type === DevCardType.YearOfPlenty ? '丰收之年' : '垄断'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Played Cards */}
                  {me.playedDevCards && me.playedDevCards.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-40">已使用</h4>
                      {Object.values(DevCardType).map(type => {
                        const count = me.playedDevCards.filter(c => c === type).length;
                        // Don't show the card if it's currently being played (handled in playable section)
                        if (count === 0 || (gameState.playingDevCard === type && count === 1)) return null;
                        
                        const displayCount = gameState.playingDevCard === type ? count - 1 : count;
                        if (displayCount === 0) return null;
                        
                        return (
                          <div key={`played-${type}`} className="flex flex-col p-1.5 rounded-lg bg-stone-100 border border-black/5 shadow-sm opacity-40 grayscale">
                            <div className="flex items-center justify-between mx-0.5">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-md bg-zinc-200 flex items-center justify-center text-[8px] relative">
                                  {type === DevCardType.Knight ? '⚔️' : 
                                   type === DevCardType.VictoryPoint ? '🏆' :
                                   type === DevCardType.RoadBuilding ? '🛣️' :
                                   type === DevCardType.YearOfPlenty ? '🎁' : '💎'}
                                  {displayCount > 1 && (
                                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-black text-white rounded-full flex items-center justify-center text-[7px] font-bold">
                                      {displayCount}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-tight line-through">
                                  {type === DevCardType.Knight ? '骑士' : 
                                   type === DevCardType.VictoryPoint ? '胜利点' :
                                   type === DevCardType.RoadBuilding ? '道路建设' :
                                   type === DevCardType.YearOfPlenty ? '丰收之年' : '垄断'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </motion.aside>
      )}
    </AnimatePresence>

        {/* Center Map */}
        <main className="flex-1 flex relative overflow-hidden bg-[#e4e3e0]">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {/* Dev Card Overlay */}
          <AnimatePresence>
            {devCardOverlay && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              >
                <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full text-white shadow-2xl flex items-center gap-3 border border-white/10">
                  <span className="text-xl">✨</span>
                  <p className="font-bold tracking-widest text-sm whitespace-nowrap">
                    <span className="text-amber-400">{devCardOverlay.playerName}</span> {devCardOverlay.actionStr}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Guidance Text */}
          {gameStarted && nextAction && (
            <div className="absolute bottom-1.5 left-1.5 z-40 max-w-[40%] pointer-events-none">
              <p className="text-[10px] font-black italic uppercase tracking-[0.2em] text-black/25 leading-none">
                {nextAction}
              </p>
            </div>
          )}

          
          {gameStarted && (
            <div className="absolute top-1 left-1 z-40 flex flex-col gap-0.5">
              <button 
                onClick={() => {
                  const roomId = roomState?.roomId || inputRoomId;
                  socketService.leaveRoom(roomId);
                  setIsJoinedLobby(false);
                  setRoomState(null);
                  syncGameState(null as any);
                  setGameStarted(false);
                  window.history.replaceState({}, '', window.location.pathname);
                }}
                className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1.5 text-[10px] rounded-md' : 'px-6 py-3 text-[14px] rounded-xl'} bg-white/90 backdrop-blur-xl border border-black/5 text-stone-600 font-bold uppercase tracking-widest shadow-xl hover:bg-stone-100 transition-all transform active:scale-95 group`}
              >
                <LogOut size={isMobile ? 12 : 18} className="group-hover:-translate-x-0.5 transition-transform scale-x-[-1]" />
                <span>中途离开</span>
              </button>

              {isHost && (
                <button 
                  onClick={() => setShowDissolveRoomConfirm(true)}
                  className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1.5 text-[10px] rounded-md' : 'px-6 py-3 text-[14px] rounded-xl'} bg-white/90 backdrop-blur-xl border border-black/5 text-red-500 font-bold uppercase tracking-widest shadow-xl hover:bg-red-500 hover:text-white transition-all transform active:scale-95 group`}
                >
                  <Trash2 size={isMobile ? 12 : 18} className="group-hover:rotate-12 transition-transform" />
                  <span>解散房间</span>
                </button>
              )}
            </div>
          )}

          {gameStarted && (
            <div className={`absolute top-2 right-2 z-50 flex gap-1 ${isMobile ? 'flex-col gap-1' : ''}`}>
              {gameState.winnerId !== null && (
                <button
                  onClick={() => setShowGameOver(true)}
                  className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1 text-[9px] rounded-md' : 'px-5 py-2.5 text-[13px] rounded-lg'} backdrop-blur-xl border border-black/5 font-bold uppercase tracking-widest shadow-xl transition-all transform active:scale-95 bg-white/90 text-amber-600 animate-pulse`}
                >
                  <Trophy size={isMobile ? 10 : 16} />
                  <span>结算</span>
                </button>
              )}
              <button
                onClick={toggleFullscreen}
                className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1 text-[9px] rounded-md' : 'px-5 py-2.5 text-[13px] rounded-lg'} backdrop-blur-xl border border-black/5 font-bold uppercase tracking-widest shadow-xl transition-all transform active:scale-95 bg-white/90 text-stone-600`}
              >
                {isFullscreen ? <Minimize size={isMobile ? 10 : 16} /> : <Maximize size={isMobile ? 10 : 16} />}
                <span>{isFullscreen ? '退屏' : '全屏'}</span>
              </button>
              <button
                id="toggle-bot-button"
                onClick={() => toggleBot(myPlayerIndex)}
                className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1 text-[9px] rounded-md' : 'px-5 py-2.5 text-[13px] rounded-lg'} backdrop-blur-xl border border-black/5 font-bold uppercase tracking-widest shadow-xl transition-all transform active:scale-95 ${me?.isBot ? 'bg-indigo-500 text-white' : 'bg-white/90 text-stone-600'}`}
              >
                <Bot size={isMobile ? 10 : 16} />
                <span>托管</span>
              </button>
            </div>
          )}

          {/* Debug Button */}
          {showDebugButton && (
            <button 
              onClick={() => {
                const newMode = !debugModeEnabled;
                setDebugModeEnabled(newMode);
                setShowDebugConsole(newMode);
              }}
              className="absolute bottom-4 left-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg"
            >
              调试
            </button>
          )}

          <Stage 
            ref={stageRef}
            width={stageWidth} 
            height={windowSize.height - headerHeight}
            draggable
            onDragStart={() => setHasManuallyInteracted(true)}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Layer>
              {hexCoords.filter(hex => !hex.isOuterSea).map((hex) => (
                <HexCell 
                  key={hex.id} 
                  hex={hex} 
                  isSelected={selectedHex === hex.id}
                  isRobber={gameState.robberHexId === hex.id}
                  isPirate={gameState.pirateHexId === hex.id}
                  onClick={() => handleHexClick(hex.id, hex.type as HexType)}
                />
              ))}
              
              {/* Debug: Detection Areas */}
              {debugModeEnabled && hexCoords.filter(hex => !hex.isOuterSea).map(hex => (
                <Circle
                  key={`debug-${hex.id}`}
                  x={hex.x}
                  y={hex.y}
                  radius={12}
                  fill="rgba(255, 0, 0, 0.3)"
                  stroke="red"
                  strokeWidth={1}
                  listening={false}
                />
              ))}

              {/* Edges for Roads/Ships */}
              {edges.map(edge => {
                const road = gameState.roads.find(r => r.edgeId === edge.id);
                const ship = gameState.ships.find(s => s.edgeId === edge.id);
                const port = gameState.ports.find(p => p.edgeId === edge.id);
                const color = road ? gameState.players.find(p => p.id === road.playerId)?.color : ship ? gameState.players.find(p => p.id === ship.playerId)?.color : 'transparent';
                const effectiveBuildMode = isMyHumanTurn ? buildMode : (gameState?.activeBuildMode || null);
                
                let nx = 0;
                let ny = 0;

                if (port) {
                  const adjacentHexes = getHexesForEdge(hexCoords, edge.id);
                  const landHex = adjacentHexes.find(h => h && (h.isMainland || h.isIsland));
                  if (landHex) {
                    const cx = (edge.x1 + edge.x2) / 2;
                    const cy = (edge.y1 + edge.y2) / 2;
                    const dx = cx - landHex.x;
                    const dy = cy - landHex.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    if (len > 0) {
                      nx = dx / len;
                      ny = dy / len;
                    }
                  }
                }

                return (
                  <Group key={edge.id}>
                    {port && (
                      <Port 
                        port={port} 
                        cx={(edge.x1 + edge.x2) / 2} 
                        cy={(edge.y1 + edge.y2) / 2} 
                        nx={nx}
                        ny={ny}
                      />
                    )}
                    <Line
                      id={`edge-debug-${edge.id}`}
                      points={[edge.x1, edge.y1, edge.x2, edge.y2]}
                      stroke="rgba(255, 0, 0, 0.2)"
                      strokeWidth={20}
                      listening={false}
                      perfectDrawEnabled={false}
                      visible={debugModeEnabled}
                    />
                    <Line
                      id={`edge-${edge.id}`}
                      points={[edge.x1, edge.y1, edge.x2, edge.y2]}
                      stroke={color !== 'transparent' ? color : ((effectiveBuildMode === 'road' || effectiveBuildMode === 'ship') && checkIsValidEdge(edge.id, effectiveBuildMode as any) ? 'rgba(0,0,0,0.3)' : 'transparent')}
                      strokeWidth={6}
                      hitStrokeWidth={25}
                      dash={ship ? [10, 5] : []}
                      lineCap="round"
                      lineJoin="round"
                      listening={color !== 'transparent' || ((effectiveBuildMode === 'road' || effectiveBuildMode === 'ship') && checkIsValidEdge(edge.id, effectiveBuildMode as any))}
                      onClick={() => handleEdgeClick(edge.id)}
                      onTap={() => handleEdgeClick(edge.id)}
                      perfectDrawEnabled={false}
                      onMouseEnter={(e: any) => {
                        if (canBuild && (buildMode === 'road' || buildMode === 'ship') && checkIsValidEdge(edge.id, buildMode)) {
                          e.target.stroke('rgba(0,0,0,0.5)');
                          e.target.getStage().container().style.cursor = 'pointer';
                        }
                      }}
                      onMouseLeave={(e: any) => {
                        if (canBuild && (buildMode === 'road' || buildMode === 'ship') && checkIsValidEdge(edge.id, buildMode)) {
                          e.target.stroke('rgba(0,0,0,0.3)');
                          e.target.getStage().container().style.cursor = 'default';
                        }
                      }}
                    />
                  </Group>
                );
              })}

              {/* Vertices for Settlements/Cities */}
              {vertices.map(vertex => {
                const settlement = gameState.settlements.find(s => s.vertexId === vertex.id);
                const color = settlement ? gameState.players.find(p => p.id === settlement.playerId)?.color : 'transparent';
                const effectiveBuildMode = isMyHumanTurn ? buildMode : (gameState?.activeBuildMode || null);
                const isValid = (isMyHumanTurn ? canBuild : true) && (effectiveBuildMode === 'settlement' || effectiveBuildMode === 'city') && checkIsValidVertex(vertex.id, effectiveBuildMode as any);

                const isValidCityUpgrade = settlement && !settlement.isCity && effectiveBuildMode === 'city' && checkIsValidVertex(vertex.id, 'city');
                
                const handleMouseEnter = (e: any) => {
                  if (isValid || isValidCityUpgrade) {
                    if (isMyHumanTurn) e.target.getStage().container().style.cursor = 'pointer';
                    e.target.to({ scaleX: 1.2, scaleY: 1.2, duration: 0.1 });
                  }
                };

                const handleMouseLeave = (e: any) => {
                  if (isValid || isValidCityUpgrade) {
                    if (isMyHumanTurn) e.target.getStage().container().style.cursor = 'default';
                    e.target.to({ scaleX: 1, scaleY: 1, duration: 0.1 });
                  }
                };

                const handleClick = () => handleVertexClick(vertex.id, vertex.hexIds);

                return (
                  <Group key={vertex.id} id={`vertex-${vertex.id}`} x={vertex.x} y={vertex.y}>
                    {/* Debug hit area for vertices */}
                    {debugModeEnabled && (
                      <Circle
                        radius={12}
                        fill="rgba(0, 255, 0, 0.2)"
                        stroke="green"
                        strokeWidth={1}
                        listening={false}
                      />
                    )}
                    {/* Invisible hit area for city upgrade */}
                    {isValidCityUpgrade && (
                      <Circle 
                        radius={16}
                        fill={debugModeEnabled ? "rgba(0, 0, 255, 0.2)" : "transparent"}
                        stroke={debugModeEnabled ? "blue" : "transparent"}
                        strokeWidth={debugModeEnabled ? 1 : 0}
                        onClick={handleClick}
                        onTap={handleClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      />
                    )}
                    {settlement ? (
                      settlement.isCity ? (
                        // City Icon (Building SVG)
                        <Path
                          data="M-8 -10 L-8 10 L8 10 L8 -2 L2 -2 L2 -10 Z"
                          fill={color}
                          stroke="#fff"
                          strokeWidth={1.5}
                          scaleX={1.2}
                          scaleY={1.2}
                          shadowColor="black"
                          shadowBlur={5}
                          shadowOpacity={0.3}
                          listening={false} // Visual only
                        />
                      ) : (
                        // Settlement Icon (House SVG)
                        <Path
                          data="M-8 0 L0 -8 L8 0 L8 8 L-8 8 Z"
                          fill={color}
                          stroke="#fff"
                          strokeWidth={1.5}
                          scaleX={1.1}
                          scaleY={1.1}
                          shadowColor="black"
                          shadowBlur={5}
                          shadowOpacity={0.3}
                          listening={isValidCityUpgrade}
                          onClick={handleClick}
                          onTap={handleClick}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        />
                      )
                    ) : (
                      // Preview Icon & Hit Area
                      isValid && (
                        <>
                          <Circle
                            radius={16} // Provide a generous hit area for ease of use
                            fill={debugModeEnabled ? "rgba(255, 0, 0, 0.2)" : "transparent"}
                            stroke={debugModeEnabled ? "red" : "transparent"}
                            strokeWidth={debugModeEnabled ? 1 : 0}
                            onClick={handleClick}
                            onTap={handleClick}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          />
                          <Circle
                            radius={6} // Visual indicator
                            fill={'rgba(0,0,0,0.3)'}
                            listening={false}
                          />
                        </>
                      )
                    )}
                  </Group>
                );
              })}

              {/* Robber/Pirate Icons - Rendered last to be on top */}
              {hexCoords.map(hex => {
                const isRobber = gameState.robberHexId === hex.id;
                const isPirate = gameState.pirateHexId === hex.id;
                const isPhaseRobber = gameState.phase === 'robber';
                
                if (isRobber) {
                  return <RobberToken key={`robber-${hex.id}`} x={hex.x} y={hex.y} isPhaseRobber={isPhaseRobber} />;
                }
                if (isPirate) {
                  return <PirateToken key={`pirate-${hex.id}`} x={hex.x} y={hex.y} isPhaseRobber={isPhaseRobber} />;
                }
                return null;
              })}
            </Layer>
          </Stage>

          {/* Dice Floating Controls */}
          <AnimatePresence>
            {!gameState.hasRolled && gameState.phase !== 'setup' && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, x: 100, y: 100 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                className="absolute bottom-4 right-4 flex flex-col items-center gap-6 z-40"
              >
                <motion.button 
                  whileHover={isMyHumanTurn ? { scale: 1.05 } : {}}
                  whileTap={isMyHumanTurn ? { scale: 0.95 } : {}}
                  onClick={() => isMyHumanTurn && rollDice()}
                  disabled={!isMyHumanTurn}
                  className={`${isMobile ? 'px-3 py-1.5' : 'px-8 py-4'} rounded-xl shadow-xl border flex items-center gap-1.5 group transition-all ${
                    isMyHumanTurn 
                      ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-400" 
                      : "bg-stone-100 text-stone-400 cursor-not-allowed border-stone-200"
                  }`}
                >
                  <Dices size={isMobile ? 14 : 24} className={isMyHumanTurn ? "animate-pulse" : ""} />
                  <span className={`${isMobile ? 'text-[10px]' : 'text-xl'} font-black tracking-widest uppercase`}>掷骰子</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {(gameState.hasRolled || (gameState.phase === 'initial_dice_roll' && gameState.dice && gameState.dice[0] > 0)) && (
              <motion.div
                key={gameState.hasRolled ? 'main-roll' : `initial-roll-${Object.keys(gameState.initialDiceRolls).length}`}
                initial={{ opacity: 0, scale: 0.5, x: 100, y: 100 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                className="absolute bottom-4 right-4 flex flex-col items-center gap-6 z-40"
              >
                <div className={`bg-white ${isMobile ? 'p-2' : 'p-4'} rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-black/5 flex items-center gap-3`}>
                  <div className="flex gap-1.5">
                    <DiceFace value={gameState.dice[0]} />
                    <DiceFace value={gameState.dice[1]} />
                  </div>
                  <div className="pr-1 text-left">
                    <p className="text-[8px] uppercase tracking-[0.2em] font-black opacity-40">
                      点数
                    </p>
                    <p className={`${isMobile ? 'text-lg' : 'text-3xl'} font-serif font-black italic leading-none text-orange-500`}>
                      {gameState.dice[0] + gameState.dice[1]}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        
{/* Dissolve Room Confirmation Modal */}
      <AnimatePresence>
        {showDissolveRoomConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDissolveRoomConfirm(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-xs w-full border border-black/5 flex flex-col items-center text-center max-h-[85vh] overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-5">
                <Trash2 size={60} />
              </div>
              
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                <Trash2 size={20} />
              </div>
              
              <h3 className="text-lg font-black text-stone-800 mb-1">确定解散房间？</h3>
              <p className="text-stone-500 text-[9px] mb-4 leading-relaxed px-2">
                解散后所有玩家将被移出房间，<br />房间数据将永久删除且不可恢复。
              </p>
              
              <div className="flex flex-col w-full gap-1.5">
                <button 
                  onClick={() => {
                    const roomId = roomState?.roomId || inputRoomId;
                    socketService.resetGame(roomId);
                    setIsJoinedLobby(false);
                    setRoomState(null);
                    syncGameState(null as any);
                    setGameStarted(false);
                    window.history.replaceState({}, '', window.location.pathname);
                    setShowDissolveRoomConfirm(false);
                  }}
                  className="w-full py-2 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-[0.98]"
                >
                  确定解散
                </button>
                <button 
                  onClick={() => setShowDissolveRoomConfirm(false)}
                  className="w-full py-2 bg-stone-100 text-stone-600 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-stone-200 transition-all active:scale-[0.98]"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState?.tradeOffers?.filter(o => o.status === 'pending').map(offer => {
            const initiator = gameState.players.find(p => p.id === offer.initiatorId);
            if (!initiator) return null;
            const isInitiator = offer.initiatorId === myPlayerIndex;
            const isTarget = offer.targetPlayerId === null || offer.targetPlayerId === myPlayerIndex;
            const hasReacted = offer.acceptedBy.includes(myPlayerIndex) || offer.rejectedBy.includes(myPlayerIndex);

            if (!isInitiator && (!isTarget || hasReacted)) return null;

            return (
              <motion.div
                key={`trade-alert-${offer.id}`}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="absolute top-4 lg:top-6 left-1/2 -translate-x-1/2 z-[200] bg-white border border-stone-200 shadow-2xl rounded-3xl p-4 lg:p-6 w-[95%] max-w-[400px] max-h-[90%] flex flex-col pointer-events-auto"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-lg">玩家交易</h3>
                    <p className="text-xs text-stone-500 font-medium">来自 {initiator.name}</p>
                  </div>
                  {isInitiator && (
                    <button onClick={() => cancelTrade(offer.id)} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                      取消交易
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 bg-stone-50 p-3 rounded-2xl flex flex-col items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{isInitiator ? '你送出' : 'TA送出'}</span>
                    <div className="flex gap-1 flex-wrap justify-center">
                      {Object.values(ResourceType).filter(r => (offer.offer[r] || 0) > 0).map(r => (
                        <div key={`offer-res-${r}`} className="flex items-center gap-1">
                            <span className="text-sm leading-none">{RESOURCE_EMOJIS[r]}</span>
                            <span className="text-xs font-bold px-1">{offer.offer[r]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Repeat size={16} className="text-stone-300" />
                  <div className="flex-1 bg-stone-50 p-3 rounded-2xl flex flex-col items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{isInitiator ? '你得到' : 'TA要求'}</span>
                    <div className="flex gap-1 flex-wrap justify-center">
                      {Object.values(ResourceType).filter(r => (offer.request[r] || 0) > 0).map(r => (
                        <div key={`req-res-${r}`} className="flex items-center gap-1">
                            <span className="text-sm leading-none">{RESOURCE_EMOJIS[r]}</span>
                            <span className="text-xs font-bold px-1">{offer.request[r]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {isInitiator ? (
                    <div className="space-y-2 overflow-y-auto no-scrollbar flex-1 min-h-[50px]">
                      <div className="min-h-[40px] flex flex-col gap-2">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {offer.acceptedBy.length === 0 && offer.rejectedBy.length === 0 && (
                            <motion.div
                              key="waiting"
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              layout
                              className="flex flex-col items-center py-5 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200"
                            >
                              <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin mb-2" />
                              <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">正在等待其他玩家回应...</p>
                            </motion.div>
                          )}
                          {offer.acceptedBy.map(pid => {
                            const p = gameState.players.find(x => x.id === pid);
                            return (
                              <motion.div 
                                key={`accept-${pid}`} 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                                className="flex items-center justify-between bg-green-50/50 p-2 lg:p-3 rounded-2xl border border-green-100/50"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
                                  <span className="text-sm font-bold text-green-700">{p?.name}</span>
                                  <span className="text-[10px] font-bold text-green-600/60 uppercase tracking-tighter">接受交易</span>
                                </div>
                                <button 
                                  onClick={() => finalizeTrade(offer.id, pid)} 
                                  className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/10 active:scale-95"
                                >
                                  成交
                                </button>
                              </motion.div>
                            );
                          })}
                          {offer.rejectedBy.map(pid => {
                                const p = gameState.players.find(x => x.id === pid);
                                return (
                                  <motion.div 
                                    key={`reject-${pid}`} 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                    className="flex items-center justify-between bg-stone-50/30 p-2 lg:p-3 rounded-2xl border border-stone-100 opacity-60"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-stone-300" />
                                      <span className="text-sm font-bold text-stone-600">{p?.name}</span>
                                      <span className="text-[10px] font-medium text-stone-400">已拒绝</span>
                                    </div>
                                  </motion.div>
                                );
                              })}
                        </AnimatePresence>
                      </div>
                    </div>
                 ) : (
                    <div className="flex gap-2">
                      <button 
                        disabled={hasReacted}
                        onClick={() => reactToTrade(offer.id, myPlayerIndex, 'reject')} 
                        className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors disabled:opacity-50"
                      >
                        拒绝
                      </button>
                      <button 
                        disabled={hasReacted || !Object.values(ResourceType).every(r => (me.resources[r] || 0) >= (offer.request[r] || 0))}
                        onClick={() => reactToTrade(offer.id, myPlayerIndex, 'accept')} 
                        className="flex-1 py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        接受
                      </button>
                    </div>
                 )}
              </motion.div>
            );
        })}
      </AnimatePresence>

      {/* Game Initializing/Loading Overlays */}
      <AnimatePresence>
        {isInitializingGame && gameStarted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center"
          >
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="flex flex-col items-center"
            >
              <div className="w-24 h-24 mb-6 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-2xl relative">
                <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/C3eURTs - Imgur.png')}`} alt="Catan" className="w-16 h-16 object-contain z-10" />
                <div className="absolute inset-0 border-4 border-indigo-500/20 border-t-indigo-500 rounded-[2rem] animate-spin" />
              </div>
              <h2 className="text-2xl font-serif font-black italic text-slate-800">正在生成地图...</h2>
              <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold mt-4 animate-pulse">
                系统初始化中
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Debug Panel */}
      <AnimatePresence>
        {showDebugConsole && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-black/5 w-80 z-[300] max-h-[80vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase tracking-widest text-xs">调试控制台</h3>
              <button onClick={() => setShowDebugConsole(false)} className="p-2 hover:bg-black/5 rounded-full">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-[10px] uppercase tracking-widest opacity-40 mb-3">控制骰子</h4>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        // Simple logic to split num into two dice
                        const d1 = Math.floor(num / 2);
                        const d2 = num - d1;
                        setDice(d1, d2);
                      }}
                      className="w-8 h-8 bg-stone-100 hover:bg-black hover:text-white rounded-lg text-xs font-mono font-bold transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[10px] uppercase tracking-widest opacity-40 mb-3">资源管理 (当前玩家)</h4>
                <div className="space-y-2">
                  {Object.values(ResourceType).map(res => (
                    <div key={res} className="flex items-center justify-between p-2 bg-stone-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-sm leading-none">{RESOURCE_EMOJIS[res]}</span>
                        <span className="text-xs font-bold">{RESOURCE_NAMES[res]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setPlayerResource(activePlayerId, res, Math.max(0, actingPlayer.resources[res] - 5))}
                          className="w-6 h-6 bg-white border border-black/10 rounded-full flex items-center justify-center hover:bg-stone-100"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs w-4 text-center">{actingPlayer.resources[res]}</span>
                        <button 
                          onClick={() => setPlayerResource(activePlayerId, res, actingPlayer.resources[res] + 5)}
                          className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Debug Toggle Button Removed - Replaced by logo 5-click toggle */}

      {/* Removed DiscardModal rendering here as it's now in the left panel */}



      {/* Player Trade Modal */}
      <AnimatePresence>
        {showPlayerTradeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none p-4 w-full"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-stone-200 rounded-3xl p-4 lg:p-5 max-w-[400px] w-full max-h-[90%] overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight">玩家交易</h2>
                  <p className="text-stone-500 font-medium text-xs">与其他玩家交换资源</p>
                </div>
                <button 
                  onClick={() => setShowPlayerTradeModal(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto text-[10px]">
                <div>
                  <h3 className="font-bold uppercase tracking-widest text-stone-400 mb-2">你送出 (Offer)</h3>
                  <div className="grid gap-1.5 grid-cols-2 md:grid-cols-5">
                    {Object.values(ResourceType).map(r => (
                      <div key={`offer-${r}`} className="p-2 border rounded-lg flex flex-col items-center gap-1">
                        <span className="text-xl leading-none">{RESOURCE_EMOJIS[r]}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button 
                            disabled={(playerTradeOffer[r] || 0) <= 0}
                            onClick={() => setPlayerTradeOffer(prev => ({...prev, [r]: (prev[r] || 0) - 1}))}
                            className="w-5 h-5 rounded bg-stone-100 flex items-center justify-center disabled:opacity-30"
                          >-</button>
                          <span className="font-bold text-xs">{playerTradeOffer[r] || 0}</span>
                          <button 
                            disabled={(playerTradeOffer[r] || 0) >= (me.resources[r] || 0)}
                            onClick={() => setPlayerTradeOffer(prev => ({...prev, [r]: (prev[r] || 0) + 1}))}
                            className="w-5 h-5 rounded bg-stone-100 flex items-center justify-center disabled:opacity-30"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold uppercase tracking-widest text-stone-400 mb-2">你希望得到 (Request)</h3>
                  <div className="grid gap-1.5 grid-cols-2 md:grid-cols-5">
                    {Object.values(ResourceType).map(r => (
                      <div key={`request-${r}`} className="p-2 border rounded-lg flex flex-col items-center gap-1">
                        <span className="text-xl leading-none">{RESOURCE_EMOJIS[r]}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button 
                            disabled={(playerTradeRequest[r] || 0) <= 0}
                            onClick={() => setPlayerTradeRequest(prev => ({...prev, [r]: (prev[r] || 0) - 1}))}
                            className="w-5 h-5 rounded bg-stone-100 flex items-center justify-center disabled:opacity-30"
                          >-</button>
                          <span className="font-bold text-xs">{playerTradeRequest[r] || 0}</span>
                          <button 
                            onClick={() => setPlayerTradeRequest(prev => ({...prev, [r]: (prev[r] || 0) + 1}))}
                            className="w-5 h-5 rounded bg-stone-100 flex items-center justify-center"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold uppercase tracking-widest text-stone-400 mb-2">交易对象</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setPlayerTradeTarget(null)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${playerTradeTarget === null ? 'bg-black text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                    >
                      所有人
                    </button>
                    {gameState?.players.filter(p => p.id !== me.id && !p.isBot).map(p => (
                      <button
                        key={`target-${p.id}`}
                        onClick={() => setPlayerTradeTarget(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${playerTradeTarget === p.id ? 'bg-black text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  disabled={
                    Object.values(playerTradeOffer).reduce((a,b) => a+b, 0) === 0 || 
                    Object.values(playerTradeRequest).reduce((a,b) => a+b, 0) === 0
                  }
                  onClick={() => {
                    proposeTrade(playerTradeOffer, playerTradeRequest, playerTradeTarget);
                    setShowPlayerTradeModal(false);
                  }}
                  className="w-full bg-black text-white px-4 py-3 rounded-lg font-black uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:bg-zinc-800 text-xs"
                >
                  发起交易
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dev Card Confirmation Modal */}
      <AnimatePresence>
        {confirmDevCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-[280px] lg:max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-6 lg:p-10 text-center"
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl bg-zinc-50 mx-auto flex items-center justify-center text-3xl lg:text-4xl shadow-inner mb-4 lg:mb-6">
                {confirmDevCard === DevCardType.Knight ? '⚔️' : 
                 confirmDevCard === DevCardType.VictoryPoint ? '🏆' :
                 confirmDevCard === DevCardType.RoadBuilding ? '🛣️' :
                 confirmDevCard === DevCardType.YearOfPlenty ? '🎁' : '💎'}
              </div>
              <h2 className="text-xl lg:text-2xl font-serif font-black italic mb-1 lg:mb-2">
                {confirmDevCard === DevCardType.Knight ? '发动骑士' : 
                 confirmDevCard === DevCardType.VictoryPoint ? '使用胜利点' :
                 confirmDevCard === DevCardType.RoadBuilding ? '道路建设' :
                 confirmDevCard === DevCardType.YearOfPlenty ? '丰收之年' : '开启垄断'}
              </h2>
              <p className="text-[10px] lg:text-xs opacity-50 uppercase tracking-[0.1em] lg:tracking-[0.2em] font-bold mb-6 lg:mb-8 leading-relaxed">
                {confirmDevCard === DevCardType.Knight ? '移动强盗并从相邻玩家处偷取一张资源卡。' : 
                 confirmDevCard === DevCardType.VictoryPoint ? '直接获得 1 点胜利点。' :
                 confirmDevCard === DevCardType.RoadBuilding ? '免费建造 2 条道路。' :
                 confirmDevCard === DevCardType.YearOfPlenty ? '从银行免费领取任意 2 张资源卡。' : '选择一种资源，所有玩家必须交出该资源。'}
              </p>
              
              <div className="space-y-2 lg:space-y-3">
                <button 
                  onClick={() => {
                    playDevCard(confirmDevCard);
                    setConfirmDevCard(null);
                  }}
                  className="w-full bg-black text-white py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black uppercase tracking-widest text-[9px] lg:text-[10px] shadow-xl hover:bg-zinc-800 transition-all active:scale-95"
                >
                  确认使用
                </button>
                <button 
                  onClick={() => setConfirmDevCard(null)}
                  className="w-full py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black uppercase tracking-widest text-[9px] lg:text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Trade Modal */}
      <AnimatePresence>
        {showTradeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none p-4 w-full"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-stone-200 w-full max-w-[400px] rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90%] flex flex-col pointer-events-auto"
            >
              <div className="p-4 border-b border-black/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-black italic">海上贸易</h2>
                  <p className="text-[9px] opacity-40 uppercase tracking-widest mt-0.5">与银行进行 {currentTradeRatio}:1 资源交换</p>
                </div>
                <button onClick={() => setShowTradeModal(false)} className="p-2 rounded-full hover:bg-black/5 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-4">支付 ({currentTradeRatio})</h4>
                  <div className="space-y-1.5">
                    {Object.values(ResourceType).map(r => (
                      <button 
                        key={r} 
                        onClick={() => setTradeGive(r)}
                        className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between ${tradeGive === r ? 'bg-black text-white border-black scale-[1.02] shadow-lg' : 'border-black/5 hover:bg-stone-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{RESOURCE_EMOJIS[r]}</span>
                          <span className="text-sm font-bold">{RESOURCE_NAMES[r]}</span>
                        </div>
                        <span className={`text-xs font-mono ${tradeGive === r ? 'opacity-60' : 'opacity-40'}`}>x{me.resources[r]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-4">获得 (1)</h4>
                  <div className="space-y-1.5">
                    {Object.values(ResourceType).map(r => (
                      <button 
                        key={r} 
                        onClick={() => setTradeReceive(r)}
                        className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between ${tradeReceive === r ? 'bg-black text-white border-black scale-[1.02] shadow-lg' : 'border-black/5 hover:bg-stone-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{RESOURCE_EMOJIS[r]}</span>
                          <span className="text-sm font-bold">{RESOURCE_NAMES[r]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-stone-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">交易次数:</span>
                  <div className="flex items-center gap-1.5 bg-white border border-black/5 rounded-full p-0.5">
                    <button 
                      onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 1))}
                      className="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-bold">{tradeQuantity}</span>
                    <button 
                      onClick={() => setTradeQuantity(Math.min(maxTradeQuantity, tradeQuantity + 1))}
                      className="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                      disabled={tradeQuantity >= maxTradeQuantity}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[9px] opacity-30 font-medium">最多可交易 {maxTradeQuantity} 次</span>
                </div>
                <button 
                  disabled={!tradeGive || !tradeReceive || tradeGive === tradeReceive || maxTradeQuantity < 1}
                  onClick={handleTrade}
                  className="bg-black text-white px-6 py-3 rounded-full font-black uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl active:scale-95 text-xs"
                >
                  确认交易 ({tradeQuantity * currentTradeRatio} 换 {tradeQuantity})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stealing Modal */}
      <AnimatePresence>
        {gameState.phase === 'stealing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] flex items-center justify-center bg-transparent pointer-events-auto p-4 w-full"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-stone-200 rounded-[2rem] shadow-2xl overflow-hidden max-w-[300px] w-full p-5 lg:p-6 flex flex-col items-center text-center relative pointer-events-auto"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-2xl mb-3 shadow-inner">
                🕵️
              </div>
              <h3 className="text-xl font-serif font-black italic mb-1 text-slate-900">选择偷取对象</h3>
              <p className="text-[10px] opacity-40 uppercase tracking-widest mb-5 px-2 leading-relaxed">从相邻建筑的玩家手中随机抽取一张资源卡</p>
              
              <div className="grid grid-cols-1 gap-2 w-full">
                {gameState.pendingStealFrom.map(pid => (
                  <button
                    key={pid}
                    onClick={() => {
                      if (isMyHumanTurn && gameState.selectedStealTarget == null) {
                        doSteal(pid);
                      }
                    }}
                    disabled={!isMyHumanTurn || gameState.selectedStealTarget != null}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all relative overflow-hidden group ${
                      gameState.selectedStealTarget === pid
                        ? "bg-black text-white border-black scale-102 shadow-xl"
                        : gameState.selectedStealTarget != null
                          ? "opacity-20 border-black/5"
                          : isMyHumanTurn 
                            ? "bg-stone-50 border-stone-100 hover:border-black/20 hover:bg-stone-100 active:scale-98" 
                            : "opacity-40 bg-stone-50 border-stone-100 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-3 relative z-10 text-left">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: gameState.players[pid].color }} />
                      <span className="font-black tracking-tight text-sm uppercase">{gameState.players[pid].name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="text-[10px] font-bold opacity-40">持有 {Object.values(gameState.players[pid].resources).reduce((a,b)=>a+b,0)}</span>
                      {isMyHumanTurn && gameState.selectedStealTarget !== pid && (
                        <ChevronRight size={14} className="opacity-20 group-hover:translate-x-1 transition-transform" />
                      )}
                      {gameState.selectedStealTarget === pid && (
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                          <Check size={12} />
                        </div>
                      )}
                    </div>

                    {gameState.selectedStealTarget === pid && (
                      <motion.div 
                        layoutId="active-target-bg"
                        className="absolute inset-0 bg-black z-0"
                      />
                    )}
                  </button>
                ))}
              </div>

              {!isMyHumanTurn && (
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full border border-black/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">正在等待行动玩家选择...</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gold Selection Modal Removed */}

      {/* Central Action Modals (Discard, Monopoly, Year of Plenty, Gold Selection) */}
      <AnimatePresence>
        {((gameState.phase === 'discard' && gameState.pendingDiscards[0]?.playerId === myPlayerIndex) ||
          (gameState.phase === 'year_of_plenty' && amIActivePlayer) ||
          (gameState.phase === 'monopoly' && amIActivePlayer) ||
          (gameState.phase === 'gold_selection' && amIActivePlayer && (gameState.pendingGoldRewards?.length || 0) > 0)) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Backdrop with zero opacity as requested to see resources behind
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-md w-full max-w-[280px] sm:max-w-[320px] lg:max-w-sm rounded-[1.8rem] lg:rounded-[2.5rem] shadow-2xl border border-black/10 p-3 sm:p-6 lg:p-8 pointer-events-auto max-h-[95vh] overflow-y-auto no-scrollbar"
            >
              {gameState.phase === 'discard' && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-serif font-black italic text-red-600">强盗突袭！</h3>
                    <p className="text-xs font-bold text-slate-800">
                      请弃掉 {gameState.pendingDiscards[0].amount} 张牌 (还需 {(gameState.pendingDiscards[0].amount - Object.values(discardSelection).reduce((a, b) => a + b, 0))} 张)
                    </p>
                  </div>
                  <DiscardPanel 
                    key={myPlayerIndex} 
                    player={me} 
                    amount={gameState.pendingDiscards[0].amount} 
                    onDiscard={(res) => discardCards(myPlayerIndex, res)} 
                    onChange={setDiscardSelection}
                  />
                </div>
              )}

              {gameState.phase === 'year_of_plenty' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-serif font-black italic mb-1">丰收之年</h3>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest">请从银行任选 2 张资源</p>
                  </div>
                  <div className="space-y-2">
                    <ResourceSelector 
                      title="第一张资源"
                      selected={tradeGive}
                      onSelect={setTradeGive}
                    />
                    <ResourceSelector 
                      title="第二张资源"
                      selected={tradeReceive}
                      onSelect={setTradeReceive}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={cancelDevCard}
                      className="flex-1 bg-stone-100 text-stone-500 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-stone-200 transition-all"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => {
                        if (tradeGive && tradeReceive) {
                          resolveYearOfPlenty(tradeGive, tradeReceive);
                          setTradeGive(null);
                          setTradeReceive(null);
                        }
                      }}
                      disabled={!tradeGive || !tradeReceive}
                      className="flex-[1.5] bg-black text-white py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-zinc-800 transition-all disabled:opacity-20 active:scale-95"
                    >
                      确认领取
                    </button>
                  </div>
                </div>
              )}

              {gameState.phase === 'monopoly' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-serif font-black italic mb-1">垄断资源</h3>
                    <p className="text-[10px] opacity-40 uppercase tracking-widest">所有玩家必须交出你选中的资源</p>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 lg:gap-2">
                    {Object.values(ResourceType).map(res => (
                      <button
                        key={`mono-${res}`}
                        onClick={() => setTradeGive(res)}
                        className={`p-2 lg:p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${tradeGive === res ? 'border-black bg-stone-50 scale-105 shadow-md' : 'border-black/5 hover:border-black/20 hover:bg-stone-50'}`}
                      >
                        <span className="text-xl lg:text-2xl leading-none">{RESOURCE_EMOJIS[res]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-1 lg:pt-2">
                    <button 
                      onClick={cancelDevCard}
                      className="flex-1 bg-stone-100 text-stone-500 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-stone-200 transition-all"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => {
                        if (tradeGive) {
                          resolveMonopoly(tradeGive);
                          setTradeGive(null);
                        }
                      }}
                      disabled={!tradeGive}
                      className="flex-[1.5] bg-black text-white py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-zinc-800 transition-all disabled:opacity-20 active:scale-95"
                    >
                      执行垄断
                    </button>
                  </div>
                </div>
              )}

              {gameState.phase === 'gold_selection' && (
                <div className="space-y-4">
                  <GoldSelectionPanel 
                    bankResources={gameState.bankResources}
                    amount={gameState.pendingGoldRewards[0].amount}
                    onSelect={selectGoldResource}
                  />
                  <button 
                    onClick={() => {
                      // Logic to skip if possible or handle cancellation if allowed
                      // (Usually gold rush is mandatory, but we can add a cancel if needed)
                    }}
                    className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-stone-300 pointer-events-none"
                  >
                    结算中...
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      
</main>

        {/* Right Panel */}
        <AnimatePresence>
          {showRightPanel && (
            <motion.aside 
              initial={{ width: rightWidth }}
              animate={{ width: rightWidth }}
              exit={{ width: 0 }}
              className={`border-l border-black/5 ${isMobile ? 'p-1' : 'p-2 lg:p-2.5'} flex flex-col h-full bg-white overflow-hidden shrink-0 z-50 relative`}
            >
              <section className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-1 shrink-0">
                  <h3 className="text-[9px] uppercase tracking-[0.2em] font-black opacity-30">建设</h3>
                </div>
                <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-y-auto no-scrollbar">
              <BuildItem 
                id="build-road"
                compact={true}
                icon={<Hammer size={16} />} 
                label="道路" 
                cost={COSTS.road} 
                active={buildMode === 'road'}
                disabled={!canBuild || (!canAfford(COSTS.road) && gameState?.phase !== 'setup' && gameState?.phase !== 'road_building') || (gameState?.phase === 'setup' && settlementsCount <= totalRoadsAndShips)}
                onClick={() => handleSetBuildMode(buildMode === 'road' ? null : 'road')} 
              />
              <BuildItem 
                id="build-ship"
                compact={true}
                icon={<ShipIcon size={16} />} 
                label="船只" 
                cost={COSTS.ship} 
                active={buildMode === 'ship'}
                disabled={!canBuild || ((!canAfford(COSTS.ship) && gameState?.phase !== 'road_building') || gameState?.mapType === 'standard') || (gameState?.phase === 'setup' && settlementsCount <= totalRoadsAndShips)}
                onClick={() => handleSetBuildMode(buildMode === 'ship' ? null : 'ship')} 
              />
              <BuildItem 
                id="build-settlement"
                compact={true}
                icon={<Home size={16} />} 
                label="村庄" 
                cost={COSTS.settlement} 
                active={buildMode === 'settlement'}
                disabled={!canBuild || (!canAfford(COSTS.settlement) && gameState?.phase !== 'setup') || (gameState?.phase === 'setup' && settlementsCount > totalRoadsAndShips)}
                onClick={() => handleSetBuildMode(buildMode === 'settlement' ? null : 'settlement')} 
              />
              <BuildItem 
                id="build-city"
                compact={true}
                icon={<Trophy size={16} />} 
                label="城市" 
                cost={COSTS.city} 
                active={buildMode === 'city'}
                disabled={!canBuild || !canAfford(COSTS.city) || gameState?.phase === 'setup'}
                onClick={() => handleSetBuildMode(buildMode === 'city' ? null : 'city')} 
              />
              <BuildItem 
                id="buy-dev-card"
                compact={true}
                icon={<BookOpen size={16} />} 
                label="发展卡" 
                cost={COSTS.devCard} 
                disabled={!canBuild || !canAfford(COSTS.devCard) || gameState?.phase === 'setup'}
                onClick={buyDevCard} 
              />
            </div>
          </section>

          {/* Removed duplicate development cards section here */}

          <section className="pt-1.5 mt-auto border-t border-black/5 space-y-1">
            <div className={`flex ${isMobile ? 'flex-col gap-1' : 'gap-1.5'}`}>
              <button 
                id="trade-bank-button"
                onClick={() => setShowTradeModal(true)}
                disabled={!canTrade}
                className={`flex-1 flex items-center justify-center ${isMobile ? 'gap-1 p-2 rounded-lg h-6' : 'gap-1 p-1 rounded-lg h-8'} bg-white border border-black/5 hover:border-black/20 hover:shadow-xl transition-all group disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <Repeat size={12} className="opacity-40 group-hover:rotate-180 transition-transform duration-500" />
                <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-widest whitespace-nowrap`}>系统交易</span>
              </button>
              <button 
                id="trade-player-button"
                onClick={openPlayerTradeModal}
                disabled={!canTrade}
                className={`flex-1 flex items-center justify-center ${isMobile ? 'gap-1 p-2 rounded-lg h-6' : 'gap-1 p-1 rounded-lg h-8'} bg-white border border-black/5 hover:border-black/20 hover:shadow-xl transition-all group disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <Users size={12} className="opacity-40" />
                <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-widest whitespace-nowrap`}>玩家交易</span>
              </button>
            </div>
            <div className="relative">
               <div className="relative group">
                <button 
                  id="end-turn-button"
                  onClick={nextTurn}
                  disabled={!isMyHumanTurn || (gameState?.phase === 'main' && !gameState.hasRolled) || gameState?.playingDevCard != null || (gameState?.phase === 'robber') || gameState?.phase === 'discard'}
                  className={`w-full flex items-center justify-center gap-1 ${isMobile ? 'rounded-lg h-7' : 'rounded-lg h-10'} bg-black text-white hover:bg-zinc-800 transition-all group disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <ChevronRight size={14} className="opacity-40" />
                  <span className={`${isMobile ? 'text-[9px]' : 'text-xs'} font-bold uppercase tracking-widest`}>结束回合</span>
                </button>
              </div>
            </div>
          </section>
        </motion.aside>
      )}
    </AnimatePresence>
    </div>

      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
      
      {/* Game Over Modal */}
      <AnimatePresence>
        {showGameOver && (
          <GameOverModal 
            gameState={gameState} 
            maxWidth={stageWidth}
            onReturnToLobby={handleReturnToLobby}
            onReturnToMap={handleReturnToMap}
          />
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}

function MapPreview({ board, isTopologyOnly = false }: { board: any[], isTopologyOnly?: boolean }) {
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (!board || board.length === 0) return;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      board.forEach(hex => {
        if (hex.isOuterSea || hex.category === 'OuterSea' || hex._category === 'OuterSea') return;
        const x = HEX_WIDTH * (hex.q + hex.r / 2);
        const y = HEX_HEIGHT * 0.75 * hex.r;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
      const boardWidth = maxX - minX + HEX_WIDTH * 2;
      const boardHeight = maxY - minY + HEX_HEIGHT * 2;
      const scaleX = width / boardWidth;
      const scaleY = height / boardHeight;
      setScale(Math.min(scaleX, scaleY) * 0.9);
    }
  }, [board]);

  const hexCoords = useMemo(() => {
    if (!board) return [];
    return board
      .filter(hex => !(hex.isOuterSea || hex.category === 'OuterSea' || hex._category === 'OuterSea'))
      .map(hex => {
        const x = HEX_WIDTH * (hex.q + hex.r / 2);
        const y = HEX_HEIGHT * 0.75 * hex.r;
        return { ...hex, x, y, radius: HEX_RADIUS };
      });
  }, [board]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <Stage width={containerRef.current?.clientWidth || 400} height={containerRef.current?.clientHeight || 400}>
        <Layer x={(containerRef.current?.clientWidth || 400) / 2} y={(containerRef.current?.clientHeight || 400) / 2} scale={{ x: scale, y: scale }}>
          {hexCoords.map(hex => {
            let fill = '#fff';
            if (isTopologyOnly) {
              if (hex.category === 'Mainland' || hex._category === 'Mainland') fill = '#8B5A2B';
              else if (hex.category === 'Island' || hex._category === 'Island') fill = '#CD853F';
              else if (hex.category === 'Desert' || hex._category === 'Desert') fill = '#F4A460';
              else if (hex.category === 'InnerSea' || hex._category === 'InnerSea') fill = '#4682B4';
            } else {
              const resType = hex.type === HexType.Gold ? 'gold' : hex.type === HexType.Desert ? 'desert' : hex.type === HexType.Sea ? 'sea' : HEX_RESOURCES[hex.type as HexType];
              fill = RESOURCE_COLORS[resType as any] || '#ccc';
            }

            return (
              <Group key={hex.id} x={hex.x} y={hex.y}>
                <RegularPolygon
                  sides={6}
                  radius={HEX_RADIUS - 1}
                  fill={fill}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth={1}
                  rotation={0}
                />
                {!isTopologyOnly && hex.number && (
                  <Group>
                    <Circle radius={12} fill="#fff" shadowBlur={2} shadowOpacity={0.2} />
                    <Text
                      text={hex.number.toString()}
                      fontSize={14}
                      fontStyle="bold"
                      fill={hex.number === 6 || hex.number === 8 ? '#d32f2f' : '#333'}
                      offsetX={hex.number > 9 ? 8 : 4}
                      offsetY={6}
                    />
                  </Group>
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

function RulesModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 40 }}
            className="bg-white w-full max-w-4xl max-h-[80vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-10 border-b border-black/5 flex items-center justify-between bg-stone-50/50">
              <div>
                <h2 className="text-4xl font-serif font-black italic tracking-tighter">游戏规则与说明</h2>
                <p className="text-xs opacity-40 uppercase tracking-[0.3em] mt-2 font-bold">CATAN: SEAFARERS EDITION</p>
              </div>
              <button onClick={onClose} className="p-5 rounded-full hover:bg-black/5 transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-12 space-y-12">
              <section>
                <h3 className="text-xl font-serif font-black italic mb-6 flex items-center gap-3">
                  <div className="w-2 h-6 bg-black rounded-full" />
                  基础玩法
                </h3>
                <div className="grid grid-cols-2 gap-10 text-sm leading-relaxed opacity-70 font-medium">
                  <p>
                    卡坦岛是一款关于资源管理与建设的游戏。玩家通过掷骰子获取资源，并利用这些资源建造道路、村庄和城市。
                    <br /><br />
                    每回合开始时，当前玩家掷出两枚骰子。所有在对应数字地块旁拥有建筑的玩家都将获得该地块产出的资源。
                  </p>
                  <p>
                    <b>建设规则：</b>
                    <br />
                    1. <b>间距规则：</b>村庄与村庄之间必须至少隔一个角（即不能在相邻的交点上建设）。
                    <br />
                    2. <b>连接规则：</b>道路必须连接到你已有的村庄、城市或其他道路。
                    <br />
                    3. <b>初始资源：</b>在初始建设阶段，放置第二个村庄后，你将获得该村庄周围地块对应的资源各1份。
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-serif font-black italic mb-6 flex items-center gap-3">
                  <div className="w-2 h-6 bg-black rounded-full" />
                  建造消耗
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <CostCard label="道路" cost={COSTS.road} />
                  <CostCard label="船只" cost={COSTS.ship} />
                  <CostCard label="村庄" cost={COSTS.settlement} />
                  <CostCard label="城市" cost={COSTS.city} />
                  <CostCard label="发展卡" cost={COSTS.devCard} />
                </div>
              </section>

              <section>
                <h3 className="text-xl font-serif font-black italic mb-6 flex items-center gap-3">
                  <div className="w-2 h-6 bg-black rounded-full" />
                  发展卡规则
                </h3>
                <div className="grid grid-cols-2 gap-6 text-sm leading-relaxed opacity-70 font-medium">
                  <div className="p-6 rounded-3xl bg-stone-50 border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3">骑士卡 (Knight)</h4>
                    <p className="text-[11px] opacity-60 leading-relaxed">打出后可以移动强盗或海盗，并从相邻建筑的玩家手中随机抽取一张资源卡。最先打出3张骑士卡的玩家获得“最大军队”称号（2分）。</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-stone-50 border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3">胜利点卡 (Victory Point)</h4>
                    <p className="text-[11px] opacity-60 leading-relaxed">每张卡片价值1个胜利点。这些卡片会一直隐藏，直到你能够赢得游戏时才会展示。</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-stone-50 border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3">道路建设 (Road Building)</h4>
                    <p className="text-[11px] opacity-60 leading-relaxed">打出后可以免费建设两条道路或船只。</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-stone-50 border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3">丰收之年 (Year of Plenty)</h4>
                    <p className="text-[11px] opacity-60 leading-relaxed">打出后可以从银行免费拿取任意两张资源卡。</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-stone-50 border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3">垄断 (Monopoly)</h4>
                    <p className="text-[11px] opacity-60 leading-relaxed">打出后声明一种资源，所有其他玩家必须将他们手中该种资源的所有卡片交给你。</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-serif font-black italic mb-6 flex items-center gap-3">
                  <div className="w-2 h-6 bg-black rounded-full" />
                  界面说明
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-stone-50 border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3">左侧面板</h4>
                    <p className="text-[11px] opacity-60 leading-relaxed">管理你的资源库存，并在此处点击建筑图标进行施工。下方可以查看银行库存和进行海上贸易。</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-stone-50 border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3">中央地图</h4>
                    <p className="text-[11px] opacity-60 leading-relaxed">展示卡坦岛全貌。你可以拖拽地图，点击地块查看详情。数字代表产出概率，点数越多概率越高。</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-stone-50 border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest mb-3">右下角骰子</h4>
                    <p className="text-[11px] opacity-60 leading-relaxed">点击掷骰子获取资源。每回合只能掷一次。投掷后会显示点数，直到下一回合开始。</p>
                  </div>
                </div>
              </section>

              <section className="bg-stone-900 text-white p-10 rounded-[2.5rem] shadow-2xl">
                <h3 className="text-xl font-serif italic mb-6">胜利条件</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  第一个获得 14 分（VP）的玩家赢得比赛。
                  <br /><br />
                  村庄 = 1 分 | 城市 = 2 分 | 最长道路/最大军队等成就也会提供额外分数。
                </p>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}

function ResourceRow({ type, count, compact }: { type: ResourceType, count: number, compact?: boolean }) {
  const icons: any = {
    [ResourceType.Lumber]: '🌲',
    [ResourceType.Brick]: '🧱',
    [ResourceType.Wool]: '🐑',
    [ResourceType.Grain]: '🌾',
    [ResourceType.Ore]: '⛰️',
  };

  return (
    <div className={`flex items-center justify-between ${compact ? 'py-1 px-1.5' : 'py-2 px-3'} rounded-md bg-white border border-black/10 hover:shadow-md transition-all group`}>
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
        <div 
          className={`${compact ? 'w-4 h-4' : 'w-7 h-7'} rounded-sm lg:rounded-md flex items-center justify-center ${compact ? 'text-[8px]' : 'text-base'} shadow-inner transition-transform group-hover:scale-110`}
          style={{ backgroundColor: RESOURCE_COLORS[type] + '20' }}
        >
          {icons[type]}
        </div>
        <span className={`font-black uppercase tracking-tight opacity-70 group-hover:opacity-100 transition-opacity ${compact ? 'text-[7px]' : 'text-[11px]'}`}>{RESOURCE_NAMES[type]}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className={`font-mono font-black ${compact ? 'text-[9px] pl-1' : 'text-base'}`}>{count}</span>
      </div>
    </div>
  );
}

function BuildItem({ id, icon, label, cost, onClick, active, disabled, compact }: { id?: string, icon: React.ReactNode, label: string, cost: Record<string, number>, onClick?: () => void, active?: boolean, disabled?: boolean, compact?: boolean }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between ${compact ? 'py-1 px-2' : 'py-2 px-3'} rounded-xl border transition-all group ${active ? 'bg-black text-white border-black shadow-xl scale-[1.01]' : 'bg-white border-black/5 hover:border-black/20 hover:shadow-xl'} ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : ''} flex-1 min-h-0 min-w-0 lg:max-h-16`}
    >
      <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'} min-w-0`}>
        <div className={`${compact ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-8 h-8'} shrink-0 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: compact ? 12 : 16 })}
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className={`${compact ? 'text-[8px] sm:text-[9px]' : 'text-[11px]'} font-black uppercase tracking-widest truncate w-full`}>{label}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 opacity-60 shrink-0">
        <div className="flex gap-1.5">
          {Object.entries(cost).map(([res, amt]) => (
            <div key={res} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] leading-none">{RESOURCE_EMOJIS[res as ResourceType]}</span>
              <span className="text-[7px] font-mono font-bold leading-none">{amt}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

function HexCell({ hex, isSelected, isRobber, isPirate, onClick }: { hex: any, isSelected: boolean, isRobber: boolean, isPirate: boolean, onClick: () => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let src = '';
    switch (hex.type) {
      case HexType.Forest: src = FOREST_IMG; break;
      case HexType.Hills: src = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/fklpV8b - Imgur.jpg'); break;
      case HexType.Pasture: src = PASTURE_IMG; break;
      case HexType.Fields: src = FIELDS_IMG; break;
      case HexType.Mountains: src = Mountains_IMG; break;
      case HexType.Desert: src = Desert_IMG; break;
      case HexType.Gold: src = ''; break;
      case HexType.Sea: src = ''; break;
    }
    if (src) {
      const img = new window.Image();
      img.src = src;
      img.referrerPolicy = 'no-referrer';
      img.crossOrigin = 'Anonymous';
      img.onload = () => setImage(img);
    }
  }, [hex.type]);

  const color = RESOURCE_COLORS[hex.type === HexType.Gold ? 'gold' : hex.type === HexType.Desert ? 'desert' : hex.type === HexType.Sea ? 'sea' : (HEX_RESOURCES[hex.type as HexType] as any)] || '#ccc';

  return (
    <Group 
      x={hex.x} 
      y={hex.y} 
      onClick={onClick} 
      onTap={onClick}
      listening={hex.type !== HexType.Sea}
      onMouseEnter={(e: any) => {
        const container = e.target.getStage().container();
        container.style.cursor = 'pointer';
      }}
      onMouseLeave={(e: any) => {
        const container = e.target.getStage().container();
        container.style.cursor = 'default';
      }}
    >
      <RegularPolygon
        sides={6}
        radius={HEX_RADIUS - 1}
        fill={image ? undefined : color}
        fillPatternImage={image || undefined}
        fillPatternScale={image ? { x: (HEX_RADIUS * 2) / image.width, y: (HEX_RADIUS * 2) / image.height } : undefined}
        fillPatternOffset={image ? { x: image.width / 2, y: image.height / 2 } : undefined}
        stroke="rgba(0,0,0,0.1)"
        strokeWidth={1}
        opacity={hex.type === HexType.Sea ? 0.8 : 1}
        shadowBlur={isRobber || isPirate ? 20 : 0}
        shadowOpacity={0.2}
        rotation={0}
      />
      
      {hex.number && (
        <Group listening={false}>
          <Circle 
            radius={12} 
            fill="rgba(255, 255, 255, 0.7)" 
            stroke="rgba(0,0,0,0.1)" 
            strokeWidth={1}
            shadowBlur={5}
            shadowOpacity={0.1}
          />
          <Text
            text={hex.number.toString()}
            fontSize={12}
            fontStyle="900"
            fill={hex.number === 6 || hex.number === 8 ? '#E74C3C' : '#1a1a1a'}
            offsetX={hex.number > 9 ? 7 : 3.5}
            offsetY={6}
            fontFamily="Inter"
          />
          <ProbabilityDots value={hex.number} />
        </Group>
      )}
    </Group>
  );
}

function ProbabilityDots({ value }: { value: number }) {
  const dots = value === 2 || value === 12 ? 1 : 
               value === 3 || value === 11 ? 2 :
               value === 4 || value === 10 ? 3 :
               value === 5 || value === 9 ? 4 :
               value === 6 || value === 8 ? 5 : 0;
  
  return (
    <Group y={8}>
      {Array.from({ length: dots }).map((_, i) => (
        <Circle 
          key={i} 
          x={(i - (dots - 1) / 2) * 3} 
          radius={1} 
          fill={value === 6 || value === 8 ? '#E74C3C' : '#000'} 
          opacity={0.8}
        />
      ))}
    </Group>
  );
}

function DiceFace({ value }: { value: number }) {
  return (
    <div className={`w-8 h-8 lg:w-14 lg:h-14 bg-white border border-black/10 rounded-lg lg:rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent" />
      <span className="text-xl lg:text-3xl font-serif font-black italic">{value}</span>
    </div>
  );
}

function StatusCard({ title, color, desc }: { title: string, color: string, desc: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-black/5 w-48 transition-transform hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-3 h-3 rounded-full ${color} shadow-lg`} />
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-[10px] opacity-40 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function CostCard({ label, cost }: { label: string, cost: Record<string, number> }) {
  return (
    <div className="p-4 rounded-2xl bg-stone-50 border border-black/5">
      <h4 className="font-black text-[10px] uppercase tracking-widest mb-3 opacity-40">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {Object.entries(cost).map(([res, amt]) => (
          <div key={res} className="flex flex-col items-center gap-0.5 bg-white px-2 py-1 rounded-lg border border-black/5 shadow-sm min-w-[32px]">
            <span className="text-[12px] leading-none">{RESOURCE_EMOJIS[res as ResourceType]}</span>
            <span className="text-[9px] font-bold">{amt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscardPanel({ player, amount, onDiscard, onChange }: { player: any, amount: number, onDiscard: (res: any) => void, onChange?: (res: any) => void }) {
  const [selected, setSelected] = useState<Record<ResourceType, number>>({
    [ResourceType.Lumber]: 0,
    [ResourceType.Brick]: 0,
    [ResourceType.Wool]: 0,
    [ResourceType.Grain]: 0,
    [ResourceType.Ore]: 0,
  });

  const totalSelected = Object.values(selected).reduce((a, b) => a + b, 0);
  const remaining = amount - totalSelected;

  const handleIncrement = (res: ResourceType) => {
    if (totalSelected < amount && player.resources[res] > selected[res]) {
      const newVal = { ...selected, [res]: selected[res] + 1 };
      setSelected(newVal);
      onChange?.(newVal);
    }
  };

  const handleDecrement = (res: ResourceType) => {
    if (selected[res] > 0) {
      const newVal = { ...selected, [res]: selected[res] - 1 };
      setSelected(newVal);
      onChange?.(newVal);
    }
  };

  return (
    <div className="flex flex-col gap-1 lg:gap-2 bg-red-50 p-2 lg:p-4 rounded-[1.2rem] lg:rounded-[1.5rem] border border-red-100 shadow-inner">
      <div className="space-y-1 lg:space-y-1.5">
        {Object.values(ResourceType).map(res => {
          const count = player.resources[res];
          if (count === 0) return null;
          return (
            <div key={res} className="flex items-center justify-between p-1.5 lg:p-2.5 bg-white rounded-lg lg:rounded-xl shadow-sm border border-black/[0.03]">
              <div className="flex items-center gap-1.5 lg:gap-2">
                <span className="text-sm lg:text-base leading-none">{RESOURCE_EMOJIS[res as ResourceType]}</span>
                <span className="font-bold text-[10px] lg:text-xs text-slate-700">{RESOURCE_NAMES[res as ResourceType]}</span>
                <span className="text-[9px] lg:text-[10px] text-slate-400 font-medium">({count})</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <button 
                  onClick={() => handleDecrement(res)}
                  disabled={selected[res] === 0}
                  className="w-5 h-5 lg:w-7 lg:h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-20 transition-all text-[10px] lg:text-xs font-black"
                >
                  -
                </button>
                <span className="font-mono font-black w-3 lg:w-4 text-center text-[10px] lg:text-sm text-slate-800">{selected[res]}</span>
                <button 
                  onClick={() => handleIncrement(res)}
                  disabled={totalSelected >= amount || selected[res] >= count}
                  className="w-5 h-5 lg:w-7 lg:h-7 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-40 transition-all text-[10px] lg:text-xs font-black shadow-md shadow-black/10"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => onDiscard(selected)}
        disabled={remaining !== 0}
        className="w-full mt-1 lg:mt-2 py-3 lg:py-4 bg-red-400 text-white rounded-xl lg:rounded-2xl text-[11px] lg:text-[13px] font-black uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:opacity-60 transition-all active:scale-95 flex items-center justify-center gap-1.5 lg:gap-2"
      >
        确认弃牌
      </button>
    </div>
  );
}

