(function(){
  var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IDLE="Play to see how it works";
  var Start={
    set:function(btn,state,busyLabel){
      var lab=btn.querySelector(".pl-label")||btn.parentNode.querySelector(".pl-label"), idle=btn.getAttribute("data-idle")||IDLE, busy=busyLabel||btn.getAttribute("data-busy")||"Playing";   
      var text=state==="busy"?busy:state==="done"?(btn.getAttribute("data-done")||"Replay"):state==="paused"?(btn.getAttribute("data-paused")||"Resume"):idle;   
      if(lab)lab.textContent=text;
      var ip=btn.querySelector(".i-play"), is=btn.querySelector(".i-pause");
      if(ip)ip.toggleAttribute("hidden",state==="busy"); if(is)is.toggleAttribute("hidden",state!=="busy");
      btn.setAttribute("aria-label",text);   
      btn.setAttribute("aria-pressed",state==="busy"?"true":"false");
      btn.setAttribute("data-state",state);
    }
  };
  function Demo(fig,btn,end,hooks){
    hooks=hooks||{};
    var els=[].slice.call(fig.querySelectorAll("[data-at]")), timers=[], running=false;
    function clear(){timers.forEach(clearTimeout);timers=[]}
    function allOn(){els.forEach(function(e){e.classList.add("is-on")})}
    function finish(){clear();running=false;allOn();Start.set(btn,"done");if(hooks.done)hooks.done()}
    function run(){
      clear();running=true;els.forEach(function(e){e.classList.remove("is-on")});
      if(hooks.reset)hooks.reset();
      Start.set(btn,"busy"); void fig.offsetWidth;
      els.forEach(function(e){timers.push(setTimeout(function(){e.classList.add("is-on")},+e.getAttribute("data-at")))});
      timers.push(setTimeout(finish,end));
    }
    btn.addEventListener("click",function(){
      if(reduce){allOn();Start.set(btn,"done");if(hooks.press)hooks.press("reduced");return}
      if(hooks.press)hooks.press(running?"stop":"start");   
      running?finish():run();
    });
    Start.set(btn,"idle");
    return {run:run,finish:finish};
  }
  
  function Dialog(dlg,closer,hooks){
    hooks=hooks||{};
    var opener=null, slot={stop:function(){}};
    function own(){return [].slice.call(dlg.querySelectorAll('button,[tabindex="0"]')).filter(function(n){return !n.disabled&&n.getClientRects().length&&getComputedStyle(n).visibility!=="hidden"})}
    dlg.setAttribute("tabindex","-1");   
    closer.addEventListener("click",function(){dlg.close()});
    dlg.addEventListener("click",function(e){if(e.target===dlg)dlg.close()});   
    dlg.addEventListener("keydown",function(e){
      if(e.key!=="Tab"||e.altKey||e.ctrlKey||e.metaKey)return;
      var f=own(); if(!f.length)return;
      e.preventDefault();
      var i=f.indexOf(document.activeElement), n=f.length;
      f[i<0?(e.shiftKey?n-1:0):(i+(e.shiftKey?n-1:1))%n].focus();
    });
    dlg.addEventListener("close",function(){
      if(hooks.close)hooks.close();
      var D=window.DJOPSDrums; if(D&&D.release)D.release(slot);
      if(opener)opener.focus();
    });
    return {slot:slot,open:function(from){
      opener=from; if(window.DJOPSTips)window.DJOPSTips.hide();
      var D=window.DJOPSDrums; if(D&&D.claim)D.claim(slot);
      if(!dlg.open){ dlg.showModal(); dlg.focus({preventScroll:true}); }   
    }};
  }
  window.DJOPSStart=Start; window.DJOPSDemo=Demo; window.DJOPSDialog=Dialog;
})();
