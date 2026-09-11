import React from 'react';
import { View, type ViewProps } from './View';
import { Text } from './Text';
import { BaseStyle } from '../types';

export interface ListProps extends Omit<ViewProps, 'data'> {
  data: readonly unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
  keyExtractor?: (item: unknown, index: number) => string;
  style?: BaseStyle;
  ItemSeparatorComponent?: React.FC | null;
  ListFooterComponent?: React.ReactNode;
  ListHeaderComponent?: React.ReactNode;
}

export const List: React.FC<ListProps> = ({
  data,
  renderItem,
  keyExtractor,
  style,
  ItemSeparatorComponent,
  ListFooterComponent,
  ListHeaderComponent,
  ...props
}) => {
  const extractKey = keyExtractor ?? ((_item, index) => String(index));

  return (
    <View style={style} {...props}>
      {ListHeaderComponent && <>{ListHeaderComponent}</>}
      {data.map((item, index) => (
        <React.Fragment key={extractKey(item, index)}>
          {index > 0 && ItemSeparatorComponent && <ItemSeparatorComponent />}
          {renderItem(item, index)}
        </React.Fragment>
      ))}
      {ListFooterComponent && <>{ListFooterComponent}</>}
    </View>
  );
};

List.displayName = 'List';

export interface FlatListProps extends Omit<ListProps, 'data' | 'renderItem'> {
  data: readonly unknown[];
  renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
}

export const FlatList: React.FC<FlatListProps> = ({
  data,
  renderItem,
  ...props
}) => {
  return (
    <List
      data={data}
      renderItem={(item, index) => renderItem({ item, index })}
      {...props}
    />
  );
};

FlatList.displayName = 'FlatList';
