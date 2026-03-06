/**
 * Simple SPA Router for SolQueue
 */
export class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentRoute = null;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const route = this.routes.find(r => r.path === hash) || this.routes.find(r => r.path === '/');

        if (route && route !== this.currentRoute) {
            this.currentRoute = route;
            if (route.onEnter) route.onEnter();
        }
    }

    navigate(path) {
        window.location.hash = path;
    }
}
