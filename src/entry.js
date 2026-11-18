const preview = new URLSearchParams(window.location.search).get('preview');

if (preview === 'phone') await import('./phone-preview.js');
else await import('./main.js');
