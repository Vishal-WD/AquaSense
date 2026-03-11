import { Injectable } from '@angular/core';
import { SensorReading } from './firebase.service';
import { environment } from '../../../environments/environment';

export interface TrendResult {
  slope: number;
  intercept: number;
  rSquared: number;
  prediction6h: number;
  isRising: boolean;
  riskLevel: 'safe' | 'warning' | 'critical';
}

export interface AlgaeRiskResult {
  risk: boolean;
  score: number;
  factors: string[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private thresholds = environment.thresholds;

  /**
   * Simple Linear Regression: y = mx + b
   * Returns slope (m), intercept (b), and R² fit.
   */
  linearRegression(values: number[]): { slope: number; intercept: number; rSquared: number } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0, rSquared: 0 };

    const xs = values.map((_, i) => i);
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xs[i] - xMean) * (values[i] - yMean);
      denominator += (xs[i] - xMean) ** 2;
      ssTot += (values[i] - yMean) ** 2;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;
    const ssRes = values.reduce((acc, y, i) => acc + (y - (slope * i + intercept)) ** 2, 0);
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return { slope, intercept, rSquared };
  }

  /**
   * Predict future value based on slope and last value.
   */
  predictFuture(slope: number, lastValue: number, stepsAhead: number): number {
    return lastValue + slope * stepsAhead;
  }

  /**
   * Analyze pH or NTU trend over last N readings.
   * Detects gradual rise using slope threshold.
   */
  analyzeTrend(readings: SensorReading[], field: 'ph' | 'ntu'): TrendResult {
    const values = readings.map(r => r[field]);
    const { slope, intercept, rSquared } = this.linearRegression(values);

    const lastValue = values[values.length - 1] || 0;
    const prediction6h = this.predictFuture(slope, lastValue, 24); // ~6h of 15-min intervals

    const isRising = slope > this.thresholds.slopeThreshold;
    let riskLevel: 'safe' | 'warning' | 'critical' = 'safe';

    if (field === 'ph') {
      if (lastValue < this.thresholds.ph.warningMin || lastValue > this.thresholds.ph.warningMax) {
        riskLevel = 'warning';
      }
      if (lastValue < this.thresholds.ph.min || lastValue > this.thresholds.ph.max) {
        riskLevel = 'critical';
      }
    } else if (field === 'ntu') {
      if (lastValue > this.thresholds.ntu.warning) riskLevel = 'warning';
      if (lastValue > this.thresholds.ntu.max) riskLevel = 'critical';
    }

    if (isRising) {
      riskLevel = riskLevel === 'safe' ? 'warning' : 'critical';
    }

    return { slope, intercept, rSquared, prediction6h, isRising, riskLevel };
  }

  /**
   * Algae / Bio-fouling Detection Logic Gate
   * High Temp (>30°C) + High Light + Rising NTU = Algae Risk
   */
  detectAlgaeRisk(readings: SensorReading[]): AlgaeRiskResult {
    if (readings.length === 0) return { risk: false, score: 0, factors: [] };

    const latest = readings[readings.length - 1];
    const factors: string[] = [];
    let score = 0;

    if (latest.temp > this.thresholds.algaeTemp) {
      score += 30;
      factors.push(`High Temperature: ${latest.temp}°C`);
    }

    if (latest.light > this.thresholds.algaeLight) {
      score += 30;
      factors.push(`High Light Intensity: ${latest.light}`);
    }

    const ntuTrend = this.analyzeTrend(readings, 'ntu');
    if (ntuTrend.isRising) {
      score += 40;
      factors.push(`Rising Turbidity (slope: ${ntuTrend.slope.toFixed(4)})`);
    }

    return { risk: score >= 60, score, factors };
  }

  /**
   * Get water quality status for a single reading.
   */
  getWaterQualityStatus(reading: SensorReading): {
    ph: 'safe' | 'warning' | 'critical';
    ntu: 'safe' | 'warning' | 'critical';
    temp: 'safe' | 'warning' | 'critical';
    overall: 'safe' | 'warning' | 'critical';
  } {
    const ph: 'safe' | 'warning' | 'critical' =
      reading.ph < this.thresholds.ph.min || reading.ph > this.thresholds.ph.max ? 'critical' :
      reading.ph < this.thresholds.ph.warningMin || reading.ph > this.thresholds.ph.warningMax ? 'warning' : 'safe';

    const ntu: 'safe' | 'warning' | 'critical' =
      reading.ntu > this.thresholds.ntu.max ? 'critical' :
      reading.ntu > this.thresholds.ntu.warning ? 'warning' : 'safe';

    const temp: 'safe' | 'warning' | 'critical' =
      reading.temp > this.thresholds.temp.max ? 'critical' :
      reading.temp > this.thresholds.temp.warning ? 'warning' : 'safe';

    const levels = [ph, ntu, temp];
    const overall = levels.includes('critical') ? 'critical' : levels.includes('warning') ? 'warning' : 'safe';

    return { ph, ntu, temp, overall };
  }

  /**
   * Compute hourly averages from raw readings for 30-day trends.
   */
  computeHourlyAverages(readings: SensorReading[]): SensorReading[] {
    const hourlyBuckets = new Map<number, SensorReading[]>();

    for (const r of readings) {
      const hourKey = Math.floor(r.server_time / 3600000) * 3600000;
      if (!hourlyBuckets.has(hourKey)) hourlyBuckets.set(hourKey, []);
      hourlyBuckets.get(hourKey)!.push(r);
    }

    const averages: SensorReading[] = [];
    for (const [hourKey, bucket] of hourlyBuckets) {
      const avg: SensorReading = {
        ph: bucket.reduce((s, r) => s + r.ph, 0) / bucket.length,
        ntu: bucket.reduce((s, r) => s + r.ntu, 0) / bucket.length,
        temp: bucket.reduce((s, r) => s + r.temp, 0) / bucket.length,
        light: bucket.reduce((s, r) => s + r.light, 0) / bucket.length,
        server_time: hourKey
      };
      averages.push(avg);
    }

    return averages.sort((a, b) => a.server_time - b.server_time);
  }
}
