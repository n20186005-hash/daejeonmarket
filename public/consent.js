(() => {
  const KEY='djcm-cookie-preferences', DENY='djcm-analytics-denied', MARK='|djcm-analytics-denied|', ID='G-HXM22WWPKP';
  let immediateDeny=false;
  const messages={
    on:'분석을 허용하고 선택을 저장했습니다.',
    off:'분석을 거부하고 선택을 저장했습니다.',
    tab:'이 탭에서는 거부 표시가 유지되는 동안 분석이 비활성화됩니다. 브라우저의 공유 선택은 다를 수 있고 다른 탭에는 저장된 허용이 남아 있을 수 있습니다. 저장된 허용을 없애려면 브라우저 설정에서 사이트 데이터를 삭제하세요.',
    retained:'이 탭에서는 세션 또는 창 이름의 거부 표시가 유지되는 동안 사이트 내 이동과 새로고침에도 분석이 비활성화됩니다. 공유 선택을 확인하지 못했으며 다른 탭에는 저장된 허용이 남아 있을 수 있습니다. 저장된 허용을 없애려면 브라우저 설정에서 사이트 데이터를 삭제하세요.',
    page:'현재 페이지에서는 분석이 비활성화됩니다. 다음 페이지까지 거부를 유지할 수 없고 다른 탭에는 저장된 허용이 남아 있을 수 있습니다. 이동하거나 새로고침하기 전에 브라우저 설정에서 사이트 데이터를 삭제하세요.'
  };
  function denialState(){
    try{return {denied:immediateDeny||sessionStorage.getItem(DENY)==='1'||window.name.includes(MARK),failed:false};}
    catch{return {denied:true,failed:true};}
  }
  function state(){
    const denial=denialState();
    try{
      const saved=JSON.parse(localStorage.getItem(KEY)||'null');
      // An old grant must not revive while permission storage cannot be verified.
      localStorage.removeItem(KEY+'-write-check');
      if(localStorage.getItem(KEY+'-write-check')!==null)throw Error('Storage unavailable');
      localStorage.setItem(KEY+'-write-check','1');
      if(localStorage.getItem(KEY+'-write-check')!=='1')throw Error('Storage unavailable');
      localStorage.removeItem(KEY+'-write-check');
      if(localStorage.getItem(KEY+'-write-check')!==null)throw Error('Storage unavailable');
      const valid=typeof saved?.analytics==='boolean';
      return {analytics:!denial.failed&&!denial.denied&&valid&&saved.analytics,preferences:!denial.failed&&!denial.denied&&valid?saved:null,denied:denial.denied,failed:denial.failed,decided:valid||denial.denied,storedFalse:valid&&saved.analytics===false};
    }catch{return {analytics:false,preferences:null,denied:denial.denied,failed:true,decided:false,storedFalse:false};}
  }
  function read(){return state().preferences;}
  function apply(grant){
    window['ga-disable-'+ID]=!grant;
    if(!grant){window.gtag?.('consent','update',{analytics_storage:'denied'});return;}
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    if(!document.getElementById('djcm-ga4'))window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted'});
    if(document.getElementById('djcm-ga4'))return;
    const script=document.createElement('script');script.id='djcm-ga4';script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(script);
    window.gtag('js',new Date());window.gtag('config',ID,{allow_google_signals:false,allow_ad_personalization_signals:false});
  }
  function retainDenial(){
    immediateDeny=true;apply(false);let retained=false;
    try{sessionStorage.setItem(DENY,'1');retained=sessionStorage.getItem(DENY)==='1';}catch{}
    try{window.name=window.name.split(MARK).join('')+MARK;retained=window.name.includes(MARK)||retained;}catch{}
    return retained;
  }
  function clearDenial(){
    try{
      sessionStorage.getItem(DENY);const name=window.name;
      sessionStorage.removeItem(DENY);
      if(sessionStorage.getItem(DENY)!==null)return false;
      window.name=name.split(MARK).join('');
      return !window.name.includes(MARK);
    }catch{return false;}
  }
  function rollbackGrant(){
    try{
      localStorage.setItem(KEY,JSON.stringify({analytics:false}));
      if(JSON.parse(localStorage.getItem(KEY)||'null')?.analytics===false)return true;
    }catch{}
    try{
      localStorage.removeItem(KEY);
      return localStorage.getItem(KEY)===null;
    }catch{return false;}
  }
  function sync(message,current=state(),failedSave=false){
    apply(current.analytics);
    const checkbox=document.getElementById('analytics-toggle');
    if(checkbox)checkbox.checked=current.analytics;
    const text=message||(current.failed?messages.page:current.denied&&!current.storedFalse?messages.tab:current.decided?(current.analytics?messages.on:messages.off):'');
    const status=document.getElementById('cookie-status');if(status)status.textContent=text;
    const open=failedSave||!current.decided||current.failed||(current.denied&&!current.storedFalse);
    const banner=document.getElementById('cookie-banner');if(banner)banner.setAttribute('data-open',open?'true':'false');
    const bannerStatus=document.getElementById('cookie-banner-status');if(bannerStatus)bannerStatus.textContent=open?text:'';
    return current;
  }
  function save(analytics){
    analytics=analytics===true;let stored=false,retained=false;
    if(!analytics){
      retained=retainDenial();
      try{localStorage.setItem(KEY,JSON.stringify({analytics:false}));stored=JSON.parse(localStorage.getItem(KEY)||'null')?.analytics===false;}catch{}
    }else{
      try{
        if(state().failed||!clearDenial())throw Error('Choice unavailable');
        localStorage.setItem(KEY,JSON.stringify({analytics:true}));
        if(JSON.parse(localStorage.getItem(KEY)||'null')?.analytics!==true)throw Error('Choice not retained');
        immediateDeny=false;
        const current=state();if(current.failed||!current.analytics)throw Error('Choice unavailable');
        stored=true;
      }catch{
        rollbackGrant();
        retained=retainDenial();
      }
    }
    let current=state();
    if(stored&&analytics&&!current.analytics){
      rollbackGrant();
      retained=retainDenial();stored=false;current=state();
    }
    sync(stored?(current.analytics?messages.on:messages.off):(retained?messages.retained:messages.page),current,!stored);
    return stored;
  }
  window.djcmConsent={read,save};
  sync();
  const checkbox=document.getElementById('analytics-toggle');
  document.getElementById('cookies-essential')?.addEventListener('click',()=>save(false));
  document.getElementById('cookies-accept')?.addEventListener('click',()=>save(true));
  document.getElementById('save-cookies')?.addEventListener('click',()=>save(checkbox?.checked===true));
  document.getElementById('reject-cookies')?.addEventListener('click',()=>save(false));
  window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)sync();});
})();
