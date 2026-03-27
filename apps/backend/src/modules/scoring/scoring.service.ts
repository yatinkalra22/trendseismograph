import { Injectable } from '@nestjs/common';

export interface RawSignals {
  googleTrendValue: number;
  googleTrendVelocity: number;
  redditPostCount: number;
  redditPostGrowth: number;
  redditSentiment: number;
  redditCommentDensity: number;
  wikipediaPageviews: number;
  wikipediaGrowth: number;
  daysInCurrentStage: number;
  stageConfidence: number;
}

@Injectable()
export class ScoringService {
  computeTippingPointScore(signals: RawSignals): number {
    const googleVelocityScore = this.normalizeGoogleVelocity(signals.googleTrendVelocity);
    const redditDiscourseScore = this.computeRedditScore(signals);
    const stageMomentumScore = this.computeStageMomentum(signals.daysInCurrentStage, signals.stageConfidence);
    const crossPlatformScore = this.computeCrossPlatformConvergence(signals);

    const tps = (
      googleVelocityScore   * 0.30 +
      redditDiscourseScore  * 0.25 +
      stageMomentumScore    * 0.25 +
      crossPlatformScore    * 0.20
    ) * 10;

    return Math.min(Math.max(parseFloat(tps.toFixed(2)), 0), 10);
  }

  private normalizeGoogleVelocity(velocity: number): number {
    return Math.min(Math.max(velocity / 100, 0), 2) / 2;
  }

  private computeRedditScore(s: RawSignals): number {
    const postGrowthNorm = Math.min(s.redditPostGrowth / 100, 1);
    const sentimentNorm = (s.redditSentiment + 1) / 2;
    const commentDensityNorm = Math.min(s.redditCommentDensity / 50, 1);
    return (postGrowthNorm * 0.5) + (sentimentNorm * 0.3) + (commentDensityNorm * 0.2);
  }

  private computeStageMomentum(daysInStage: number, confidence: number): number {
    const speedScore = Math.max(1 - (daysInStage / 30), 0);
    return speedScore * confidence;
  }

  private computeCrossPlatformConvergence(s: RawSignals): number {
    let spiking = 0;
    if (s.googleTrendVelocity > 20) spiking++;
    if (s.redditPostGrowth > 30) spiking++;
    if (s.wikipediaGrowth > 25) spiking++;
    return spiking / 3;
  }

  scoreToStage(score: number): string {
    if (score < 3) return 'discovery';
    if (score < 5) return 'early_adoption';
    if (score < 7) return 'approaching_tipping';
    if (score < 8.5) return 'tipping_point';
    return 'mainstream';
  }
}
