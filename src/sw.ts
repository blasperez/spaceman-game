self.addEventListener('install', (event: any) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
	self.clients.claim();
});

self.addEventListener('fetch', () => {
	// Network-first (let Vite/HTTP handle caching)
});