import { GitPlatformEnum, IGitPlatformAccount } from '@/components/repository/model';
import { Gitlab, Projects, Users } from '@gitbeaker/browser';


/**
 * 当前登录用户
 * 
 * @param host 
 * @param token 
 */
export const getCurrentUser = async (host: string, token: string): Promise<IGitPlatformAccount> => {
    let user = {
        host: host,
        token: token,
        avatarUrl: "",
        username: "",
        platform: GitPlatformEnum.GIT_LAB
    }
    new Users({ host, token }).current().then(res => {
        user.avatarUrl = res.avatar_url
        user.username = res.username
    }).catch(err => {
        console.error(`[currentUser] ==> param ==> { ${host} ${token} } fail reason ==> ${err}`)
    })

    return user
}

export const listGitProject = async (request: { host: string, token: string }): Promise<any> => {
    if(!request || !request.host || !request.token) {
        return
    }
    return new Projects(request).all()
}