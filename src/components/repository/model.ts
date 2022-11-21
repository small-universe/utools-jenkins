export interface IGitPlatformAccount {
    host: string,
    token: string,
    username?: string,
    avatarUrl?: string
    platform?: string
}

export interface IUtoolsGitAccount {
    _id: string,
    data: IGitPlatformAccount,
    _rev?: string
}
export enum GitPlatformEnum {
    GIT_LAB = "GitLab",
    GIT_HUB = "GitHub",
    GITEE = "Gitee",
    GITEA = 'Gitea'
}
