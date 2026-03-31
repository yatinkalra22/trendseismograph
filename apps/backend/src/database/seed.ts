import { DataSource } from 'typeorm';
import { Trend } from '../modules/trends/entities/trend.entity';
import { TrendScore } from '../modules/trends/entities/trend-score.entity';
import { BacktestResult } from '../modules/backtest/entities/backtest-result.entity';

type SeedTrend = {
  slug: string;
  name: string;
  category: string;
  isHistorical: boolean;
  actualOutcome: 'mainstream' | 'fizzled' | 'pending';
};

type SeedScore = {
  trendId: string;
  tippingPointScore: number;
  discourseStage: string;
  stageConfidence: number;
  googleTrendValue: number;
  googleTrendVelocity: number;
  redditPostCount: number;
  redditCommentCount: number;
  redditSentiment: number;
  wikipediaPageviews: number;
  crossPlatformScore: number;
  scoredAt: Date;
};

type SeedBacktest = {
  trendId: string;
  predictedStage: string;
  predictedScore: number;
  actualOutcome: 'mainstream' | 'fizzled';
  wasCorrect: boolean;
  weeksBeforePeak: number | null;
};

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/trendseismograph',
  entities: [Trend, TrendScore, BacktestResult],
  synchronize: false,
});

const SEED_TRENDS: SeedTrend[] = [
  // WENT MAINSTREAM
  { slug: 'pickleball', name: 'Pickleball', category: 'sports', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'oat-milk', name: 'Oat Milk', category: 'food', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'air-fryer', name: 'Air Fryer', category: 'food', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'sourdough-baking', name: 'Sourdough Baking', category: 'food', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'cold-plunge', name: 'Cold Plunge', category: 'wellness', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'van-life', name: 'Van Life', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'mushroom-coffee', name: 'Mushroom Coffee', category: 'food', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'quiet-quitting', name: 'Quiet Quitting', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'cottagecore', name: 'Cottagecore', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'book-tok', name: 'BookTok', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'dry-january', name: 'Dry January', category: 'wellness', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'hot-girl-walks', name: 'Hot Girl Walks', category: 'wellness', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'analog-photography', name: 'Analog Photography', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'thrifting', name: 'Thrifting / Secondhand', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'kombucha', name: 'Kombucha', category: 'food', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'birding', name: 'Birding / Birdwatching', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'padel-tennis', name: 'Padel Tennis', category: 'sports', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'axe-throwing', name: 'Axe Throwing', category: 'sports', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'gut-health', name: 'Gut Health', category: 'wellness', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'olive-oil-coffee', name: 'Olive Oil Coffee', category: 'food', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'wordle', name: 'Wordle', category: 'tech', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'plant-based-meat', name: 'Plant-Based Meat', category: 'food', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'beekeeping', name: 'Urban Beekeeping', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'normcore', name: 'Normcore Fashion', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },
  { slug: 'depop-fashion', name: 'Depop / Resale Fashion', category: 'culture', isHistorical: true, actualOutcome: 'mainstream' },

  // FIZZLED
  { slug: 'raw-water', name: 'Raw Water', category: 'wellness', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'juicero', name: 'Juicero', category: 'tech', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'google-glass', name: 'Google Glass (consumer)', category: 'tech', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'clubhouse-app', name: 'Clubhouse App', category: 'tech', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'nft-art', name: 'NFT Art', category: 'culture', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'quibi', name: 'Quibi Streaming', category: 'tech', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'metaverse-real-estate', name: 'Metaverse Real Estate', category: 'tech', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'dog-collar-cameras', name: 'Dog Collar Cameras', category: 'tech', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'fidget-spinners', name: 'Fidget Spinners', category: 'culture', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'supersonic-travel', name: 'Supersonic Commercial Travel', category: 'tech', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'google-plus', name: 'Google+', category: 'tech', isHistorical: true, actualOutcome: 'fizzled' },
  { slug: 'lab-grown-fur', name: 'Lab-Grown Fur Fashion', category: 'culture', isHistorical: true, actualOutcome: 'fizzled' },

  // CURRENTLY TRACKING
  { slug: 'forest-bathing', name: 'Forest Bathing', category: 'wellness', isHistorical: false, actualOutcome: 'pending' },
  { slug: 'longevity-science', name: 'Longevity Science', category: 'wellness', isHistorical: false, actualOutcome: 'pending' },
  { slug: 'sleep-tourism', name: 'Sleep Tourism', category: 'culture', isHistorical: false, actualOutcome: 'pending' },
  { slug: 'solarpunk', name: 'Solarpunk', category: 'culture', isHistorical: false, actualOutcome: 'pending' },
  { slug: 'rewilding', name: 'Rewilding', category: 'culture', isHistorical: false, actualOutcome: 'pending' },
  { slug: 'neurotech-consumer', name: 'Consumer Neurotech', category: 'tech', isHistorical: false, actualOutcome: 'pending' },
  { slug: 'regenerative-travel', name: 'Regenerative Travel', category: 'culture', isHistorical: false, actualOutcome: 'pending' },
  { slug: 'brown-noise', name: 'Brown Noise', category: 'wellness', isHistorical: false, actualOutcome: 'pending' },
  { slug: 'ambient-computing', name: 'Ambient Computing', category: 'tech', isHistorical: false, actualOutcome: 'pending' },
  { slug: 'biomimicry-fashion', name: 'Biomimicry Fashion', category: 'culture', isHistorical: false, actualOutcome: 'pending' },
];

// Generate realistic mock scores for seeded trends
function generateMockScores(trendId: string, outcome: SeedTrend['actualOutcome']): SeedScore[] {
  const scores: SeedScore[] = [];
  const days = 90;

  for (let i = 0; i < days; i += 3) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    let tps: number;
    let stage: string;

    if (outcome === 'mainstream') {
      // Rising trend: 2 -> 9
      tps = 2 + (i / days) * 7 + (Math.random() - 0.5) * 1.5;
    } else if (outcome === 'fizzled') {
      // Peaks then drops: 2 -> 6 -> 3
      const peak = days * 0.4;
      if (i < peak) {
        tps = 2 + (i / peak) * 4 + (Math.random() - 0.5);
      } else {
        tps = 6 - ((i - peak) / (days - peak)) * 3 + (Math.random() - 0.5);
      }
    } else {
      // Pending: slow rise 1 -> 5
      tps = 1 + (i / days) * 4 + (Math.random() - 0.5);
    }

    tps = Math.min(Math.max(tps, 0), 10);

    if (tps < 3) stage = 'discovery';
    else if (tps < 5) stage = 'early_adoption';
    else if (tps < 7) stage = 'approaching_tipping';
    else if (tps < 8.5) stage = 'tipping_point';
    else stage = 'mainstream';

    scores.push({
      trendId,
      tippingPointScore: parseFloat(tps.toFixed(2)),
      discourseStage: stage,
      stageConfidence: parseFloat((0.6 + Math.random() * 0.35).toFixed(3)),
      googleTrendValue: Math.floor(20 + (tps / 10) * 80),
      googleTrendVelocity: parseFloat(((Math.random() - 0.3) * 60).toFixed(2)),
      redditPostCount: Math.floor(50 + tps * 120),
      redditCommentCount: Math.floor(200 + tps * 500),
      redditSentiment: parseFloat(((Math.random() - 0.2) * 1.5).toFixed(3)),
      wikipediaPageviews: Math.floor(1000 + tps * 5000),
      crossPlatformScore: parseFloat(((tps / 10) * 8 + Math.random() * 2).toFixed(2)),
      scoredAt: date,
    });
  }

  return scores;
}

function generateBacktestResult(trendId: string, outcome: SeedTrend['actualOutcome']): SeedBacktest | null {
  if (outcome === 'pending') return null;

  const wasCorrect = Math.random() > 0.19; // ~81% accuracy
  const predictedScore = outcome === 'mainstream'
    ? parseFloat((6 + Math.random() * 3.5).toFixed(2))
    : parseFloat((3 + Math.random() * 3).toFixed(2));

  return {
    trendId,
    predictedStage: outcome === 'mainstream' ? 'tipping_point' : 'early_adoption',
    predictedScore,
    actualOutcome: outcome,
    wasCorrect,
    weeksBeforePeak: outcome === 'mainstream' ? Math.floor(3 + Math.random() * 8) : null,
  };
}

async function seed() {
  await dataSource.initialize();
  const trendRepo = dataSource.getRepository(Trend);
  const scoreRepo = dataSource.getRepository(TrendScore);
  const backtestRepo = dataSource.getRepository(BacktestResult);

  for (const t of SEED_TRENDS) {
    let trend = await trendRepo.findOne({ where: { slug: t.slug } });
    if (!trend) {
      trend = await trendRepo.save(trendRepo.create(t));
      console.log(`Seeded: ${t.name}`);
    } else {
      console.log(`Skipped (exists): ${t.name}`);
      continue;
    }

    // Generate mock score history
    const scores = generateMockScores(trend.id, t.actualOutcome);
    await scoreRepo.save(scores.map((s) => scoreRepo.create(s as Partial<TrendScore>)));

    // Generate backtest result for historical trends
    const backtest = generateBacktestResult(trend.id, t.actualOutcome);
    if (backtest) {
      await backtestRepo.save(backtestRepo.create(backtest as Partial<BacktestResult>));
    }
  }

  console.log(`\nSeed complete. ${SEED_TRENDS.length} trends processed.`);
  await dataSource.destroy();
}

seed().catch(console.error);
