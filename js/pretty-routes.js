(function () {
  const { protocol, hostname, pathname, search, hash } = window.location;
  if (protocol !== 'http:' && protocol !== 'https:') {
    return;
  }

  const prettyRoutes = {
    '/home.html': '/',
    '/index.html': '/',
    '/event.html': '/events',
    '/rent.html': '/rent',
    '/login.html': '/login',
    '/gallery.html': '/gallery',
    '/gallery2.html': '/gallery',
    '/viewer.html': '/viewer',
    '/flyer.html': '/flyer',
    '/flyer3.html': '/flyer3',
    '/404.html': '/404'
  };

  const lowerPath = pathname.toLowerCase();
  const prettyPath = prettyRoutes[lowerPath];
  if (prettyPath) {
    const nextUrl = `${prettyPath}${search}${hash}`;
    if (nextUrl !== `${pathname}${search}${hash}`) {
      history.replaceState(null, '', nextUrl);
    }
    return;
  }

  if (lowerPath.endsWith('.html')) {
    window.location.replace('/404.html');
  }
})();
