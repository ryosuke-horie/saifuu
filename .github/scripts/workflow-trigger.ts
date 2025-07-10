import { getOctokit } from '@actions/github';

export interface TriggerOptions {
  target: string;
  prNumber: number;
  ref: string;
  token: string;
  owner: string;
  repo: string;
}

export interface TriggerResult {
  success: boolean;
  workflowRunId?: number;
  workflowName?: string;
  error?: string;
}

export async function triggerWorkflow(options: TriggerOptions): Promise<TriggerResult> {
  const { target, prNumber, ref, token, owner, repo } = options;
  
  // ターゲットからワークフローファイル名を決定
  const workflowMap: Record<string, string> = {
    'api': 'api-ci.yml',
    'frontend': 'frontend-ci.yml'
  };
  
  const workflowFileName = workflowMap[target];
  if (!workflowFileName) {
    return {
      success: false,
      error: `Invalid target: ${target}`
    };
  }
  
  try {
    const octokit = getOctokit(token);
    
    // workflow_dispatch イベントをトリガー
    const response = await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowFileName,
      ref,
      inputs: {
        pr_number: prNumber.toString()
      }
    });
    
    // ワークフローの実行IDを取得（実際の実装では追加のAPIコールが必要）
    // ここでは簡略化のためダミーのIDを返す
    return {
      success: true,
      workflowRunId: Date.now(), // 実際の実装では正しいIDを取得
      workflowName: workflowFileName
    };
  } catch (error: any) {
    return {
      success: false,
      error: `GitHub API error: ${error.message || 'Unknown error'}`
    };
  }
}