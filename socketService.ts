import { ResourceType } from './types';

export const FOREST_IMG = 'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E6%A3%AE%E6%9E%97.jpg';
export const FIELDS_IMG = 'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E9%BA%A6%E7%94%B0.jpg';
export const PASTURE_IMG = 'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E7%89%A7%E5%9C%BA.jpg';
export const Desert_IMG =  'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E6%B2%99%E6%BC%A0.jpg';
export const Mountains_IMG =  'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E7%9F%BF%E5%B1%B1.jpg';

// Resource Icons
export const LUMBER_ICON = 'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E6%A0%91.png';
export const BRICK_ICON = 'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E7%A0%96%E5%9D%97.png';
export const WOOL_ICON = 'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E7%BE%8A2.png';
export const GRAIN_ICON = 'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E5%B0%8F%E9%BA%A6.png';
export const ORE_ICON = 'https://fastly.jsdelivr.net/gh/xia-skot/Catan_Pics/img/%E9%93%81%E7%9F%BF%E7%9F%B3.png';

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  [ResourceType.Lumber]: LUMBER_ICON,
  [ResourceType.Brick]: BRICK_ICON,
  [ResourceType.Wool]: WOOL_ICON,
  [ResourceType.Grain]: GRAIN_ICON,
  [ResourceType.Ore]: ORE_ICON,
};
