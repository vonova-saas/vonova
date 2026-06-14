import { Injectable, Logger } from '@nestjs/common';
import { AUTO_MOD_FLAGS } from './moderation.constants';

export type AutoModerationResult = {
  score: number;
  flags: string[];
  shouldFlag: boolean;
  shouldBlock: boolean;
};

type FloodEntry = { timestamps: number[] };
type RepeatEntry = { hash: string; count: number };

@Injectable()
export class AutoModerationService {
  private readonly log = new Logger('AutoModeration');
  private readonly floodByUser = new Map<string, FloodEntry>();
  private readonly repeatByUser = new Map<string, RepeatEntry>();

  private readonly config = {
    flagScore: 45,
    blockScore: 85,
    maxLinks: 4,
    maxEmojiRatio: 0.45,
    maxMentions: 8,
    floodWindowMs: 60_000,
    floodMaxPosts: 8,
    repeatedSpamMinLength: 12,
  };

  evaluateText(
    text: string,
    context: {
      userId: string;
      surface: 'post' | 'comment' | 'chat' | 'report';
    },
  ): AutoModerationResult {
    const flags: string[] = [];
    let score = 0;
    const t = text.trim();
    if (!t) return { score: 0, flags, shouldFlag: false, shouldBlock: false };

    const linkMatches = t.match(/https?:\/\/|www\./gi) ?? [];
    if (linkMatches.length > this.config.maxLinks) {
      flags.push(AUTO_MOD_FLAGS[0]);
      score += 25 + (linkMatches.length - this.config.maxLinks) * 8;
    }

    const emojiMatches = t.match(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    );
    const emojiLen = emojiMatches?.join('').length ?? 0;
    if (emojiLen / Math.max(t.length, 1) > this.config.maxEmojiRatio) {
      flags.push(AUTO_MOD_FLAGS[4]);
      score += 20;
    }

    const mentions = t.match(/@[\w.-]+/g) ?? [];
    if (mentions.length > this.config.maxMentions) {
      flags.push(AUTO_MOD_FLAGS[3]);
      score += 15 + mentions.length * 2;
    }

    const spamPatterns = [
      /(.)\1{6,}/i,
      /(buy now|click here|free money|crypto giveaway)/i,
      /(viagra|casino|lottery winner)/i,
    ];
    if (spamPatterns.some((p) => p.test(t))) {
      flags.push(AUTO_MOD_FLAGS[1]);
      score += 30;
    }

    if (this.isFlooding(context.userId, context.surface)) {
      flags.push(AUTO_MOD_FLAGS[2]);
      score += 35;
    }

    const repeatBoost = this.trackRepeatedSpam(context.userId, t);
    if (repeatBoost > 0) {
      flags.push(AUTO_MOD_FLAGS[1]);
      score += repeatBoost;
    }

    score = Math.min(100, score);
    const shouldFlag = score >= this.config.flagScore;
    const shouldBlock = score >= this.config.blockScore;

    if (flags.length > 0 || shouldFlag) {
      this.log.log(
        `[AUTO_MODERATION] surface=${context.surface} userId=${context.userId} score=${score} flags=${flags.join(',') || 'none'} block=${shouldBlock}`,
      );
    }

    return { score, flags, shouldFlag, shouldBlock };
  }

  private isFlooding(userId: string, surface: string): boolean {
    const key = `${userId}:${surface}`;
    const now = Date.now();
    let entry = this.floodByUser.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.floodByUser.set(key, entry);
    }
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < this.config.floodWindowMs,
    );
    entry.timestamps.push(now);
    return entry.timestamps.length > this.config.floodMaxPosts;
  }

  private trackRepeatedSpam(userId: string, text: string): number {
    if (text.length < this.config.repeatedSpamMinLength) return 0;
    const hash = this.simpleHash(text.toLowerCase());
    const prev = this.repeatByUser.get(userId);
    const count = prev?.hash === hash ? (prev.count ?? 0) + 1 : 0;
    this.repeatByUser.set(userId, { hash, count });
    return count >= 2 ? 25 : 0;
  }

  private simpleHash(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }
}
