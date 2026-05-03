import { ResourceType } from './types';

export const FOREST_IMG = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/u7AhKge - Imgur.jpg');
export const FIELDS_IMG = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/yG8cXii - Imgur.jpg');
export const PASTURE_IMG = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/O0rOQKN - Imgur.jpg');
export const Desert_IMG =  '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/bHGjRHQ - Imgur.jpg');
export const Mountains_IMG =  '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/ieLNUXP - Imgur.jpg');

// Resource Icons
export const LUMBER_ICON = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/树.png');
export const BRICK_ICON = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/砖块.png');
export const WOOL_ICON = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/羊.png');
export const GRAIN_ICON = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/小麦.png');
export const ORE_ICON = '/api/proxy-image?url=' + encodeURIComponent('http://tdyuzzmmy.hn-bkt.clouddn.com/img/铁矿石2.png');

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  [ResourceType.Lumber]: LUMBER_ICON,
  [ResourceType.Brick]: BRICK_ICON,
  [ResourceType.Wool]: WOOL_ICON,
  [ResourceType.Grain]: GRAIN_ICON,
  [ResourceType.Ore]: ORE_ICON,
};
