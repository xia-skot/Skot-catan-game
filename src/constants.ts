import { HexType, ResourceType } from './types';

export const HEX_RESOURCES: Record<HexType, ResourceType | 'none'> = {
  [HexType.Forest]: ResourceType.Lumber,
  [HexType.Hills]: ResourceType.Brick,
  [HexType.Pasture]: ResourceType.Wool,
  [HexType.Fields]: ResourceType.Grain,
  [HexType.Mountains]: ResourceType.Ore,
  [HexType.Desert]: 'none',
  [HexType.Sea]: 'none',
  [HexType.Gold]: 'none', // Gold provides any resource
};

export const RESOURCE_NAMES: Record<ResourceType, string> = {
  [ResourceType.Lumber]: '木材',
  [ResourceType.Brick]: '砖块',
  [ResourceType.Wool]: '羊毛',
  [ResourceType.Grain]: '小麦',
  [ResourceType.Ore]: '矿石',
};

export const HEX_NAMES: Record<HexType, string> = {
  [HexType.Forest]: '森林',
  [HexType.Hills]: '丘陵',
  [HexType.Pasture]: '牧场',
  [HexType.Fields]: '耕地',
  [HexType.Mountains]: '山脉',
  [HexType.Desert]: '沙漠',
  [HexType.Sea]: '海洋',
  [HexType.Gold]: '金矿',
};

export const RESOURCE_COLORS: Record<ResourceType | 'gold' | 'desert' | 'sea', string> = {
  [ResourceType.Lumber]: '#2D5A27', // Deep Forest Green
  [ResourceType.Brick]: '#A0522D',  // Sienna/Brick Red
  [ResourceType.Wool]: '#90EE90',   // Light Green/Pasture
  [ResourceType.Grain]: '#F4D03F',  // Golden Yellow
  [ResourceType.Ore]: '#7B7D7D',    // Slate Gray
  gold: '#FFD700',
  desert: '#EDC9AF',
  sea: '#3498DB',
};

export const PLAYER_COLORS = [
  '#E74C3C', // Red
  '#3498DB', // Blue
  '#F1C40F', // Yellow
  '#FFFFFF', // White
  '#2ECC71', // Green
  '#8E44AD', // Purple
];

export const COSTS = {
  road: { [ResourceType.Lumber]: 1, [ResourceType.Brick]: 1 },
  ship: { [ResourceType.Lumber]: 1, [ResourceType.Wool]: 1 },
  settlement: { [ResourceType.Lumber]: 1, [ResourceType.Brick]: 1, [ResourceType.Wool]: 1, [ResourceType.Grain]: 1 },
  city: { [ResourceType.Grain]: 2, [ResourceType.Ore]: 3 },
  devCard: { [ResourceType.Wool]: 1, [ResourceType.Grain]: 1, [ResourceType.Ore]: 1 },
};
