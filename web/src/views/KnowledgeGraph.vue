<template>
    <div>
      <h2>知识图谱</h2>
      <p style="color: #999; margin-bottom: 20px">标签与内容的关联关系</p>
      <div ref="chartRef" style="width: 100%; height: 600px; background: #fff; border-radius: 4px;"></div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import * as echarts from 'echarts';
  import { tagApi } from '../api/tag';
  import { contentApi } from '../api/content';
  
  const chartRef = ref(null);
  let chart = null;
  
  async function loadGraphData() {
    // 1. 查所有标签
    const tags = await tagApi.list();
  
    // 2. 查所有内容（只取 id 和标题）
    const contentsData = await contentApi.list({ page: 1, pageSize: 50 });
  
    const nodes = [];
    const links = [];
  
    // 标签节点（大节点，用圆形）
    tags.forEach(tag => {
      nodes.push({
        id: `tag-${tag.id}`,
        name: tag.name,
        symbolSize: Math.max(20, tag.usage_count * 3),  // 使用次数越多节点越大
        category: 0,
        itemStyle: { color: tag.color || '#1890ff' },
      });
    });
  
    // 内容节点（小节点，用方形）
    contentsData.list.forEach(content => {
      nodes.push({
        id: `content-${content.id}`,
        name: content.title.substring(0, 10),  // 标题太长截断
        symbolSize: 15,
        category: 1,
        itemStyle: { color: '#67c23a' },
      });
  
      // 画连线：内容 → 标签
      content.tags?.forEach(tag => {
        links.push({
          source: `content-${content.id}`,
          target: `tag-${tag.id}`,
        });
      });
    });
  
    // 渲染图表
    chart = echarts.init(chartRef.value);
    chart.setOption({
      tooltip: {},
      legend: [{ data: ['标签', '内容'] }],
      series: [{
        type: 'graph',
        layout: 'force',         // 力导向布局，自动散开
        data: nodes,
        links: links,
        categories: [
          { name: '标签' },
          { name: '内容' },
        ],
        roam: true,              // 可缩放可拖拽
        label: { show: true, fontSize: 10 },
        force: { repulsion: 200 },  // 节点之间的斥力
      }],
    });
  }
  
  // 窗口大小变化时，图表自适应
  function handleResize() {
    if (chart) chart.resize();
  }
  
  onMounted(() => {
    loadGraphData();
    window.addEventListener('resize', handleResize);
  });
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (chart) chart.dispose();
  });
  </script>