import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PoseService } from '../pose/pose.service';
import { RulesService } from '../rules/rules.service';
import { ScoringService } from './scoring.service';
import { AnalyzeAssessmentDto } from './dto/upload-photos.dto';
import { AssessmentAnswerItemDto } from './dto/submit-answers.dto';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly poseService: PoseService,
    private readonly rulesService: RulesService,
    private readonly scoringService: ScoringService,
  ) {}

  private parseJson<T>(value: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async start(userId: number) {
    return this.prisma.assessmentSession.create({
      data: {
        userId,
        status: 'started',
      },
    });
  }

  async submitAnswers(sessionId: number, answers: AssessmentAnswerItemDto[]) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('session not found');
    }

    await this.prisma.assessmentAnswer.deleteMany({ where: { sessionId } });

    for (const answer of answers) {
      const option = answer.optionId
        ? await this.prisma.questionOption.findUnique({
            where: { id: answer.optionId },
          })
        : null;

      await this.prisma.assessmentAnswer.create({
        data: {
          sessionId,
          questionId: answer.questionId,
          optionId: answer.optionId,
          rawValue: answer.rawValue,
          score: option?.score ?? 0,
        },
      });
    }

    await this.prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { status: 'answers_submitted' },
    });

    return { success: true };
  }

  async uploadPhotos(
    sessionId: number,
    photos: Array<{ viewType: 'front' | 'side' | 'back'; filePath: string }>,
  ) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('session not found');
    }

    await this.prisma.posePhoto.deleteMany({ where: { sessionId } });
    if (photos.length > 0) {
      await this.prisma.posePhoto.createMany({
        data: photos.map((photo) => ({
          sessionId,
          viewType: photo.viewType,
          filePath: photo.filePath,
        })),
      });
    }

    return { success: true, count: photos.length };
  }

  private poseScoreFromMetrics(metrics: Record<string, number>) {
    const values = Object.values(metrics);
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.max(0, Math.min(100, Number(avg.toFixed(2))));
  }

  async analyze(sessionId: number, dto?: AnalyzeAssessmentDto) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('session not found');
    }

    const photos = await this.prisma.posePhoto.findMany({
      where: { sessionId },
    });
    const questionnaireScore =
      await this.scoringService.computeQuestionnaireScore(sessionId);

    const poseResultRaw = await this.poseService.analyze(
      dto?.filePaths ?? photos.map((photo) => photo.filePath),
    );

    const poseMetrics = dto?.injectedMetrics ?? poseResultRaw.metrics;
    const poseScore = {
      total: this.poseScoreFromMetrics(poseMetrics),
      metrics: poseMetrics,
      confidence: poseResultRaw.confidence,
      fallbackUsed: poseResultRaw.fallbackUsed,
      modelName: poseResultRaw.modelName,
      modelVersion: poseResultRaw.modelVersion,
    };

    const finalScore = this.scoringService.computeFinalScore(
      questionnaireScore.total,
      poseScore.total,
      poseScore.fallbackUsed,
    );

    const diagnosis = await this.rulesService.evaluate({
      questionnaireScore,
      poseMetrics,
      finalScoreTotal: finalScore.total,
    });

    await this.prisma.poseAnalysisResult.create({
      data: {
        sessionId,
        modelName: poseScore.modelName,
        modelVersion: poseScore.modelVersion,
        landmarksJson: JSON.stringify(poseResultRaw.landmarks ?? {}),
        metricsJson: JSON.stringify(poseMetrics),
        confidence: poseScore.confidence,
        fallbackUsed: poseScore.fallbackUsed,
      },
    });

    await this.prisma.diagnosisResult.deleteMany({ where: { sessionId } });
    for (const item of diagnosis) {
      await this.prisma.diagnosisResult.create({
        data: {
          sessionId,
          problemType: item.problemType,
          severity: item.severity,
          evidenceJson: JSON.stringify(item.evidence),
          adviceText: item.adviceText,
        },
      });
    }

    await this.prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'analyzed',
        questionnaireScoreJson: JSON.stringify(questionnaireScore),
        poseScoreJson: JSON.stringify(poseScore),
        finalScoreJson: JSON.stringify(finalScore),
      },
    });

    return {
      sessionId,
      questionnaireScore,
      pose: poseScore,
      finalScore,
      diagnosis,
    };
  }

  async result(sessionId: number) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        diagnosisResults: true,
        poseResults: true,
        answers: true,
      },
    });

    if (!session) {
      throw new NotFoundException('session not found');
    }

    return {
      id: session.id,
      status: session.status,
      questionnaireScore: this.parseJson(session.questionnaireScoreJson),
      poseScore: this.parseJson(session.poseScoreJson),
      finalScore: this.parseJson(session.finalScoreJson),
      diagnosis: session.diagnosisResults.map((item) => ({
        problemType: item.problemType,
        severity: item.severity,
        evidence: this.parseJson(item.evidenceJson),
        adviceText: item.adviceText,
      })),
      answers: session.answers,
      poseResults: session.poseResults.map((item) => ({
        ...item,
        landmarksJson: this.parseJson(item.landmarksJson),
        metricsJson: this.parseJson(item.metricsJson),
      })),
    };
  }
}
