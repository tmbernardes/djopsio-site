(function(){
  
  var D=window.DJOPSDialog;
  if(!D||typeof HTMLDialogElement==="undefined"||!HTMLDialogElement.prototype.showModal)return;
  var PARAMS="dynamicHeight=1";
  var TITLE="Request DJOPS beta access";   
  var ORIGIN="https://tally.so", FORM=ORIGIN+"/r/";
  var links=[].slice.call(document.querySelectorAll('a[href^="'+FORM+'"]'));
  var made=null;
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e}
  function make(href){
    var dlg=el("dialog","beta-dlg"), top=el("div","beta-top"), closer=el("button","beta-close","\u00d7"), body=el("div","beta-body");
    dlg.setAttribute("aria-label",TITLE);   
    closer.type="button"; closer.setAttribute("aria-label","Close");
    top.appendChild(closer);
    var say=el("p","beta-say","Loading the form…"); say.setAttribute("role","status");
    var fr=el("iframe","beta-frame"); fr.title=TITLE; fr.setAttribute("tabindex","0");
    body.appendChild(say); body.appendChild(fr); dlg.appendChild(top); dlg.appendChild(body); document.body.appendChild(dlg);
    var late=null;
    fr.addEventListener("load",function(){clearTimeout(late);say.hidden=true});
    var dl=D(dlg,closer,{});
    function start(){
      fr.src=href.replace(FORM,ORIGIN+"/embed/")+(href.indexOf("?")<0?"?":"&")+PARAMS;
      late=setTimeout(function(){say.textContent="";var a=el("a","",  "The form is slow to load. Open it in a new tab.");a.href=href;a.target="_blank";a.rel="noopener";say.appendChild(a)},12000);
    }
    return {dl:dl,start:start,frame:fr};
  }
  function onClick(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    e.preventDefault();
    var a=e.currentTarget;
    if(!made){made=make(a.getAttribute("href"));made.start()}
    made.dl.open(a);
  }
  links.forEach(function(a){a.setAttribute("aria-haspopup","dialog");a.addEventListener("click",onClick)});
})();
