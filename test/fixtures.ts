export const fixtures = {
  users: {
    /**
    * 一般テストユーザー
    */
    user1: {
      id: 'user1-cuid',
      displayName: 'User One',
    },
    /**
    * 表示名未設定ユーザー
    */
    user2: {
      id: 'user2-cuid',
      displayName: undefined,
    },
  },
  registrationCodes: {
    /**
    * 登録コード1: for user1
    */
    regCode1: {
      code: 'REGCODE1',
      userId: 'user1-cuid',
    },
    /**
    * 登録コード2: for user2
    */
    regCode2: {
      code: 'REGCODE2',
      userId: 'user2-cuid',
    },
  },
  sessions: {
    /**
    * セッション1: for user1
    */
    session1: {
      id: 'session1-cuid',
      userId: 'user1-cuid',
    },
    /**
    * セッション2: for user2
    */
    session2: {
      id: 'session2-cuid',
      userId: 'user2-cuid',
    },
    /**
    * 匿名セッション1
    */
    anonSession1: {
      id: 'anon-session1-cuid',
      userId: null,
    },
  },
  pendingRedirects: {
    /**
    * PendingRedirect1: for session1
    */
    pendingRedirect1: {
      id: 'pending-redirect1-cuid',
      sessionId: 'session1-cuid',
      redirectUrl: 'https://example.com/redirect1',
      postbackUrl: 'https://example.com/postback1',
      state: 'state123',
    },
    /**
    * PendingRedirect2: for anonSession1
    */
    pendingRedirect2: {
      id: 'pending-redirect2-cuid',
      sessionId: 'anon-session1-cuid',
      redirectUrl: 'https://example.com/redirect1',
      postbackUrl: 'https://example.com/postback1',
      state: 'state123',
    },
  },
}
