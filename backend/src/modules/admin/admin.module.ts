import { Module } from '@nestjs/common';
import { QuestionsAdminController } from './questions.admin.controller';
import { ActionsAdminController } from './actions.admin.controller';
import { RulesAdminController } from './rules.admin.controller';
import { SettingsAdminController } from './settings.admin.controller';
import { UsersAdminController } from './users.admin.controller';
import { RulesModule } from '../rules/rules.module';
import { PoseModule } from '../pose/pose.module';

@Module({
  imports: [RulesModule, PoseModule],
  controllers: [
    QuestionsAdminController,
    ActionsAdminController,
    RulesAdminController,
    SettingsAdminController,
    UsersAdminController,
  ],
})
export class AdminModule {}
