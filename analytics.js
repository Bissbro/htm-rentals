// HTM Rentals Analytics Tracker
(function() {
    const API = 'https://api.htmrentals.com';

    // Generate or retrieve IDs
    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    const visitorId = localStorage.getItem('htm_vid') || (() => {
        const id = generateId();
        localStorage.setItem('htm_vid', id);
        return id;
    })();

    const sessionId = sessionStorage.getItem('htm_sid') || (() => {
        const id = generateId();
        sessionStorage.setItem('htm_sid', id);
        return id;
    })();

    // Device detection
    const screenW = window.screen.width;
    const deviceType = screenW < 768 ? 'mobile' : screenW < 1024 ? 'tablet' : 'desktop';
    const referrer = document.referrer || '';
    const landingPage = window.location.pathname;

    // Core track function
    function track(eventType, data = {}) {
        const payload = {
            session_id: sessionId,
            visitor_id: visitorId,
            event_type: eventType,
            page: window.location.pathname,
            unit_id: data.unit_id || null,
            metadata: data.metadata || null,
            device_type: deviceType,
            screen_width: screenW,
            referrer: referrer,
            landing_page: landingPage
        };

        fetch(API + '/api/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(() => {}); // Silent fail
    }

    // Auto track page view
    track('PAGE_VIEW');

    // Expose globally
    window.HTMAnalytics = { track };

    // Track outbound clicks
    document.addEventListener('click', function(e) {
        const el = e.target.closest('a[href*="maps.app"], a[href*="google.com/maps"]');
        if (el) track('DIRECTIONS_TAP');
    });

    // Track scroll depth
    let maxScroll = 0;
    let scrollTracked = {};
    window.addEventListener('scroll', function() {
        const scrollPct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPct > maxScroll) {
            maxScroll = scrollPct;
            [25, 50, 75, 100].forEach(function(depth) {
                if (scrollPct >= depth && !scrollTracked[depth]) {
                    scrollTracked[depth] = true;
                    track('SCROLL_DEPTH', { metadata: { depth: depth } });
                }
            });
        }
    }, { passive: true });

    // Track time on page
    const pageStart = Date.now();
    window.addEventListener('beforeunload', function() {
        const seconds = Math.round((Date.now() - pageStart) / 1000);
        track('PAGE_EXIT', { metadata: { seconds: seconds } });
    });

})();
