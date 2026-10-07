import {isFixed,type Node} from './radio';
import type {InventorySettings} from './equipment';
/** Reserve real stock for custom locked radios without changing their physical identity. */
export function inventoryLocks(nodes:Node[],inventory:InventorySettings):Node[]{
 const generic=[...Array.from({length:inventory.campRadios},(_,i)=>`camp-${i+1}`),...Array.from({length:inventory.communityRadios},(_,i)=>`community-${i+1}`)];
 const slots=new Set(['primary-p1',...generic,...(inventory.includeG3?['offered-g3']:[])]),locked=nodes.filter(n=>isFixed(n)&&n.locked),used=new Set<string>();
 for(const n of locked){const slot=n.inventorySlot??n.id;if(slots.has(slot)){if(used.has(slot))throw new Error('Two locked radios claim the same equipment slot.');used.add(slot);}}
 return locked.map(n=>{const slot=n.inventorySlot??n.id;if(slots.has(slot))return n;if(n.inventorySlot)throw new Error('A locked radio uses equipment removed from the inventory. Unlock it or restore the equipment count.');if(n.kind==='p1')throw new Error('The main P1 uses the primary-p1 inventory identity. Import it with that identity before locking.');const free=generic.find(id=>!used.has(id));if(!free)throw new Error('No camp/community equipment slot is free for this locked radio. Increase available equipment or unlock it.');used.add(free);return{...n,inventorySlot:free};});
}
/** A complete infrastructure recomputation must not erase deliberate roaming test locations. */
export function withRoamingTests(fixed:Node[],previous:Node[]):Node[]{const roaming=previous.filter(n=>!isFixed(n));if(roaming.some(n=>fixed.some(v=>v.id===n.id)))throw new Error('A roaming test radio has an infrastructure inventory ID. Give it a unique ID in your imported plan before recomputing; your current plan is unchanged.');return [...fixed,...roaming];}
