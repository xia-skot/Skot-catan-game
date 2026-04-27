import { useState, useCallback, useEffect } from 'react';
import { GameState, Hex, HexType, ResourceType, Player, DevCardType, MapType, Port, Settlement, Road, Ship, TradeOffer } from './types';
import { PLAYER_COLORS, COSTS } from './constants';

const HEX_SIZE = 50;

// Helper to find hexes adjacent to an edge
export function getHexesForEdge(board: any[], edgeId: string) {
  return board.filter(h => {
    const HEX_RADIUS = 40;
    const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
    const HEX_HEIGHT = 2 * HEX_RADIUS;
    const x = HEX_WIDTH * (h.q + h.r / 2);
    const y = HEX_HEIGHT * 0.75 * h.r;
    
    for (let i = 0; i < 6; i++) {
      const a1 = (Math.PI / 180) * (60 * i + 30);
      const a2 = (Math.PI / 180) * (60 * ((i + 1) % 6) + 30);
      const x1 = x + HEX_RADIUS * Math.cos(a1);
      const y1 = y + HEX_RADIUS * Math.sin(a1);
      const x2 = x + HEX_RADIUS * Math.cos(a2);
      const y2 = y + HEX_RADIUS * Math.sin(a2);
      const v1 = `${Math.round(x1)},${Math.round(y1)}`;
      const v2 = `${Math.round(x2)},${Math.round(y2)}`;
      const key = [v1, v2].sort().join('|');
      if (key === edgeId) return true;
    }
    return false;
  });
}

// Helper to find hexes adjacent to a vertex
export function getHexesForVertex(board: any[], vertexId: string) {
  return board.filter(h => {
    const HEX_RADIUS = 40;
    const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
    const HEX_HEIGHT = 2 * HEX_RADIUS;
    const x = HEX_WIDTH * (h.q + h.r / 2);
    const y = HEX_HEIGHT * 0.75 * h.r;
    
    for (let i = 0; i < 6; i++) {
      const angle_rad = (Math.PI / 180) * (60 * i + 30);
      const vx = x + HEX_RADIUS * Math.cos(angle_rad);
      const vy = y + HEX_RADIUS * Math.sin(angle_rad);
      const key = `${Math.round(vx)},${Math.round(vy)}`;
      if (key === vertexId) return true;
    }
    return false;
  });
}

export function calculateLongestRoad(playerId: number, roads: Road[], ships: Ship[], settlements: Settlement[]): number {
  const playerRoads = roads.filter(e => e.playerId === playerId).map(e => e.edgeId);
  const playerShips = ships.filter(e => e.playerId === playerId).map(e => e.edgeId);
  if (playerRoads.length === 0 && playerShips.length === 0) return 0;

  const opponentSettlements = new Set(settlements.filter(s => s.playerId !== playerId).map(s => s.vertexId));
  const playerSettlements = new Set(settlements.filter(s => s.playerId === playerId).map(s => s.vertexId));

  const allPlayerEdges = [
    ...playerRoads.map(e => ({ id: e, type: 'road' })),
    ...playerShips.map(e => ({ id: e, type: 'ship' }))
  ];

  const adj: Record<string, { id: string, type: string }[]> = {};
  for (const edge of allPlayerEdges) {
    const [v1, v2] = edge.id.split('|');
    if (!adj[v1]) adj[v1] = [];
    if (!adj[v2]) adj[v2] = [];
    adj[v1].push(edge);
    adj[v2].push(edge);
  }

  let maxLength = 0;

  function dfs(currentVertex: string, visitedEdges: Set<string>, currentLength: number, lastEdgeType: string | null) {
    if (currentLength > maxLength) {
      maxLength = currentLength;
    }

    if (opponentSettlements.has(currentVertex) && currentLength > 0) {
      return;
    }

    const edges = adj[currentVertex] || [];
    for (const edge of edges) {
      if (!visitedEdges.has(edge.id)) {
        // If switching between road and ship, must have player's settlement/city at currentVertex
        // User requested that they connect freely for longest road
        /*
        if (lastEdgeType !== null && lastEdgeType !== edge.type) {
          if (!playerSettlements.has(currentVertex)) {
            continue;
          }
        }
        */

        visitedEdges.add(edge.id);
        const [v1, v2] = edge.id.split('|');
        const nextVertex = v1 === currentVertex ? v2 : v1;
        dfs(nextVertex, visitedEdges, currentLength + 1, edge.type);
        visitedEdges.delete(edge.id);
      }
    }
  }

  for (const startVertex of Object.keys(adj)) {
    dfs(startVertex, new Set<string>(), 0, null);
  }

  return maxLength;
}

export function updateLongestRoad(players: Player[], roads: Road[], ships: Ship[], settlements: Settlement[], currentLongestRoadPlayerId: number | null) {
  let newLongestRoadPlayerId = currentLongestRoadPlayerId;
  let maxRoadLength = 0;
  
  const updatedPlayers = [...players];

  for (let i = 0; i < updatedPlayers.length; i++) {
    const length = calculateLongestRoad(updatedPlayers[i].id, roads, ships, settlements);
    updatedPlayers[i] = { ...updatedPlayers[i], longestRoadLength: length };
    if (length > maxRoadLength) {
      maxRoadLength = length;
    }
  }

  if (maxRoadLength >= 5) {
    if (currentLongestRoadPlayerId === null) {
      const candidate = updatedPlayers.find(p => p.longestRoadLength === maxRoadLength);
      if (candidate) {
        newLongestRoadPlayerId = candidate.id;
      }
    } else {
      const currentHolder = updatedPlayers[currentLongestRoadPlayerId];
      if (maxRoadLength > currentHolder.longestRoadLength) {
        const candidate = updatedPlayers.find(p => p.longestRoadLength === maxRoadLength);
        if (candidate) {
          newLongestRoadPlayerId = candidate.id;
        }
      } else if (currentHolder.longestRoadLength < 5) {
        const eligiblePlayers = updatedPlayers.filter(p => p.longestRoadLength >= 5);
        if (eligiblePlayers.length === 0) {
          newLongestRoadPlayerId = null;
        } else {
          const maxPlayers = eligiblePlayers.filter(p => p.longestRoadLength === maxRoadLength);
          if (maxPlayers.length === 1) {
            newLongestRoadPlayerId = maxPlayers[0].id;
          } else {
            newLongestRoadPlayerId = null;
          }
        }
      }
    }
  } else {
    newLongestRoadPlayerId = null;
  }

  // Adjust victory points
  if (newLongestRoadPlayerId !== currentLongestRoadPlayerId) {
    if (currentLongestRoadPlayerId !== null) {
      const oldPlayer = updatedPlayers.find(p => p.id === currentLongestRoadPlayerId);
      if (oldPlayer) {
        oldPlayer.victoryPoints -= 2;
      }
    }
    if (newLongestRoadPlayerId !== null) {
      const newPlayer = updatedPlayers.find(p => p.id === newLongestRoadPlayerId);
      if (newPlayer) {
        newPlayer.victoryPoints += 2;
      }
    }
  }

  return { players: updatedPlayers, longestRoadPlayerId: newLongestRoadPlayerId };
}

export function useCatanGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Helper to fill holes in the mainland
  const fillMainlandHoles = (shape: { q: number, r: number, category: string }[]) => {
    const gridMap = new Map<string, { q: number, r: number, category: string }>();
    shape.forEach(s => gridMap.set(`${s.q},${s.r}`, s));
    
    const visited = new Set<string>();
    const queue: { q: number, r: number }[] = [];
    
    // Start from all OuterSea or edge hexes
    shape.filter(s => s.category === 'OuterSea').forEach(s => {
      queue.push({ q: s.q, r: s.r });
      visited.add(`${s.q},${s.r}`);
    });
    
    const directions = [
      { q: 1, r: 0 }, { q: -1, r: 0 },
      { q: 0, r: 1 }, { q: 0, r: -1 },
      { q: 1, r: -1 }, { q: -1, r: 1 }
    ];
    
    while (queue.length > 0) {
      const { q, r } = queue.shift()!;
      
      for (const dir of directions) {
        const nq = q + dir.q;
        const nr = r + dir.r;
        const key = `${nq},${nr}`;
        const neighbor = gridMap.get(key);
        
        if (neighbor && !visited.has(key)) {
          if (neighbor.category !== 'Mainland' && neighbor.category !== 'Island') {
            visited.add(key);
            queue.push({ q: nq, r: nr });
          }
        }
      }
    }
    
    // Any InnerSea not visited is a hole
    shape.forEach(s => {
      if (s.category === 'InnerSea' && !visited.has(`${s.q},${s.r}`)) {
        s.category = 'Mainland';
      }
    });
  };

  const generateMapTopology = useCallback((mapType: MapType, playerCount: number) => {
    const isLarge = playerCount > 4;
    const radius = isLarge ? 3 : 2;
    const totalRadius = radius + 1;

    let shape: { q: number, r: number, category: 'Mainland' | 'Island' | 'InnerSea' | 'OuterSea' | 'Desert' | 'GoldCandidate' }[] = [];

    // 1. Generate Grid Shape
    if (mapType === 'archipelago') {
      const topEdge = playerCount <= 4 ? 5 : playerCount === 5 ? 6 : 7;
      const R = 3; 
      const S = topEdge - 4; 
      const qOffset = Math.floor(S / 2);

      for (let r = -R; r <= R; r++) {
        const qMin = Math.max(-R, -r - R);
        const qMax = Math.min(R + S, -r + R + S);
        for (let q = qMin; q <= qMax; q++) {
          shape.push({ q: q - qOffset, r, category: 'InnerSea' });
        }
      }
      
      const innerSet = new Set(shape.map(s => `${s.q},${s.r}`));
      const outerCandidates = new Set<string>();
      shape.forEach(s => {
        const neighbors = [
            {q: s.q+1, r: s.r}, {q: s.q-1, r: s.r},
            {q: s.q, r: s.r+1}, {q: s.q, r: s.r-1},
            {q: s.q+1, r: s.r-1}, {q: s.q-1, r: s.r+1}
        ];
        neighbors.forEach(n => {
            const key = `${n.q},${n.r}`;
            if (!innerSet.has(key)) {
                outerCandidates.add(key);
            }
        });
      });
      outerCandidates.forEach(k => {
          const [q, r] = k.split(',').map(Number);
          shape.push({ q, r, category: 'OuterSea' });
      });

    } else {
      for (let q = -totalRadius; q <= totalRadius; q++) {
        for (let r = -totalRadius; r <= totalRadius; r++) {
          if (Math.abs(q + r) <= totalRadius) {
            const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
            if (dist === totalRadius) {
              shape.push({ q, r, category: 'OuterSea' });
            } else {
              shape.push({ q, r, category: 'InnerSea' });
            }
          }
        }
      }
    }

    // 2. Generate Land Masses
    let goldCount = 0;
    let desertCount = 0;

    if (mapType === 'archipelago') {
        if (playerCount === 4) { goldCount = 2; desertCount = 3; }
        else if (playerCount === 6) { goldCount = 3; desertCount = 5; }
        else { goldCount = 2; desertCount = 3; } // 5 players
    } else {
        goldCount = isLarge ? 3 : 1;
        desertCount = isLarge ? 2 : 1;
    }
    
    const landLimit = mapType === 'archipelago' ? 0 : (isLarge ? 37 : 19); // landLimit unused in archipelago now
    const landHexes = new Map<string, {id: number, category: 'Mainland' | 'Island'}>();

    if (mapType === 'standard') {
        const innerHexes = shape.filter(s => s.category === 'InnerSea').sort(() => Math.random() - 0.5);
        for (let i = 0; i < landLimit && i < innerHexes.length; i++) {
            innerHexes[i].category = 'Mainland';
        }
        fillMainlandHoles(shape);
    } else {
        let minIslands = 2, maxIslands = 3, minIslandSize = 2, maxIslandSize = 4, minTotalIslandHexes = 8, maxTotalIslandHexes = 9;
        if (playerCount === 5) { minIslands = 3; maxIslands = 4; minIslandSize = 2; maxIslandSize = 4; minTotalIslandHexes = 10; maxTotalIslandHexes = 11; }
        if (playerCount === 6) { minIslands = 3; maxIslands = 5; minIslandSize = 3; maxIslandSize = 5; minTotalIslandHexes = 14; maxTotalIslandHexes = 15; }

        let numIslands = 0;
        let islandTargetSizes: number[] = [];
        let totalIslandHexes = 0;
        
        while (totalIslandHexes < minTotalIslandHexes || totalIslandHexes > maxTotalIslandHexes) {
            numIslands = Math.floor(Math.random() * (maxIslands - minIslands + 1)) + minIslands;
            islandTargetSizes = [];
            for (let i = 0; i < numIslands; i++) {
                islandTargetSizes.push(Math.floor(Math.random() * (maxIslandSize - minIslandSize + 1)) + minIslandSize);
            }
            totalIslandHexes = islandTargetSizes.reduce((a, b) => a + b, 0);
        }
        
        // Identify strictly edge candidates (InnerSea adjacent to OuterSea)
        const outerSeaSet = new Set(shape.filter(s => s.category === 'OuterSea').map(s => `${s.q},${s.r}`));
        const allInnerSea = shape.filter(s => s.category === 'InnerSea');
        const strictEdgeCandidates = allInnerSea.filter(s => {
            const neighbors = [
                {q: s.q+1, r: s.r}, {q: s.q-1, r: s.r},
                {q: s.q, r: s.r+1}, {q: s.q, r: s.r-1},
                {q: s.q+1, r: s.r-1}, {q: s.q-1, r: s.r+1}
            ];
            return neighbors.some(n => outerSeaSet.has(`${n.q},${n.r}`));
        });

        let islandsPlacedCount = 0;
        let retryCount = 0;
        const MAX_RETRIES = 100;

        // Retry loop for island placement
        while (islandsPlacedCount < numIslands && retryCount < MAX_RETRIES) {
            // Reset for this attempt
            landHexes.clear();
            islandsPlacedCount = 0;
            let islandIdCounter = 1;
            
            // Shuffle candidates for randomness
            const currentCandidates = [...strictEdgeCandidates].sort(() => Math.random() - 0.5);

            for (const targetSize of islandTargetSizes) {
                let seedFound = false;
                for (const seed of currentCandidates) {
                    const seedKey = `${seed.q},${seed.r}`;
                    if (landHexes.has(seedKey)) continue;

                    // Check distance from other islands
                    let isFarEnough = true;
                    for (const [key] of landHexes.entries()) {
                        const [lq, lr] = key.split(',').map(Number);
                        const dist = Math.max(Math.abs(seed.q - lq), Math.abs(seed.r - lr), Math.abs(seed.q + seed.r - (lq + lr)));
                        if (dist < 3) { 
                            isFarEnough = false;
                            break;
                        }
                    }

                    if (isFarEnough) {
                        const islandQueue = [seed];
                        const visitedInIsland = new Set([seedKey]);
                        
                        // Temporary map for this island to verify it can grow
                        const tempIslandHexes = new Map<string, {id: number, category: 'Mainland' | 'Island'}>();
                        tempIslandHexes.set(seedKey, {id: islandIdCounter, category: 'Island'});

                        while(islandQueue.length > 0 && visitedInIsland.size < targetSize) {
                            const current = islandQueue.shift()!;
                            const neighbors = [
                                {q: current.q+1, r: current.r}, {q: current.q-1, r: current.r},
                                {q: current.q, r: current.r+1}, {q: current.q, r: current.r-1},
                                {q: current.q+1, r: current.r-1}, {q: current.q-1, r: current.r+1}
                            ];
                            
                            // Prioritize neighbors that are also edge candidates to encourage growth along the rim
                            neighbors.sort((a, b) => {
                                const aIsEdge = outerSeaSet.has(`${a.q},${a.r}`) || strictEdgeCandidates.some(s => s.q === a.q && s.r === a.r);
                                const bIsEdge = outerSeaSet.has(`${b.q},${b.r}`) || strictEdgeCandidates.some(s => s.q === b.q && s.r === b.r);
                                if (aIsEdge && !bIsEdge) return -1;
                                if (!aIsEdge && bIsEdge) return 1;
                                return Math.random() - 0.5;
                            });

                            for (const n of neighbors) {
                                const nKey = `${n.q},${n.r}`;
                                const nHex = shape.find(s => s.q === n.q && s.r === n.r);
                                // Can grow into InnerSea that is not already occupied
                                if (nHex && nHex.category === 'InnerSea' && !landHexes.has(nKey) && !tempIslandHexes.has(nKey) && visitedInIsland.size < targetSize) {
                                    tempIslandHexes.set(nKey, {id: islandIdCounter, category: 'Island'});
                                    visitedInIsland.add(nKey);
                                    islandQueue.push(nHex);
                                }
                            }
                        }

                        // Only commit if we reached target size (or close to it, e.g. >= targetSize - 1)
                        // For strictness, let's require full size or at least min size
                        if (visitedInIsland.size >= minIslandSize) {
                            tempIslandHexes.forEach((val, key) => {
                                landHexes.set(key, val);
                                const [q, r] = key.split(',').map(Number);
                                const hex = shape.find(s => s.q === q && s.r === r);
                                if (hex) hex.category = 'Island';
                            });
                            islandIdCounter++;
                            islandsPlacedCount++;
                            seedFound = true;
                            break; 
                        }
                    }
                }
                if (!seedFound) {
                    // If we failed to place an island, break and retry the whole process
                    break;
                }
            }
            retryCount++;
        }
        
        // If we failed after retries, fallback (should be rare)
        if (islandsPlacedCount < numIslands) {
            console.warn("Failed to place all islands after retries");
        }

        // 2. Create Buffer Zone (Sea/Desert) & Place Deserts
        const bufferSet = new Set<string>();
        landHexes.forEach((val, key) => {
            if (val.category === 'Island') {
                const [q, r] = key.split(',').map(Number);
                const neighbors = [
                    {q: q+1, r: r}, {q: q-1, r: r},
                    {q: q, r: r+1}, {q: q, r: r-1},
                    {q: q+1, r: r-1}, {q: q-1, r: r+1}
                ];
                for (const n of neighbors) {
                    const nKey = `${n.q},${n.r}`;
                    const hex = shape.find(s => s.q === n.q && s.r === n.r);
                    // Only add to buffer if it's InnerSea and not already an Island
                    if (hex && hex.category === 'InnerSea' && !landHexes.has(nKey)) {
                        bufferSet.add(nKey);
                    }
                }
            }
        });

        // Place Deserts in Buffer (Cluster them)
        const bufferArray = Array.from(bufferSet);
        let desertsToPlace = desertCount;
        const desertHexes = new Set<string>();

        if (bufferArray.length > 0 && desertsToPlace > 0) {
            // Pick first random desert
            let currentKey = bufferArray[Math.floor(Math.random() * bufferArray.length)];
            desertHexes.add(currentKey);
            desertsToPlace--;

            while (desertsToPlace > 0) {
                // Try to find a buffer neighbor of existing deserts
                const candidates = new Set<string>();
                desertHexes.forEach(k => {
                    const [q, r] = k.split(',').map(Number);
                    const neighbors = [
                        {q: q+1, r: r}, {q: q-1, r: r},
                        {q: q, r: r+1}, {q: q, r: r-1},
                        {q: q+1, r: r-1}, {q: q-1, r: r+1}
                    ];
                    for (const n of neighbors) {
                        const nKey = `${n.q},${n.r}`;
                        if (bufferSet.has(nKey) && !desertHexes.has(nKey)) {
                            candidates.add(nKey);
                        }
                    }
                });

                if (candidates.size > 0) {
                    const arr = Array.from(candidates);
                    currentKey = arr[Math.floor(Math.random() * arr.length)];
                    desertHexes.add(currentKey);
                    desertsToPlace--;
                } else {
                    // No adjacent buffer found, pick random remaining buffer
                    const remaining = bufferArray.filter(k => !desertHexes.has(k));
                    if (remaining.length === 0) break;
                    currentKey = remaining[Math.floor(Math.random() * remaining.length)];
                    desertHexes.add(currentKey);
                    desertsToPlace--;
                }
            }
        }

        // Apply Desert category
        desertHexes.forEach(k => {
            const [q, r] = k.split(',').map(Number);
            const hex = shape.find(s => s.q === q && s.r === r);
            if (hex) hex.category = 'Desert';
        });

        // 3. Fill Mainland (All remaining InnerSea that are not in buffer)
        shape.forEach(s => {
            const key = `${s.q},${s.r}`;
            if (s.category === 'InnerSea' && !bufferSet.has(key)) {
                s.category = 'Mainland';
                landHexes.set(key, {id: 0, category: 'Mainland'});
            }
        });

        // 4. Clean up isolated mainland hexes (islands that shouldn't exist)
        // Find the largest connected component of Mainland and remove everything else
        const mainlandKeys = Array.from(landHexes.entries())
            .filter(([k, v]) => v.category === 'Mainland')
            .map(([k]) => k);
        
        if (mainlandKeys.length > 0) {
            const visited = new Set<string>();
            let largestComponent: string[] = [];

            for (const key of mainlandKeys) {
                if (visited.has(key)) continue;
                
                const component: string[] = [];
                const queue = [key];
                visited.add(key);
                
                while (queue.length > 0) {
                    const curr = queue.shift()!;
                    component.push(curr);
                    const [q, r] = curr.split(',').map(Number);
                    const neighbors = [
                        {q: q+1, r: r}, {q: q-1, r: r},
                        {q: q, r: r+1}, {q: q, r: r-1},
                        {q: q+1, r: r-1}, {q: q-1, r: r+1}
                    ];
                    
                    for (const n of neighbors) {
                        const nKey = `${n.q},${n.r}`;
                        if (landHexes.has(nKey) && landHexes.get(nKey)!.category === 'Mainland' && !visited.has(nKey)) {
                            visited.add(nKey);
                            queue.push(nKey);
                        }
                    }
                }
                
                if (component.length > largestComponent.length) {
                    largestComponent = component;
                }
            }
            
            // Remove small components
            const largestSet = new Set(largestComponent);
            mainlandKeys.forEach(key => {
                if (!largestSet.has(key)) {
                    const [q, r] = key.split(',').map(Number);
                    const hex = shape.find(s => s.q === q && s.r === r);
                    if (hex) {
                        hex.category = 'InnerSea'; // Turn back to sea
                        landHexes.delete(key);
                    }
                }
            });
        }
    }

    const hexes: Hex[] = shape.map(s => {
        const landInfo = landHexes.get(`${s.q},${s.r}`);
        return {
            id: `${s.q},${s.r}`,
            q: s.q,
            r: s.r,
            type: s.category === 'Desert' ? HexType.Desert : HexType.Sea, 
            number: null,
            isMainland: s.category === 'Mainland' || s.category === 'GoldCandidate' || (s.category === 'Desert' && !shape.some(x => x.category === 'Island' && Math.max(Math.abs(x.q-s.q), Math.abs(x.r-s.r)) < 2)), 
            isIsland: s.category === 'Island',
            isOuterSea: s.category === 'OuterSea',
            _category: s.category,
            isStartingLand: false,
            islandId: landInfo ? landInfo.id : undefined
        } as any;
    });
    
    hexes.forEach(h => {
        if (h.type === HexType.Desert) {
            const neighbors = hexes.filter(n => Math.max(Math.abs(n.q - h.q), Math.abs(n.r - h.r), Math.abs((n.q + n.r) - (h.q + h.r))) === 1);
            if (neighbors.some(n => n.isMainland)) h.isMainland = true;
            if (neighbors.some(n => n.isIsland)) h.isIsland = true;
        }
    });

    // Calculate isStartingLand
    const unvisited = new Set(hexes.filter(h => h._category === 'Mainland').map(h => `${h.q},${h.r}`));
    let largestComponent: string[] = [];
    
    while (unvisited.size > 0) {
        const start = Array.from(unvisited)[0];
        const comp: string[] = [];
        const queue = [start];
        unvisited.delete(start);
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            comp.push(current);
            const [q, r] = current.split(',').map(Number);
            const neighbors = [
                {q: q+1, r: r}, {q: q-1, r: r},
                {q: q, r: r+1}, {q: q, r: r-1},
                {q: q+1, r: r-1}, {q: q-1, r: r+1}
            ];
            for (const n of neighbors) {
                const key = `${n.q},${n.r}`;
                if (unvisited.has(key)) {
                    unvisited.delete(key);
                    queue.push(key);
                }
            }
        }
        if (comp.length > largestComponent.length) {
            largestComponent = comp;
        }
    }
    
    const startingLandSet = new Set(largestComponent);
    hexes.forEach(h => {
        if (startingLandSet.has(`${h.q},${h.r}`)) {
            h.isStartingLand = true;
        }
    });

    return hexes;
  }, []);

  const distributeResources = useCallback((hexes: Hex[], mapType: MapType, playerCount: number) => {
      const newHexes = hexes.map(h => ({...h}));
      
      let landCounts: Partial<Record<HexType, number>> = {};
      let goldCount = 0;
      
      if (mapType === 'archipelago') {
        goldCount = 2;
        let desertCount = 3; // Used only for reference in landCounts, actual deserts are already placed
        
        if (playerCount <= 4) { goldCount = 2; desertCount = 3; }
        else if (playerCount === 6) { goldCount = 3; desertCount = 5; }
        
        // Dynamically calculate available spots for resources
        // Filter hexes that are Land (Mainland or Island) AND NOT Desert (which are already fixed)
        const availableLandHexes = hexes.filter(h => (h.isMainland || h.isIsland) && h.type !== HexType.Desert);
        const resourceTotal = availableLandHexes.length - goldCount;
        
        const resourceTypes = [HexType.Forest, HexType.Hills, HexType.Pasture, HexType.Fields, HexType.Mountains];
        
        if (playerCount <= 4) {
             // For 2-4 players, we might want to stick to standard distribution if the map size is close to standard,
             // but since map size is dynamic, we should scale.
             // However, to ensure balance, let's try to keep the ratio or just fill dynamically.
             // Let's use the dynamic filling logic for all player counts in archipelago to be safe.
             const baseCount = Math.floor(resourceTotal / 5);
             const counts: Record<string, number> = {};
             resourceTypes.forEach(t => counts[t] = baseCount);
             let remaining = resourceTotal - (baseCount * 5);
             while (remaining > 0) {
                 const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
                 counts[type]++;
                 remaining--;
             }
             landCounts = {
                 [HexType.Forest]: counts[HexType.Forest], [HexType.Hills]: counts[HexType.Hills], [HexType.Pasture]: counts[HexType.Pasture],
                 [HexType.Fields]: counts[HexType.Fields], [HexType.Mountains]: counts[HexType.Mountains],
                 [HexType.Gold]: goldCount, [HexType.Desert]: desertCount
             };
        } else {
            const baseCount = Math.floor(resourceTotal / 5);
            const counts: Record<string, number> = {};
            resourceTypes.forEach(t => counts[t] = baseCount);
            let remaining = resourceTotal - (baseCount * 5);
            while (remaining > 0) {
                const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
                counts[type]++;
                remaining--;
            }
            landCounts = {
                [HexType.Forest]: counts[HexType.Forest], [HexType.Hills]: counts[HexType.Hills], [HexType.Pasture]: counts[HexType.Pasture],
                [HexType.Fields]: counts[HexType.Fields], [HexType.Mountains]: counts[HexType.Mountains],
                [HexType.Gold]: goldCount, [HexType.Desert]: desertCount
            };
        }
      } else {
         const isLarge = playerCount > 4;
         landCounts = isLarge 
          ? { [HexType.Forest]: 8, [HexType.Hills]: 6, [HexType.Pasture]: 8, [HexType.Fields]: 8, [HexType.Mountains]: 6, [HexType.Gold]: 0, [HexType.Desert]: 1 }
          : { [HexType.Forest]: 4, [HexType.Hills]: 3, [HexType.Pasture]: 4, [HexType.Fields]: 4, [HexType.Mountains]: 3, [HexType.Gold]: 0, [HexType.Desert]: 1 };
      }

      const resourcePool: HexType[] = [];
      for (const [type, count] of Object.entries(landCounts)) {
          if (type === HexType.Desert || type === HexType.Gold) continue;
          for (let i = 0; i < (count as number); i++) resourcePool.push(type as HexType);
      }
      resourcePool.sort(() => Math.random() - 0.5);

      const landHexes = newHexes.filter(h => (h.isMainland || h.isIsland) && h.type !== HexType.Desert);
      
      // Distribute Gold Mines across different islands if possible
      const islandHexes = landHexes.filter(h => h.isIsland);
      const mainlandHexes = landHexes.filter(h => h.isMainland);
      
      // Group islands by ID
      const islandsById = new Map<number, Hex[]>();
      islandHexes.forEach(h => {
          if (h.islandId) {
              if (!islandsById.has(h.islandId)) islandsById.set(h.islandId, []);
              islandsById.get(h.islandId)!.push(h);
          }
      });

      const islandIds = Array.from(islandsById.keys()).sort(() => Math.random() - 0.5);
      let goldPlaced = 0;

      // First pass: one gold per island
      for (const id of islandIds) {
          if (goldPlaced >= goldCount) break;
          const hexesOnIsland = islandsById.get(id)!;
          // Filter out hexes that are already gold (though in first pass none should be)
          const candidates = hexesOnIsland.filter(h => h.type !== HexType.Gold && h.type !== HexType.Desert);
          if (candidates.length > 0) {
              const randomHex = candidates[Math.floor(Math.random() * candidates.length)];
              randomHex.type = HexType.Gold;
              goldPlaced++;
          }
      }

      // Second pass: fill remaining gold on random islands ONLY (never mainland)
      while (goldPlaced < goldCount) {
          const remainingCandidates = islandHexes.filter(h => h.type !== HexType.Gold && h.type !== HexType.Desert);
          if (remainingCandidates.length === 0) break;
          const randomHex = remainingCandidates[Math.floor(Math.random() * remainingCandidates.length)];
          randomHex.type = HexType.Gold;
          goldPlaced++;
      }
      
      const remainingLand = landHexes.filter(h => h.type !== HexType.Gold);
      
      // Improved resource distribution to prevent clustering
      // We process hexes one by one, trying to pick a resource that doesn't match neighbors
      const shuffledLand = remainingLand.sort(() => Math.random() - 0.5);
      
      for (const hex of shuffledLand) {
          // Identify neighbors that already have a resource assigned
          const neighbors = newHexes.filter(n => 
              n !== hex && 
              n.type !== HexType.Sea && 
              n.type !== HexType.Desert && 
              n.type !== HexType.Gold &&
              // Check if resource is already assigned (not default Sea/Desert/Gold)
              // Note: In our logic, unassigned hexes are Sea by default until assigned here, 
              // but we are iterating through 'remainingLand' which are the target hexes.
              // However, 'newHexes' contains all hexes. We need to check if a neighbor 
              // is part of 'remainingLand' AND has already been processed (assigned a type from pool).
              // Since we haven't assigned yet, we need a way to track assigned status.
              // Actually, we can just look at the current type. 
              // But wait, 'remainingLand' hexes currently have their type set to whatever they were initialized with (likely Sea or previous type).
              // We need to be careful.
              // Let's use a temporary assignment map or just modify in place and check against the pool.
              true
          );

          // Actually, a better approach:
          // 1. Get neighbors of current hex.
          // 2. See what resources they have (if they have been assigned a valid resource type).
          // 3. Try to pick a resource from 'resourcePool' that is NOT in that set.
          
          const neighborTypes = new Set<HexType>();
          const adjacentHexes = newHexes.filter(n => {
              const dq = Math.abs(n.q - hex.q);
              const dr = Math.abs(n.r - hex.r);
              const ds = Math.abs((n.q + n.r) - (hex.q + hex.r));
              return Math.max(dq, dr, ds) === 1;
          });
          
          adjacentHexes.forEach(n => {
              // Only consider neighbors that are part of the resource distribution (not Sea/Desert/Gold)
              // And have already been assigned a valid resource type from the pool
              if (n.type !== HexType.Sea && n.type !== HexType.Desert && n.type !== HexType.Gold && 
                  // Check if this neighbor has been assigned a resource from our pool types
                  [HexType.Forest, HexType.Hills, HexType.Pasture, HexType.Fields, HexType.Mountains].includes(n.type)) {
                  neighborTypes.add(n.type);
              }
          });

          // Try to find a resource in the pool that is not in neighborTypes
          const candidateIndex = resourcePool.findIndex(r => !neighborTypes.has(r));
          
          if (candidateIndex !== -1) {
              // Found a non-conflicting resource
              hex.type = resourcePool.splice(candidateIndex, 1)[0];
          } else {
              // No non-conflicting resource found (or pool only has conflicting ones), just take the first one
              hex.type = resourcePool.pop() || HexType.Sea;
          }
      }

      const baseNumbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
      let numbers: number[] = [];
      const resourceHexes = newHexes.filter(h => h.type !== HexType.Sea && h.type !== HexType.Desert);
      while (numbers.length < resourceHexes.length) numbers.push(...baseNumbers);
      numbers = numbers.slice(0, resourceHexes.length).sort(() => Math.random() - 0.5);

      const isRed = (n: number) => n === 6 || n === 8;
      const areAdjacent = (h1: Hex, h2: Hex) => {
          const dq = Math.abs(h1.q - h2.q);
          const dr = Math.abs(h1.r - h2.r);
          const ds = Math.abs((h1.q + h1.r) - (h2.q + h2.r));
          return Math.max(dq, dr, ds) === 1;
      };

      const getNum = (hex: Hex) => {
          if (hex.type === HexType.Desert || hex.type === HexType.Sea) return null;
          for (let i = 0; i < numbers.length; i++) {
              const n = numbers[i];
              if (isRed(n)) {
                  const hasRedNeighbor = newHexes.some(other => other.number !== null && isRed(other.number) && areAdjacent(hex, other));
                  if (hasRedNeighbor) continue;
              }
              return numbers.splice(i, 1)[0];
          }
          const nonRedIdx = numbers.findIndex(n => !isRed(n));
          if (nonRedIdx !== -1) return numbers.splice(nonRedIdx, 1)[0];
          return numbers.splice(0, 1)[0] || null;
      };
      
      const hexesNeedingNumbers = newHexes.filter(h => h.type !== HexType.Sea && h.type !== HexType.Desert);
      hexesNeedingNumbers.sort(() => Math.random() - 0.5);
      hexesNeedingNumbers.forEach(h => h.number = getNum(h));

      // Post-processing: Check for adjacent red numbers and fix them
      let conflictFound = true;
      let iterations = 0;
      while (conflictFound && iterations < 100) {
          conflictFound = false;
          iterations++;
          const redHexes = hexesNeedingNumbers.filter(h => h.number !== null && isRed(h.number));
          
          for (const rHex of redHexes) {
              const redNeighbors = redHexes.filter(other => other !== rHex && areAdjacent(rHex, other));
              if (redNeighbors.length > 0) {
                  conflictFound = true;
                  // Swap with a non-red number that is far away
                  const candidates = hexesNeedingNumbers.filter(h => 
                      h.number !== null && !isRed(h.number) && 
                      !areAdjacent(h, rHex) && // Not adjacent to current red hex
                      !redNeighbors.some(rn => areAdjacent(h, rn)) // Not adjacent to the conflicting neighbor
                  );
                  
                  if (candidates.length > 0) {
                      const swapTarget = candidates[Math.floor(Math.random() * candidates.length)];
                      // Verify swap is safe for the target location too (target shouldn't become adjacent to another red)
                      const targetNeighbors = hexesNeedingNumbers.filter(n => n !== swapTarget && areAdjacent(swapTarget, n));
                      const targetHasRedNeighbor = targetNeighbors.some(n => n.number !== null && isRed(n.number) && n !== rHex); // Ignore rHex as it will move away
                      
                      if (!targetHasRedNeighbor) {
                          const temp = rHex.number;
                          rHex.number = swapTarget.number;
                          swapTarget.number = temp;
                          break; // Restart check after swap
                      }
                  }
              }
          }
      }

      if (mapType === 'archipelago') {
          const goldHexes = newHexes.filter(h => h.type === HexType.Gold && h.number !== null);
          const validGoldNumbers = [2, 3, 4, 10, 11, 12];
          goldHexes.forEach(gHex => {
              if (gHex.number && !validGoldNumbers.includes(gHex.number)) {
                  const candidate = newHexes.find(h => h.type !== HexType.Gold && h.type !== HexType.Desert && h.type !== HexType.Sea && h.number !== null && validGoldNumbers.includes(h.number));
                  if (candidate && candidate.number) {
                      const temp = gHex.number;
                      gHex.number = candidate.number;
                      candidate.number = temp;
                  }
              }
          });
      }
      
      return newHexes;
  }, []);

  const generateEdgesAndVertices = (hexes: Hex[]) => {
    const vertices = new Map<string, any>();
    const edges = new Map<string, any>();
    const HEX_RADIUS = 40;
    const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
    const HEX_HEIGHT = 2 * HEX_RADIUS;

    hexes.forEach(hex => {
      const x = HEX_WIDTH * (hex.q + hex.r / 2);
      const y = HEX_HEIGHT * 0.75 * hex.r;

      for (let i = 0; i < 6; i++) {
        const angle_rad = (Math.PI / 180) * (60 * i + 30);
        const vx = x + HEX_RADIUS * Math.cos(angle_rad);
        const vy = y + HEX_RADIUS * Math.sin(angle_rad);
        const vKey = `${Math.round(vx)},${Math.round(vy)}`;
        if (!vertices.has(vKey)) {
          vertices.set(vKey, { id: vKey, x: vx, y: vy, hexIds: [hex.id] });
        } else {
          vertices.get(vKey).hexIds.push(hex.id);
        }

        const angle2_rad = (Math.PI / 180) * (60 * ((i + 1) % 6) + 30);
        const vx2 = x + HEX_RADIUS * Math.cos(angle2_rad);
        const vy2 = y + HEX_RADIUS * Math.sin(angle2_rad);
        const vKey2 = `${Math.round(vx2)},${Math.round(vy2)}`;

        const edgeKey = [vKey, vKey2].sort().join('|');
        if (!edges.has(edgeKey)) {
          edges.set(edgeKey, { id: edgeKey, v1: vKey, v2: vKey2, x1: vx, y1: vy, x2: vx2, y2: vy2 });
        }
      }
    });

    return { edges: Array.from(edges.values()), vertices: Array.from(vertices.values()) };
  };

  const generateBoard = useCallback((mapType: MapType = 'standard', playerCount: number = 4) => {
    const topology = generateMapTopology(mapType, playerCount);
    const hexes = distributeResources(topology, mapType, playerCount);
    const { edges, vertices } = generateEdgesAndVertices(hexes);
    return { hexes, edges, vertices };
  }, [generateMapTopology, distributeResources, generateEdgesAndVertices]);



  const initGame = useCallback((playerCount: number, mapType: MapType = 'standard', customBoard?: Hex[], botConfig?: boolean[], connectedPlayers?: string[], playerNames?: string[]) => {
    const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: (playerNames && playerNames[i]) ? playerNames[i] : `玩家 ${i + 1}`,
      color: PLAYER_COLORS[i],
      isBot: botConfig ? botConfig[i] : false,
      sessionId: connectedPlayers ? connectedPlayers[i] : undefined,
      resources: {
        [ResourceType.Lumber]: 0,
        [ResourceType.Brick]: 0,
        [ResourceType.Wool]: 0,
        [ResourceType.Grain]: 0,
        [ResourceType.Ore]: 0,
      },
      victoryPoints: 0,
      roads: 0,
      ships: 0,
      settlements: 0,
      cities: 0,
      devCards: [],
      devCardsBoughtThisTurn: [],
      playedDevCards: [],
      knightsPlayed: 0,
      longestRoadLength: 0,
      vpCardsCount: 0,
      islandBonusPoints: 0,
    }));

    const { hexes, edges, vertices } = customBoard ? { hexes: customBoard, ...generateEdgesAndVertices(customBoard) } : generateBoard(mapType, playerCount);

    const desertHex = hexes.find(h => h.type === HexType.Desert);

    // Generate Ports
    const ports: Port[] = [];
    
    // 1. Identify Land Hexes
    const landHexes = hexes.filter(h => h.isMainland || h.isIsland);
    
    // 2. Count edge occurrences to find coastal edges
    const edgeCounts = new Map<string, number>();
    const edgeToVertexMap = new Map<string, [string, string]>();
    
    landHexes.forEach(hex => {
        const HEX_RADIUS = 40;
        const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
        const HEX_HEIGHT = 2 * HEX_RADIUS;
        const x = HEX_WIDTH * (hex.q + hex.r / 2);
        const y = HEX_HEIGHT * 0.75 * hex.r;
        
        for (let i = 0; i < 6; i++) {
            const a1 = (Math.PI / 180) * (60 * i + 30);
            const a2 = (Math.PI / 180) * (60 * ((i + 1) % 6) + 30);
            const x1 = x + HEX_RADIUS * Math.cos(a1);
            const y1 = y + HEX_RADIUS * Math.sin(a1);
            const x2 = x + HEX_RADIUS * Math.cos(a2);
            const y2 = y + HEX_RADIUS * Math.sin(a2);
            const v1 = `${Math.round(x1)},${Math.round(y1)}`;
            const v2 = `${Math.round(x2)},${Math.round(y2)}`;
            const edgeKey = [v1, v2].sort().join('|');
            
            edgeCounts.set(edgeKey, (edgeCounts.get(edgeKey) || 0) + 1);
            edgeToVertexMap.set(edgeKey, [v1, v2]);
        }
    });

    // 3. Filter Coastal Edges (count === 1)
    // Only consider edges that are not shared between two land hexes
    let coastalEdges = Array.from(edgeCounts.entries())
        .filter(([_, count]) => count === 1)
        .map(([key, _]) => key);
        
    // 4. Shuffle edges for random placement
    coastalEdges.sort(() => Math.random() - 0.5);
    
    // 5. Determine Port Types
    const numPorts = playerCount <= 4 ? 9 : 11;
    
    const portTypes: (ResourceType | '3:1')[] = [];
    
    if (numPorts === 9) {
        portTypes.push('3:1', '3:1', '3:1', '3:1');
        portTypes.push(ResourceType.Lumber, ResourceType.Brick, ResourceType.Wool, ResourceType.Grain, ResourceType.Ore);
    } else {
        portTypes.push('3:1', '3:1', '3:1', '3:1', '3:1');
        portTypes.push(ResourceType.Lumber, ResourceType.Brick, ResourceType.Wool, ResourceType.Wool, ResourceType.Grain, ResourceType.Ore);
    }
    
    // Shuffle types
    portTypes.sort(() => Math.random() - 0.5);
    
    // 6. Place Ports
    const occupiedVertices = new Set<string>();
    
    for (const type of portTypes) {
        // Find an edge that doesn't conflict (ensure spacing)
        const edgeIndex = coastalEdges.findIndex(edge => {
            const [v1, v2] = edgeToVertexMap.get(edge)!;
            return !occupiedVertices.has(v1) && !occupiedVertices.has(v2);
        });
        
        if (edgeIndex !== -1) {
            const edge = coastalEdges[edgeIndex];
            const [v1, v2] = edgeToVertexMap.get(edge)!;
            
            ports.push({
                edgeId: edge,
                type: type,
                vertexIds: [v1, v2]
            });
            
            // Mark vertices as occupied to prevent adjacent ports
            occupiedVertices.add(v1);
            occupiedVertices.add(v2);
            
            // Remove used edge
            coastalEdges.splice(edgeIndex, 1);
        }
    }

    const devCards: DevCardType[] = [
      ...Array(14).fill(DevCardType.Knight),
      ...Array(5).fill(DevCardType.VictoryPoint),
      ...Array(2).fill(DevCardType.RoadBuilding),
      ...Array(2).fill(DevCardType.YearOfPlenty),
      ...Array(2).fill(DevCardType.Monopoly),
    ].sort(() => Math.random() - 0.5);

    const state: GameState = {
      board: hexes,
      ports,
      players,
      currentPlayerIndex: 0,
      dice: [0, 0],
      robberHexId: desertHex?.id || '0,0',
      pirateHexId: hexes.find(h => h.type === HexType.Sea)?.id || null,
      settlements: [],
      roads: [],
      ships: [],
      phase: 'initial_dice_roll',
      initialDiceRolls: {},
      initialRollQueue: players.map((_, i) => i),
      setupStep: 0,
      hasRolled: false,
      hasBuiltThisTurn: false,
      hasPlayedDevCardThisTurn: false,
      longestRoadPlayerId: null,
      largestArmyPlayerId: null,
      winnerId: null,
      bankResources: {
        [ResourceType.Lumber]: 24,
        [ResourceType.Brick]: 24,
        [ResourceType.Wool]: 24,
        [ResourceType.Grain]: 24,
        [ResourceType.Ore]: 24,
      },
      bankDevCards: devCards,
      mapType,
      pendingStealFrom: [],
      pendingGoldRewards: [],
      pendingDiscards: [],
      tradeOffers: [],
    };

    setGameState(state);
    return state;
  }, [generateBoard]);

  const resolveInitialRoll = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.phase !== 'initial_dice_roll' || !prev.hasRolled) return prev;

      const currentId = prev.players[prev.currentPlayerIndex].id;
      const rollSum = prev.dice[0] + prev.dice[1];
      
      const playerHistory = prev.initialDiceRolls[currentId] || [];
      const newHistory = [...playerHistory, rollSum];
      const newRolls = { ...prev.initialDiceRolls, [currentId]: newHistory };

      const queue = prev.initialRollQueue ? [...prev.initialRollQueue] : [];
      const queueIndex = queue.indexOf(currentId);
      if (queueIndex !== -1) queue.splice(queueIndex, 1);

      if (queue.length > 0) {
         return {
             ...prev,
             initialDiceRolls: newRolls,
             initialRollQueue: queue,
             currentPlayerIndex: prev.players.findIndex(p => p.id === queue[0]),
             hasRolled: false,
             dice: [0, 0]
         };
      }

      const playersByHistory = prev.players.map(p => ({ id: p.id, history: newRolls[p.id] || [] }));

      playersByHistory.sort((a, b) => {
          const minLen = Math.min(a.history.length, b.history.length);
          for (let i = 0; i < minLen; i++) {
              if (b.history[i] !== a.history[i]) {
                  return b.history[i] - a.history[i];
              }
          }
          return b.history.length - a.history.length;
      });

      const ties = new Set<number>();
      for (let i = 0; i < playersByHistory.length - 1; i++) {
          const a = playersByHistory[i];
          const b = playersByHistory[i+1];
          if (a.history.length === b.history.length) {
              let isTie = true;
              for (let j = 0; j < a.history.length; j++) {
                  if (a.history[j] !== b.history[j]) isTie = false;
              }
              if (isTie) {
                  ties.add(a.id);
                  ties.add(b.id);
              }
          }
      }

      if (ties.size > 0) {
          const newQueue = Array.from(ties);
          return {
              ...prev,
              initialDiceRolls: newRolls,
              initialRollQueue: newQueue,
              currentPlayerIndex: prev.players.findIndex(p => p.id === newQueue[0]),
              hasRolled: false,
              dice: [0, 0]
          };
      }

      const newPlayers = playersByHistory.map(ph => {
          return { ...prev.players.find(p => p.id === ph.id)! };
      });
      
      const newRollsKeysReassigned: Record<number, number[]> = {};
      newPlayers.forEach((p, idx) => {
          newRollsKeysReassigned[idx] = newRolls[p.id];
          p.id = idx;
      });

      return {
          ...prev,
          players: newPlayers,
          initialDiceRolls: newRollsKeysReassigned,
          initialRollQueue: [],
          phase: 'setup',
          currentPlayerIndex: 0,
          hasRolled: false,
          dice: [0, 0]
      };
    });
  }, []);

  const rollDice = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;

      if (prev.phase === 'initial_dice_roll') {
        if (prev.hasRolled) return prev;
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        return { ...prev, dice: [d1, d2], hasRolled: true };
      }

      if (prev.phase === 'setup' || prev.hasRolled) return prev;
      
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;

      const next = { ...prev, dice: [d1, d2] as [number, number], hasRolled: true };
      
      if (total === 7) {
        next.activeBuildMode = null;
        // Check for players with >= 7 cards
        const pendingDiscards: { playerId: number, amount: number }[] = [];
        next.players.forEach(p => {
          const totalCards = Object.values(p.resources).reduce((a, b) => a + b, 0);
          if (totalCards >= 7) {
            pendingDiscards.push({ playerId: p.id, amount: Math.floor(totalCards / 2) });
          }
        });

        if (pendingDiscards.length > 0) {
          next.phase = 'rolling_7';
          next.pendingDiscards = pendingDiscards;
        } else {
          next.phase = 'rolling_7';
        }
      } else {
        // Distribute resources
        const updatedPlayers = [...next.players];
        const updatedBank = { ...next.bankResources };
        const pendingGold: { playerId: number, amount: number }[] = [];

        next.board.forEach(hex => {
          if (hex.number === total && hex.id !== next.robberHexId && hex.id !== next.pirateHexId) {
            next.settlements.forEach(s => {
              if (s.hexIds.includes(hex.id)) {
                const amount = s.isCity ? 2 : 1;
                
                if (hex.type === HexType.Gold) {
                  pendingGold.push({ playerId: s.playerId, amount });
                } else {
                  const resourceMap: any = {
                    [HexType.Forest]: ResourceType.Lumber,
                    [HexType.Hills]: ResourceType.Brick,
                    [HexType.Pasture]: ResourceType.Wool,
                    [HexType.Fields]: ResourceType.Grain,
                    [HexType.Mountains]: ResourceType.Ore,
                  };
                  const resToGive = resourceMap[hex.type];
                  if (resToGive && updatedBank[resToGive] >= amount) {
                    updatedPlayers[s.playerId] = {
                      ...updatedPlayers[s.playerId],
                      resources: {
                        ...updatedPlayers[s.playerId].resources,
                        [resToGive]: updatedPlayers[s.playerId].resources[resToGive] + amount
                      }
                    };
                    updatedBank[resToGive] -= amount;
                  }
                }
              }
            });
          }
        });

        next.players = updatedPlayers;
        next.bankResources = updatedBank;
        
        if (pendingGold.length > 0) {
          next.phase = 'gold_selection';
          next.pendingGoldRewards = pendingGold;
        }
      }
      return next;
    });
  }, []);

  const discardCards = useCallback((playerId: number, resources: Record<ResourceType, number>) => {
    setGameState(prev => {
      if (!prev || prev.phase !== 'discard') return prev;
      
      const pendingIdx = prev.pendingDiscards.findIndex(p => p.playerId === playerId);
      if (pendingIdx === -1) return prev;
      
      const pending = prev.pendingDiscards[pendingIdx];
      const discardCount = Object.values(resources).reduce((a, b) => a + b, 0);
      
      if (discardCount !== pending.amount) return prev; // Must discard exact amount
      
      const updatedPlayers = [...prev.players];
      const player = { ...updatedPlayers[playerId], resources: { ...updatedPlayers[playerId].resources } };
      const updatedBank = { ...prev.bankResources };
      
      // Remove resources
      for (const [res, amt] of Object.entries(resources)) {
        if (player.resources[res as ResourceType] < amt) return prev; // Validation
        player.resources[res as ResourceType] -= amt;
        updatedBank[res as ResourceType] += amt;
      }
      
      updatedPlayers[playerId] = player;
      
      const nextPendingDiscards = [...prev.pendingDiscards];
      nextPendingDiscards.splice(pendingIdx, 1);
      
      let nextPhase: GameState['phase'] = prev.phase;
      if (nextPendingDiscards.length === 0) {
        nextPhase = 'robber';
      }
      
      return {
        ...prev,
        players: updatedPlayers,
        bankResources: updatedBank,
        pendingDiscards: nextPendingDiscards,
        phase: nextPhase
      };
    });
  }, []);

  const nextTurn = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.phase === 'setup' || prev.phase === 'finished') return prev;
      
      const updatedPlayers = [...prev.players];
      updatedPlayers[prev.currentPlayerIndex] = {
        ...updatedPlayers[prev.currentPlayerIndex],
        devCards: [...updatedPlayers[prev.currentPlayerIndex].devCards, ...(updatedPlayers[prev.currentPlayerIndex].devCardsBoughtThisTurn || [])],
        devCardsBoughtThisTurn: []
      };

      return {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        phase: 'main',
        hasRolled: false,
        hasBuiltThisTurn: false,
        hasPlayedDevCardThisTurn: false,
        activeBuildMode: null,
      };
    });
  }, []);

  const calculatePlayerScore = (p: Player) => {
    const unplayedVPCards = p.devCards.filter(c => c === DevCardType.VictoryPoint).length;
    const vpBoughtThisTurn = (p.devCardsBoughtThisTurn || []).filter(c => c === DevCardType.VictoryPoint).length;
    // victoryPoints tracks other bonus points (Longest Road, Largest Army)
    // we also include islandBonusPoints and total VP cards (unplayed + played)
    // Note: p.victoryPoints is a bit redundant now if we use specific fields, 
    // but we'll use it to store total VP from cards and bonuses for now to keep it simple, 
    // or just sum everything here.
    const totalVpCards = unplayedVPCards + vpBoughtThisTurn + (p.playedDevCards?.filter(c => c === DevCardType.VictoryPoint).length || 0);
    
    return (p.settlements * 1) + (p.cities * 2) + p.victoryPoints + unplayedVPCards + vpBoughtThisTurn;
  };

  const checkWinner = (players: Player[]) => {
    // Standard Catan rule: you can only win during your turn
    // (though in some digital versions it's immediate)
    const winner = players.find(p => calculatePlayerScore(p) >= 14);
    return winner ? winner.id : null;
  };
 
  const buildRoad = useCallback((edgeId: string) => {
    setGameState(prev => {
      if (!prev) return null;
      const player = prev.players[prev.currentPlayerIndex];
      
      const hexes = getHexesForEdge(prev.board, edgeId);
      
      // Check if road is on pure sea (invalid)
      const hasLand = hexes.some(h => h.type !== HexType.Sea && !h.isOuterSea);
      if (!hasLand) return prev;

      // Check if occupied
      if (prev.roads.some(r => r.edgeId === edgeId) || prev.ships.some(s => s.edgeId === edgeId)) return prev;

      const isSetup = prev.phase === 'setup';
      
      const totalRoads = prev.roads.filter(r => r.playerId === player.id).length;
      if (totalRoads >= 15) {
          console.warn("Road limit reached (15)");
          // Clear build mode if active, since we hit the limit
          return { ...prev, activeBuildMode: null };
      }

      const setupRoadsThisTurn = prev.roads.filter(r => r.playerId === prev.currentPlayerIndex).length;
      const setupSettlementsThisTurn = prev.settlements.filter(s => s.playerId === prev.currentPlayerIndex).length;

      // In setup, must build settlement first, then road
      if (isSetup) {
        if (setupRoadsThisTurn >= setupSettlementsThisTurn) return prev;
      } else if (prev.phase === 'road_building') {
        // Free road
      } else {
        const cost = COSTS.road;
        for (const [res, amt] of Object.entries(cost)) {
          if (player.resources[res as ResourceType] < amt) return prev;
        }
      }

      // Check connectivity
      const [v1Id, v2Id] = edgeId.split('|');

      const hasSettlementAtV1 = prev.settlements.some(s => s.playerId === player.id && s.vertexId === v1Id);
      const hasSettlementAtV2 = prev.settlements.some(s => s.playerId === player.id && s.vertexId === v2Id);
      
      const oppSettlementAtV1 = prev.settlements.some(s => s.playerId !== player.id && s.vertexId === v1Id);
      const oppSettlementAtV2 = prev.settlements.some(s => s.playerId !== player.id && s.vertexId === v2Id);

      const hasRoadAtV1 = prev.roads.some(r => r.playerId === player.id && r.edgeId !== edgeId && r.edgeId.split('|').includes(v1Id));
      const hasRoadAtV2 = prev.roads.some(r => r.playerId === player.id && r.edgeId !== edgeId && r.edgeId.split('|').includes(v2Id));
      
      const hasShipAtV1 = prev.ships.some(s => s.playerId === player.id && s.edgeId !== edgeId && s.edgeId.split('|').includes(v1Id));
      const hasShipAtV2 = prev.ships.some(s => s.playerId === player.id && s.edgeId !== edgeId && s.edgeId.split('|').includes(v2Id));
      
      const canConnectV1 = hasSettlementAtV1 || (hasRoadAtV1 && !oppSettlementAtV1) || (hasShipAtV1 && !oppSettlementAtV1);
      const canConnectV2 = hasSettlementAtV2 || (hasRoadAtV2 && !oppSettlementAtV2) || (hasShipAtV2 && !oppSettlementAtV2);
      const hasConnection = canConnectV1 || canConnectV2;

      // In setup, the road must connect to the settlement just placed
      if (isSetup) {
        const lastSettlement = prev.settlements.filter(s => s.playerId === player.id).pop();
        if (!lastSettlement || (lastSettlement.vertexId !== v1Id && lastSettlement.vertexId !== v2Id)) return prev;
      } else if (!hasConnection) {
        return prev;
      }

      const updatedPlayers = [...prev.players];
      const updatedPlayer = { 
        ...player, 
        roads: player.roads + 1,
        resources: { ...player.resources } 
      };
      const updatedBank = { ...prev.bankResources };

      let nextPhase = prev.phase;
      let nextFreeRoads = prev.freeRoads;

      if (!isSetup && prev.phase !== 'road_building') {
        for (const [res, amt] of Object.entries(COSTS.road)) {
          updatedPlayer.resources[res as ResourceType] -= amt;
          updatedBank[res as ResourceType] += amt;
        }
      } else if (prev.phase === 'road_building') {
        nextFreeRoads = (nextFreeRoads || 0) - 1;
        if (nextFreeRoads <= 0) {
          nextPhase = 'main';
        }
      }
      updatedPlayers[prev.currentPlayerIndex] = updatedPlayer;

      let nextStep = prev.setupStep;
      let nextPlayerIdx = prev.currentPlayerIndex;

      if (isSetup) {
        nextStep += 1;
        const playerCount = prev.players.length;
        if (nextStep < playerCount) {
          nextPlayerIdx = nextStep;
        } else if (nextStep < playerCount * 2) {
          nextPlayerIdx = playerCount - 1 - (nextStep - playerCount);
        } else {
          nextPhase = 'main';
          nextPlayerIdx = 0;
        }
      }

      const newRoads = [...prev.roads, { edgeId, playerId: player.id }];
      const { players: playersAfterRoad, longestRoadPlayerId } = updateLongestRoad(updatedPlayers, newRoads, prev.ships, prev.settlements, prev.longestRoadPlayerId);

      const winnerId = checkWinner(playersAfterRoad);

      // Check if player can still build another road
      const costRoad = COSTS.road;
      let stillCanBuildRoad = true;
      if (nextPhase === 'road_building') {
        stillCanBuildRoad = (nextFreeRoads || 0) > 0;
      } else {
        for (const [res, amt] of Object.entries(costRoad)) {
          if (playersAfterRoad[prev.currentPlayerIndex].resources[res as ResourceType] < amt) {
            stillCanBuildRoad = false;
            break;
          }
        }
        if (playersAfterRoad[prev.currentPlayerIndex].roads >= 15) stillCanBuildRoad = false;
      }

      return {
        ...prev,
        players: playersAfterRoad,
        bankResources: updatedBank,
        roads: newRoads,
        phase: winnerId !== null ? 'finished' : nextPhase,
        winnerId,
        playingDevCard: nextPhase === 'main' ? null : prev.playingDevCard,
        setupStep: nextStep,
        currentPlayerIndex: nextPlayerIdx,
        freeRoads: nextFreeRoads,
        hasBuiltThisTurn: isSetup ? prev.hasBuiltThisTurn : true,
        longestRoadPlayerId,
        activeBuildMode: winnerId !== null ? null : (isSetup ? (nextPhase === 'main' ? null : 'settlement') : (stillCanBuildRoad ? 'road' : null)),
      };
    });
  }, []);

  const buildShip = useCallback((edgeId: string) => {
    setGameState(prev => {
      if (!prev) return null;
      const player = prev.players[prev.currentPlayerIndex];
      
      const isSetup = prev.phase === 'setup';
      if (isSetup) return prev; // Cannot build ships in setup

      const totalShips = prev.ships.filter(s => s.playerId === player.id).length;
      if (totalShips >= 15) {
          console.warn("Ship limit reached (15)");
          return { ...prev, activeBuildMode: null };
      }

      if (prev.phase === 'road_building') {
        // Free ship
      } else {
        const cost = COSTS.ship;
        for (const [res, amt] of Object.entries(cost)) {
          if (player.resources[res as ResourceType] < amt) return prev;
        }
      }

      // Check connectivity
      const [v1Id, v2Id] = edgeId.split('|');

      const hasSettlementAtV1 = prev.settlements.some(s => s.playerId === player.id && s.vertexId === v1Id);
      const hasSettlementAtV2 = prev.settlements.some(s => s.playerId === player.id && s.vertexId === v2Id);
      
      const oppSettlementAtV1 = prev.settlements.some(s => s.playerId !== player.id && s.vertexId === v1Id);
      const oppSettlementAtV2 = prev.settlements.some(s => s.playerId !== player.id && s.vertexId === v2Id);

      const hasShipAtV1 = prev.ships.some(s => s.playerId === player.id && s.edgeId !== edgeId && s.edgeId.split('|').includes(v1Id));
      const hasShipAtV2 = prev.ships.some(s => s.playerId === player.id && s.edgeId !== edgeId && s.edgeId.split('|').includes(v2Id));

      const hasRoadAtV1 = prev.roads.some(r => r.playerId === player.id && r.edgeId !== edgeId && r.edgeId.split('|').includes(v1Id));
      const hasRoadAtV2 = prev.roads.some(r => r.playerId === player.id && r.edgeId !== edgeId && r.edgeId.split('|').includes(v2Id));

      const canConnectV1 = hasSettlementAtV1 || (hasShipAtV1 && !oppSettlementAtV1) || (hasRoadAtV1 && !oppSettlementAtV1);
      const canConnectV2 = hasSettlementAtV2 || (hasShipAtV2 && !oppSettlementAtV2) || (hasRoadAtV2 && !oppSettlementAtV2);
      const hasConnection = canConnectV1 || canConnectV2;

      if (!hasConnection) return prev;

      const hexes = getHexesForEdge(prev.board, edgeId);
      
      // Ships must be on sea edges or coastal edges
      const hasSea = hexes.some(h => h.type === HexType.Sea);
      if (!hasSea) return prev;

      // Check for Pirate
      const hasPirate = hexes.some(h => h.id === prev.pirateHexId);
      if (hasPirate) return prev;

      // Check if occupied
      if (prev.roads.some(r => r.edgeId === edgeId) || prev.ships.some(s => s.edgeId === edgeId)) return prev;

      const updatedPlayers = [...prev.players];
      const updatedPlayer = { 
        ...player, 
        ships: player.ships + 1,
        resources: { ...player.resources } 
      };
      const updatedBank = { ...prev.bankResources };

      let nextPhase = prev.phase;
      let nextFreeRoads = prev.freeRoads;

      if (prev.phase !== 'road_building') {
        for (const [res, amt] of Object.entries(COSTS.ship)) {
          updatedPlayer.resources[res as ResourceType] -= amt;
          updatedBank[res as ResourceType] += amt;
        }
      } else if (prev.phase === 'road_building') {
        nextFreeRoads = (nextFreeRoads || 0) - 1;
        if (nextFreeRoads <= 0) {
          nextPhase = 'main';
        }
      }
      updatedPlayers[prev.currentPlayerIndex] = updatedPlayer;

      const newShips = [...prev.ships, { edgeId, playerId: player.id }];
      const { players: playersAfterShip, longestRoadPlayerId } = updateLongestRoad(updatedPlayers, prev.roads, newShips, prev.settlements, prev.longestRoadPlayerId);

      const winnerId = checkWinner(playersAfterShip);

      // Check if player can still build another ship
      const costShip = COSTS.ship;
      let stillCanBuildShip = true;
      if (prev.phase === 'road_building') {
        stillCanBuildShip = (nextFreeRoads || 0) > 0;
      } else {
        for (const [res, amt] of Object.entries(costShip)) {
          if (playersAfterShip[prev.currentPlayerIndex].resources[res as ResourceType] < amt) {
            stillCanBuildShip = false;
            break;
          }
        }
        if (playersAfterShip[prev.currentPlayerIndex].ships >= 15) stillCanBuildShip = false;
      }

      return {
        ...prev,
        players: playersAfterShip,
        bankResources: updatedBank,
        ships: newShips,
        phase: winnerId !== null ? 'finished' : nextPhase,
        winnerId,
        playingDevCard: nextPhase === 'main' ? null : prev.playingDevCard,
        freeRoads: nextFreeRoads,
        hasBuiltThisTurn: true,
        longestRoadPlayerId,
        activeBuildMode: (winnerId !== null || !stillCanBuildShip) ? null : 'ship',
      };
    });
  }, []);

  const buildSettlement = useCallback((vertexId: string, hexIds: string[]) => {
    setGameState(prev => {
      if (!prev) return null;
      const player = prev.players[prev.currentPlayerIndex];
      
      const isSetup = prev.phase === 'setup';
      const setupSettlementsThisTurn = prev.settlements.filter(s => s.playerId === prev.currentPlayerIndex).length;
      const setupRoadsThisTurn = prev.roads.filter(r => r.playerId === prev.currentPlayerIndex).length;

      // Cannot build on pure Sea vertices
      const isAllSea = hexIds.every(id => {
        const hex = prev.board.find(h => h.id === id);
        return hex?.type === HexType.Sea;
      });
      if (isAllSea) return prev;

      if (isSetup) {
        if (setupSettlementsThisTurn > setupRoadsThisTurn) return prev;
        if (setupSettlementsThisTurn >= 2) return prev;
        
        // Cannot build on Gold during setup
        const isGold = hexIds.some(id => {
          const hex = prev.board.find(h => h.id === id);
          return hex?.type === HexType.Gold;
        });
        if (isGold) return prev;
      } else {
        // Settlement limit (5 in standard Catan)
        if (player.settlements >= 5) {
          console.warn("Settlement limit reached (5)");
          return prev;
        }

        const cost = COSTS.settlement;
        for (const [res, amt] of Object.entries(cost)) {
          if (player.resources[res as ResourceType] < amt) return prev;
        }

        // Check connectivity for main phase
        const hasRoadConnection = 
          prev.roads.some(r => r.playerId === player.id && r.edgeId.includes(vertexId)) ||
          prev.ships.some(s => s.playerId === player.id && s.edgeId.includes(vertexId));
        if (!hasRoadConnection) return prev;
      }

      // Check distance rule (no adjacent settlements)
      const [vx, vy] = vertexId.split(',').map(Number);
      const isTooClose = prev.settlements.some(s => {
        const [sx, sy] = s.vertexId.split(',').map(Number);
        const dist = Math.sqrt(Math.pow(vx - sx, 2) + Math.pow(vy - sy, 2));
        return dist < 50; // HEX_RADIUS is 40, distance between adjacent vertices is ~40
      });
      if (isTooClose) return prev;
      
      // Check if surrounded by sea/desert (cannot build if all adjacent hexes are sea/desert)
      const adjacentHexes = hexIds.map(id => prev.board.find(h => h.id === id)).filter(Boolean);
      const allBarren = adjacentHexes.every(h => h!.type === HexType.Sea || h!.type === HexType.Desert);
      if (allBarren) return prev;

      // Check for island settlement bonus
      // Desert hexes don't count as islands themselves for the bonus, 
      // but if a vertex touches a real Island hex (even if it also touches Desert), it counts.
      const isIslandSettlement = adjacentHexes.some(h => h!.isIsland && h!.type !== HexType.Desert);
      let bonusPoints = 0;
      if (isIslandSettlement && !isSetup) {
        const playerIslandIds = new Set(prev.settlements
          .filter(s => s.playerId === player.id)
          .flatMap(s => s.hexIds)
          .map(id => prev.board.find(h => h.id === id))
          .filter(h => h && h.isIsland)
          .map(h => h!.islandId)
        );
        const newIslandIds = new Set(adjacentHexes.filter(h => h!.isIsland).map(h => h!.islandId));
        let hasNewIsland = false;
        for (const id of newIslandIds) {
          if (!playerIslandIds.has(id)) {
            hasNewIsland = true;
            break;
          }
        }
        if (hasNewIsland) {
          bonusPoints = 1; // Island bonus changed from 2 to 1
        }
      }

      const updatedPlayers = [...prev.players];
      const updatedPlayer = { 
        ...player, 
        settlements: player.settlements + 1,
        resources: { ...player.resources },
        victoryPoints: player.victoryPoints + bonusPoints,
        islandBonusPoints: player.islandBonusPoints + bonusPoints
      };
      const updatedBank = { ...prev.bankResources };

      if (!isSetup) {
        for (const [res, amt] of Object.entries(COSTS.settlement)) {
          updatedPlayer.resources[res as ResourceType] -= amt;
          updatedBank[res as ResourceType] += amt;
        }
      } else if (setupSettlementsThisTurn === 1) {
        // Second settlement gives resources
        hexIds.forEach(hexId => {
          const hex = prev.board.find(h => h.id === hexId);
          if (hex && hex.type !== HexType.Desert && hex.type !== HexType.Sea) {
            const resourceMap: any = {
              [HexType.Forest]: ResourceType.Lumber,
              [HexType.Hills]: ResourceType.Brick,
              [HexType.Pasture]: ResourceType.Wool,
              [HexType.Fields]: ResourceType.Grain,
              [HexType.Mountains]: ResourceType.Ore,
            };
            const res = resourceMap[hex.type];
            if (res && updatedBank[res] > 0) {
              updatedPlayer.resources[res] += 1;
              updatedBank[res] -= 1;
            }
          }
        });
      }

      updatedPlayers[prev.currentPlayerIndex] = updatedPlayer;

      const newSettlements = [...prev.settlements, { vertexId, hexIds, playerId: player.id, isCity: false }];
      const { players: playersAfterSettlement, longestRoadPlayerId } = updateLongestRoad(updatedPlayers, prev.roads, prev.ships, newSettlements, prev.longestRoadPlayerId);
      
      const winnerId = checkWinner(playersAfterSettlement);
      
      // Check if player can still build another settlement
      const cost = COSTS.settlement;
      let stillCanBuild = true;
      for (const [res, amt] of Object.entries(cost)) {
        if (playersAfterSettlement[prev.currentPlayerIndex].resources[res as ResourceType] < amt) {
          stillCanBuild = false;
          break;
        }
      }
      if (playersAfterSettlement[prev.currentPlayerIndex].settlements >= 5) stillCanBuild = false;

      return {
        ...prev,
        players: playersAfterSettlement,
        bankResources: updatedBank,
        settlements: newSettlements,
        hasBuiltThisTurn: isSetup ? prev.hasBuiltThisTurn : true,
        longestRoadPlayerId,
        winnerId,
        phase: winnerId !== null ? 'finished' : prev.phase,
        activeBuildMode: winnerId !== null ? null : (isSetup ? 'road' : (stillCanBuild ? 'settlement' : null)),
      };
    });
  }, []);

  const upgradeToCity = useCallback((vertexId: string) => {
    setGameState(prev => {
      if (!prev) return null;
      const player = prev.players[prev.currentPlayerIndex];
      const cost = COSTS.city;

      // City limit (4 in standard Catan)
      if (player.cities >= 4) {
        console.warn("City limit reached (4)");
        return prev;
      }

      for (const [res, amt] of Object.entries(cost)) {
        if (player.resources[res as ResourceType] < amt) return prev;
      }

      // Check for Pirate
      const hexes = getHexesForVertex(prev.board, vertexId);
      const hasPirate = hexes.some(h => h.id === prev.pirateHexId);
      if (hasPirate) return prev;

      const settlementIdx = prev.settlements.findIndex(s => s.vertexId === vertexId && s.playerId === player.id && !s.isCity);
      if (settlementIdx === -1) return prev;

      const updatedPlayers = [...prev.players];
      const updatedPlayer = { 
        ...player, 
        settlements: player.settlements - 1,
        cities: player.cities + 1,
        resources: { ...player.resources }
      };
      const updatedBank = { ...prev.bankResources };

      for (const [res, amt] of Object.entries(cost)) {
        updatedPlayer.resources[res as ResourceType] -= amt;
        updatedBank[res as ResourceType] += amt;
      }
      updatedPlayers[prev.currentPlayerIndex] = updatedPlayer;

      const updatedSettlements = [...prev.settlements];
      updatedSettlements[settlementIdx] = { ...updatedSettlements[settlementIdx], isCity: true };
      
      const winnerId = checkWinner(updatedPlayers);

      // Check if player can still build another city
      const costCity = COSTS.city;
      let stillCanBuild = true;
      for (const [res, amt] of Object.entries(costCity)) {
        if (updatedPlayers[prev.currentPlayerIndex].resources[res as ResourceType] < amt) {
          stillCanBuild = false;
          break;
        }
      }
      if (updatedPlayers[prev.currentPlayerIndex].cities >= 4) stillCanBuild = false;

      return {
        ...prev,
        players: updatedPlayers,
        bankResources: updatedBank,
        settlements: updatedSettlements,
        hasBuiltThisTurn: true,
        phase: winnerId !== null ? 'finished' : prev.phase,
        winnerId,
        activeBuildMode: (winnerId !== null || !stillCanBuild) ? null : 'city',
      };
    });
  }, []);

  const buyDevCard = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.bankDevCards.length === 0) return prev;
      const player = prev.players[prev.currentPlayerIndex];
      const cost = COSTS.devCard;

      for (const [res, amt] of Object.entries(cost)) {
        if (player.resources[res as ResourceType] < amt) return prev;
      }

      const updatedPlayers = [...prev.players];
      const updatedBankDevCards = [...prev.bankDevCards];
      const drawnCard = updatedBankDevCards.pop()!;
      
      const updatedPlayer = { 
        ...player, 
        devCardsBoughtThisTurn: [...(player.devCardsBoughtThisTurn || []), drawnCard],
        resources: { ...player.resources }
      };
      
      const updatedBankResources = { ...prev.bankResources };

      for (const [res, amt] of Object.entries(cost)) {
        updatedPlayer.resources[res as ResourceType] -= amt;
        updatedBankResources[res as ResourceType] += amt;
      }
      updatedPlayers[prev.currentPlayerIndex] = updatedPlayer;
      
      const winnerId = checkWinner(updatedPlayers);

      return {
        ...prev,
        players: updatedPlayers,
        bankResources: updatedBankResources,
        bankDevCards: updatedBankDevCards,
        hasBuiltThisTurn: true,
        phase: winnerId !== null ? 'finished' : prev.phase,
        winnerId,
      };
    });
  }, []);

  const playDevCard = useCallback((cardType: DevCardType) => {
    setGameState(prev => {
      if (!prev) return null;
      const player = prev.players[prev.currentPlayerIndex];
      const cardIdx = player.devCards.indexOf(cardType);
      if (cardIdx === -1) return prev;

      const updatedPlayers = [...prev.players];
      const updatedDevCards = [...player.devCards];
      updatedDevCards.splice(cardIdx, 1);
      
      const updatedPlayer = { 
        ...player, 
        devCards: updatedDevCards,
        playedDevCards: [...(player.playedDevCards || []), cardType]
      };
      let nextPhase = prev.phase;
      let freeRoads = prev.freeRoads;
      
      let newEvent = prev.lastDevCardEvent;
      if (cardType !== DevCardType.VictoryPoint) {
        let actionStr = '';
        if (cardType === DevCardType.Knight) actionStr = '发动骑士';
        else if (cardType === DevCardType.Monopoly) actionStr = '开启垄断';
        else if (cardType === DevCardType.YearOfPlenty) actionStr = '使用丰收之年';
        else if (cardType === DevCardType.RoadBuilding) actionStr = '使用道路建设';
        newEvent = { playerName: player.name, cardType: actionStr, timestamp: Date.now() };
      }
      
      if (cardType === DevCardType.VictoryPoint) {
        // VP cards shouldn't be playable manually, but just in case
        updatedPlayer.victoryPoints += 1;
      } else if (cardType === DevCardType.Knight) {
        nextPhase = 'robber';
        updatedPlayer.knightsPlayed += 1;
      } else if (cardType === DevCardType.YearOfPlenty) {
        nextPhase = 'year_of_plenty';
      } else if (cardType === DevCardType.Monopoly) {
        nextPhase = 'monopoly';
      } else if (cardType === DevCardType.RoadBuilding) {
        nextPhase = 'road_building';
        freeRoads = 2;
      }
      
      updatedPlayers[prev.currentPlayerIndex] = updatedPlayer;
      
      // Check Largest Army
      let newLargestArmyPlayerId = prev.largestArmyPlayerId;
      if (updatedPlayer.knightsPlayed >= 3) {
        if (prev.largestArmyPlayerId === null) {
          newLargestArmyPlayerId = updatedPlayer.id;
        } else if (prev.largestArmyPlayerId !== updatedPlayer.id) {
          const currentLargestArmyPlayer = prev.players[prev.largestArmyPlayerId];
          if (updatedPlayer.knightsPlayed > currentLargestArmyPlayer.knightsPlayed) {
            newLargestArmyPlayerId = updatedPlayer.id;
          }
        }

        // Adjust victory points for Largest Army
        if (newLargestArmyPlayerId !== prev.largestArmyPlayerId) {
          if (prev.largestArmyPlayerId !== null) {
            const oldPlayer = updatedPlayers.find(p => p.id === prev.largestArmyPlayerId);
            if (oldPlayer) {
              oldPlayer.victoryPoints -= 2;
            }
          }
          if (newLargestArmyPlayerId !== null) {
            const newPlayer = updatedPlayers.find(p => p.id === newLargestArmyPlayerId);
            if (newPlayer) {
              newPlayer.victoryPoints += 2;
            }
          }
        }
      }

      const winnerId = checkWinner(updatedPlayers);
      
      return { 
        ...prev, 
        players: updatedPlayers, 
        phase: winnerId !== null ? 'finished' : nextPhase, 
        winnerId,
        freeRoads,
        hasPlayedDevCardThisTurn: cardType !== DevCardType.VictoryPoint,
        playingDevCard: cardType !== DevCardType.VictoryPoint ? cardType : null,
        largestArmyPlayerId: newLargestArmyPlayerId,
        activeBuildMode: nextPhase === 'road_building' ? 'road' : null,
        lastDevCardEvent: newEvent,
      };
    });
  }, []);

  const cancelDevCard = useCallback(() => {
    setGameState(prev => {
      if (!prev || !prev.playingDevCard) return prev;
      
      const cardType = prev.playingDevCard;
      
      // Cannot cancel road building if a road has already been built, but we can end the phase
      if (cardType === DevCardType.RoadBuilding && prev.freeRoads !== 2) {
        return {
          ...prev,
          phase: 'main',
          freeRoads: 0,
          playingDevCard: null,
          activeBuildMode: null,
        };
      }

      const updatedPlayers = [...prev.players];
      const currentPlayer = { ...updatedPlayers[prev.currentPlayerIndex] };
      
      currentPlayer.devCards = [...currentPlayer.devCards, cardType];
      const playedIdx = currentPlayer.playedDevCards.lastIndexOf(cardType);
      if (playedIdx !== -1) {
        currentPlayer.playedDevCards = currentPlayer.playedDevCards.filter((_, i) => i !== playedIdx);
      }

      let newLargestArmyPlayerId = prev.largestArmyPlayerId;
      if (cardType === DevCardType.Knight) {
        currentPlayer.knightsPlayed = Math.max(0, currentPlayer.knightsPlayed - 1);
        
        // Re-evaluate largest army if this player was the holder
        if (prev.largestArmyPlayerId === currentPlayer.id) {
          if (currentPlayer.knightsPlayed < 3) {
            // Find new holder or null
            const eligiblePlayers = updatedPlayers.filter(p => p.knightsPlayed >= 3);
            if (eligiblePlayers.length === 0) {
              newLargestArmyPlayerId = null;
            } else {
              const maxKnights = Math.max(...eligiblePlayers.map(p => p.knightsPlayed));
              const maxPlayers = eligiblePlayers.filter(p => p.knightsPlayed === maxKnights);
              if (maxPlayers.length === 1) {
                newLargestArmyPlayerId = maxPlayers[0].id;
              } else {
                newLargestArmyPlayerId = null;
              }
            }
          }
        }

        // Adjust victory points for Largest Army
        if (newLargestArmyPlayerId !== prev.largestArmyPlayerId) {
          if (prev.largestArmyPlayerId !== null) {
            const oldPlayer = updatedPlayers.find(p => p.id === prev.largestArmyPlayerId);
            if (oldPlayer) {
              oldPlayer.victoryPoints -= 2;
            }
          }
          if (newLargestArmyPlayerId !== null) {
            const newPlayer = updatedPlayers.find(p => p.id === newLargestArmyPlayerId);
            if (newPlayer) {
              newPlayer.victoryPoints += 2;
            }
          }
        }
      }

      updatedPlayers[prev.currentPlayerIndex] = currentPlayer;

      return {
        ...prev,
        players: updatedPlayers,
        phase: 'main',
        hasPlayedDevCardThisTurn: false,
        playingDevCard: null,
        freeRoads: 0,
        largestArmyPlayerId: newLargestArmyPlayerId,
        activeBuildMode: null,
      };
    });
  }, []);

  const moveRobber = useCallback((hexId: string) => {
    setGameState(prev => {
      if (!prev || (prev.phase !== 'robber' && prev.phase !== 'robber_move')) return prev;
      const hex = prev.board.find(h => h.id === hexId);
      if (!hex || hex.type === HexType.Sea) return prev;
      
      // Find players to steal from
      const playersToStealFrom = Array.from(new Set(
        prev.settlements
          .filter(s => s.hexIds.includes(hexId) && s.playerId !== prev.currentPlayerIndex)
          .map(s => s.playerId)
      ));

      if (playersToStealFrom.length > 0) {
        return {
          ...prev,
          robberHexId: hexId,
          phase: 'stealing',
          pendingStealFrom: playersToStealFrom
        };
      }

      return {
        ...prev,
        robberHexId: hexId,
        phase: 'main',
        playingDevCard: null
      };
    });
  }, []);

  const movePirate = useCallback((hexId: string) => {
    setGameState(prev => {
      if (!prev || (prev.phase !== 'robber' && prev.phase !== 'robber_move')) return prev;
      const hex = prev.board.find(h => h.id === hexId);
      if (!hex || hex.type !== HexType.Sea) return prev;
      
      const playersToStealFrom = Array.from(new Set(
        prev.ships
          .filter(s => s.edgeId.includes(hexId) && s.playerId !== prev.currentPlayerIndex)
          .map(s => s.playerId)
      ));

      if (playersToStealFrom.length > 0) {
        return {
          ...prev,
          pirateHexId: hexId,
          phase: 'stealing',
          pendingStealFrom: playersToStealFrom
        };
      }

      return {
        ...prev,
        pirateHexId: hexId,
        phase: 'main',
        playingDevCard: null
      };
    });
  }, []);

  const resolveYearOfPlenty = useCallback((res1: ResourceType, res2: ResourceType) => {
    setGameState(prev => {
      if (!prev || prev.phase !== 'year_of_plenty') return prev;
      const updatedPlayers = [...prev.players];
      const player = { 
        ...updatedPlayers[prev.currentPlayerIndex],
        resources: { ...updatedPlayers[prev.currentPlayerIndex].resources }
      };
      const updatedBank = { ...prev.bankResources };

      if (updatedBank[res1] > 0) {
        player.resources[res1]++;
        updatedBank[res1]--;
      }
      if (res1 !== res2 && updatedBank[res2] > 0) {
        player.resources[res2]++;
        updatedBank[res2]--;
      } else if (res1 === res2 && updatedBank[res1] > 0) {
        player.resources[res1]++;
        updatedBank[res1]--;
      }

      updatedPlayers[prev.currentPlayerIndex] = player;
      return {
        ...prev,
        players: updatedPlayers,
        bankResources: updatedBank,
        phase: 'main',
        playingDevCard: null
      };
    });
  }, []);

  const resolveMonopoly = useCallback((resource: ResourceType) => {
    setGameState(prev => {
      if (!prev || prev.phase !== 'monopoly') return prev;
      const updatedPlayers = [...prev.players];
      let totalStolen = 0;

      for (let i = 0; i < updatedPlayers.length; i++) {
        if (i === prev.currentPlayerIndex) continue;
        const amount = updatedPlayers[i].resources[resource];
        if (amount > 0) {
          updatedPlayers[i] = {
            ...updatedPlayers[i],
            resources: {
              ...updatedPlayers[i].resources,
              [resource]: 0
            }
          };
          totalStolen += amount;
        }
      }

      const currentPlayer = { 
        ...updatedPlayers[prev.currentPlayerIndex],
        resources: { ...updatedPlayers[prev.currentPlayerIndex].resources }
      };
      currentPlayer.resources[resource] += totalStolen;
      updatedPlayers[prev.currentPlayerIndex] = currentPlayer;

      return {
        ...prev,
        players: updatedPlayers,
        phase: 'main',
        playingDevCard: null
      };
    });
  }, []);

  const selectStealTarget = useCallback((playerId: number | null) => {
    setGameState(prev => {
      if (!prev || prev.phase !== 'stealing') return prev;
      return {
        ...prev,
        selectedStealTarget: playerId
      };
    });
  }, []);

  const stealResource = useCallback((fromPlayerId: number) => {
    setGameState(prev => {
      if (!prev || prev.phase !== 'stealing') return prev;
      const fromPlayer = prev.players[fromPlayerId];
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      
      const availableResources = Object.entries(fromPlayer.resources)
        .filter(([_, count]) => count > 0)
        .flatMap(([res, count]) => Array(count).fill(res as ResourceType));
      
      if (availableResources.length === 0) return { ...prev, phase: 'main', playingDevCard: null };

      const stolenRes = availableResources[Math.floor(Math.random() * availableResources.length)];
      
      const updatedPlayers = [...prev.players];
      updatedPlayers[fromPlayerId] = {
        ...fromPlayer,
        resources: { ...fromPlayer.resources, [stolenRes]: fromPlayer.resources[stolenRes] - 1 }
      };
      updatedPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        resources: { ...currentPlayer.resources, [stolenRes]: currentPlayer.resources[stolenRes] + 1 }
      };

      return {
        ...prev,
        players: updatedPlayers,
        phase: 'main',
        pendingStealFrom: [],
        selectedStealTarget: null,
        playingDevCard: null
      };
    });
  }, []);

  const doSteal = useCallback((fromPlayerId: number) => {
    selectStealTarget(fromPlayerId);
    stealResource(fromPlayerId);
  }, [selectStealTarget, stealResource]);

  const selectGoldResource = useCallback((selectedResources: Record<ResourceType, number>) => {
    setGameState(prev => {
      if (!prev || prev.phase !== 'gold_selection' || prev.pendingGoldRewards.length === 0) return prev;
      
      const reward = prev.pendingGoldRewards[0];
      const updatedPlayers = [...prev.players];
      const player = { ...updatedPlayers[reward.playerId], resources: { ...updatedPlayers[reward.playerId].resources } };
      const updatedBank = { ...prev.bankResources };

      // Verify bank has enough resources
      for (const [res, count] of Object.entries(selectedResources)) {
        if (updatedBank[res as ResourceType] < count) return prev;
      }

      // Distribute resources
      for (const [res, count] of Object.entries(selectedResources)) {
        const resourceType = res as ResourceType;
        if (count > 0) {
          player.resources[resourceType] += count;
          updatedBank[resourceType] -= count;
        }
      }

      updatedPlayers[reward.playerId] = player;

      const remainingRewards = prev.pendingGoldRewards.slice(1);

      return {
        ...prev,
        players: updatedPlayers,
        bankResources: updatedBank,
        pendingGoldRewards: remainingRewards,
        phase: remainingRewards.length === 0 ? 'main' : 'gold_selection'
      };
    });
  }, []);

  const tradeWithBank = useCallback((give: ResourceType, receive: ResourceType) => {
    setGameState(prev => {
      if (!prev) return null;
      const player = prev.players[prev.currentPlayerIndex];
      
      const playerPorts = prev.ports.filter(p => {
        const settlement = prev.settlements.find(s => p.vertexIds.includes(s.vertexId) && s.playerId === player.id);
        return !!settlement;
      });

      const specificPort = playerPorts.find(p => p.type === give);
      const genericPort = playerPorts.find(p => p.type === '3:1');
      
      let tradeRatio = 4;
      if (specificPort) tradeRatio = 2;
      else if (genericPort) tradeRatio = 3;

      if (player.resources[give] < tradeRatio || prev.bankResources[receive] < 1) return prev;

      const updatedPlayers = [...prev.players];
      const updatedPlayer = { 
        ...player, 
        resources: { ...player.resources }
      };
      const updatedBank = { ...prev.bankResources };

      updatedPlayer.resources[give] -= tradeRatio;
      updatedPlayer.resources[receive] += 1;
      updatedBank[give] += tradeRatio;
      updatedBank[receive] -= 1;

      updatedPlayers[prev.currentPlayerIndex] = updatedPlayer;

      return { ...prev, players: updatedPlayers, bankResources: updatedBank };
    });
  }, []);

  const addResources = useCallback((playerId: number, amount: number) => {
    setGameState(prev => {
      if (!prev) return null;
      const updatedPlayers = [...prev.players];
      const p = { ...updatedPlayers[playerId], resources: { ...updatedPlayers[playerId].resources } };
      Object.values(ResourceType).forEach(r => {
        p.resources[r] += amount;
      });
      updatedPlayers[playerId] = p;
      return { ...prev, players: updatedPlayers };
    });
  }, []);



  const setPlayerResource = useCallback((playerId: number, resource: ResourceType, amount: number) => {
    setGameState(prev => {
      if (!prev) return null;
      const updatedPlayers = [...prev.players];
      const p = { ...updatedPlayers[playerId] };
      
      const oldAmount = p.resources[resource];
      const diff = amount - oldAmount;
      
      p.resources = { ...p.resources, [resource]: amount };
      updatedPlayers[playerId] = p;
      
      const updatedBank = { ...prev.bankResources };
      updatedBank[resource] -= diff;
      
      return { ...prev, players: updatedPlayers, bankResources: updatedBank };
    });
  }, []);

  const setDice = useCallback((d1: number, d2: number) => {
    const total = d1 + d2;
    setGameState(prev => {
      if (!prev) return null;
      const next = { ...prev, dice: [d1, d2] as [number, number], hasRolled: true };
      
      if (total === 7) {
        // Check for players with >= 7 cards
        const pendingDiscards: { playerId: number, amount: number }[] = [];
        next.players.forEach(p => {
          const totalCards = Object.values(p.resources).reduce((a, b) => a + b, 0);
          if (totalCards >= 7) {
            pendingDiscards.push({ playerId: p.id, amount: Math.floor(totalCards / 2) });
          }
        });

        if (pendingDiscards.length > 0) {
          next.phase = 'rolling_7';
          next.pendingDiscards = pendingDiscards;
        } else {
          next.phase = 'rolling_7';
        }
      } else {
        // Distribute resources immediately for non-7
        const updatedPlayers = [...next.players];
        const updatedBank = { ...next.bankResources };
        const pendingGold: { playerId: number, amount: number }[] = [];

        next.board.forEach(hex => {
          if (hex.number === total && hex.id !== next.robberHexId && hex.id !== next.pirateHexId) {
            next.settlements.forEach(s => {
              if (s.hexIds.includes(hex.id)) {
                const amount = s.isCity ? 2 : 1;
                
                if (hex.type === HexType.Gold) {
                  pendingGold.push({ playerId: s.playerId, amount });
                } else {
                  const resourceMap: any = {
                    [HexType.Forest]: ResourceType.Lumber,
                    [HexType.Hills]: ResourceType.Brick,
                    [HexType.Pasture]: ResourceType.Wool,
                    [HexType.Fields]: ResourceType.Grain,
                    [HexType.Mountains]: ResourceType.Ore,
                  };
                  const resToGive = resourceMap[hex.type];
                  if (resToGive && updatedBank[resToGive] >= amount) {
                    updatedPlayers[s.playerId] = {
                      ...updatedPlayers[s.playerId],
                      resources: {
                        ...updatedPlayers[s.playerId].resources,
                        [resToGive]: updatedPlayers[s.playerId].resources[resToGive] + amount
                      }
                    };
                    updatedBank[resToGive] -= amount;
                  }
                }
              }
            });
          }
        });

        next.players = updatedPlayers;
        next.bankResources = updatedBank;
        
        if (pendingGold.length > 0) {
          next.phase = 'gold_selection';
          next.pendingGoldRewards = pendingGold;
        }
      }
      return next;
    });
  }, []);

  const toggleBot = useCallback((playerId: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      const newPlayers = [...prev.players];
      newPlayers[playerId] = { ...newPlayers[playerId], isBot: !newPlayers[playerId].isBot };
      return { ...prev, players: newPlayers };
    });
  }, []);

  useEffect(() => {
    if (gameState?.phase === 'rolling_7') {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          phase: prev.pendingDiscards.length > 0 ? 'discard' : 'robber'
        };
      });
    }
  }, [gameState?.phase]);

  const syncGameState = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  const proposeTrade = useCallback((offer: Record<ResourceType, number>, request: Record<ResourceType, number>, targetPlayerId: number | null) => {
    setGameState(prev => {
      if (!prev) return prev;
      const newOffer: TradeOffer = {
        id: Math.random().toString(36).substring(2, 9),
        initiatorId: prev.currentPlayerIndex,
        targetPlayerId,
        offer,
        request,
        status: 'pending',
        acceptedBy: [],
        rejectedBy: [],
      };
      return { ...prev, tradeOffers: [...(prev.tradeOffers || []), newOffer] };
    });
  }, []);

  const reactToTrade = useCallback((tradeId: string, playerId: number, reaction: 'accept' | 'reject') => {
    setGameState(prev => {
      if (!prev) return prev;
      const offers = (prev.tradeOffers || []).map(offer => {
        if (offer.id === tradeId) {
          // Prevent duplicate reactions
          if (offer.acceptedBy.includes(playerId) || offer.rejectedBy.includes(playerId)) return offer;
          
          if (reaction === 'accept') {
            return { ...offer, acceptedBy: [...offer.acceptedBy, playerId] };
          } else {
            return { ...offer, rejectedBy: [...offer.rejectedBy, playerId] };
          }
        }
        return offer;
      });
      return { ...prev, tradeOffers: offers };
    });
  }, []);

  const cancelTrade = useCallback((tradeId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const offers = (prev.tradeOffers || []).map(offer => 
        offer.id === tradeId ? { ...offer, status: 'canceled' as const } : offer
      );
      return { ...prev, tradeOffers: offers };
    });
  }, []);

  const finalizeTrade = useCallback((tradeId: string, partnerId: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      const offer = (prev.tradeOffers || []).find(o => o.id === tradeId);
      if (!offer) return prev;

      // Ensure both have resources
      const initiator = prev.players.find(p => p.id === offer.initiatorId);
      const partner = prev.players.find(p => p.id === partnerId);
      
      if (!initiator || !partner) return prev;

      let initiatorHasResources = true;
      let partnerHasResources = true;

      const types = Object.values(ResourceType);
      types.forEach(t => {
        if ((initiator.resources[t] || 0) < (offer.offer[t] || 0)) initiatorHasResources = false;
        if ((partner.resources[t] || 0) < (offer.request[t] || 0)) partnerHasResources = false;
      });

      if (!initiatorHasResources || !partnerHasResources) {
        return prev; // Trade impossible
      }

      const updatedPlayers = prev.players.map(p => {
        if (p.id === initiator.id) {
          const newRes = { ...p.resources };
          types.forEach(t => {
            newRes[t] = (newRes[t] || 0) - (offer.offer[t] || 0) + (offer.request[t] || 0);
          });
          return { ...p, resources: newRes };
        } else if (p.id === partner.id) {
          const newRes = { ...p.resources };
          types.forEach(t => {
            newRes[t] = (newRes[t] || 0) + (offer.offer[t] || 0) - (offer.request[t] || 0);
          });
          return { ...p, resources: newRes };
        }
        return p;
      });

      const offers = (prev.tradeOffers || []).map(o => 
        o.id === tradeId ? { ...o, status: 'completed' as const } : o
      );

      return { ...prev, players: updatedPlayers, tradeOffers: offers };
    });
  }, []);

  const setBuildModeSync = useCallback((mode: GameState['activeBuildMode']) => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, activeBuildMode: mode };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState(null);
  }, []);

  return {
    gameState,
    syncGameState,
    resetGame,
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
    // Debug functions
    setPlayerResource,
    setDice,
    setBuildModeSync,
    proposeTrade,
    reactToTrade,
    cancelTrade,
    finalizeTrade
  };
}
