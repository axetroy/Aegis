# @aegis/capabilities

能力实现包。为应用提供 Storage、Network、Camera、Location、Clipboard、Notifications 等能力的具体实现，受 `@aegis/security` 权限策略控制。

## 导出

- **`StorageCapability`** — localStorage / sessionStorage 封装
- **`NetworkCapability`** — fetch / XMLHttpRequest 封装
- **`CameraCapability`** — 相机能力（预留接口）
- **`LocationCapability`** — 定位能力（预留接口）

## 依赖

`@aegis/protocol`、`@aegis/security`

## 用法

```ts
import { StorageCapability } from '@aegis/capabilities';

const storage = new StorageCapability({ namespace: 'app-1' });
await storage.setItem('key', 'value');
const val = await storage.getItem('key');
```
