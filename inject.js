// Injected into browser webviews to sniff video playback
function rep(u,d){try{FlexSiteBridge.reportMedia(JSON.stringify({url:String(u).slice(0,700),pageUrl:location.href.slice(0,200),durationSec:d||0}))}catch(e){}}
function chk(v){var u=v.currentSrc||v.src;if(u&&u.indexOf("blob:")!==0&&(!v.duration||!isFinite(v.duration)||v.duration>60))rep(u,v.duration)}
document.addEventListener("play",function(e){if(e.target&&e.target.tagName==="VIDEO")chk(e.target)},true);
document.addEventListener("loadedmetadata",function(e){if(e.target&&e.target.tagName==="VIDEO")chk(e.target)},true);
