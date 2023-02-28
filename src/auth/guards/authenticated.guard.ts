// src/common/guards/authenticated.guard.ts
import { HttpService } from '@nestjs/axios';
import { ExecutionContext, Injectable, CanActivate, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AxiosResponse } from 'axios';

@Injectable()
export class AuthenticatedGuard implements CanActivate {

  constructor(
    private reflector: Reflector, 
    private httpService: HttpService){
  }

  async canActivate(context: ExecutionContext) {

    const isAnonymous = this.reflector.get<string[]>('isAnonymous', context.getHandler());
    if(isAnonymous) return true;

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers["authorization"];

    if(authorization == null) throw new UnauthorizedException("invalid jwt");

    const token = authorization.split(' ')[1];
    var data = {
      'token': token
    };

    const res = await this.getInstropect(data);
    if(res.status != 200) throw new UnauthorizedException(res.statusText);
    if(!res.data["active"]) throw new UnauthorizedException("invalid token");

    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) return true;

    return matchRoles(roles, res.data["role"]);
  }

  async getInstropect(data: any): Promise<AxiosResponse> {

    const basicAuth = `Basic ${btoa(process.env.OAUTH2_CLIENT_REGISTRATION_LOGIN_CLIENT_ID + ":" + process.env.OAUTH2_CLIENT_REGISTRATION_LOGIN_CLIENT_SECRET)}`;

    var promise = new Promise<AxiosResponse>((resolve, reject) => {
      this.httpService.post(`${process.env.OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER}/connect/introspect`, data, {
        headers: {
          'Authorization': basicAuth, 
          "Content-Type": 'application/x-www-form-urlencoded'
        }
      }).subscribe(res => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });

    return promise;
  }

  async getOpenIDConfig() {

    var promise = new Promise((resolve, reject) => {
      this.httpService.get(`${process.env.OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER}/.well-known/openid-configuration`).subscribe(res => {
        resolve(res);
      });
    });

    return promise;
  }
}

function matchRoles(userRoles: string[], tokenInfoRole: string) {

  let flag = true;

  userRoles.forEach(role => {
    if(role != tokenInfoRole) flag = false;
  });

  return flag;
}
