# @aegis/ui

Aegis UI 原语组件库。提供 `View`、`Text`、`Button`、`Input`、`Form`、`ScrollView`、`List` 等基础组件，与 `@aegis/renderer` 配合使用。

## 导出

- **`View`** — 容器组件
- **`Text`** — 文本组件
- **`Button`** — 按钮组件
- **`Input`** — 输入组件（受控/非受控）
- **`Form`** — 表单组件
- **`ScrollView`** — 滚动容器
- **`List`** — 列表组件

## 依赖

`@aegis/protocol`

## 用法

```tsx
import { View, Text, Button } from '@aegis/ui';

function App() {
  return (
    <View>
      <Text>Hello</Text>
      <Button onClick={() => alert('hi')}>Click</Button>
    </View>
  );
}
```

## 跨 renderer 事件

`Input` 的 `onChangeText`、`onFocus` 和 `onBlur` 通过 Aegis 事件协议派发。使用 `Form` 时，为 `Input` 设置 `name`，提交按钮使用 `type="submit"`：

```tsx
<Form onSubmit={(values) => console.log(values)}>
  <Input name="query" onChangeText={(value) => console.log(value)} />
  <Button type="submit">Search</Button>
</Form>
```

`ScrollView` 的 `onScroll` 接收可序列化快照，而不是 DOM `UIEvent`：

```ts
interface ScrollViewEvent {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
}
```
