// 子应用只依赖协议，而不依赖宿主 React Router / Vue Router 实例
export interface NavigationService {
  navigate(path: string): void;
  replace(path: string): void;
  getCurrentPath(): string;
}

export function createBrowserNavigation(): NavigationService {
  return {
    navigate(path) {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    replace(path) {
      window.history.replaceState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    getCurrentPath() {
      return window.location.pathname;
    },
  };
}
// 生产实现还需接入主应用路由生命周期、权限与路径校验。
