const HOST='daejeonmarket.com';
const PAGES=new Set(['/','/privacy/','/terms/','/cookies/']);
export default { async fetch(request,env){
 const url=new URL(request.url);
 if(url.protocol!=='https:'||url.hostname===`www.${HOST}`){url.protocol='https:';url.hostname=HOST;url.port='';return Response.redirect(url.href,301);}
 // 비자산 경로(파일 확장자 없음)는 끝에 슬래시를 붙여 정적 자산(index.html)이 해석되도록 합니다.
 const path=url.pathname;
 const hasExtension=/\.[a-zA-Z0-9]+$/.test(path);
 if(!hasExtension && path!=='/' && !path.endsWith('/')){url.pathname=path+'/';return Response.redirect(url.href,301);}
 if(PAGES.has(url.pathname)){url.pathname+='/';return Response.redirect(url.href,301);}
 const isErrorPage=['/404','/404/','/404.html'].includes(url.pathname);
 const assetURL=new URL(request.url);
 if(isErrorPage)assetURL.pathname='/__missing_error_page__';
 const response=await env.ASSETS.fetch(new Request(assetURL,request));
 if(response.status===404||isErrorPage){const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex');return new Response(response.body,{status:404,headers});}
 return response;
}};
