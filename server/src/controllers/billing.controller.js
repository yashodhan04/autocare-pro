import { Op } from 'sequelize';
import { Invoice, Payment, Estimate, ServiceJob } from '../models/index.js';
import { sequelize } from '../config/db.js';
import { ADVISORS, ROLES } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, searchFilter, and, ok, created, list } from '../utils/pagination.js';
import { computeTotals, round2 } from '../utils/money.js';
import { nextNumber } from '../utils/sequence.js';
import { ownerFilter, isCustomer } from '../middleware/auth.js';
import { audit } from '../services/audit.service.js';
import { setJobStatus } from '../services/job.service.js';
import { notifyCustomer, notifyRoles, safe } from '../services/notification.service.js';
import { assertAccess, found } from './helpers.js';

const INV_POP = [
  { association: 'customer', attributes: ['id', 'name', 'phone', 'email', 'address'] },
  { association: 'vehicle', attributes: ['id', 'registrationNumber', 'make', 'model', 'year'] },
  { association: 'job', attributes: ['id', 'jobNo', 'odometerIn', 'checkInAt'] },
];
const DUE_DAYS = 7;
const loadInvoice = (id) => Invoice.findByPk(id, { include: INV_POP });

export async function listInvoices(req, res) {
  const where = { ...ownerFilter(req) };
  if (req.query.status) where.status = req.query.status;
  if (req.query.customer && !isCustomer(req)) where.customerId = req.query.customer;
  if (req.query.job) where.jobId = req.query.job;
  list(res, await paginate(Invoice, req, { where: and(where, searchFilter(req.query.q, ['invoiceNo'])), include: INV_POP, order: [['issuedAt', 'DESC']] }));
}

export async function getInvoice(req, res) {
  const inv = assertAccess(req, await loadInvoice(req.params.id));
  const payments = await Payment.findAll({ where: { invoiceId: inv.id }, order: [['paidAt', 'ASC']], include: [{ association: 'receivedBy', attributes: ['id', 'name'] }] });
  ok(res, { ...inv.toJSON(), payments });
}

/** Generate the invoice from the job's approved estimate. Totals are recomputed server-side. */
export async function createInvoice(req, res) {
  const job = found(await ServiceJob.findByPk(req.body.job), 'Job');
  if (job.status !== 'completed') throw ApiError.conflict(['invoiced', 'delivered'].includes(job.status) ? 'This job has already been invoiced' : 'Only completed jobs (quality check passed) can be invoiced');
  if (await Invoice.count({ where: { jobId: job.id, status: { [Op.ne]: 'void' } } })) throw ApiError.conflict('An invoice already exists for this job');
  const est = await Estimate.findOne({ where: { jobId: job.id, status: 'approved' } });
  if (!est) throw ApiError.conflict('No approved estimate found for this job');

  const t = computeTotals(est.lines.map((l) => ({ kind: l.kind, description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })), est.taxRate, est.discount);
  const invoiceNo = await nextNumber('INV', 'INV');
  const inv = await sequelize.transaction(async (transaction) => {
    await Invoice.destroy({ where: { jobId: job.id, status: 'void' }, transaction }); // one invoice slot per job; a voided one is replaced
    return Invoice.create({
      invoiceNo, jobId: job.id, estimateId: est.id, customerId: job.customerId, vehicleId: job.vehicleId,
      ...t, balance: t.total, dueDate: req.body.dueDate ?? new Date(Date.now() + DUE_DAYS * 86_400_000), createdById: req.user.id,
    }, { transaction });
  });
  await setJobStatus(job, 'invoiced', req, `Invoice ${inv.invoiceNo} generated`);
  await audit(req, 'invoice.create', { type: 'Invoice', id: inv.id }, `${inv.invoiceNo} for ${job.jobNo}: ₹${inv.total}`);
  safe(notifyCustomer(job.customerId, { type: 'invoice.created', title: 'Invoice ready', message: `${inv.invoiceNo} — ₹${inv.total} due`, link: '/app/invoices' }));
  created(res, await loadInvoice(inv.id));
}

export async function voidInvoice(req, res) {
  const inv = found(await Invoice.findByPk(req.params.id), 'Invoice');
  if (inv.amountPaid > 0) throw ApiError.conflict('Invoices with payments cannot be voided');
  if (inv.status === 'void') throw ApiError.conflict('Invoice is already void');
  const job = await ServiceJob.findByPk(inv.jobId);
  if (job.status === 'delivered') throw ApiError.conflict('Delivered jobs cannot be un-invoiced');
  await inv.update({ status: 'void', balance: 0 });
  await setJobStatus(job, 'completed', req, `Invoice ${inv.invoiceNo} voided`);
  await audit(req, 'invoice.void', { type: 'Invoice', id: inv.id }, `${inv.invoiceNo} voided`);
  ok(res, inv);
}

// ── Payments ─────────────────────────────────────────────────
export async function listPayments(req, res) {
  const where = { ...ownerFilter(req) };
  if (req.query.invoice) where.invoiceId = req.query.invoice;
  if (req.query.method) where.method = req.query.method;
  list(res, await paginate(Payment, req, { where, order: [['paidAt', 'DESC']], include: [{ association: 'invoice', attributes: ['id', 'invoiceNo'] }, { association: 'customer', attributes: ['id', 'name'] }, { association: 'receivedBy', attributes: ['id', 'name'] }] }));
}

/**
 * Record a (manual / simulated) payment. The invoice row is locked for the duration of the
 * transaction, so concurrent payments are serialised and can never over-collect.
 */
export async function recordPayment(req, res) {
  const { invoice: invoiceId, amount, method, reference, note } = req.body;
  const paymentNo = await nextNumber('PAY', 'PM');
  const amt = round2(amount);
  const { payment, invoice } = await sequelize.transaction(async (transaction) => {
    const inv = found(await Invoice.findByPk(invoiceId, { transaction, lock: transaction.LOCK.UPDATE }), 'Invoice');
    if (inv.status === 'void') throw ApiError.conflict('Cannot pay a void invoice');
    if (amt > inv.balance + 0.001) throw ApiError.badRequest(`Amount exceeds the outstanding balance of ₹${inv.balance}`);
    const newPaid = round2(inv.amountPaid + amt);
    const newBalance = round2(inv.total - newPaid);
    await inv.update({ amountPaid: newPaid, balance: newBalance, status: newBalance <= 0 ? 'paid' : 'partial' }, { transaction });
    const p = await Payment.create({ paymentNo, invoiceId: inv.id, customerId: inv.customerId, amount: amt, method, reference, note, isTest: method === 'test', receivedById: req.user.id }, { transaction });
    return { payment: p, invoice: inv };
  });
  await audit(req, 'payment.record', { type: 'Payment', id: payment.id }, `${payment.paymentNo}: ₹${amt} on ${invoice.invoiceNo}${method === 'test' ? ' (test)' : ''}`);
  safe(notifyCustomer(invoice.customerId, { type: 'payment.received', title: 'Payment received', message: `₹${amt} received for ${invoice.invoiceNo}. Balance ₹${invoice.balance}`, link: '/app/invoices' }));
  if (invoice.status === 'paid') safe(notifyRoles([...ADVISORS, ROLES.CASHIER], { type: 'invoice.paid', title: 'Invoice paid', message: `${invoice.invoiceNo} is fully paid — ready for delivery`, link: '/app/service-jobs' }));
  created(res, { payment, invoice });
}
