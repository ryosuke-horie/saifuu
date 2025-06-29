/**
 * Cloudflare Workers Test Environment Type Declarations
 */

declare module 'cloudflare:test' {
  import type { Env } from '../db'
  
  interface TestSELF {
    fetch(input: RequestInfo | URL | string, init?: RequestInit): Promise<Response>
    env: Env
  }
  
  export const SELF: TestSELF
}

// Vitest global functions
declare global {
  function describe(name: string, fn: () => void): void
  function it(name: string, fn: () => void | Promise<void>): void
  function expect<T>(actual: T): {
    toBe(expected: T): void
    toEqual(expected: T): void
    toBeDefined(): void
    toBeUndefined(): void
    toBeNull(): void
    toBeTruthy(): void
    toBeFalsy(): void
    toBeGreaterThan(expected: number): void
    toBeGreaterThanOrEqual(expected: number): void
    toBeLessThan(expected: number): void
    toBeLessThanOrEqual(expected: number): void
    toContain(expected: string | any): void
    toHaveProperty(property: string): void
    toBeInstanceOf(expected: any): void
    toMatchObject(expected: object): void
    not: {
      toBe(expected: T): void
      toEqual(expected: T): void
      toBeDefined(): void
      toThrow(): void
    }
  }
  function beforeEach(fn: () => void | Promise<void>): void
  function afterEach(fn: () => void | Promise<void>): void
  function beforeAll(fn: () => void | Promise<void>): void
  function afterAll(fn: () => void | Promise<void>): void
  
  interface Performance {
    now(): number
  }
  
  const performance: Performance
}

export {}