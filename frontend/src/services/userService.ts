import { Broker } from "../models/broker";

export class UserService {
    private static instance: UserService | null = null;
    private p_loginedUser: Broker | null;

    private constructor(user: Broker) {
        this.p_loginedUser = user;
    }

    public static setInstance(user: Broker): void {
        UserService.instance = new UserService(user);
        localStorage.setItem('userInstance', JSON.stringify(user));
    }

    public static getCreatedInstance() {
        return UserService.instance;
    }

    public getLoginedUser(): Broker {
        return <Broker>this.p_loginedUser
    }

    public static exit() {
        UserService.instance = null;
    }
}