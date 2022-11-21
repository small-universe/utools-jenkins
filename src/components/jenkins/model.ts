
enum JenkinsClassTypeEnum {
    // 快捷添加的job
    FREE_STYLE_PROJECT = 'hudson.model.FreeStyleProject',
    // 多分支流水线
    WORKFLOW_MULTI_BRANCH_PROJECT = 'org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject',
    // 工作流下的job
    WORKFLOW_JOB = 'org.jenkinsci.plugins.workflow.job.WorkflowJob'
}

interface IJobListRequestParam {
    viewName:string,
    workflowName:string
}

export { JenkinsClassTypeEnum, IJobListRequestParam };

