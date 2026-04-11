// --- HOOK GLOBAL WEBSOCKET POUR INTERCEPTION gameId & PTC monitoring ---
(function () {
	if (global.x) return;

	const OriginalWebSocket = window.WebSocket;

	function HookedWebSocket(this: WebSocket, url: string | URL, protocols?: string | string[]) {
		if (global.x) return;

		const ws = protocols !== undefined
			? new OriginalWebSocket(url, protocols)
			: new OriginalWebSocket(url);
		if (typeof url === "string" && url.includes("gameId=")) {
			const gameId = url.split("gameId=")[1];
			globalThis.kxsClient.actualGameId = gameId;

			// do things
			global.kxsClient.pingManager.setServerFromWebsocketHooking(new URL(url));

			const originalClose = ws.close.bind(ws);
			ws.close = function (code?: number, reason?: string) {
				globalThis.kxsClient.aliveplayer.stopObserving();
				global.kxsClient.pingManager.stop();
				globalThis.kxsClient.actualGameId = null;
				return originalClose(code, reason);
			};
		}
		return ws;
	}

	// Copie le prototype
	HookedWebSocket.prototype = OriginalWebSocket.prototype;
	// Copie les propriétés statiques (CONNECTING, OPEN, etc.)
	Object.defineProperties(HookedWebSocket, {
		CONNECTING: { value: OriginalWebSocket.CONNECTING, writable: false },
		OPEN: { value: OriginalWebSocket.OPEN, writable: false },
		CLOSING: { value: OriginalWebSocket.CLOSING, writable: false },
		CLOSED: { value: OriginalWebSocket.CLOSED, writable: false },
	});

	// Remplace le constructeur global
	(window as any).WebSocket = HookedWebSocket;
})();
