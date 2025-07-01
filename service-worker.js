// 缓存名称
const CACHE_NAME = 'simple-navigation-cache-v1';

// 需要缓存的资源
const urlsToCache = [
  '/',
  '/favicon.ico',
  'http://m.bidianer.com/iiii',
  'https://www.bidianer.com/iiii'
];

// 安装Service Worker
self.addEventListener('install', event => {
  // 在安装过程中打开一个缓存
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // 将所有资源添加到缓存中
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            // 删除旧的缓存
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 如果缓存中有响应，则返回缓存的响应
        if (cachedResponse) {
          return cachedResponse;
        }
        // 如果缓存中没有响应，则从网络获取
        return fetch(event.request).then(response => {
          // 将网络响应克隆一份并添加到缓存中
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          // 检查是否是HTML响应
          if (response.headers.get('content-type').includes('text/html')) {
            // 读取响应内容
            return response.clone().text().then(html => {
              // 过滤指定的CSS元素
              const elementsToRemove = [
                '.el-alert.el-alert--warning.is-light',
                '.wx-login-alert.panel',
                '.guest-function-guide.card-opacity.box',
                '.panel.card-opacity.fixed-slider-button.el-tooltip.item.focusing',
                '.panel.card-opacity.fixed-slider-button.el-dropdown-selfdefine.focusing',
                '.el-button.el-tooltip.go-home-btn.el-button--default.el-button--mini.focusing',
                '.flex.items-center.login',
                '.action.flex.single',
                '.web-header',
                '.category-operation.horizontal',
                '.right-icon.text-lighter.el-icon-more'
              ];

              elementsToRemove.forEach(selector => {
                const regex = new RegExp(`<${selector}[^>]*>.*?</${selector}>`, 'gs');
                html = html.replace(regex, '');
              });

              // 返回修改后的HTML内容
              return new Response(html, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            });
          }

          return response;
        });
      })
  );
});
