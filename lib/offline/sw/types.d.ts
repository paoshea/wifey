/// <reference lib="webworker" />

declare global {
    interface ServiceWorkerGlobalScopeEventMap {
        install: ExtendableEvent;
        activate: ExtendableEvent;
        fetch: FetchEvent;
        sync: SyncEvent;
        periodicsync: PeriodicSyncEvent;
        message: ExtendableMessageEvent;
    }

    interface ServiceWorkerGlobalScope {
        __WB_DISABLE_DEV_LOGS: boolean;
        caches: CacheStorage;
        clients: Clients;
        registration: ServiceWorkerRegistration;
        skipWaiting(): Promise<void>;
        addEventListener<K extends keyof ServiceWorkerGlobalScopeEventMap>(
            type: K,
            listener: (event: ServiceWorkerGlobalScopeEventMap[K]) => void
        ): void;
        addEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject
        ): void;
    }

    interface ExtendableEvent extends Event {
        waitUntil(promise: Promise<any>): void;
    }

    interface FetchEvent extends ExtendableEvent {
        request: Request;
        respondWith(response: Promise<Response> | Response): void;
    }

    interface SyncEvent extends ExtendableEvent {
        tag: string;
        lastChance: boolean;
    }

    interface PeriodicSyncEvent extends ExtendableEvent {
        tag: string;
    }

    interface ExtendableMessageEvent extends ExtendableEvent {
        data: any;
        source: Client | MessagePort | ServiceWorker;
        ports: ReadonlyArray<MessagePort>;
    }

    interface WindowClient extends Client {
        focused: boolean;
        visibilityState: DocumentVisibilityState;
        focus(): Promise<WindowClient>;
        navigate(url: string): Promise<WindowClient | null>;
    }

    interface Client {
        id: string;
        type: ClientType;
        url: string;
        postMessage(message: any, transfer?: Transferable[]): void;
    }

    interface Clients {
        claim(): Promise<void>;
        get(id: string): Promise<Client | undefined>;
        matchAll(options?: ClientQueryOptions): Promise<Client[]>;
        openWindow(url: string): Promise<WindowClient | null>;
    }

    interface ClientQueryOptions {
        includeUncontrolled?: boolean;
        type?: ClientType;
    }

    type ClientType = "window" | "worker" | "sharedworker";

    var self: ServiceWorkerGlobalScope;
}

export { };
