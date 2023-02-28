import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from 'src/auth/decorator/anonymous.decorator';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { TestService } from './test.service';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get("protect")
  @Roles('POCAdminUser')
  getProtectedData(){
    return "access protected data success !!!";
  }

  @Get("public")
  @AllowAnonymous()
  getPublicData(){
    return "access public data success !!!";
  }
}
