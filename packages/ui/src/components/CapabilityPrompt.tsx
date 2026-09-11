import React, { useState } from 'react';
import { View } from './View';
import { Text } from './Text';
import { Button } from './Button';
import { BaseStyle } from '../types';
import { CapabilityName, PermissionDecision } from '@aegis/protocol';

export interface CapabilityPromptProps {
  capability: CapabilityName;
  description: string;
  onAllow: () => void;
  onDeny: () => void;
  style?: BaseStyle;
}

export const CapabilityPrompt: React.FC<CapabilityPromptProps> = ({
  capability,
  description,
  onAllow,
  onDeny,
  style,
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleAllow = () => {
    setVisible(false);
    onAllow();
  };

  const handleDeny = () => {
    setVisible(false);
    onDeny();
  };

  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        ...style,
      }}
    >
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 12,
            color: '#333',
          }}
        >
          {capability} 权限请求
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#666',
            marginBottom: 24,
            lineHeight: '20px',
          }}
        >
          {description}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={handleDeny}
            style={{
              backgroundColor: '#f5f5f5',
              color: '#666',
              padding: '8px 16px',
              borderRadius: 6,
            }}
          >
            拒绝
          </Button>
          <Button
            onClick={handleAllow}
            style={{
              backgroundColor: '#007AFF',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 6,
            }}
          >
            允许
          </Button>
        </View>
      </View>
    </View>
  );
};

CapabilityPrompt.displayName = 'CapabilityPrompt';
