import json
from pathlib import Path
import plotly.graph_objects as go
from plotly.subplots import make_subplots

report = json.loads(Path('/home/ubuntu/diploma-notes/reports/ask-poly-token-limit-benchmark.json').read_text(encoding='utf-8'))
current = report['current_1200']
reference = report['historical_6000_reference']
current_values = sorted(row['elapsed_ms'] for row in current['results'] if row.get('ok'))
reference_values = [4160, 5072, 7541]  # available historical min, median, and max only
percentiles = [0, 25, 50, 75, 90, 95, 99, 100]

def empirical(values):
    n = len(values)
    return [values[min(n - 1, max(0, round((p / 100) * (n - 1))))] for p in percentiles]

current_pct = empirical(current_values)
reference_pct = [reference['min_ms'], None, reference['median_ms'], None, None, reference['p95_ms'], None, reference['max_ms']]
fig = make_subplots(rows=2, cols=1, shared_xaxes=False, vertical_spacing=0.18,
                    subplot_titles=('Empirical latency distribution (each observed request)', 'Percentile breakdown'))
fig.add_trace(go.Scatter(x=list(range(1, len(current_values) + 1)), y=current_values, mode='lines+markers', name='1,200 tokens', line=dict(color='#087f8c', width=3), marker=dict(size=8), hovertemplate='Request rank %{x}<br>%{y:,.1f} ms<extra>1,200 tokens</extra>'), row=1, col=1)
fig.add_trace(go.Scatter(x=list(range(1, len(reference_values) + 1)), y=reference_values, mode='lines+markers', name='6,000 tokens (available baseline points)', line=dict(color='#f4a261', width=3, dash='dash'), marker=dict(size=9), hovertemplate='Available baseline point %{x}<br>%{y:,.1f} ms<extra>6,000 tokens</extra>'), row=1, col=1)
fig.add_trace(go.Scatter(x=percentiles, y=current_pct, mode='lines+markers+text', text=[f'{v:,.0f}' for v in current_pct], textposition='top center', name='1,200 tokens', line=dict(color='#087f8c', width=3), hovertemplate='P%{x}<br>%{y:,.1f} ms<extra>1,200 tokens</extra>'), row=2, col=1)
fig.add_trace(go.Scatter(x=percentiles, y=reference_pct, mode='lines+markers+text', text=[f'{v:,.0f}' if v is not None else 'n/a' for v in reference_pct], textposition='bottom center', name='6,000 tokens (historical)', line=dict(color='#f4a261', width=3, dash='dash'), connectgaps=False, hovertemplate='P%{x}<br>%{y:,.1f} ms<extra>6,000 tokens</extra>'), row=2, col=1)
fig.update_xaxes(title_text='Observed request rank (sorted fastest → slowest)', row=1, col=1)
fig.update_xaxes(title_text='Percentile', tickmode='array', tickvals=percentiles, ticktext=[f'P{p}' for p in percentiles], row=2, col=1)
fig.update_yaxes(title_text='Latency (ms)', rangemode='tozero')
fig.update_layout(title='Ask POLY latency distribution: 1,200 vs 6,000 output-token limits', template='plotly_white', height=900, width=1200, hovermode='x unified', legend=dict(orientation='h', yanchor='bottom', y=1.02, x=0))
fig.add_annotation(text='Historical 6,000-token raw sample contains only min/median/P95/max; unavailable quartiles are shown as n/a.', xref='paper', yref='paper', x=0, y=-0.12, showarrow=False, font=dict(size=11, color='#555'))
out = Path('/home/ubuntu/diploma-notes/reports/ask-poly-token-limit-percentile-distribution.html')
fig.write_html(out, include_plotlyjs=True, full_html=True)
print(out)
