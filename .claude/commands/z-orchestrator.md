# Orchestrator

Split complex tasks into sequential steps, where each step can contain multiple parallel subtasks.

## Process

1. **Initial Analysis**
   - First, analyze the entire task to understand scope and requirements
   - Identify dependencies and execution order
   - Plan sequential steps based on dependencies

2. **Step Planning**
   - Break down into 2-4 sequential steps
   - Each step can contain multiple parallel subtasks
   - Define what context from previous steps is needed

3. **Step-by-Step Execution**
   - Execute all subtasks within a step in parallel
   - Wait for all subtasks in current step to complete
   - Pass relevant results to next step
   - Request concise summaries (100-200 words) from each subtask

4. **Step Review and Adaptation**
   - After each step completion, review results
   - Validate if remaining steps are still appropriate
   - Adjust next steps based on discoveries
   - Add, remove, or modify subtasks as needed

5. **Progressive Aggregation**
   - Synthesize results from completed step
   - Use synthesized results as context for next step
   - Build comprehensive understanding progressively
   - Maintain flexibility to adapt plan

6. **Create PR**
    - Create PR. Use gh command.
    - before create pr, check typecheck, format

7. **After Create PR Check CI Success and Claude Code Review**
    - Check CI Passed
    - Check Claude Code Review Comment
    - Fix High or middle revel reviews

## Example Usage with Agents

When given "analyze test lint and commit":

**Step 1: Initial Analysis** (1 subtask)
- Analyze project structure to understand test/lint setup
- Identify frontend vs backend components

**Step 2: Quality Checks** (parallel subtasks)
- Run tests and capture results
- Run linting and type checking
- Check git status and changes

**Step 3: Fix Issues** (parallel subtasks with specialized agents)
- **frontend-developer**: Fix frontend linting/type errors found in Step 2
- **backend-developer**: Fix backend test failures found in Step 2
- Prepare commit message based on changes

*Agent Context Passing:*
- Error logs and file paths from Step 2
- Specific error messages and line numbers
- Test failure details

*Review: If no errors found in Step 2, skip fixes and proceed to commit*

**Step 4: Final Validation** (parallel subtasks)
- Re-run tests to ensure fixes work
- Re-run lint to verify all issues resolved
- Create commit with verified changes
*Review: If Step 3 had no fixes, simplify to just creating commit*

## Key Benefits

- **Sequential Logic**: Steps execute in order, allowing later steps to use earlier results
- **Parallel Efficiency**: Within each step, independent tasks run simultaneously
- **Memory Optimization**: Each subtask gets minimal context, preventing overflow
- **Progressive Understanding**: Build knowledge incrementally across steps
- **Clear Dependencies**: Explicit flow from analysis → execution → validation

## Implementation Notes

- Always start with a single analysis task to understand the full scope
- Group related parallel tasks within the same step
- Pass only essential findings between steps (summaries, not full output)
- Use TodoWrite to track both steps and subtasks for visibility
- After each step, explicitly reconsider the plan:
  - Are the next steps still relevant?
  - Did we discover something that requires new tasks?
  - Can we skip or simplify upcoming steps?
  - Should we add new validation steps?

## Agent Integration Strategy

### When to Use Specialized Agents
- **Step 3+**: Implementation and fix steps benefit most from agents
- **Parallel Work**: Different agents can work on frontend/backend simultaneously
- **Context Isolation**: Each agent receives only relevant error context

### Context Passing to Agents
1. **Error Context**:
   - Specific error messages and stack traces
   - Failed test names and assertions
   - Linting rule violations

2. **File Context**:
   - List of affected files
   - Recent changes from git diff
   - Dependencies and imports

3. **Project Context**:
   - Technology stack identification from Step 1
   - Build/test configuration
   - Coding standards and patterns

### Agent Selection Logic
- Files in `components/`, `pages/`, `app/` → **frontend-developer**
- Files in `api/`, `services/`, `models/` → **backend-developer**
- Mixed changes → Both agents work in parallel on their domains

## Adaptive Planning Example

```
Initial Plan: Step 1 → Step 2 → Step 3 → Step 4

After Step 2: "No errors found in tests or linting"
Adapted Plan: Step 1 → Step 2 → Skip Step 3 → Simplified Step 4 (just commit)

After Step 2: "Found critical architectural issue"
Adapted Plan: Step 1 → Step 2 → New Step 2.5 (analyze architecture) → Modified Step 3
```

## Branch Naming Convention

- Format: `issue-{ISSUE_NUMBER}`
- Examples: `issue-123`, `issue-456`, `issue-789`
- This ensures clear traceability between branches, PRs, and Issues

## Git Workflow

1. Fetch Issue details from GitHub
2. Create and checkout branch `issue-{ISSUE_NUMBER}`
3. Implement solution following the sequential steps
4. Commit changes with meaningful messages referencing the Issue
5. Push branch and create Pull Request
6. Link PR to original Issue (GitHub auto-links if PR title/description mentions Issue #)
7. Request appropriate reviews based on Issue scope and impact
