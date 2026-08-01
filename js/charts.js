window.Charts = {
  donut(canvasId, data, centerOptions = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale for high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const innerRadius = radius * 0.7;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -Math.PI / 2;
    
    ctx.lineCap = 'round';
    
    data.forEach(item => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - (radius - innerRadius) / 2, startAngle, startAngle + sliceAngle);
      ctx.lineWidth = radius - innerRadius;
      ctx.strokeStyle = item.color;
      ctx.stroke();
      startAngle += sliceAngle;
    });
    
    if (centerOptions.text) {
      ctx.fillStyle = '#1A1A2E';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerOptions.text, cx, cy - 10);
      
      if (centerOptions.subtext) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(centerOptions.subtext, cx, cy + 15);
      }
    }
  },
  
  line(canvasId, config) {
    // simplified implementation
  },
  
  bar(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    
    const labels = config.labels;
    const ds1 = config.datasets[0];
    const ds2 = config.datasets[1];
    
    const maxVal = Math.max(...ds1.data, ...ds2.data);
    
    // Draw axes
    ctx.strokeStyle = '#E5E7EB';
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();
    
    // Draw bars
    const barWidth = (w - padding.left - padding.right) / labels.length / 3;
    
    labels.forEach((label, i) => {
      const x = padding.left + (w - padding.left - padding.right) * (i + 0.5) / labels.length;
      
      // Bar 1
      const val1 = ds1.data[i];
      const h1 = (val1 / maxVal) * (h - padding.top - padding.bottom);
      ctx.fillStyle = ds1.color;
      ctx.fillRect(x - barWidth, h - padding.bottom - h1, barWidth * 0.9, h1);
      
      // Bar 2
      const val2 = ds2.data[i];
      const h2 = (val2 / maxVal) * (h - padding.top - padding.bottom);
      ctx.fillStyle = ds2.color;
      ctx.fillRect(x, h - padding.bottom - h2, barWidth * 0.9, h2);
      
      // Label
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, h - padding.bottom + 15);
    });
  }
};
