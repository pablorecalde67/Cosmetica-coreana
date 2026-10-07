// ⏰ JOB SCHEDULER
// Ejecuta trabajos de publicación a horas específicas

import { nanoid } from 'nanoid';

export class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.completedJobs = new Map();
    this.runningJobs = new Set();
    this.checkInterval = 30000; // Verificar cada 30 segundos
    this.startScheduler();
  }

  // Programar un post
  schedulePost(campaignId, scheduledTime, platform, content) {
    try {
      const jobId = nanoid();

      const job = {
        id: jobId,
        campaignId,
        platform,
        scheduledTime, // Formato: "19:00" o "HH:mm"
        content,
        createdAt: new Date(),
        status: 'pending', // pending, executing, completed, failed
        executedAt: null,
        error: null,
      };

      this.jobs.set(jobId, job);

      console.log('[JOB SCHEDULER] Job programado:', {
        jobId,
        platform,
        scheduledTime,
        campaignId,
      });

      return {
        success: true,
        jobId,
        status: 'scheduled',
      };
    } catch (error) {
      console.error('[JOB SCHEDULER] Error scheduling job:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Iniciar el scheduler
  startScheduler() {
    console.log('[JOB SCHEDULER] ✅ Iniciado. Verificando cada 30 segundos.');

    this.schedulerInterval = setInterval(() => {
      this.checkAndExecuteJobs();
    }, this.checkInterval);
  }

  // Detener el scheduler
  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      console.log('[JOB SCHEDULER] ⏹️ Detenido.');
    }
  }

  // Verificar y ejecutar trabajos
  checkAndExecuteJobs() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        job.status === 'pending' &&
        job.scheduledTime <= currentTime
      ) {
        this.executeJob(jobId);
      }
    }
  }

  // Ejecutar trabajo
  async executeJob(jobId) {
    try {
      const job = this.jobs.get(jobId);

      if (!job) {
        console.error('[JOB SCHEDULER] Job no encontrado:', jobId);
        return;
      }

      if (this.runningJobs.has(jobId)) {
        console.log('[JOB SCHEDULER] Job ya está ejecutándose:', jobId);
        return;
      }

      this.runningJobs.add(jobId);
      job.status = 'executing';

      console.log('[JOB SCHEDULER] 🚀 Ejecutando job:', {
        jobId,
        platform: job.platform,
        campaignId: job.campaignId,
      });

      // Simular publicación según plataforma
      const result = await this.simulatePublish(job);

      if (result.success) {
        job.status = 'completed';
        job.executedAt = new Date();

        console.log('[JOB SCHEDULER] ✅ Job completado:', {
          jobId,
          platform: job.platform,
          url: result.url,
        });
      } else {
        job.status = 'failed';
        job.error = result.error;

        console.error('[JOB SCHEDULER] ❌ Job fallido:', {
          jobId,
          error: result.error,
        });
      }

      // Mover a completed
      this.completedJobs.set(jobId, job);
      this.jobs.delete(jobId);
    } catch (error) {
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
      }
      console.error('[JOB SCHEDULER] Error executing job:', error);
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  // Simular publicación en la plataforma
  async simulatePublish(job) {
    return new Promise((resolve) => {
      // Simular delay de API
      setTimeout(() => {
        const postId = nanoid();

        if (Math.random() > 0.05) {
          // 95% de éxito
          resolve({
            success: true,
            postId,
            platform: job.platform,
            url: `https://${job.platform}.com/post/${postId}`,
          });
        } else {
          resolve({
            success: false,
            error: `Error conectando con API de ${job.platform}`,
          });
        }
      }, Math.random() * 2000 + 500); // 500-2500ms
    });
  }

  // Obtener estado de job
  getJobStatus(jobId) {
    let job = this.jobs.get(jobId);

    if (!job) {
      job = this.completedJobs.get(jobId);
    }

    if (!job) {
      return { error: 'Job no encontrado' };
    }

    return {
      jobId: job.id,
      campaignId: job.campaignId,
      platform: job.platform,
      scheduledTime: job.scheduledTime,
      status: job.status,
      createdAt: job.createdAt,
      executedAt: job.executedAt,
      error: job.error,
    };
  }

  // Obtener jobs pendientes
  getPendingJobs() {
    const pending = Array.from(this.jobs.values()).filter(
      (j) => j.status === 'pending'
    );

    return {
      total: pending.length,
      jobs: pending.map((j) => ({
        id: j.id,
        platform: j.platform,
        scheduledTime: j.scheduledTime,
        campaignId: j.campaignId,
      })),
    };
  }

  // Obtener jobs completados
  getCompletedJobs() {
    const completed = Array.from(this.completedJobs.values());

    return {
      total: completed.length,
      jobs: completed.map((j) => ({
        id: j.id,
        platform: j.platform,
        status: j.status,
        executedAt: j.executedAt,
        error: j.error,
      })),
    };
  }

  // Obtener jobs por campaña
  getJobsByCampaign(campaignId) {
    const allJobs = [
      ...Array.from(this.jobs.values()),
      ...Array.from(this.completedJobs.values()),
    ];

    const campaignJobs = allJobs.filter((j) => j.campaignId === campaignId);

    return {
      campaignId,
      total: campaignJobs.length,
      pending: campaignJobs.filter((j) => j.status === 'pending').length,
      completed: campaignJobs.filter((j) => j.status === 'completed').length,
      failed: campaignJobs.filter((j) => j.status === 'failed').length,
      jobs: campaignJobs,
    };
  }

  // Cancelar job
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);

    if (!job) {
      return { error: 'Job no encontrado' };
    }

    if (job.status === 'executing' || job.status === 'completed') {
      return { error: 'No se puede cancelar job que está ejecutándose o completado' };
    }

    this.jobs.delete(jobId);

    return {
      success: true,
      message: 'Job cancelado',
      jobId,
    };
  }

  // Obtener estadísticas
  getStatistics() {
    const allJobs = [
      ...Array.from(this.jobs.values()),
      ...Array.from(this.completedJobs.values()),
    ];

    const pending = allJobs.filter((j) => j.status === 'pending').length;
    const executing = allJobs.filter((j) => j.status === 'executing').length;
    const completed = allJobs.filter((j) => j.status === 'completed').length;
    const failed = allJobs.filter((j) => j.status === 'failed').length;

    const platformBreakdown = {};
    ['instagram', 'tiktok', 'facebook'].forEach((platform) => {
      platformBreakdown[platform] = {
        total: allJobs.filter((j) => j.platform === platform).length,
        completed: allJobs.filter(
          (j) => j.platform === platform && j.status === 'completed'
        ).length,
        failed: allJobs.filter(
          (j) => j.platform === platform && j.status === 'failed'
        ).length,
      };
    });

    return {
      total: allJobs.length,
      pending,
      executing,
      completed,
      failed,
      successRate: completed > 0 ? ((completed / (completed + failed)) * 100).toFixed(2) + '%' : 'N/A',
      platforms: platformBreakdown,
    };
  }
}
