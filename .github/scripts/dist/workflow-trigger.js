// workflow-trigger.ts
import { getOctokit } from "@actions/github";
async function triggerWorkflow(options) {
  const { target, prNumber, ref, token, owner, repo } = options;
  const workflowMap = {
    "api": "api-ci.yml",
    "frontend": "frontend-ci.yml"
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
    const response = await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowFileName,
      ref,
      inputs: {
        pr_number: prNumber.toString()
      }
    });
    return {
      success: true,
      workflowRunId: Date.now(),
      // 実際の実装では正しいIDを取得
      workflowName: workflowFileName
    };
  } catch (error) {
    return {
      success: false,
      error: `GitHub API error: ${error.message || "Unknown error"}`
    };
  }
}
export {
  triggerWorkflow
};
//# sourceMappingURL=workflow-trigger.js.map
