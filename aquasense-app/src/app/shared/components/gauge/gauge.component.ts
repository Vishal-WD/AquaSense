import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-gauge',
  template: `
    <div class="gauge-container" [ngClass]="status">
      <svg viewBox="0 0 120 120" class="gauge-svg">
        <!-- Background arc -->
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(100,116,139,0.15)" stroke-width="10"
                stroke-dasharray="235.6" stroke-dashoffset="59"
                stroke-linecap="round" transform="rotate(135 60 60)" />
        <!-- Colored arc -->
        <circle cx="60" cy="60" r="50" fill="none" [attr.stroke]="arcColor" stroke-width="10"
                [attr.stroke-dasharray]="arcDash" stroke-dashoffset="59"
                stroke-linecap="round" transform="rotate(135 60 60)"
                class="gauge-arc" />
        <!-- Center value -->
        <text x="60" y="55" text-anchor="middle" class="gauge-value" [attr.fill]="arcColor">
          {{ displayValue }}
        </text>
        <text x="60" y="72" text-anchor="middle" class="gauge-unit" fill="#94a3b8">
          {{ unit }}
        </text>
      </svg>
      <div class="gauge-label">{{ label }}</div>
      <div class="gauge-status-dot" [ngClass]="status"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .gauge-container {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(100, 116, 139, 0.15);
      border-radius: 20px;
      padding: 20px 16px 16px;
      text-align: center;
      position: relative;
      transition: all 0.4s ease;
      overflow: hidden;
    }

    .gauge-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      transition: background 0.4s;
    }

    .gauge-container.safe::before {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .gauge-container.warning::before {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }

    .gauge-container.critical::before {
      background: linear-gradient(90deg, #ef4444, #f87171);
      animation: criticalPulse 1.5s ease-in-out infinite;
    }

    @keyframes criticalPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .gauge-container:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    .gauge-svg {
      width: 100%;
      max-width: 140px;
      height: auto;
    }

    .gauge-arc {
      transition: stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.4s;
    }

    .gauge-value {
      font-size: 22px;
      font-weight: 800;
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    .gauge-unit {
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .gauge-label {
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 600;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }

    .gauge-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      position: absolute;
      top: 12px;
      right: 12px;
    }

    .gauge-status-dot.safe { background: #10b981; box-shadow: 0 0 8px #10b981; }
    .gauge-status-dot.warning { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
    .gauge-status-dot.critical { background: #ef4444; box-shadow: 0 0 8px #ef4444; animation: blink 1s infinite; }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `],
  standalone: false
})
export class GaugeComponent implements OnChanges {
  @Input() value: number = 0;
  @Input() min: number = 0;
  @Input() max: number = 14;
  @Input() warningMin: number = 0;
  @Input() warningMax: number = 10;
  @Input() criticalMin: number = 0;
  @Input() criticalMax: number = 14;
  @Input() label: string = '';
  @Input() unit: string = '';
  @Input() decimals: number = 1;

  displayValue = '0';
  arcDash = '0 235.6';
  arcColor = '#10b981';
  status: 'safe' | 'warning' | 'critical' = 'safe';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] || changes['min'] || changes['max']) {
      this.updateGauge();
    }
  }

  private updateGauge() {
    this.displayValue = this.value.toFixed(this.decimals);

    // Calculate arc percentage (0 → 270°, represented in stroke-dasharray)
    const maxArc = 235.6; // circumference * (270/360)
    const range = this.max - this.min;
    const normalizedValue = Math.max(0, Math.min(1, (this.value - this.min) / range));
    const arcLength = normalizedValue * maxArc;
    this.arcDash = `${arcLength} ${maxArc}`;

    // Determine status
    if (this.value < this.criticalMin || this.value > this.criticalMax) {
      this.status = 'critical';
      this.arcColor = '#ef4444';
    } else if (this.value < this.warningMin || this.value > this.warningMax) {
      this.status = 'warning';
      this.arcColor = '#f59e0b';
    } else {
      this.status = 'safe';
      this.arcColor = '#10b981';
    }
  }
}
