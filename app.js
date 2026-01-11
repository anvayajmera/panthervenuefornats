document.addEventListener("DOMContentLoaded", () => {
    const pageWrapper = document.getElementById('page-wrapper');
    const mainHead = document.head;

    const routeMap = {
        '/': '/home.html',
        '/events': '/event.html',
        '/rent': '/rent.html',
        '/login': '/login.html',
        '/gallery': '/gallery2.html',
        '/viewer': '/viewer.html',
        '/flyer': '/flyer.html',
        '/flyer3': '/flyer3.html',
        '/404': '/404.html'
    };

    const legacyMap = {
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

    const normalizePath = (path) => {
        if (!path) return '/';
        const trimmed = path.replace(/\/+$/, '');
        return trimmed === '' ? '/' : trimmed;
    };

    const canonicalizePath = (path) => {
        const normalized = normalizePath(path);
        return legacyMap[normalized] || normalized;
    };

    const resolveRoute = (path) => {
        const canonical = canonicalizePath(path);
        const fetchUrl = routeMap[canonical];
        if (fetchUrl) {
            return { canonical, fetchUrl };
        }
        return { canonical: '/404', fetchUrl: routeMap['/404'] };
    };

    // --- Core Functions ---

    /**
     * Swaps <link> and <style> tags in the main document's <head>.
     * It removes the old page's assets and adds the new ones.
     */
    const swapHeadTags = (newDoc) => {
        // Remove old page-specific assets
        mainHead.querySelectorAll('[data-spa-asset]').forEach(tag => tag.remove());

        // Add new assets from the fetched document
        const newTags = newDoc.head.querySelectorAll('link[rel="stylesheet"], style, link[rel="prefetch"], meta, title, script[src]');
        newTags.forEach(tag => {
            const newTag = document.createElement(tag.tagName);
            for (const attr of tag.attributes) {
                newTag.setAttribute(attr.name, attr.value);
            }
            newTag.setAttribute('data-spa-asset', 'true'); // Mark as a page-specific asset
            if (!tag.src) {
                newTag.textContent = tag.textContent; // For inline <style> and <script>
            }
            mainHead.appendChild(newTag);
        });
    };

    /**
     * Re-creates and executes only the INLINE scripts from the loaded body.
     */
    const executeBodyScripts = (container) => {
        const scripts = container.querySelectorAll('script:not([src])');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    };

    /**
     * The main function to fetch, parse, and render a new page.
     */
    const loadPage = async (url, hash = '', search = '') => {
        const { canonical, fetchUrl } = resolveRoute(url);
        const nextUrl = `${canonical}${search}${hash}`;

        if (canonical !== url) {
            history.replaceState(null, '', nextUrl);
        }

        document.body.classList.add('loading');

        try {
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                if (canonical !== '/404') {
                    history.replaceState(null, '', '/404');
                    return loadPage('/404');
                }
                pageWrapper.innerHTML = '<h2>Error Loading Page</h2>';
                return;
            }
            const html = await response.text();

            // Use DOMParser to create a new document from the fetched HTML
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');

            // 1. Swap all necessary <head> tags
            swapHeadTags(newDoc);
            
            // 2. Replace the body content
            pageWrapper.innerHTML = newDoc.body.innerHTML;

            // 3. Execute any inline scripts that were in the new <body>
            executeBodyScripts(pageWrapper);

            // 4. Handle scrolling to a hash link if one exists
            if (hash) {
                const element = document.querySelector(hash);
                element?.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo(0, 0);
            }

        } catch (error) {
            console.error('Failed to load page:', error);
            pageWrapper.innerHTML = '<h2>Error Loading Page</h2>';
        } finally {
            // Use a short delay to allow content to render before fading in
            setTimeout(() => document.body.classList.remove('loading'), 50);
        }
    };


    // --- Event Listeners ---

    document.body.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (link && link.href && link.target !== '_blank' && new URL(link.href).origin === window.location.origin) {
            event.preventDefault();
            
            const targetUrl = new URL(link.href);
            const path = targetUrl.pathname;
            const hash = targetUrl.hash;
            const search = targetUrl.search;
            const targetPath = canonicalizePath(path);
            const currentPath = canonicalizePath(location.pathname);

            // Don't do anything if we're just clicking a hash link on the same page
            if (targetPath === currentPath && search === location.search && hash) {
                 const element = document.querySelector(hash);
                 element?.scrollIntoView({ behavior: 'smooth' });
                 return;
            }
            
            if (targetPath === currentPath && search === location.search) return;

            history.pushState(null, '', `${targetPath}${search}${hash}`);
            loadPage(targetPath, hash, search);
        }
    });

    window.addEventListener('popstate', () => {
        loadPage(location.pathname, location.hash, location.search);
    });

    // --- Initial Load ---
    loadPage(location.pathname, location.hash, location.search);
});
