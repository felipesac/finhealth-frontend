import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetUser, mockChain } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockChain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  // All chain methods return mockChain (thenable) by default
  for (const key of ['select', 'update', 'insert', 'eq', 'order']) {
    mockChain[key].mockImplementation(() => mockChain);
  }
  return { mockGetUser, mockChain };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => mockChain),
  }),
}));

import { GET, PATCH } from '@/app/api/notifications/route';

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish chain returns after clearAllMocks
    for (const key of ['select', 'update', 'insert', 'eq', 'order']) {
      mockChain[key].mockImplementation(() => mockChain);
    }
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    });
  });

  it('returns 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns empty array when table does not exist', async () => {
    mockChain.limit.mockResolvedValueOnce({
      data: null,
      error: { code: '42P01', message: 'relation does not exist' },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.unreadCount).toBe(0);
  });

  it('returns notifications and unread count', async () => {
    mockChain.limit.mockResolvedValueOnce({
      data: [
        { id: 'n1', title: 'Test', read: false },
        { id: 'n2', title: 'Test2', read: true },
      ],
      error: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.unreadCount).toBe(1);
  });
});

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish chain returns after clearAllMocks
    for (const key of ['select', 'update', 'insert', 'eq', 'order']) {
      mockChain[key].mockImplementation(() => mockChain);
    }
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.com' } },
    });
    // Make the chain awaitable — when `await chain.eq()` resolves, return success
    mockChain.then = vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null }));
  });

  it('returns 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'n1' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when no id or markAllRead', async () => {
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('marks single notification as read', async () => {
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'n1' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('marks all as read', async () => {
    const req = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
