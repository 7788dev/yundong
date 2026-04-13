# 体态评估与康复计划平台设计文档（pure-admin-thin + NestJS + SQLite）

- 日期：2026-04-13
- 版本：V1
- 目标：基于“预设题库 + 预设动作库 + 规则算法”，让用户通过表格和姿态照片完成体态评估，自动获得康复动作与4周计划。

## 1. 项目目标与范围

### 1.1 目标
1. 用户可在线完成体态问卷与姿态照片上传。
2. 系统自动输出体态问题分析（可解释证据链）。
3. 系统自动生成康复动作与4周训练计划。
4. 支持复评与改善趋势对比。
5. 管理员可维护题库、动作库、规则库。

### 1.2 已确认技术与业务约束
- 前端：pure-admin-thin（用户端 + 管理端）
- 后端：Node.js + NestJS
- 数据库：SQLite
- 算法：标准规则（多维问卷评分 + 禁忌过滤 + 动作进阶/退阶）
- 覆盖范围：全身基础版（头颈肩、胸椎、骨盆、膝踝足）
- 姿态识别：可插拔接入开源模型；不可用时自动降级为仅问卷
- 题库/动作/规则：首版由系统提供专业基础默认库，后台可编辑

### 1.3 非目标（V1不做）
- 医疗诊断声明与处方资格替代
- 复杂多租户与机构分级权限
- 实时视频姿态识别

---

## 2. 总体架构

## 2.1 架构分层
1. 前端层（pure-admin-thin）
   - 用户端：评估、结果、计划、打卡、复评
   - 管理端：用户、题库、动作、规则、评估记录、系统设置
2. API层（NestJS）
   - Auth、Assessment、PoseAnalysis、RuleEngine、Plan、Admin模块
3. 数据层（SQLite）
   - 评估数据、算法结果、计划与打卡记录
4. 可插拔识别层（Provider模式）
   - 优先 MediaPipe Pose
   - 备选 MoveNet / MMPose
   - 失败或低置信度自动降级

### 2.2 核心业务流程
1. 用户注册登录。
2. 创建评估会话并填写问卷。
3. 上传正面/侧面/背面照片。
4. 系统进行问卷评分；若识别可用则追加姿态评分。
5. 规则引擎判定问题类型与严重度。
6. 计划生成器输出动作清单与4周计划。
7. 用户执行打卡，周期后复评并做趋势对比。

### 2.3 关键设计原则
- 可解释：每个结论关联题项、关键点指标、命中规则。
- 可降级：识别失败不阻断主流程。
- 可运营：题库/动作/规则全可后台配置。
- 可扩展：识别模块和规则引擎支持替换与迭代。

---

## 3. 数据模型设计（SQLite）

### 3.1 表清单
1. `users`
   - `id`, `username`, `password_hash`, `role`, `gender`, `age`, `created_at`

2. `question_bank`
   - `id`, `code`, `category`, `question_text`, `answer_type`, `weight`, `enabled`

3. `question_options`
   - `id`, `question_id`, `option_text`, `score`, `sort`

4. `action_library`
   - `id`, `code`, `name`, `target_problem`, `level`, `contraindications`, `steps`, `duration_sec`, `sets`, `enabled`

5. `rule_engine_rules`
   - `id`, `rule_name`, `problem_type`, `condition_json`, `score_formula`, `plan_template_json`, `priority`, `enabled`

6. `assessment_sessions`
   - `id`, `user_id`, `status`, `questionnaire_score_json`, `pose_score_json`, `final_score_json`, `created_at`

7. `assessment_answers`
   - `id`, `session_id`, `question_id`, `option_id`, `raw_value`, `score`

8. `pose_photos`
   - `id`, `session_id`, `view_type`, `file_path`, `uploaded_at`

9. `pose_analysis_results`
   - `id`, `session_id`, `model_name`, `model_version`, `landmarks_json`, `metrics_json`, `confidence`, `fallback_used`

10. `diagnosis_results`
    - `id`, `session_id`, `problem_type`, `severity`, `evidence_json`, `advice_text`

11. `rehab_plans`
    - `id`, `session_id`, `user_id`, `start_date`, `weeks`, `summary`

12. `rehab_plan_items`
    - `id`, `plan_id`, `week_no`, `day_no`, `action_id`, `prescription_json`, `notes`

13. `progress_logs`
    - `id`, `user_id`, `plan_item_id`, `done`, `pain_level`, `feedback`, `logged_at`

14. `reassessments`
    - `id`, `user_id`, `baseline_session_id`, `current_session_id`, `improvement_json`, `created_at`

15. `system_settings`
    - `key`, `value`

### 3.2 关键关系
- 一个 `assessment_session` 对应多条 `assessment_answers`、`pose_photos`、`pose_analysis_results`、`diagnosis_results`。
- 一个 `assessment_session` 对应一个 `rehab_plan`，含多条 `rehab_plan_items`。
- `reassessments` 通过基线评估与当前评估做前后对比。

---

## 4. 算法与规则引擎设计

### 4.1 评分总框架
- 当姿态识别可用：
  - `FinalScore = Q_score * 0.65 + P_score * 0.35`
- 当姿态识别不可用或置信度不足：
  - `FinalScore = Q_score`
  - 记录 `fallback_used = true`

### 4.2 问卷评分（Q_score）
- 采用题目权重与选项分值累加。
- 维度分桶：
  - 头颈肩
  - 胸椎/圆肩驼背
  - 骨盆
  - 膝踝足
- 严重度映射：
  - 0-39 轻度
  - 40-69 中度
  - 70-100 重度

### 4.3 姿态评分（P_score）
- Provider统一输出关键点与指标。
- 指标样例：
  - 头前引角
  - 肩峰高低差
  - 骨盆倾斜角
  - 膝内扣趋势（Q-angle）
  - 踝-膝-髋对齐度
- 每指标按阈值评分并合成 `P_score`。
- 置信度低于阈值（默认0.5）时不计入融合。

### 4.4 规则引擎
- 规则输入：`Q_score`维度、`P_score`指标、禁忌信息、训练史。
- 规则条件：`condition_json`（可配置）
- 规则输出：
  - `problem_type`
  - `severity`
  - `evidence_json`
  - `action template`

### 4.5 动作计划生成
- 动作分组：Release / Stretch / Activate / Strengthen。
- 4周进阶：
  - W1 学习动作与低强度
  - W2 增加时长/组数
  - W3 进阶动作或阻力
  - W4 巩固并准备复评
- 反馈闭环：若打卡反馈疼痛升高则自动退阶或替换动作。

### 4.6 安全过滤
- 先进行禁忌过滤：急性疼痛、高风险损伤史等。
- 触发禁忌时：
  - 屏蔽高风险动作
  - 替换低负荷动作
  - 在报告中追加线下就医/评估建议

---

## 5. 页面与功能设计

### 5.1 用户端页面
1. `/u/login` 登录/注册
2. `/u/assessment` 问卷与照片上传
3. `/u/result/:id` 评估结果与证据链
4. `/u/plan/:id` 4周计划与动作详情
5. `/u/reassess` 复评与趋势对比

### 5.2 管理端页面
1. `/admin/users` 用户管理
2. `/admin/questions` 题库管理
3. `/admin/actions` 动作库管理
4. `/admin/rules` 规则管理（含规则测试）
5. `/admin/sessions` 评估记录与报告复核
6. `/admin/settings` 系统设置（模型开关、阈值等）

---

## 6. API 设计（V1）

### 6.1 认证与用户
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/admin/users`
- `GET /api/admin/users/:id/sessions`

### 6.2 题库 / 动作 / 规则（管理员）
- `GET/POST/PUT/DELETE /api/admin/questions`
- `GET/POST/PUT/DELETE /api/admin/actions`
- `GET/POST/PUT/DELETE /api/admin/rules`
- `POST /api/admin/rules/test`

### 6.3 评估流程
- `POST /api/assessments/start`
- `POST /api/assessments/:id/answers`
- `POST /api/assessments/:id/photos`
- `POST /api/assessments/:id/analyze`
- `GET /api/assessments/:id/result`

### 6.4 计划与执行
- `POST /api/plans/generate/:sessionId`
- `GET /api/plans/:id`
- `POST /api/plans/:id/items/:itemId/log`
- `POST /api/reassessments/compare`

### 6.5 模型状态与配置
- `GET /api/system/model/status`
- `PUT /api/admin/system/model-config`

---

## 7. 默认内容策略（V1）

### 7.1 默认题库
- 提供覆盖全身基础问题的默认题库。
- 每题包含分类、权重、选项分值。

### 7.2 默认动作库
- 按问题类型和等级预置动作。
- 每动作带步骤、时长、组数、禁忌说明。

### 7.3 默认规则库
- 提供可直接运行的基础规则集。
- 管理员可启用/停用/编辑并即时生效。

---

## 8. 验收标准
1. 用户可完成：注册登录 → 评估 → 获取报告与计划。
2. 管理员可维护题库/动作/规则并影响后续评估结果。
3. 模型不可用时自动降级且流程不中断。
4. 报告可展示可解释证据链。
5. 用户可打卡与复评，看到趋势变化。
6. 核心接口具备基础自动化测试（鉴权、评估、计划生成、降级分支）。

---

## 9. 风险与应对
1. 开源模型接入差异大
   - 应对：Provider抽象层 + 统一指标映射 + 开关配置
2. SQLite并发限制
   - 应对：V1定位单机/小规模；后续可平滑迁移MySQL/PostgreSQL
3. 规则复杂度增长
   - 应对：规则优先级、规则测试接口、规则版本管理

---

## 10. 实施边界说明
- V1优先实现业务闭环与稳定可用；姿态识别作为可插拔增强能力。
- 当识别模块不可用时，系统保持“仅问卷+规则”可完整运行。
