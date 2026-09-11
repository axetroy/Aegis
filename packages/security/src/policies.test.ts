import { describe, it, expect } from 'vitest';
import {
  validateNetworkPolicy,
  validateStoragePolicy,
  validateCameraPolicy,
  validateLocationPolicy,
  validateCapabilityPolicy,
  isNetworkAllowed,
  parseMemorySize,
  formatMemorySize,
  createResourceValidator,
} from './policies';
import { type CapabilityPolicy } from '@aegis/protocol';

describe('Policies', () => {
  describe('validateNetworkPolicy', () => {
    it('合法策略不应抛出', () => {
      expect(() => validateNetworkPolicy({ allow: ['example.com'] })).not.toThrow();
      expect(() => validateNetworkPolicy({ deny: ['evil.com'] })).not.toThrow();
      expect(() => validateNetworkPolicy({ allow: [], deny: [] })).not.toThrow();
    });

    it('非数组 allow/deny 应抛出', () => {
      expect(() => validateNetworkPolicy({ allow: 'example.com' as any }))
        .toThrow('allow');
      expect(() => validateNetworkPolicy({ deny: 'evil.com' as any }))
        .toThrow('deny');
    });
  });

  describe('validateStoragePolicy', () => {
    it('合法配额不应抛出', () => {
      expect(() => validateStoragePolicy({ quota: '10MB' })).not.toThrow();
      expect(() => validateStoragePolicy({ quota: '1GB' })).not.toThrow();
    });

    it('无效配额应抛出', () => {
      expect(() => validateStoragePolicy({ quota: '-1MB' as any }))
        .toThrow('Invalid memory size format');
    });
  });

  describe('validateCameraPolicy', () => {
    it('合法 mode 不应抛出', () => {
      expect(() => validateCameraPolicy({ mode: 'user' })).not.toThrow();
      expect(() => validateCameraPolicy({ mode: 'environment' })).not.toThrow();
    });

    it('非法 mode 应抛出', () => {
      expect(() => validateCameraPolicy({ mode: 'invalid' as any }))
        .toThrow('mode must be "user" or "environment"');
    });
  });

  describe('validateLocationPolicy', () => {
    it('合法 accuracy 不应抛出', () => {
      expect(() => validateLocationPolicy({ accuracy: 'high' })).not.toThrow();
      expect(() => validateLocationPolicy({ accuracy: 'low' })).not.toThrow();
    });

    it('非法 accuracy 应抛出', () => {
      expect(() => validateLocationPolicy({ accuracy: 'medium' as any }))
        .toThrow('accuracy must be "high" or "low"');
    });
  });

  describe('validateCapabilityPolicy', () => {
    it('完整合法策略不应抛出', () => {
      const policy: CapabilityPolicy = {
        storage: { quota: '10MB' },
        network: { allow: ['api.example.com'] },
        camera: { mode: 'user' },
        location: { accuracy: 'high' },
      };
      expect(() => validateCapabilityPolicy(policy)).not.toThrow();
    });
  });

  describe('isNetworkAllowed', () => {
    it('允许列表命中应返回 true', () => {
      const policy = { allow: ['api.example.com', 'cdn.example.com'] };
      expect(isNetworkAllowed('https://api.example.com/v1', policy)).toBe(true);
    });

    it('拒绝列表命中应返回 false', () => {
      const policy = { deny: ['evil.com'] };
      expect(isNetworkAllowed('https://evil.com/malware', policy)).toBe(false);
    });

    it('无策略时应允许所有', () => {
      const policy = {};
      expect(isNetworkAllowed('https://any.com', policy)).toBe(true);
    });
  });

  describe('parseMemorySize', () => {
    it('应正确解析 B', () => {
      expect(parseMemorySize('512B')).toBe(512);
    });

    it('应正确解析 KB', () => {
      expect(parseMemorySize('1KB')).toBe(1024);
    });

    it('应正确解析 MB', () => {
      expect(parseMemorySize('10MB')).toBe(10 * 1024 * 1024);
    });

    it('应正确解析 GB', () => {
      expect(parseMemorySize('1GB')).toBe(1024 * 1024 * 1024);
    });

    it('无效格式应抛出', () => {
      expect(() => parseMemorySize('abc')).toThrow('Invalid memory size format');
    });
  });

  describe('formatMemorySize', () => {
    it('小于 1KB 应显示 B', () => {
      expect(formatMemorySize(512)).toBe('512B');
    });

    it('小于 1MB 应显示 KB', () => {
      expect(formatMemorySize(2048)).toBe('2.00KB');
    });

    it('小于 1GB 应显示 MB', () => {
      expect(formatMemorySize(10 * 1024 * 1024)).toBe('10.00MB');
    });
  });

  describe('createResourceValidator', () => {
    it('应创建验证器实例', () => {
      const validator = createResourceValidator({ uiNodes: 1000 });
      expect(validator.checkNodes(500)).toBe(true);
      expect(validator.checkNodes(1500)).toBe(false);
    });

    it('无限制时应通过所有检查', () => {
      const validator = createResourceValidator({});
      expect(validator.checkMemory(1024 * 1024 * 1024)).toBe(true);
      expect(validator.checkStorage(1024 * 1024 * 1024)).toBe(true);
    });
  });
});
