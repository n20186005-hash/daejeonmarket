const HOST='daejeonmarket.com';
const PAGES=new Set(['/','/privacy/','/terms/','/cookies/']);
export default { async fetch(request,env){
 const url=new URL(request.url);
 if(url.protocol!=='https:'||url.hostname===`www.${HOST}`){url.protocol='https:';url.hostname=HOST;url.port='';return Response.redirect(url.href,301);}
 if(PAGES.has(url.pathname+'/')){url.pathname+='/';return Response.redirect(url.href,301);}
 const assetURL=new URL(request.url);
 if(url.pathname==='/404.html')assetURL.pathname='/__missing_error_page__';
 const response=await env.ASSETS.fetch(new Request(assetURL,request));
 if(response.status===404||url.pathname==='/404.html'){const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex');return new Response(response.body,{status:404,headers});}
 return response;
}};
