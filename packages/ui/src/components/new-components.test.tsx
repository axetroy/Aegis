import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from './Input';
import { Form } from './Form';
import { ScrollView } from './ScrollView';
import { List, FlatList } from './List';
import { CapabilityPrompt } from './CapabilityPrompt';
import { CapabilityName } from '@aegis/protocol';

describe('Input Component', () => {
  it('应渲染 input 元素', () => {
    render(<Input placeholder="请输入" />);
    const input = screen.getByPlaceholderText('请输入');
    expect(input).toBeInTheDocument();
  });

  it('受控模式应显示 value', () => {
    render(<Input value="hello" />);
    const input = screen.getByDisplayValue('hello');
    expect(input).toBeInTheDocument();
  });

  it('onChangeText 应被调用', () => {
    const handleChange = vi.fn();
    render(<Input onChangeText={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledWith('test');
  });

  it('disabled 状态应应用样式', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('secureTextEntry 应切换为 password 类型', () => {
    render(<Input secureTextEntry />);
    const inputs = document.querySelectorAll('input');
    expect(inputs[0].type).toBe('password');
  });
});

describe('Form Component', () => {
  it('应提交表单数据', () => {
    const handleSubmit = vi.fn();
    render(
      <Form onSubmit={handleSubmit}>
        <input name="username" defaultValue="admin" />
        <input name="password" defaultValue="secret" />
        <button type="submit">提交</button>
      </Form>
    );
    fireEvent.click(screen.getByText('提交'));
    expect(handleSubmit).toHaveBeenCalledWith({ username: 'admin', password: 'secret' });
  });
});

describe('ScrollView Component', () => {
  it('应渲染子元素', () => {
    render(
      <ScrollView>
        <div data-testid="content">Content</div>
      </ScrollView>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('onScroll 事件应触发', () => {
    const handleScroll = vi.fn();
    render(<ScrollView onScroll={handleScroll} />);
    const scrollView = document.querySelector('div[style*="overflow: auto"]');
    expect(scrollView).toBeInTheDocument();
    if (scrollView) {
      fireEvent.scroll(scrollView);
    }
    expect(handleScroll).toHaveBeenCalled();
  });
});

describe('List/FlatList Component', () => {
  const items = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  it('List 应渲染所有项', () => {
    render(
      <List
        data={items}
        keyExtractor={(item) => (item as { id: string }).id}
        renderItem={(item) => <div data-testid={`item-${(item as { id: string }).id}`}>{(item as { name: string }).name}</div>}
      />
    );
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    expect(screen.getByTestId('item-3')).toBeInTheDocument();
  });

  it('FlatList 应正确传递 props', () => {
    const renderItem = vi.fn(({ item }: { item: unknown; index: number }) => <div>{(item as { name: string }).name}</div>);
    render(<FlatList data={items} renderItem={renderItem} />);
    expect(renderItem).toHaveBeenCalledTimes(3);
    expect(renderItem.mock.calls[0]).toEqual([{ item: items[0], index: 0 }]);
    expect(renderItem.mock.calls[1]).toEqual([{ item: items[1], index: 1 }]);
    expect(renderItem.mock.calls[2]).toEqual([{ item: items[2], index: 2 }]);
  });

  it('应支持分隔组件', () => {
    const Separator = () => <div data-testid="separator">-</div>;
    render(
      <List
        data={items}
        ItemSeparatorComponent={Separator}
        keyExtractor={(item) => (item as { id: string }).id}
        renderItem={(item) => <div>{(item as { name: string }).name}</div>}
      />
    );
    expect(screen.getAllByTestId('separator')).toHaveLength(2);
  });
});

describe('CapabilityPrompt Component', () => {
  it('应显示权限请求对话框', () => {
    render(
      <CapabilityPrompt
        capability={CapabilityName.Storage}
        description="需要访问存储空间"
        onAllow={() => undefined}
        onDeny={() => undefined}
      />
    );
    expect(screen.getByText('storage 权限请求')).toBeInTheDocument();
    expect(screen.getByText('需要访问存储空间')).toBeInTheDocument();
  });

  it('点击允许应调用 onAllow 并隐藏', () => {
    const handleAllow = vi.fn();
    const handleDeny = vi.fn();
    render(
      <CapabilityPrompt
        capability={CapabilityName.Network}
        description="需要网络权限"
        onAllow={handleAllow}
        onDeny={handleDeny}
      />
    );
    fireEvent.click(screen.getByText('允许'));
    expect(handleAllow).toHaveBeenCalled();
    expect(handleDeny).not.toHaveBeenCalled();
    expect(screen.queryByText('network 权限请求')).not.toBeInTheDocument();
  });

  it('点击拒绝应调用 onDeny 并隐藏', () => {
    const handleAllow = vi.fn();
    const handleDeny = vi.fn();
    render(
      <CapabilityPrompt
        capability={CapabilityName.Camera}
        description="需要相机权限"
        onAllow={handleAllow}
        onDeny={handleDeny}
      />
    );
    fireEvent.click(screen.getByText('拒绝'));
    expect(handleDeny).toHaveBeenCalled();
    expect(handleAllow).not.toHaveBeenCalled();
  });
});
