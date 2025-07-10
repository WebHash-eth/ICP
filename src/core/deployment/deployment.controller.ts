import { Body, Controller, Post } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { DeploymentCreateDto } from './dto/deployment.create.dto';

@Controller('deployments')
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post()
  async createDeployment(@Body() dto: DeploymentCreateDto) {
    return this.deploymentService.createDeployment(dto);
  }
}
