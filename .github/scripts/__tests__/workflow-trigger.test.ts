import { describe, it, expect, vi } from 'vitest';
import { triggerWorkflow } from '../workflow-trigger';

// @actions/github モジュールをモック
vi.mock('@actions/github', () => ({
  getOctokit: vi.fn(() => ({
    rest: {
      actions: {
        createWorkflowDispatch: vi.fn().mockResolvedValue({ status: 204 })
      }
    }
  }))
}));

describe('triggerWorkflow', () => {
  describe('ワークフローのトリガー', () => {
    it('api CIワークフローを正しくトリガーする', async () => {
      const result = await triggerWorkflow({
        target: 'api',
        prNumber: 123,
        ref: 'feature/test-branch',
        token: 'test-token',
        owner: 'ryosuke-horie',
        repo: 'saifuu-main'
      });

      expect(result).toEqual({
        success: true,
        workflowRunId: expect.any(Number),
        workflowName: 'api-ci.yml'
      });
    });

    it('frontend CIワークフローを正しくトリガーする', async () => {
      const result = await triggerWorkflow({
        target: 'frontend',
        prNumber: 123,
        ref: 'feature/test-branch',
        token: 'test-token',
        owner: 'ryosuke-horie',
        repo: 'saifuu-main'
      });

      expect(result).toEqual({
        success: true,
        workflowRunId: expect.any(Number),
        workflowName: 'frontend-ci.yml'
      });
    });

    it('無効なターゲットでエラーを返す', async () => {
      const result = await triggerWorkflow({
        target: 'invalid',
        prNumber: 123,
        ref: 'feature/test-branch',
        token: 'test-token',
        owner: 'ryosuke-horie',
        repo: 'saifuu-main'
      });

      expect(result).toEqual({
        success: false,
        error: 'Invalid target: invalid'
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('GitHubAPIエラーを適切に処理する', async () => {
      // エラーを発生させるためのモックを再設定
      const { getOctokit } = await import('@actions/github');
      vi.mocked(getOctokit).mockImplementationOnce(() => ({
        rest: {
          actions: {
            createWorkflowDispatch: vi.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      } as any));

      const result = await triggerWorkflow({
        target: 'api',
        prNumber: 123,
        ref: 'feature/test-branch',
        token: 'invalid-token',
        owner: 'ryosuke-horie',
        repo: 'saifuu-main'
      });

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('GitHub API error')
      });
    });
  });
});