import { MOUNT_SITES } from './site-features';

export type InventorySettings = {budget:number;campRadios:number;communityRadios:number;includeG3:boolean;roamingCount:number;maxAgl:number;mainSite:string;mainRole:'router'|'router_late';supportRole:'client_base'|'router_late';allowedSiteIds:string[]};
export const DEFAULT_INVENTORY:InventorySettings={budget:3,campRadios:2,communityRadios:0,includeG3:false,roamingCount:2,maxAgl:12,mainSite:'auto',mainRole:'router',supportRole:'client_base',allowedSiteIds:MOUNT_SITES.map(s=>s.id)};
/** Planning search supports at most eight fixed devices; excess entered stock remains outside this run. */
export function availableRadios(s:InventorySettings){return Math.min(8,1+s.campRadios+s.communityRadios+Number(s.includeG3));}
export function validateInventory(raw:unknown):InventorySettings {
 if(!raw||typeof raw!=='object')throw new Error('Expected equipment settings.');
 const s=raw as InventorySettings;
 for(const [key,min,max] of [['budget',1,8],['campRadios',0,7],['communityRadios',0,7],['roamingCount',0,100]] as const){if(!Number.isInteger(s[key])||s[key]<min||s[key]>max)throw new Error(`Invalid ${key}.`);}
 if(typeof s.includeG3!=='boolean'||!Number.isFinite(s.maxAgl)||s.maxAgl<1.5||s.maxAgl>30||typeof s.mainSite!=='string'||!s.mainSite||s.mainSite.length>100||!['router','router_late'].includes(s.mainRole)||!['client_base','router_late'].includes(s.supportRole)||!Array.isArray(s.allowedSiteIds)||s.allowedSiteIds.length>100||s.allowedSiteIds.some(id=>typeof id!=='string'||!id||id.length>100)||new Set(s.allowedSiteIds).size!==s.allowedSiteIds.length)throw new Error('Invalid equipment constraints.');
 return {...s,allowedSiteIds:[...s.allowedSiteIds]};
}
export const EQUIPMENT_PROVENANCE=[
 {label:'AstralMesh MediumFast planning baseline',status:'Derived RF assumption; not a manufacturer measurement',url:'https://meshtastic.org/docs/overview/radio-settings/#presets',detail:'MediumFast: SF9, 250 kHz, 4/5; published 148 dB link budget assumes +22 dBm and 0 dBi, implying -126 dBm sensitivity. Existing custom plans retain earlier assumptions. The modeled 915 MHz is nominal, not the auto-hashed carrier.'},
 {label:'Owned main router — SenseCAP Solar Node P1',status:'Plan input; actual battery and firmware configuration require confirmation',url:'https://wiki.seeedstudio.com/meshtastic_solar_node/',detail:'SX1262 module: 22 dBm; supplied antenna: 2 dBi; 5 W panel. Plain P1 excludes supplied batteries and GPS. The MediumFast baseline uses a -126 dBm receiver threshold derived from Meshtastic’s published link budget; actual receiver performance needs validation.'},
 {label:'P1 and fixed camp deployment intent',status:'Reddit planning intent, not confirmed site installation',url:'https://www.reddit.com/r/NocturnalValley/comments/1wdxd53/comment/p9g2j7l/',detail:'The P1 main site and additional camp locations are optimized proposals; mounting, access, power and participation require confirmation.'},
 {label:'Camp radios — generic Heltec V4 profile',status:'Editable planning assumption, not a hardware commitment',detail:'Fixed camp radios use an assumed standard-power V4 RF profile until actual equipment is supplied.'},
 {label:'Optional Station G3',status:'Reddit offer, not confirmed deployment',url:'https://www.reddit.com/r/NocturnalValley/comments/1wdxd53/comment/p99x384/',detail:'Owner offered a Station G3 with a 5.8 dBi antenna. Its optimized location is a proposed campsite subject to owner confirmation; 22 dBm configured power remains a conservative planning assumption.'},
 {label:'Two Wio Tracker L1 Pro handhelds',status:'Roaming equipment count, not fixed relay locations',url:'https://www.reddit.com/r/NocturnalValley/comments/1wdxd53/meshtastic_lora_will_be_onsite/',detail:'Owner reported two L1 Pros with upgraded Muzi Works antennas; actual antenna gain remains unverified. Roaming count creates no pinned devices and adds no dependable backbone coverage.'},
 {label:'Meshtastic roles',status:'Official current role semantics',url:'https://raw.githubusercontent.com/meshtastic/protobufs/master/meshtastic/config.proto',detail:'CLIENT_BASE treats favorites as ROUTER_LATE and other traffic as CLIENT; ROUTER_LATE rebroadcasts after other modes. RF feasibility does not simulate packet contention or duplicate suppression.'},
];
