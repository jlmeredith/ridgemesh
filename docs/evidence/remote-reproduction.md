# Remote audit reproduction

Date: 2026-09-12. Host: `z370`. Run ID: `ridgemesh-audit-20260912-lXCeDe`. Source: `47a5558`. Runtime: Node `v22.23.2`. This is an audit diagnostic, not the repaired application's acceptance suite.

The source was streamed from `git archive 47a5558` into `/tmp/ridgemesh-audit-20260912-lXCeDe` on z370. On that box, `timeout 30 node --check scripts/grok-pwa-shared.mjs` returned exit 1:

```text
/tmp/ridgemesh-audit-20260912-lXCeDe/scripts/grok-pwa-shared.mjs:13
    .replaceAll('"', """)
                     ^^

SyntaxError: missing ) after argument list
    at checkSyntax (node:internal/main/check_syntax:74:5)

Node.js v22.23.2
```

Only the remote copies of `src/lib/radio.ts` and `src/lib/world.ts` had their `"./terrain"` import specifiers replaced with `"./terrain.ts"` so Node's TypeScript stripping could resolve them. No calculation code was changed. The following diagnostic ran on the box via `timeout 60 node --experimental-strip-types --input-type=module` with stdin. Never run it on the Mac.

```javascript
import { tintTerrain } from './src/lib/world.ts';
import { evaluateLink, profile, reachability, computeHeat, suggestBackbone, suggestClients } from './src/lib/radio.ts';
const params={crowd:0.45,bagLoss:true,clientsHop:false,meshHops:1,totemHops:1,communityTotems:false};
const nodes=[...suggestBackbone(),...suggestClients()];
const heat=computeHeat(nodes,params,20);
const changed=computeHeat(nodes,{...params,clientsHop:true,meshHops:7,totemHops:7},20);
const reach=reachability(nodes,params,'mesh');
const land=new Float32Array([0.1,0.2,0.3]);
const tint=tintTerrain(land,heat,'mesh');
const a={id:'a',kind:'m1',x:50,y:50,label:'M1'};
const b={id:'b',kind:'v4',x:70,y:70,label:'V4'};
const pair=evaluateLink(a,b,params);
const clientPair=evaluateLink(a,{...b,kind:'m1'},params);
const fine=profile({...a,agl:1.3},{...b,agl:6},false);
const coarse=profile({...a,agl:1.3},{...b,agl:6},true);
console.log(JSON.stringify({host:'z370',runId:'ridgemesh-audit-20260912-lXCeDe',sourceCommit:'47a5558',node:process.version,scope:'Dependency-free reproduction; remote copies change terrain import extensions only; step 20 bounds audit runtime, app default is 5.',tintPreservesBase:land.every((v,i)=>v===tint[i]),meshHeatUnchangedAfterHopAndRoleChanges:heat.mesh.every((v,i)=>v===changed.mesh[i]),reachabilityHops:[...reach.hops],reachabilityParents:[...reach.prev],mixedPairBudgetDb:pair.budgetDb,clientPairBudgetDb:clientPair.budgetDb,pathDistanceM:fine.distM,forestFineM:fine.forestM,forestCoarseM:coarse.forestM},null,2));
```

Exit code: 0. Output values (array whitespace compacted):

```json
{
  "host": "z370",
  "runId": "ridgemesh-audit-20260912-lXCeDe",
  "sourceCommit": "47a5558",
  "node": "v22.23.2",
  "scope": "Dependency-free reproduction; remote copies change terrain import extensions only; step 20 bounds audit runtime, app default is 5.",
  "tintPreservesBase": true,
  "meshHeatUnchangedAfterHopAndRoleChanges": true,
  "reachabilityHops": [["sug-w",0],["sug-e",0],["sug-s",0],["c-field",0],["c-grove",0],["c-star",0],["c-dream",0],["c-fam",0]],
  "reachabilityParents": [["sug-w",null],["sug-e",null],["sug-s",null],["c-field",null],["c-grove",null],["c-star",null],["c-dream",null],["c-fam",null]],
  "mixedPairBudgetDb": 152,
  "clientPairBudgetDb": 146,
  "pathDistanceM": 282.842712474619,
  "forestFineM": 231,
  "forestCoarseM": 121
}
```

The first parser check failed as expected; the diagnostic completed and exposed incorrect behavior. Neither result means the application passes tests or builds. See [audit limits](../RECOVERY-AUDIT-2026-09-12.md) and [planned acceptance work](../RECOVERY-WBS.md).
