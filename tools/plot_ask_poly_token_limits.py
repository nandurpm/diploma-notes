import json
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

report = json.loads(Path('/home/ubuntu/diploma-notes/reports/ask-poly-token-limit-benchmark.json').read_text(encoding='utf-8'))
current = report['current_1200']
reference = report['historical_6000_reference']
metrics = ['Wall-clock', 'Median', 'P95', 'Maximum']
values_1200 = [current['wall_ms'], current['median_ms'], current['p95_ms'], current['max_ms']]
values_6000 = [reference['wall_ms'], reference['median_ms'], reference['p95_ms'], reference['max_ms']]

plt.style.use('seaborn-v0_8-whitegrid')
fig, ax = plt.subplots(figsize=(11, 6.5), dpi=180)
x = np.arange(len(metrics))
width = 0.34
bars_a = ax.bar(x - width/2, values_1200, width, label='1,200 max output tokens', color='#087f8c')
bars_b = ax.bar(x + width/2, values_6000, width, label='6,000 max output tokens (historical)', color='#f4a261')
ax.set_title('Ask POLY latency comparison by output-token ceiling', fontsize=16, weight='bold', pad=18)
ax.set_ylabel('Latency (milliseconds)', fontsize=11)
ax.set_xticks(x, metrics)
ax.set_ylim(0, max(values_1200 + values_6000) * 1.22)
ax.legend(frameon=True, loc='upper left')
ax.text(0.99, 0.02, '10 concurrent requests · 14,000-character context · all successful', transform=ax.transAxes, ha='right', va='bottom', fontsize=9, color='#555555')
for bars in (bars_a, bars_b):
    for bar in bars:
        value = bar.get_height()
        ax.annotate(f'{value:,.0f}', (bar.get_x() + bar.get_width()/2, value), xytext=(0, 5), textcoords='offset points', ha='center', va='bottom', fontsize=9, weight='bold')
fig.tight_layout()
out = Path('/home/ubuntu/diploma-notes/reports/ask-poly-token-limit-latency-comparison.png')
fig.savefig(out, bbox_inches='tight')
print(out)
