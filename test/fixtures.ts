export const fixtures = {
  users: {
    /**
    * 一般テストユーザー
    */
    user1: {
      id: '3KKJnOhz',
      displayName: 'User One',
    },
    /**
    * 表示名未設定ユーザー
    */
    user2: {
      id: '7BBLmPqv',
      displayName: undefined,
    },
  },
  registrationCodes: {
    /**
    * 登録コード1: for user1
    */
    regCode1: {
      code: 'REGCODE1',
      userId: '3KKJnOhz',
    },
    /**
    * 登録コード2: for user2
    */
    regCode2: {
      code: 'REGCODE2',
      userId: '7BBLmPqv',
    },
  },
  sessions: {
    /**
    * セッション1: for user1
    */
    session1: {
      id: 'cmgr08bdq000b04l7aidp19j3',
      userId: '3KKJnOhz',
    },
    /**
    * セッション2: for user2
    */
    session2: {
      id: 'cmgr08qv9000c04l7cais7i9m',
      userId: '7BBLmPqv',
    },
    /**
    * 匿名セッション1
    */
    anonSession1: {
      id: 'cmgr093np000d04l7heai0uaz',
      userId: null,
    },
  },
  pendingRedirects: {
    /**
    * PendingRedirect1: for session1
    */
    pendingRedirect1: {
      id: 'cmgr09cqs000e04l79tisg4ve',
      sessionId: 'cmgr08bdq000b04l7aidp19j3',
      redirectUrl: 'https://example.com/redirect1',
      postbackUrl: 'https://example.com/postback1',
      state: 'state123',
    },
    /**
    * PendingRedirect2: for anonSession1
    */
    pendingRedirect2: {
      id: 'cmgr0a2ey000f04l786qjh7iu',
      sessionId: 'cmgr093np000d04l7heai0uaz',
      redirectUrl: 'https://example.com/redirect1',
      postbackUrl: 'https://example.com/postback1',
      state: 'state123',
    },
  },
}
