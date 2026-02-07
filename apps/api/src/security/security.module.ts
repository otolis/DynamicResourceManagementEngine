import { Global, Module } from '@nestjs/common';
import { RbacGuard } from './guards/rbac.guard';
import { AbacGuard } from './guards/abac.guard';
import { PolicyEvaluatorService } from './services/policy-evaluator.service';

@Global()
@Module({
    providers: [RbacGuard, AbacGuard, PolicyEvaluatorService],
    exports: [RbacGuard, AbacGuard, PolicyEvaluatorService],
})
export class SecurityModule { }
