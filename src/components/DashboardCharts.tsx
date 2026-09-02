'use client';

import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

// Use standard fonts, can be overridden by globals.css
const FONT = 'Inter, system-ui, sans-serif';

const THEME = {
  ink2: '#b8bdd4',
  ink: '#f5f6fb',
  bg: '#07070e',
  acc: '#8b5cf6',
  warn: '#fbbf24',
  muted: '#7c82a0',
  track: 'rgba(255,255,255,.09)',
  stroke: 'rgba(255,255,255,.1)',
  grid: 'rgba(255,255,255,.06)',
  plane: 'rgba(255,255,255,.055)',
  c1: '#8b5cf6',
  c2: '#22d3ee',
  c3: '#34d399',
  c4: '#fbbf24',
  c5: '#fb7185',
};

export function GaugeChart({ percent, label, detail }: { percent: number, label: string, detail: string }) {
  const option = {
    textStyle: { fontFamily: FONT, color: THEME.ink2 },
    tooltip: {
      backgroundColor: THEME.ink,
      borderWidth: 0,
      padding: [9, 12],
      textStyle: { color: THEME.bg, fontSize: 12, fontFamily: FONT },
      extraCssText: 'border-radius:6px',
      formatter: () => detail
    },
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      radius: '92%',
      center: ['50%', '62%'],
      progress: {
        show: true,
        width: 16,
        itemStyle: { color: THEME.acc }
      },
      axisLine: {
        lineStyle: { width: 16, color: [[1, THEME.track]] }
      },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: {
        show: true,
        offsetCenter: [0, '32%'],
        color: THEME.muted,
        fontSize: 12,
        fontFamily: FONT
      },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '2%'],
        fontSize: 38,
        fontWeight: 700,
        fontFamily: FONT,
        color: THEME.ink,
        formatter: '{value}%'
      },
      data: [{ value: percent, name: label }]
    }]
  };
  return <ReactECharts option={option} style={{ height: '250px' }} />;
}

export function LineChart({ data, labels }: { data: number[], labels: string[] }) {
  const option = {
    textStyle: { fontFamily: FONT, color: THEME.ink2 },
    grid: { left: 4, right: 16, top: 22, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: THEME.ink,
      borderWidth: 0,
      padding: [9, 12],
      textStyle: { color: THEME.bg, fontSize: 12, fontFamily: FONT },
      extraCssText: 'border-radius:6px',
      axisPointer: {
        type: 'line',
        lineStyle: { color: THEME.muted, type: 'dashed' }
      },
      formatter: (params: any) => {
        let val = params[0].value;
        return `<div style="opacity:.6;font-size:10.5px">${params[0].axisValue}</div>
                <div style="font-weight:700;font-size:14px;margin:2px 0">${val} entregas</div>`;
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: THEME.stroke } },
      axisTick: { show: false },
      axisLabel: {
        color: THEME.muted,
        fontSize: 11,
        fontFamily: FONT,
        interval: Math.max(0, Math.round(labels.length / 5) - 1)
      }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: THEME.grid, type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: THEME.muted, fontSize: 11, fontFamily: FONT }
    },
    series: [{
      type: 'line',
      data: data,
      smooth: 0.25,
      showSymbol: false,
      lineStyle: { width: 2.4, color: THEME.acc },
      itemStyle: { color: THEME.acc },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: THEME.acc },
          { offset: 1, color: 'transparent' }
        ]),
        opacity: 0.22
      }
    }]
  };
  return <ReactECharts option={option} style={{ height: '240px' }} />;
}

export function DonutChart({ data, centerText, centerLabel }: { data: {name: string, value: number}[], centerText: string, centerLabel: string }) {
  const colors = [THEME.c1, THEME.c2, THEME.c3, THEME.c4, THEME.c5];
  
  const option = {
    textStyle: { fontFamily: FONT, color: THEME.ink2 },
    tooltip: {
      trigger: 'item',
      backgroundColor: THEME.ink,
      borderWidth: 0,
      padding: [9, 12],
      textStyle: { color: THEME.bg, fontSize: 12, fontFamily: FONT },
      extraCssText: 'border-radius:6px',
      formatter: (p: any) => `<b>${p.name}</b><br>${p.value} unid. · ${p.percent}%`
    },
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      icon: 'roundRect',
      textStyle: { color: THEME.ink2, fontSize: 11.5, fontFamily: FONT }
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '36%',
        style: { text: centerText, fill: THEME.ink, fontSize: 24, fontWeight: 700, fontFamily: FONT }
      },
      {
        type: 'text',
        left: 'center',
        top: '46%',
        style: { text: centerLabel, fill: THEME.muted, fontSize: 11.5, fontFamily: FONT }
      }
    ],
    series: [{
      type: 'pie',
      radius: ['58%', '82%'],
      center: ['50%', '43%'],
      itemStyle: { borderColor: THEME.plane, borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      emphasis: { scaleSize: 6, label: { show: false } },
      data: data.map((d, i) => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: colors[i % 5] }
      }))
    }]
  };
  return <ReactECharts option={option} style={{ height: '250px' }} />;
}
