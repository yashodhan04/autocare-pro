import { AuditLog } from '../models/index.js';

/**
 * Record an important action. Never throws — auditing must not break the business operation.
 * audit(req, 'estimate.approve', { type: 'Estimate', id }, 'summary', { meta })
 */
export async function audit(req, action, entity = {}, summary = '', meta) {
  try {
    await AuditLog.create({
      actorId: req?.user?.id,
      actorName: req?.user?.name,
      actorRole: req?.user?.role,
      action,
      entityType: entity.type,
      entityId: entity.id,
      summary: summary?.slice(0, 500),
      meta,
      ip: req?.ip,
    });
  } catch (e) {
    console.error('[audit] failed to write log', e.message);
  }
}
