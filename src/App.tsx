import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Stage, Layer, RegularPolygon, Text, Group, Circle, Line, Path, Image, Rect } from 'react-konva';
import { useCatanGame, getHexesForEdge, getHexesForVertex } from './useCatanGame';
import { HexType, ResourceType, DevCardType, MapType } from './types';
import { HEX_RESOURCES, RESOURCE_NAMES, HEX_NAMES, RESOURCE_COLORS, PLAYER_COLORS, COSTS } from './constants';
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
  Trash2
} from 'lucide-react';
import { ResourceSelector } from './components/ResourceSelector';
import { GoldSelectionPanel } from './components/GoldSelectionPanel';

import { FOREST_IMG, FIELDS_IMG, PASTURE_IMG, Desert_IMG, Mountains_IMG } from './images';

const HEX_RADIUS = 40;
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_HEIGHT = 2 * HEX_RADIUS;

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
    <Group x={cx} y={cy} rotation={rotation}>
      {/* Pier / Dock lines */}
      <Line
        points={[-4, 0, -4, -distance]}
        stroke="#8B5A2B"
        strokeWidth={3}
      />
      <Line
        points={[4, 0, 4, -distance]}
        stroke="#8B5A2B"
        strokeWidth={3}
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

import { DevCard } from './components/DevCard';
import { socketService, RoomState } from './services/socketService';

export default function App() {
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
    stealResource,
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
      socketService.resetGame(roomId);
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
      const isSelfReset = roomState?.hostId === socketService.playerId;

      // 1. Clear local game state first to prevent re-sync
      syncGameState(null as any);
      
      // 2. Clear room state
      setRoomState(null);
      
      // 3. Reset UI flags
      setGameStarted(false);
      setShowGameOver(false);
      setHasResolvedGameOver(false);
      setIsJoinedLobby(false); // Force back to room search screen
      
      // 4. Remove room param from URL
      window.history.replaceState({}, '', window.location.pathname);
      
      if (!isSelfReset) {
        alert('房间已被房主解散。');
      }
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
  const [showLeftPanel, setShowLeftPanel] = useState(!isMobile);
  const [showRightPanel, setShowRightPanel] = useState(!isMobile);

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
    setHasManuallyInteracted(true);
    const stage = stageRef.current;
    if (!stage) return;

    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      setHasManuallyInteracted(true);
      if (stage.isDragging()) {
        stage.stopDrag();
      }

      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      if (!lastCenter.current) {
        lastCenter.current = getCenter(p1, p2);
        return;
      }

      const newCenter = getCenter(p1, p2);
      const dist = getDistance(p1, p2);

      if (!lastDist.current) {
        lastDist.current = dist;
      }

      const pointTo = {
        x: (newCenter.x - stage.x()) / stage.scaleX(),
        y: (newCenter.y - stage.y()) / stage.scaleX(),
      };

      const newScale = stage.scaleX() * (dist / lastDist.current);
      if (newScale < 0.1 || newScale > 5) return;

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: newCenter.x - pointTo.x * newScale,
        y: newCenter.y - pointTo.y * newScale,
      };

      stage.position(newPos);
      lastDist.current = dist;
      lastCenter.current = newCenter;
      stage.batchDraw();
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
    lastCenter.current = null;
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
  const [showDebug, setShowDebug] = useState(false);
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
      setShowDebug(prev => !prev);
      logoClickCountRef.current = 0;
      logoStartTimeRef.current = 0;
    }
  }, []);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showDissolveRoomConfirm, setShowDissolveRoomConfirm] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
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
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      
      // Auto toggle panels based on size
      if (width < 1024) {
        setShowLeftPanel(false);
        setShowRightPanel(false);
      } else {
        setShowLeftPanel(true);
        setShowRightPanel(true);
      }
      
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
          stealResource(targets[0].id);
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
  }, [gameState, activePlayerId, vertices, edges, checkIsValidVertex, checkIsValidEdge, buildSettlement, buildRoad, buildShip, upgradeToCity, rollDice, nextTurn, discardCards, moveRobber, movePirate, stealResource, selectGoldResource, resolveYearOfPlenty, resolveMonopoly, playDevCard, tradeWithBank, buyDevCard, canAfford, roomState?.hostId]);

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
    if (!roomState) return;
    if (roomState.hostId !== socketService.playerId) return; 
    
    const allReady = roomState.players.every(p => p.isReady);
    if (!allReady) {
      alert("请等待所有玩家点击'准备'后再开始游戏");
      return;
    }

    const totalBotCount = roomState.settings?.botConfig?.filter(b => b).length || 0;
    const totalPlayersCount = roomState.players.length + totalBotCount;
    const requiredPlayers = roomState.settings?.playerCount || 4;
    
    if (totalPlayersCount !== requiredPlayers) {
        alert(`游戏需要配置刚好 ${requiredPlayers} 名玩家（包含真实玩家和机器人）`);
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
      socketService.startGame(roomState.roomId, initialStateWithRolls);
    }
  };

  const isHostInLobby = roomState?.hostId === socketService.playerId;

  if (!isJoinedLobby) {
    return (
      <div className="flex flex-col h-screen w-full bg-slate-50 font-sans items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-200 max-w-md w-full text-center z-10 relative">
          <div className="w-24 h-24 mx-auto mb-6 bg-indigo-50 rounded-3xl flex items-center justify-center" onClick={handleLogoClick}>
            <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/C3eURTs - Imgur.png')}`} alt="Catan Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-serif font-black italic mb-2 text-slate-800">CATAN</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-black mb-8">Professional Online Edition</p>
          
          <div className="flex flex-col gap-5 text-left">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">你的昵称</label>
              <input 
                type="text" 
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl outline-none font-bold text-center mb-1 transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">房间代码</label>
              <input 
                type="text" 
                value={inputRoomId}
                onChange={e => setInputRoomId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl outline-none font-bold font-mono tracking-[0.2em] text-center transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            
            <button 
              onClick={handleJoinRoom}
              className="w-full bg-indigo-600 text-white py-4.5 rounded-2xl font-black uppercase tracking-[0.15em] hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.98] transition-all mt-4 shadow-lg shadow-indigo-100"
            >
              进入大厅
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 font-sans overflow-hidden relative selection:bg-indigo-600 selection:text-white">
        {/* Decorative Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(79,70,229,0.05)_0%,_transparent_60%)] pointer-events-none" />
        
        {/* Left Side: Branding & Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 flex flex-col p-8 lg:p-20 relative z-10"
        >
          {/* Header & Logo */}
          <div className="flex items-center gap-8 mb-10 px-4" onClick={handleLogoClick}>
            <div className="w-20 h-20 lg:w-28 lg:h-28 bg-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-100 border border-slate-100 relative">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-50 to-transparent rounded-b-[2rem] opacity-50" />
              <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/C3eURTs - Imgur.png')}`} alt="Catan Logo" className="w-14 h-14 lg:w-16 lg:h-16 object-contain relative z-10 drop-shadow-xl" />
            </div>
            <div>
              <h1 className="text-5xl lg:text-7xl font-serif font-black italic tracking-tighter text-slate-900 leading-none drop-shadow-sm">CATAN</h1>
              <p className="text-[10px] lg:text-xs uppercase tracking-[0.5em] text-slate-400 font-bold mt-3">航海家版 · SEAFARERS</p>
            </div>
          </div>

          <div className="w-full max-w-lg space-y-8 px-4">
            {/* Map Settings */}
            <div className={!isHostInLobby ? 'opacity-50 pointer-events-none' : ''}>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">地图选择</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'standard', label: '标准大陆', icon: '🌍' },
                  { id: 'archipelago', label: '群岛世界', icon: '🏝️' }
                ].map(map => (
                  <button
                    key={map.id}
                    onClick={() => { setMapType(map.id as MapType); syncSettings({ mapType: map.id }); }}
                    className={`flex flex-col items-center gap-3 p-6 rounded-[2.5rem] transition-all duration-300 border ${mapType === map.id ? 'bg-white border-indigo-500 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-500/10' : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-600'}`}
                  >
                    <div className="text-3xl">{map.icon}</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{map.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-2">
              {!roomState?.players.find(p => p.id === socketService.playerId)?.isReady ? (
                <button 
                  onClick={handleToggleReady}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2.5xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
                >
                  <Play size={18} fill="currentColor" />
                  准备开始
                </button>
              ) : (
                <button 
                  onClick={handleToggleReady}
                  className="w-full bg-slate-100 text-slate-500 py-5 rounded-2.5xl font-black uppercase tracking-[0.2em] border border-slate-200 hover:bg-slate-200 transition-all flex items-center justify-center gap-4 text-sm"
                >
                  <X size={18} />
                  取消准备
                </button>
              )}

              {isHostInLobby && (
                <button 
                  onClick={handleStartGame}
                  disabled={!roomState?.players.every(p => p.isReady) || !roomState || (roomState.players.length + (roomState.settings?.botConfig?.filter(b => b).length || 0)) !== roomState.settings?.playerCount}
                  className="w-full bg-slate-900 text-white py-5 rounded-2.5xl font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale text-sm"
                >
                  {roomState?.players.every(p => p.isReady) ? '开启游戏' : '等待全员准备'}
                </button>
              )}

              <div className="pt-1">
                <button 
                  onClick={() => {
                    if (confirm('确定要离开房间吗？')) {
                      if (roomState) socketService.leaveRoom(roomState.roomId);
                      setIsJoinedLobby(false);
                      setRoomState(null);
                      window.history.replaceState({}, '', window.location.pathname);
                    }
                  }}
                  className="w-full py-2 text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] hover:text-red-500 transition-colors"
                >
                  离开房间
                </button>
              </div>
            </div>
          </div>

          
          <div className="flex-1" />
        </motion.div>


        {/* Right Side: Online Status & Room Info */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full h-full flex flex-col p-8 lg:p-12 xl:p-16 bg-white/50 backdrop-blur-3xl border-l border-slate-200 z-20 lg:w-[480px] shrink-0"
        >
          <div className="flex flex-col gap-8 w-full max-w-sm mx-auto h-full">
            
            {/* Room Info Section (Moved Back) */}
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black font-serif italic text-slate-800">在线玩家</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm shadow-emerald-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{roomState?.players.length || 0} / {playerCount}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">房间代码</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-slate-800">{roomState?.roomId || inputRoomId}</span>
                        <button 
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('room', roomState?.roomId || inputRoomId);
                            navigator.clipboard.writeText(url.toString());
                            alert('已复制邀请链接');
                          }}
                          className="hover:bg-slate-100 p-1 rounded-md transition-colors"
                        >
                          <Copy size={12} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">游戏人数</span>
                      <div className="relative inline-block">
                        <select 
                          value={playerCount} 
                          onChange={e => {
                            const newCount = Number(e.target.value);
                            setPlayerCount(newCount);
                            syncSettings({ playerCount: newCount });
                          }}
                          disabled={!isHostInLobby}
                          className="text-sm font-bold text-slate-800 outline-none disabled:opacity-50 appearance-none cursor-pointer pr-4"
                        >
                          {[2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num} 人</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-40" />
                      </div>
                    </div>
                  </div>
              </div>
            </div>

            {/* Players List */}
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 no-scrollbar">
              {roomState?.players.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-indigo-100 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                      <User size={18} className="text-slate-400" />
                      {roomState.hostId === p.id && (
                        <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 border-2 border-white text-white p-1 rounded-full text-[6px]" title="房主">👑</div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-sm block leading-none text-slate-700">{p.name}</span>
                      {p.id === socketService.playerId && <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 mt-1 block">这是你</span>}
                    </div>
                  </div>
                  {p.isReady ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <Check size={10} className="text-emerald-600" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">已就绪</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">准备中</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Bot slots */}
              {Array.from({ length: Math.max(0, playerCount - (roomState?.players.length || 0)) }).map((_, i) => {
                const globalIndex = (roomState?.players.length || 0) + i;
                return (
                  <div key={`empty-${i}`} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${botConfig[globalIndex] ? 'bg-white border-indigo-100 shadow-sm' : 'border-dashed border-slate-200 opacity-40 hover:opacity-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${botConfig[globalIndex] ? 'bg-slate-50' : 'border border-dashed border-slate-200'}`}>
                        {botConfig[globalIndex] ? <Bot size={18} className="text-indigo-600" /> : <Users size={18} className="text-slate-200" />}
                      </div>
                      <span className={`text-xs font-bold transition-colors ${botConfig[globalIndex] ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}`}>{botConfig[globalIndex] ? '中级 AI' : '待加入...'}</span>
                    </div>
                    {isHostInLobby && (
                      <button 
                        onClick={() => {
                          const newConfig = [...botConfig];
                          newConfig[globalIndex] = !newConfig[globalIndex];
                          setBotConfig(newConfig);
                          syncSettings({ botConfig: newConfig });
                        }}
                        className="text-[9px] font-black uppercase tracking-[0.1em] text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                      >
                        {botConfig[globalIndex] ? '移除' : '配置 AI'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex-1" />
            <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] pt-4">
              等待全员就位后由房主开启游戏
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!gameState) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <h1 className="text-6xl font-serif italic mb-4">Catan</h1>
        <div className="w-12 h-1 bg-white/20 mx-auto mb-8" />
        <p className="text-sm uppercase tracking-[0.3em] opacity-50">正在初始化世界...</p>
      </motion.div>
    </div>
  );

  const actingPlayer = gameState?.players[activePlayerId];
  const settlementsCount = gameState.settlements.filter(s => s.playerId === activePlayerId).length;
  const roadsCount = gameState.roads.filter(r => r.playerId === activePlayerId).length;
  const shipsCount = gameState.ships.filter(s => s.playerId === activePlayerId).length;
  const totalRoadsAndShips = roadsCount + shipsCount;
  
  const canTrade = gameState?.phase === 'main' && gameState.hasRolled && !gameState.hasBuiltThisTurn && isMyHumanTurn;
  const canPlayDevCard = gameState?.phase === 'main' && gameState.hasRolled && isMyHumanTurn;

  const sidebarWidth = 280;
  const leftOffset = showLeftPanel && !isMobile ? sidebarWidth : 0;
  const rightOffset = showRightPanel && !isMobile ? sidebarWidth : 0;
  const headerHeight = isMobile ? 64 : 80;
  const stageWidth = windowSize.width - leftOffset - rightOffset;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f5f2ed] text-[#1a1a1a] overflow-hidden font-sans selection:bg-black selection:text-white relative">
      {/* Mobile Sidebar Toggles */}
      {isMobile && gameStarted && (
        <>
          <button 
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className="fixed bottom-24 left-4 z-[60] w-12 h-12 bg-white rounded-full shadow-lg border border-black/5 flex items-center justify-center text-stone-600"
          >
            <Users size={20} />
          </button>
          <button 
            onClick={() => setShowRightPanel(!showRightPanel)}
            className="fixed bottom-24 right-4 z-[60] w-12 h-12 bg-white rounded-full shadow-lg border border-black/5 flex items-center justify-center text-stone-600"
          >
            <Hammer size={20} />
          </button>
        </>
      )}

      {/* Floating Waiting Banner (Bottom Left of Map) */}
      {!amIActivePlayer && (
        <div className="fixed bottom-6 left-6 z-[100] pointer-events-none lg:left-[calc(320px+1.5rem)]">
          <motion.div 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-black/80 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md border border-white/10"
          >
            <div className="w-3 h-3 rounded-full border-2 border-white/20 border-r-white animate-spin" />
            <span className="font-bold text-[10px] uppercase tracking-[0.15em] text-white/90">
              等待 {gameState.players[activePlayerId]?.name} ...
            </span>
          </motion.div>
        </div>
      )}
      <header className="w-full flex items-center bg-white border-b border-black/5 px-4 z-50 overflow-hidden" style={{ height: headerHeight }}>
        {/* Left: Logo */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0 cursor-default lg:absolute lg:left-8" onClick={handleLogoClick}>
          <div className="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center">
            <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/C3eURTs - Imgur.png')}`} alt="Catan Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm lg:text-xl font-serif font-black tracking-tight leading-none uppercase">CATAN</h1>
            <p className="text-[6px] lg:text-[8px] uppercase tracking-[0.2em] opacity-40 font-bold mt-0.5">SEAFARERS</p>
          </div>
        </div>

        {/* Center: Player Cards */}
        <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar py-2 px-2 lg:ml-48 lg:mr-48">
          <div className="flex items-center gap-2 lg:gap-8">
            {gameState.players.map((p, i) => {
            const isCurrent = i === activePlayerId;
            const resourceCount = Object.values(p.resources).reduce((a, b) => a + b, 0);
            const devCardCount = p.devCards.length + (p.devCardsBoughtThisTurn?.length || 0);
            const totalCards = resourceCount + devCardCount;
            const publicScore = (p.settlements * 1) + (p.cities * 2) + p.victoryPoints;
            return (
              <div 
                key={p.id} 
                className={`relative shrink-0 group flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 rounded-full transition-all duration-500 ${isCurrent ? 'bg-indigo-50 border border-indigo-100 shadow-sm scale-105' : 'opacity-60 hover:opacity-100'}`}>
                <div 
                  onClick={() => {
                    if (p.sessionId === socketService.playerId) {
                      toggleBot(p.id);
                    }
                  }}
                  className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 border-white ring-1 ring-black/10 flex items-center justify-center shrink-0 transition-transform ${p.sessionId === socketService.playerId ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                  style={{ backgroundColor: p.color }}
                  title={p.sessionId === socketService.playerId ? (p.isBot ? "点击接管" : "点击托管") : `${p.name} (${p.isBot ? '机器人' : '玩家'})`}
                >
                  {p.isBot ? (
                    <Bot size={8} color={p.color === '#F1C40F' ? '#000' : '#FFF'} />
                  ) : (
                    <User size={8} color={p.color === '#F1C40F' ? '#000' : '#FFF'} />
                  )}
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] lg:text-xs font-bold leading-none truncate max-w-[60px] lg:max-w-none">{p.name}</span>
                      {gameState.longestRoadPlayerId === p.id && <span title={`最长道路 (${p.longestRoadLength})`} className="text-[8px] lg:text-[10px]">🛤️</span>}
                      {gameState.largestArmyPlayerId === p.id && <span title={`最大骑士 (${p.knightsPlayed})`} className="text-[8px] lg:text-[10px]">⚔️</span>}
                      {(gameState.phase === 'initial_dice_roll' || gameState.phase === 'setup') && gameState.initialDiceRolls[p.id]?.length > 0 && (
                        <span className="text-[9px] font-mono ml-1 text-orange-600 font-bold bg-orange-100 px-1 rounded flex items-center gap-0.5">
                          🎲 {gameState.initialDiceRolls[p.id].join(' → ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] lg:text-[11px] font-bold opacity-80" title="公开分数">{publicScore}分</span>
                      <span className="text-[10px] opacity-20">|</span>
                      <span className="flex items-center gap-0.5 text-[9px] lg:text-[11px] font-mono opacity-80" title="资源卡">
                        <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/nVgige5 - Imgur.png')}`} alt="res" className="w-2.5 h-2.5 lg:w-3 lg:h-3 object-contain" />
                        {resourceCount}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <span className="text-[10px] opacity-20 mx-0.5">|</span>
                        <span className="flex items-center gap-0.5 text-[9px] lg:text-[11px] font-mono opacity-80" title="发展卡">
                          <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/xgqjQo7 - Imgur.png')}`} alt="dev" className="w-2.5 h-2.5 lg:w-3 lg:h-3 object-contain" />
                          {devCardCount}
                        </span>
                        <span className="text-[10px] opacity-20 mx-0.5">|</span>
                        <span className="flex items-center gap-0.5 text-[9px] lg:text-[11px] font-mono opacity-80" title="道路">
                          <img src={`/api/proxy-image?url=${encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/TdfNSeV - Imgur.png')}`} alt="road" className="w-2.5 h-2.5 lg:w-3 lg:h-3 object-contain" />
                          {p.longestRoadLength}
                        </span>
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
              initial={isMobile ? { x: -sidebarWidth } : { width: 0 }}
              animate={isMobile ? { x: 0 } : { width: sidebarWidth }}
              exit={isMobile ? { x: -sidebarWidth } : { width: 0 }}
              className={`border-r border-black/5 p-4 lg:p-5 flex flex-col gap-6 bg-white/95 backdrop-blur-md overflow-y-auto overflow-x-hidden shrink-0 z-50 ${isMobile ? `fixed inset-y-0 left-0 shadow-2xl w-full max-w-[${sidebarWidth}px]` : `relative w-[${sidebarWidth}px]`}`}
            >
              {isMobile && (
                <button 
                  onClick={() => setShowLeftPanel(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full"
                >
                  <X size={20} />
                </button>
              )}
              <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30">银行库存</h3>
            </div>
            <div className="grid grid-cols-3 grid-rows-2 gap-2">
              {Object.entries(gameState.bankResources).map(([res, count]) => (
                <div key={res} className="flex items-center justify-between p-2 rounded-xl bg-stone-100/50 border border-black">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RESOURCE_COLORS[res as ResourceType] }} />
                  <span className="text-[10px] font-mono font-bold opacity-60">{count}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-2 rounded-xl bg-red-600 shadow-sm text-white">
                <span className="text-[10px] font-black">发</span>
                <span className="text-[10px] font-mono font-bold">{gameState.bankDevCards.length}</span>
              </div>
            </div>
          </section>

          <section className="pt-6 border-t border-black/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30">
                {gameState.phase === 'discard' && gameState.pendingDiscards[0]?.playerId === myPlayerIndex ? '弃牌阶段' : '你的资源'}
              </h3>
              <Info size={14} className="opacity-20" />
            </div>
            {gameState.phase === 'discard' && gameState.pendingDiscards[0]?.playerId === myPlayerIndex ? (
              <DiscardPanel 
                key={myPlayerIndex} 
                player={me} 
                amount={gameState.pendingDiscards[0].amount} 
                onDiscard={(res) => discardCards(myPlayerIndex, res)} 
              />
            ) : gameState.phase === 'year_of_plenty' && amIActivePlayer ? (
              <div>
                <ResourceSelector 
                  title="选择第一张资源"
                  selected={tradeGive}
                  onSelect={setTradeGive}
                />
                <div className="h-2" />
                <ResourceSelector 
                  title="选择第二张资源"
                  selected={tradeReceive}
                  onSelect={setTradeReceive}
                />
                <div className="h-2" />
                <div className="flex gap-2">
                  <button 
                    onClick={cancelDevCard}
                    className="w-full bg-stone-200 text-black py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-stone-300 transition-all"
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
                    className="w-full bg-black text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    确认领取
                  </button>
                </div>
              </div>
            ) : gameState.phase === 'monopoly' && amIActivePlayer ? (
              <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-center">选择垄断资源</h4>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Object.values(ResourceType).map(res => (
                    <button
                      key={`mono-${res}`}
                      onClick={() => setTradeGive(res)}
                      className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${tradeGive === res ? 'border-black bg-stone-50 scale-105 shadow-md' : 'border-black/5 hover:border-black/20 hover:bg-stone-50'}`}
                    >
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: RESOURCE_COLORS[res] }} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={cancelDevCard}
                    className="w-full bg-stone-200 text-black py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-stone-300 transition-all"
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
                    className="w-full bg-black text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    确认垄断
                  </button>
                </div>
              </div>
            ) : gameState.phase === 'gold_selection' && amIActivePlayer ? (
              <>
                <GoldSelectionPanel 
                  bankResources={gameState.bankResources}
                  amount={gameState.pendingGoldRewards[0].amount}
                  onSelect={selectGoldResource}
                />
                <div className="h-4" />
                <div className="grid grid-cols-1 gap-2 opacity-60">
                  {Object.entries(me.resources).map(([res, count]) => (
                    <ResourceRow key={res} type={res as ResourceType} count={count} />
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(me.resources).map(([res, count]) => (
                  <ResourceRow key={res} type={res as ResourceType} count={count} />
                ))}
              </div>
            )}
          </section>

          <section className="pt-6 border-t border-black/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30">你的发展卡</h3>
            </div>
            <div className="space-y-4">
              {me.devCards.length === 0 && (!me.devCardsBoughtThisTurn || me.devCardsBoughtThisTurn.length === 0) && (!me.playedDevCards || me.playedDevCards.length === 0) ? (
                <p className="text-[10px] opacity-30 italic">暂无发展卡</p>
              ) : (
                <>
                  {/* Playable Cards */}
                  {me.devCards.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-40">可使用</h4>
                      {Object.values(DevCardType).map(type => {
                        const count = me.devCards.filter(c => c === type).length;
                        if (count === 0) return null;
                        
                        return (
                          <div key={`playable-${type}`} className="flex flex-col p-3 rounded-xl bg-white border border-black/5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-xs relative">
                                  {type === DevCardType.Knight ? '⚔️' : 
                                   type === DevCardType.VictoryPoint ? '🏆' :
                                   type === DevCardType.RoadBuilding ? '🛣️' :
                                   type === DevCardType.YearOfPlenty ? '🎁' : '💎'}
                                  {count > 1 && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                                      {count}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tight">
                                  {type === DevCardType.Knight ? '骑士' : 
                                   type === DevCardType.VictoryPoint ? '胜利点' :
                                   type === DevCardType.RoadBuilding ? '道路建设' :
                                   type === DevCardType.YearOfPlenty ? '丰收之年' : '垄断'}
                                </span>
                              </div>
                              {type !== DevCardType.VictoryPoint && (
                                <div className="flex items-center gap-2">
                                  {gameState.playingDevCard === type ? (
                                    <button 
                                      onClick={cancelDevCard}
                                      className="text-[8px] font-black uppercase tracking-widest bg-red-500 text-white px-3 py-1.5 rounded-full hover:bg-red-600 transition-all shadow-md active:scale-95"
                                    >
                                      取消
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => playDevCard(type)}
                                      disabled={!canPlayDevCard || gameState.hasPlayedDevCardThisTurn}
                                      className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      使用
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-[9px] opacity-40 leading-tight">
                              {type === DevCardType.Knight ? '移动强盗并从相邻玩家处偷取一张资源卡。' : 
                               type === DevCardType.VictoryPoint ? '直接获得 1 点胜利点。' :
                               type === DevCardType.RoadBuilding ? '免费建造 2 条道路。' :
                               type === DevCardType.YearOfPlenty ? '从银行免费领取任意 2 张资源卡。' : '选择一种资源，所有玩家必须交出该资源。'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bought This Turn */}
                  {me.devCardsBoughtThisTurn && me.devCardsBoughtThisTurn.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-40">本回合购买</h4>
                      {Object.values(DevCardType).map(type => {
                        const count = me.devCardsBoughtThisTurn.filter(c => c === type).length;
                        if (count === 0) return null;
                        
                        return (
                          <div key={`bought-${type}`} className="flex flex-col p-3 rounded-xl bg-stone-100 border border-black/5 shadow-sm opacity-60">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-xs relative">
                                  {type === DevCardType.Knight ? '⚔️' : 
                                   type === DevCardType.VictoryPoint ? '🏆' :
                                   type === DevCardType.RoadBuilding ? '🛣️' :
                                   type === DevCardType.YearOfPlenty ? '🎁' : '💎'}
                                  {count > 1 && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                                      {count}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tight">
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
                    <div className="space-y-2">
                      <h4 className="text-[9px] uppercase tracking-widest font-bold opacity-40">已使用</h4>
                      {Object.values(DevCardType).map(type => {
                        const count = me.playedDevCards.filter(c => c === type).length;
                        // Don't show the card if it's currently being played (handled in playable section)
                        if (count === 0 || (gameState.playingDevCard === type && count === 1)) return null;
                        
                        const displayCount = gameState.playingDevCard === type ? count - 1 : count;
                        if (displayCount === 0) return null;
                        
                        return (
                          <div key={`played-${type}`} className="flex flex-col p-3 rounded-xl bg-stone-100 border border-black/5 shadow-sm opacity-40 grayscale">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-xs relative">
                                  {type === DevCardType.Knight ? '⚔️' : 
                                   type === DevCardType.VictoryPoint ? '🏆' :
                                   type === DevCardType.RoadBuilding ? '🛣️' :
                                   type === DevCardType.YearOfPlenty ? '🎁' : '💎'}
                                  {displayCount > 1 && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                                      {displayCount}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tight line-through">
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
          
          {gameStarted && (
            <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
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
                className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-xl border border-black/5 text-stone-600 font-bold text-[11px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-stone-100 transition-all transform active:scale-95 group"
              >
                <LogOut size={14} className="group-hover:-translate-x-1 transition-transform scale-x-[-1]" />
                <span>中途离开</span>
              </button>

              {isHost && (
                <button 
                  onClick={() => setShowDissolveRoomConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-xl border border-black/5 text-red-500 font-bold text-[11px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-red-500 hover:text-white transition-all transform active:scale-95 group"
                >
                  <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                  <span>解散房间</span>
                </button>
              )}
            </div>
          )}

          {gameStarted && (
            <div className="absolute top-4 right-4 z-40">
              <button
                id="toggle-bot-button"
                onClick={() => toggleBot(myPlayerIndex)}
                className={`flex items-center gap-2 px-4 py-2.5 backdrop-blur-xl border border-black/5 font-bold text-[11px] uppercase tracking-widest rounded-2xl shadow-xl transition-all transform active:scale-95 ${me.isBot ? 'bg-indigo-500 text-white' : 'bg-white/90 text-stone-600'}`}
              >
                <Bot size={14} />
                <span>托管</span>
              </button>
            </div>
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
                      id={`edge-${edge.id}`}
                      points={[edge.x1, edge.y1, edge.x2, edge.y2]}
                      stroke={color !== 'transparent' ? color : ((effectiveBuildMode === 'road' || effectiveBuildMode === 'ship') && checkIsValidEdge(edge.id, effectiveBuildMode as any) ? 'rgba(0,0,0,0.3)' : 'transparent')}
                      strokeWidth={6}
                      hitStrokeWidth={20}
                      dash={ship ? [10, 5] : []}
                      lineCap="round"
                      onClick={() => handleEdgeClick(edge.id)}
                      onTap={() => handleEdgeClick(edge.id)}
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

                const handleMouseEnter = (e: any) => {
                  if (isValid || (settlement && effectiveBuildMode === 'city' && !settlement.isCity)) {
                    if (isMyHumanTurn) e.target.getStage().container().style.cursor = 'pointer';
                    e.target.to({ scaleX: 1.2, scaleY: 1.2, duration: 0.1 });
                  }
                };

                const handleMouseLeave = (e: any) => {
                  if (isValid || (settlement && effectiveBuildMode === 'city' && !settlement.isCity)) {
                    if (isMyHumanTurn) e.target.getStage().container().style.cursor = 'default';
                    e.target.to({ scaleX: 1, scaleY: 1, duration: 0.1 });
                  }
                };

                const handleClick = () => handleVertexClick(vertex.id, vertex.hexIds);

                return (
                  <Group key={vertex.id} id={`vertex-${vertex.id}`} x={vertex.x} y={vertex.y}>
                    {/* Invisible hit area for city upgrade */}
                    {settlement && !settlement.isCity && effectiveBuildMode === 'city' && (
                      <Path 
                        data="M-8 0 L0 -8 L8 0 L8 8 L-8 8 Z"
                        fill="transparent"
                        scaleX={1.5}
                        scaleY={1.5}
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
                            radius={15} // Increased hit area
                            fill="transparent"
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
                  className={`px-8 py-4 rounded-3xl shadow-xl border flex items-center gap-3 group transition-all ${
                    isMyHumanTurn 
                      ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-400" 
                      : "bg-stone-100 text-stone-400 cursor-not-allowed border-stone-200"
                  }`}
                >
                  <Dices size={24} className={isMyHumanTurn ? "animate-pulse" : ""} />
                  <span className="text-xl font-black tracking-widest uppercase">掷骰子</span>
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
                <div className="bg-white p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-black/5 flex items-center gap-6">
                  <div className="flex gap-3">
                    <DiceFace value={gameState.dice[0]} />
                    <DiceFace value={gameState.dice[1]} />
                  </div>
                  <div className="pr-2 text-left">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40">
                      点数
                    </p>
                    <p className="text-3xl font-serif font-black italic leading-none text-orange-500">
                      {gameState.dice[0] + gameState.dice[1]}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Panel */}
        <AnimatePresence>
          {showRightPanel && (
            <motion.aside 
              initial={isMobile ? { x: sidebarWidth } : { width: 0 }}
              animate={isMobile ? { x: 0 } : { width: sidebarWidth }}
              exit={isMobile ? { x: sidebarWidth } : { width: 0 }}
              className={`border-l border-black/5 p-4 lg:p-5 flex flex-col gap-6 bg-white/95 backdrop-blur-md overflow-y-auto overflow-x-hidden shrink-0 z-50 ${isMobile ? `fixed inset-y-0 right-0 shadow-2xl w-full max-w-[${sidebarWidth}px]` : `relative w-[${sidebarWidth}px]`}`}
            >
              {isMobile && (
                <button 
                  onClick={() => setShowRightPanel(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full"
                >
                  <X size={20} />
                </button>
              )}
              {gameState.phase === 'initial_dice_roll' && (
                <section className="bg-orange-600 text-white p-4 rounded-2xl shadow-xl">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-80 mb-2">初始掷骰决定顺序</h3>
                  <p className="text-sm font-bold">
                    等待 {gameState.players.find(p => p.id === activePlayerId)?.name} 掷骰子...
                  </p>
                </section>
              )}

              {gameState.phase === 'setup' && (
            <section className="bg-black text-white p-4 rounded-2xl shadow-xl">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 mb-2">初始阶段</h3>
              <p className="text-xs font-medium leading-relaxed">
                {gameState.players[gameState.currentPlayerIndex].name}，请放置一个村庄和一条道路。
                {gameState.setupStep >= gameState.players.length ? ' (第二轮：逆序放置)' : ' (第一轮：顺序放置)'}
              </p>
            </section>
          )}

          {gameState.phase === 'road_building' && isMyHumanTurn && (
            <section className="bg-amber-100 border border-amber-300 text-amber-900 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50 mb-1">道路建设</h3>
                <p className="text-xs font-bold">请放置免费道路 ({2 - (gameState.freeRoads || 0)}/2)</p>
              </div>
              <button 
                onClick={cancelDevCard}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all"
              >
                {gameState.freeRoads === 2 ? '取消此卡' : '结束建造'}
              </button>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30">建筑施工</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <BuildItem 
                id="build-road"
                icon={<Hammer size={16} />} 
                label="道路" 
                cost={COSTS.road} 
                active={buildMode === 'road'}
                disabled={!canBuild || (!canAfford(COSTS.road) && gameState?.phase !== 'setup' && gameState?.phase !== 'road_building') || (gameState?.phase === 'setup' && settlementsCount <= totalRoadsAndShips)}
                onClick={() => handleSetBuildMode(buildMode === 'road' ? null : 'road')} 
              />
              <BuildItem 
                id="build-ship"
                icon={<ShipIcon size={16} />} 
                label="船只" 
                cost={COSTS.ship} 
                active={buildMode === 'ship'}
                disabled={!canBuild || ((!canAfford(COSTS.ship) && gameState?.phase !== 'road_building') || gameState?.mapType === 'standard') || (gameState?.phase === 'setup' && settlementsCount <= totalRoadsAndShips)}
                onClick={() => handleSetBuildMode(buildMode === 'ship' ? null : 'ship')} 
              />
              <BuildItem 
                id="build-settlement"
                icon={<Home size={16} />} 
                label="村庄" 
                cost={COSTS.settlement} 
                active={buildMode === 'settlement'}
                disabled={!canBuild || (!canAfford(COSTS.settlement) && gameState?.phase !== 'setup') || (gameState?.phase === 'setup' && settlementsCount > totalRoadsAndShips)}
                onClick={() => handleSetBuildMode(buildMode === 'settlement' ? null : 'settlement')} 
              />
              <BuildItem 
                id="build-city"
                icon={<Trophy size={16} />} 
                label="城市" 
                cost={COSTS.city} 
                active={buildMode === 'city'}
                disabled={!canBuild || !canAfford(COSTS.city) || gameState?.phase === 'setup'}
                onClick={() => handleSetBuildMode(buildMode === 'city' ? null : 'city')} 
              />
              <BuildItem 
                id="buy-dev-card"
                icon={<BookOpen size={16} />} 
                label="发展卡" 
                cost={COSTS.devCard} 
                disabled={!canBuild || !canAfford(COSTS.devCard) || gameState?.phase === 'setup'}
                onClick={buyDevCard} 
              />
            </div>
          </section>

          {/* Removed duplicate development cards section here */}

          <section className="pt-4 mt-auto border-t border-black/5 space-y-2">
            <div className="flex gap-2">
              <button 
                id="trade-bank-button"
                onClick={() => setShowTradeModal(true)}
                disabled={!canTrade}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-black/5 hover:border-black/20 hover:shadow-xl transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Repeat size={16} className="opacity-40 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">系统交易</span>
              </button>
              <button 
                id="trade-player-button"
                onClick={openPlayerTradeModal}
                disabled={!canTrade}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-black/5 hover:border-black/20 hover:shadow-xl transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Users size={16} className="opacity-40" />
                <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">玩家交易</span>
              </button>
            </div>
            <div className="relative">
               <div className="relative group">
                <button 
                  id="end-turn-button"
                  onClick={nextTurn}
                  disabled={!isMyHumanTurn || (gameState?.phase === 'main' && !gameState.hasRolled) || gameState?.playingDevCard != null || (gameState?.phase === 'robber') || gameState?.phase === 'discard'}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-black text-white hover:bg-zinc-800 transition-all group disabled:opacity-30 disabled:cursor-not-allowed h-16"
                >
                  <ChevronRight size={18} className="opacity-40" />
                  <span className="text-xs font-bold uppercase tracking-widest">结束回合</span>
                </button>
              </div>
            </div>
          </section>
        </motion.aside>
      )}
    </AnimatePresence>
    </div>

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
              className="relative bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border border-black/5 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trash2 size={120} />
              </div>
              
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <Trash2 size={32} />
              </div>
              
              <h3 className="text-2xl font-black text-stone-800 mb-3">确定解散房间？</h3>
              <p className="text-stone-500 text-sm mb-10 leading-relaxed px-4">
                解散后所有玩家将被移出房间，<br />房间数据将永久删除且不可恢复。
              </p>
              
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => {
                    const roomId = roomState?.roomId || inputRoomId;
                    socketService.resetGame(roomId);
                    setShowDissolveRoomConfirm(false);
                  }}
                  className="w-full py-4.5 bg-red-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-[0.98]"
                >
                  确定解散
                </button>
                <button 
                  onClick={() => setShowDissolveRoomConfirm(false)}
                  className="w-full py-4.5 bg-stone-100 text-stone-600 font-bold text-sm uppercase tracking-widest rounded-2xl hover:bg-stone-200 transition-all active:scale-[0.98]"
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
                className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-white border border-stone-200 shadow-2xl rounded-3xl p-6 w-[90vw] max-w-[400px]"
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
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: RESOURCE_COLORS[r] }} />
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
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: RESOURCE_COLORS[r] }} />
                            <span className="text-xs font-bold px-1">{offer.request[r]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {isInitiator ? (
                   <div className="space-y-2">
                     {offer.acceptedBy.map(pid => {
                       const p = gameState.players.find(x => x.id === pid);
                       return (
                         <div key={`accept-${pid}`} className="flex items-center justify-between bg-green-50/50 p-2 rounded-xl">
                           <span className="text-sm font-bold text-green-700">{p?.name} 接受了</span>
                           <button onClick={() => finalizeTrade(offer.id, pid)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">
                             成交
                           </button>
                         </div>
                       );
                     })}
                     {offer.rejectedBy.map(pid => {
                       const p = gameState.players.find(x => x.id === pid);
                       return (
                         <div key={`reject-${pid}`} className="flex items-center justify-between bg-red-50/50 p-2 rounded-xl">
                           <span className="text-sm font-bold text-red-700">{p?.name} 拒绝了</span>
                         </div>
                       );
                     })}
                     {offer.acceptedBy.length === 0 && offer.rejectedBy.length === 0 && (
                       <p className="text-center text-xs font-medium text-stone-500 py-2">等待其他玩家回应...</p>
                     )}
                   </div>
                ) : (
                   <div className="flex gap-2">
                     <button onClick={() => reactToTrade(offer.id, myPlayerIndex, 'reject')} className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors">
                       拒绝
                     </button>
                     <button 
                       disabled={!Object.values(ResourceType).every(r => (me.resources[r] || 0) >= (offer.request[r] || 0))}
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
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-20 right-4 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-black/5 w-80 z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase tracking-widest text-xs">调试控制台</h3>
              <button onClick={() => setShowDebug(false)} className="p-2 hover:bg-black/5 rounded-full">
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
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: RESOURCE_COLORS[res] }} />
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm shadow-2xl z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">玩家交易</h2>
                  <p className="text-stone-500 font-medium">与其他玩家交换资源</p>
                </div>
                <button 
                  onClick={() => setShowPlayerTradeModal(false)}
                  className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">你送出 (Offer)</h3>
                  <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
                    {Object.values(ResourceType).map(r => (
                      <div key={`offer-${r}`} className="p-3 border rounded-xl flex flex-col items-center gap-2">
                        <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: RESOURCE_COLORS[r] }} />
                        <div className="flex items-center gap-2 mt-2">
                          <button 
                            disabled={(playerTradeOffer[r] || 0) <= 0}
                            onClick={() => setPlayerTradeOffer(prev => ({...prev, [r]: (prev[r] || 0) - 1}))}
                            className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center disabled:opacity-30"
                          >-</button>
                          <span className="font-bold">{playerTradeOffer[r] || 0}</span>
                          <button 
                            disabled={(playerTradeOffer[r] || 0) >= (me.resources[r] || 0)}
                            onClick={() => setPlayerTradeOffer(prev => ({...prev, [r]: (prev[r] || 0) + 1}))}
                            className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center disabled:opacity-30"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">你希望得到 (Request)</h3>
                  <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
                    {Object.values(ResourceType).map(r => (
                      <div key={`request-${r}`} className="p-3 border rounded-xl flex flex-col items-center gap-2">
                        <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: RESOURCE_COLORS[r] }} />
                        <div className="flex items-center gap-2 mt-2">
                          <button 
                            disabled={(playerTradeRequest[r] || 0) <= 0}
                            onClick={() => setPlayerTradeRequest(prev => ({...prev, [r]: (prev[r] || 0) - 1}))}
                            className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center disabled:opacity-30"
                          >-</button>
                          <span className="font-bold">{playerTradeRequest[r] || 0}</span>
                          <button 
                            onClick={() => setPlayerTradeRequest(prev => ({...prev, [r]: (prev[r] || 0) + 1}))}
                            className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">交易对象</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPlayerTradeTarget(null)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${playerTradeTarget === null ? 'bg-black text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                    >
                      所有人
                    </button>
                    {gameState?.players.filter(p => p.id !== me.id && !p.isBot).map(p => (
                      <button
                        key={`target-${p.id}`}
                        onClick={() => setPlayerTradeTarget(p.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${playerTradeTarget === p.id ? 'bg-black text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
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
                  className="w-full bg-black text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:bg-zinc-800"
                >
                  发起交易
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
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-black/5 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-serif font-black italic">海上贸易</h2>
                  <p className="text-xs opacity-40 uppercase tracking-widest mt-1">与银行进行 {currentTradeRatio}:1 资源交换</p>
                </div>
                <button onClick={() => setShowTradeModal(false)} className="p-4 rounded-full hover:bg-black/5 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-10 grid grid-cols-2 gap-10">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-black opacity-30 mb-6">支付 ({currentTradeRatio})</h4>
                  <div className="space-y-2">
                    {Object.values(ResourceType).map(r => (
                      <button 
                        key={r} 
                        onClick={() => setTradeGive(r)}
                        className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between ${tradeGive === r ? 'bg-black text-white border-black scale-[1.02] shadow-lg' : 'border-black/5 hover:bg-stone-50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: RESOURCE_COLORS[r] }} />
                          <span className="text-base font-bold">{RESOURCE_NAMES[r]}</span>
                        </div>
                        <span className={`text-sm font-mono ${tradeGive === r ? 'opacity-60' : 'opacity-40'}`}>x{me.resources[r]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-black opacity-30 mb-6">获得 (1)</h4>
                  <div className="space-y-2">
                    {Object.values(ResourceType).map(r => (
                      <button 
                        key={r} 
                        onClick={() => setTradeReceive(r)}
                        className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between ${tradeReceive === r ? 'bg-black text-white border-black scale-[1.02] shadow-lg' : 'border-black/5 hover:bg-stone-50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: RESOURCE_COLORS[r] }} />
                          <span className="text-base font-bold">{RESOURCE_NAMES[r]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-10 bg-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black uppercase tracking-widest opacity-40">交易次数:</span>
                  <div className="flex items-center gap-2 bg-white border border-black/5 rounded-full p-1">
                    <button 
                      onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 1))}
                      className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-black">{tradeQuantity}</span>
                    <button 
                      onClick={() => setTradeQuantity(Math.min(maxTradeQuantity, tradeQuantity + 1))}
                      className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                      disabled={tradeQuantity >= maxTradeQuantity}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] opacity-30 font-medium">最多可交易 {maxTradeQuantity} 次</span>
                </div>
                <button 
                  disabled={!tradeGive || !tradeReceive || tradeGive === tradeReceive || maxTradeQuantity < 1}
                  onClick={handleTrade}
                  className="bg-black text-white px-10 py-4 rounded-full font-black uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl active:scale-95"
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
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-black/5 max-w-md w-full text-center">
              <h3 className="text-2xl font-serif font-black italic mb-2">选择偷取对象</h3>
              <p className="text-xs opacity-40 uppercase tracking-widest mb-8">从相邻建筑的玩家手中随机抽取一张资源卡</p>
              <div className="grid grid-cols-1 gap-3">
                {gameState.pendingStealFrom.map(pid => (
                  <button
                    key={pid}
                    onClick={() => isMyHumanTurn && stealResource(pid)}
                    disabled={!isMyHumanTurn}
                    className={`flex items-center justify-between p-4 rounded-2xl border border-black/5 transition-all group ${
                      isMyHumanTurn 
                        ? "hover:bg-stone-50 cursor-pointer" 
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: gameState.players[pid].color }} />
                      <span className="font-black uppercase tracking-tight">{gameState.players[pid].name}</span>
                    </div>
                    {isMyHumanTurn && <ChevronRight size={18} className="opacity-20 group-hover:translate-x-1 transition-transform" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gold Selection Modal Removed */}

      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
      
      {/* Game Over Modal */}
      <AnimatePresence>
        {showGameOver && (
          <GameOverModal 
            gameState={gameState} 
            onReturnToLobby={handleReturnToLobby}
            onReturnToMap={handleReturnToMap}
          />
        )}
      </AnimatePresence>
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
            className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col"
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
            
            <div className="flex-1 overflow-y-auto p-12 space-y-12">
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

function ResourceRow({ type, count }: { type: ResourceType, count: number }) {
  const icons: any = {
    [ResourceType.Lumber]: '🌲',
    [ResourceType.Brick]: '🧱',
    [ResourceType.Wool]: '🐑',
    [ResourceType.Grain]: '🌾',
    [ResourceType.Ore]: '⛰️',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-black hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-inner transition-transform group-hover:scale-110"
          style={{ backgroundColor: RESOURCE_COLORS[type] + '20' }}
        >
          {icons[type]}
        </div>
        <span className="text-xs font-black uppercase tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">{RESOURCE_NAMES[type]}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-lg font-mono font-black">{count}</span>
      </div>
    </div>
  );
}

function BuildItem({ id, icon, label, cost, onClick, active, disabled }: { id?: string, icon: React.ReactNode, label: string, cost: Record<string, number>, onClick?: () => void, active?: boolean, disabled?: boolean }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all group ${active ? 'bg-black text-white border-black shadow-xl scale-[1.02]' : 'bg-white border-black/5 hover:border-black/20 hover:shadow-xl'} ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
          {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-tight">{label}</span>
      </div>
      <div className="flex gap-1">
        {Object.entries(cost).map(([res, amt]) => (
          <div key={res} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RESOURCE_COLORS[res as ResourceType] }} title={`${amt} ${RESOURCE_NAMES[res as ResourceType]}`} />
        ))}
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
        <Group>
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
    <div className="w-14 h-14 bg-white border-2 border-black/10 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent" />
      <span className="text-3xl font-serif font-black italic">{value}</span>
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
          <div key={res} className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-black/5 shadow-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RESOURCE_COLORS[res as ResourceType] }} />
            <span className="text-[9px] font-bold">{amt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscardPanel({ player, amount, onDiscard }: { player: any, amount: number, onDiscard: (res: any) => void }) {
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
      setSelected(prev => ({ ...prev, [res]: prev[res] + 1 }));
    }
  };

  const handleDecrement = (res: ResourceType) => {
    if (selected[res] > 0) {
      setSelected(prev => ({ ...prev, [res]: prev[res] - 1 }));
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
      <div className="text-center mb-2">
        <h4 className="text-red-600 font-black text-[10px] uppercase tracking-widest mb-1">强盗突袭！</h4>
        <p className="text-xs font-bold text-red-800">
          请弃掉 {amount} 张牌 (还需 {remaining} 张)
        </p>
      </div>
      
      {Object.values(ResourceType).map(res => {
        const count = player.resources[res];
        if (count === 0) return null;
        return (
          <div key={res} className="flex items-center justify-between p-2 bg-white rounded-xl border border-black/5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: RESOURCE_COLORS[res] }} />
              <span className="font-bold text-[10px]">{RESOURCE_NAMES[res]}</span>
              <span className="text-[10px] opacity-40">({count})</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleDecrement(res)}
                disabled={selected[res] === 0}
                className="w-5 h-5 rounded-full bg-stone-100 border border-black/10 flex items-center justify-center hover:bg-stone-200 disabled:opacity-30 transition-colors text-xs"
              >
                -
              </button>
              <span className="font-mono font-bold w-3 text-center text-[10px]">{selected[res]}</span>
              <button 
                onClick={() => handleIncrement(res)}
                disabled={totalSelected >= amount || selected[res] >= count}
                className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-30 transition-colors text-xs"
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      <button 
        onClick={() => onDiscard(selected)}
        disabled={remaining !== 0}
        className="w-full mt-2 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        确认弃牌
      </button>
    </div>
  );
}

