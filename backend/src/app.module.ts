import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PoseModule } from './modules/pose/pose.module';
import { RulesModule } from './modules/rules/rules.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { PlansModule } from './modules/plans/plans.module';
import { AdminModule } from './modules/admin/admin.module';
import { SystemModule } from './modules/system/system.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    PoseModule,
    RulesModule,
    AssessmentModule,
    PlansModule,
    AdminModule,
    SystemModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
