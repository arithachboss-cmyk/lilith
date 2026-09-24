import { requirePermission } from '../rbac.mjs';

/**
 * Wraps a procedure so the permission check and the audit record can never be
 * forgotten: the guard runs before the body, and both the refusal and the
 * success are appended to the append-only log.
 */
export function procedure({ module, action, name, run }) {
  return function invoke(ctx, actor, params = {}) {
    try {
      requirePermission(actor, module, action, ctx.policy);
    } catch (error) {
      ctx.audit.append({
        actor,
        module,
        action,
        outcome: error.code,
        subject: params.sku_id || params.subject || null,
        detail: name,
      });
      throw error;
    }
    try {
      const result = run(ctx, actor, params);
      ctx.audit.append({
        actor,
        module,
        action,
        outcome: 'OK',
        subject: params.sku_id || params.subject || null,
        detail: name,
      });
      return result;
    } catch (error) {
      ctx.audit.append({
        actor,
        module,
        action,
        outcome: error.code || 'ERROR',
        subject: params.sku_id || params.subject || null,
        detail: name,
      });
      throw error;
    }
  };
}

export function notFound(what) {
  const error = new Error(`NOT_FOUND: ${what}`);
  error.code = 'NOT_FOUND';
  return error;
}
