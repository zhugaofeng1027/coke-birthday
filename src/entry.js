const params = new URLSearchParams(window.location.search);

if (params.get('preview') === 'phone') await import('./phone-preview.js');
else if (import.meta.env.DEV && params.get('score-fx') === '1') await import('./score-fx-preview.js');
else await import('./main.js');
