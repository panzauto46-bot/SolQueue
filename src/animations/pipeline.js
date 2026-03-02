/**
 * 2D Canvas Pipeline Animation
 * Visualizes jobs flowing through a queue pipeline
 */
export class PipelineAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.jobs = [];
        this.time = 0;
        this.running = true;

        this.colors = {
            pending: { bg: 'rgba(153, 69, 255, 0.3)', border: '#9945FF', text: '#b06aff' },
            processing: { bg: 'rgba(59, 130, 246, 0.3)', border: '#3b82f6', text: '#60a5fa' },
            completed: { bg: 'rgba(20, 241, 149, 0.3)', border: '#14F195', text: '#14F195' },
            failed: { bg: 'rgba(255, 69, 69, 0.3)', border: '#ff4545', text: '#ff6b6b' },
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.spawnInterval = setInterval(() => this.spawnJob(), 1800);
        this.animate();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    spawnJob() {
        if (this.jobs.length > 15) return;

        const types = ['pending', 'processing', 'completed', 'failed'];
        const names = ['send_email', 'process_data', 'gen_report', 'sync_db', 'resize_img', 'validate', 'notify', 'batch_op', 'transform', 'aggregate'];

        const job = {
            x: -80,
            y: 30 + Math.random() * (this.height - 80),
            width: 70 + Math.random() * 30,
            height: 28,
            speed: 0.5 + Math.random() * 0.8,
            type: 'pending',
            name: names[Math.floor(Math.random() * names.length)],
            progress: 0,
            opacity: 0,
            spawned: Date.now(),
        };

        this.jobs.push(job);
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < this.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < this.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    drawStages() {
        const ctx = this.ctx;
        const stages = [
            { label: 'QUEUE', x: this.width * 0.15, color: '#9945FF' },
            { label: 'PROCESS', x: this.width * 0.45, color: '#3b82f6' },
            { label: 'COMPLETE', x: this.width * 0.75, color: '#14F195' },
        ];

        stages.forEach(stage => {
            // Vertical dashed line
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = stage.color + '20';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(stage.x, 0);
            ctx.lineTo(stage.x, this.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label at top
            ctx.font = '600 9px "JetBrains Mono", monospace';
            ctx.fillStyle = stage.color + '60';
            ctx.textAlign = 'center';
            ctx.fillText(stage.label, stage.x, 16);
        });
    }

    drawJob(job) {
        const ctx = this.ctx;
        const colors = this.colors[job.type];

        // Glow effect
        ctx.shadowColor = colors.border;
        ctx.shadowBlur = 8;

        // Job box
        ctx.fillStyle = colors.bg;
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;

        const r = 4;
        ctx.beginPath();
        ctx.roundRect(job.x, job.y, job.width, job.height, r);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Job name
        ctx.font = '500 9px "JetBrains Mono", monospace';
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'left';
        ctx.globalAlpha = job.opacity;
        ctx.fillText(job.name, job.x + 8, job.y + 17);
        ctx.globalAlpha = 1;

        // Progress indicator for processing jobs
        if (job.type === 'processing') {
            const progWidth = (job.width - 16) * job.progress;
            ctx.fillStyle = colors.border + '40';
            ctx.beginPath();
            ctx.roundRect(job.x + 8, job.y + job.height - 6, job.width - 16, 2, 1);
            ctx.fill();

            ctx.fillStyle = colors.border;
            ctx.beginPath();
            ctx.roundRect(job.x + 8, job.y + job.height - 6, progWidth, 2, 1);
            ctx.fill();
        }
    }

    drawConnectorParticles() {
        const ctx = this.ctx;
        const count = 5;

        for (let i = 0; i < count; i++) {
            const x = (this.time * 50 + i * 200) % (this.width + 100) - 50;
            const y = this.height / 2 + Math.sin(this.time * 2 + i) * 30;
            const size = 2 + Math.sin(this.time * 3 + i) * 1;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? 'rgba(153, 69, 255, 0.3)' : 'rgba(20, 241, 149, 0.3)';
            ctx.fill();
        }
    }

    update() {
        this.time += 0.016;

        this.jobs.forEach(job => {
            job.x += job.speed;
            job.opacity = Math.min(1, job.opacity + 0.05);

            // State transitions based on position
            const queueLine = this.width * 0.15;
            const processLine = this.width * 0.45;
            const completeLine = this.width * 0.75;

            if (job.x > queueLine && job.type === 'pending') {
                job.type = 'processing';
                job.progress = 0;
            }

            if (job.type === 'processing') {
                job.progress = Math.min(1, job.progress + 0.005);
            }

            if (job.x > processLine && job.type === 'processing') {
                job.type = Math.random() > 0.15 ? 'completed' : 'failed';
            }
        });

        // Remove off-screen jobs
        this.jobs = this.jobs.filter(job => job.x < this.width + 100);
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        this.drawGrid();
        this.drawStages();
        this.drawConnectorParticles();
        this.jobs.forEach(job => this.drawJob(job));
    }

    animate() {
        if (!this.running) return;

        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.running = false;
        clearInterval(this.spawnInterval);
    }
}


/**
 * 2D Canvas Chart Animation for Analytics
 */
export class BarChartAnimation {
    constructor(canvas, data, color = '#9945FF') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.data = data;
        this.color = color;
        this.animProgress = 0;
        this.running = true;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    draw() {
        const ctx = this.ctx;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = this.width - padding.left - padding.right;
        const chartHeight = this.height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, this.width, this.height);

        if (!this.data || this.data.length === 0) return;

        const maxVal = Math.max(...this.data.map(d => d.value)) * 1.1;
        const barWidth = (chartWidth / this.data.length) * 0.6;
        const gap = (chartWidth / this.data.length) * 0.4;

        // Grid lines
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(this.width - padding.right, y);
            ctx.stroke();

            // Y-axis labels
            const val = Math.round(maxVal - (maxVal / 4) * i);
            ctx.font = '400 10px "Inter", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.textAlign = 'right';
            ctx.fillText(val.toString(), padding.left - 8, y + 4);
        }

        // Bars
        this.data.forEach((d, i) => {
            const x = padding.left + i * (barWidth + gap) + gap / 2;
            const barMaxHeight = (d.value / maxVal) * chartHeight;
            const barHeight = barMaxHeight * Math.min(1, this.animProgress);
            const y = padding.top + chartHeight - barHeight;

            // Bar gradient
            const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartHeight);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, this.color + '20');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            ctx.fill();

            // Glow
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = this.color + '30';
            ctx.fillRect(x, y, barWidth, 2);
            ctx.shadowBlur = 0;

            // X-axis label
            ctx.font = '400 9px "Inter", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + barWidth / 2, this.height - padding.bottom + 16);
        });
    }

    animate() {
        if (!this.running) return;

        if (this.animProgress < 1) {
            this.animProgress += 0.02;
        }

        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.running = false;
    }
}


/**
 * Line chart for throughput visualization
 */
export class LineChartAnimation {
    constructor(canvas, datasets) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.datasets = datasets;
        this.animProgress = 0;
        this.time = 0;
        this.running = true;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    draw() {
        const ctx = this.ctx;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = this.width - padding.left - padding.right;
        const chartHeight = this.height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, this.width, this.height);

        // Grid
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(this.width - padding.right, y);
            ctx.stroke();
        }

        // Draw each dataset
        this.datasets.forEach(dataset => {
            const data = dataset.data;
            const maxVal = Math.max(...this.datasets.flatMap(d => d.data)) * 1.2;
            const pointSpacing = chartWidth / (data.length - 1);

            // Animated draw extent
            const drawCount = Math.floor(data.length * Math.min(1, this.animProgress));

            // Fill area
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top + chartHeight);

            for (let i = 0; i <= drawCount && i < data.length; i++) {
                const x = padding.left + i * pointSpacing;
                const y = padding.top + chartHeight - (data[i] / maxVal) * chartHeight;
                if (i === 0) {
                    ctx.lineTo(x, y);
                } else {
                    // Smooth curve
                    const prevX = padding.left + (i - 1) * pointSpacing;
                    const prevY = padding.top + chartHeight - (data[i - 1] / maxVal) * chartHeight;
                    const cpX = (prevX + x) / 2;
                    ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
                }
            }

            const lastX = padding.left + Math.min(drawCount, data.length - 1) * pointSpacing;
            ctx.lineTo(lastX, padding.top + chartHeight);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
            gradient.addColorStop(0, dataset.color + '20');
            gradient.addColorStop(1, dataset.color + '00');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Line
            ctx.beginPath();
            for (let i = 0; i <= drawCount && i < data.length; i++) {
                const x = padding.left + i * pointSpacing;
                const y = padding.top + chartHeight - (data[i] / maxVal) * chartHeight;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    const prevX = padding.left + (i - 1) * pointSpacing;
                    const prevY = padding.top + chartHeight - (data[i - 1] / maxVal) * chartHeight;
                    const cpX = (prevX + x) / 2;
                    ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
                }
            }
            ctx.strokeStyle = dataset.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Dots
            for (let i = 0; i <= drawCount && i < data.length; i++) {
                const x = padding.left + i * pointSpacing;
                const y = padding.top + chartHeight - (data[i] / maxVal) * chartHeight;

                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = dataset.color;
                ctx.fill();

                // Glow on last point
                if (i === drawCount) {
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                    ctx.fillStyle = dataset.color + '30';
                    ctx.fill();
                }
            }
        });

        // X-axis labels
        const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
        labels.forEach((label, i) => {
            const x = padding.left + (i / (labels.length - 1)) * chartWidth;
            ctx.font = '400 9px "Inter", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, this.height - padding.bottom + 16);
        });
    }

    animate() {
        if (!this.running) return;

        this.time += 0.016;
        if (this.animProgress < 1) {
            this.animProgress += 0.015;
        }

        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.running = false;
    }
}
