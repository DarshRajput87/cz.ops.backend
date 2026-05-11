import mongoose from 'mongoose'

import { TICKET_STATUS } from './constants/statuses.js'
import { TICKET_PRIORITY } from './constants/priorities.js'
import { DEPARTMENT_TAG } from './constants/departments.js'
import { ISSUE_TAG } from './constants/issueTags.js'
import { generateTicketId } from './utils/ticketIdGenerator.js'

export { TICKET_STATUS, TICKET_PRIORITY, DEPARTMENT_TAG, ISSUE_TAG }

// ─── Ticket Schema ────────────────────────────────────────────────────────────

const ticketSchema = new mongoose.Schema(
  {
    ticket_id: {
      type:   String,
      unique: true,
      index:  true,
    },
    created_by: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Account',
      required: true,
    },
    customer: {
      name:  { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },
    title: {
      type:     String,
      required: true,
      trim:     true,
    },
    description: {
      type:     String,
      required: true,
      trim:     true,
    },
    department_tag: {
      type:     String,
      enum:     Object.values(DEPARTMENT_TAG),
      required: true,
    },
    issue_tags: [
      {
        type: String,
        enum: Object.values(ISSUE_TAG),
      },
    ],
    priority: {
      type:    String,
      enum:    Object.values(TICKET_PRIORITY),
      default: TICKET_PRIORITY.MEDIUM,
    },
    status: {
      type:    String,
      enum:    Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Account',
    },
    related_entities: {
      charger_id: { type: String, trim: true },
      session_id: { type: String, trim: true },
      location_id:{ type: String, trim: true },
    },
    resolution_note: {
      type: String,
      trim: true,
    },
    resolved_at: {
      type: Date,
    },
    closed_at: {
      type: Date,
    },
    is_escalated: {
      type:    Boolean,
      default: false,
    },
    source: {
      type:    String,
      enum:    ['MANUAL', 'AI_GENERATED', 'AI_REVIEW'],
      default: 'MANUAL',
    },
    ai_generated: {
      type:    Boolean,
      default: false,
    },
    ai_analysis_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'FeedbackAnalysis',
    },
  },
  {
    timestamps: true,
    collection: 'tickets',
  }
)

// ─── Auto-generate ticket_id ──────────────────────────────────────────────────

ticketSchema.pre('save', async function (next) {
  if (this.ticket_id) return next()
  this.ticket_id = await generateTicketId()
  next()
})

// ─── Indexes ──────────────────────────────────────────────────────────────────

ticketSchema.index({ status: 1, priority: 1 })
ticketSchema.index({ department_tag: 1 })
ticketSchema.index({ assigned_to: 1 })
ticketSchema.index({ created_by: 1 })
ticketSchema.index({ createdAt: -1 })

export const Ticket = mongoose.model('Ticket', ticketSchema, 'tickets')

// ─── Activity Schema ──────────────────────────────────────────────────────────

const ticketActivitySchema = new mongoose.Schema(
  {
    ticket_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    action:       { type: String, required: true },
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    metadata:     { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'ticket_activities',
  }
)

export const TicketActivity = mongoose.model('TicketActivity', ticketActivitySchema, 'ticket_activities')

// ─── Attachment Schema ────────────────────────────────────────────────────────

const ticketAttachmentSchema = new mongoose.Schema(
  {
    ticket_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    filename:   { type: String, required: true },
    url:        { type: String, required: true },
    mime_type:  { type: String },
    size_bytes: { type: Number },
    uploaded_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  },
  {
    timestamps: true,
    collection: 'ticket_attachments',
  }
)

export const TicketAttachment = mongoose.model('TicketAttachment', ticketAttachmentSchema, 'ticket_attachments')

// ─── Feedback Analysis Schema ─────────────────────────────────────────────────

const feedbackAnalysisSchema = new mongoose.Schema(
  {
    raw_feedback:       { type: String, required: true },
    classified_issue:   { type: String },
    issue_tags:         [{ type: String, enum: Object.values(ISSUE_TAG) }],
    suggested_priority: { type: String, enum: Object.values(TICKET_PRIORITY) },
    suggested_dept:     { type: String, enum: Object.values(DEPARTMENT_TAG) },
    is_enhancement:     { type: Boolean, default: false },
    confidence:         { type: Number, min: 0, max: 1 },
    auto_ticket_created:{ type: Boolean, default: false },
    ticket_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    raw_ai_response:    { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'feedback_analysis',
  }
)

export const FeedbackAnalysis = mongoose.model('FeedbackAnalysis', feedbackAnalysisSchema, 'feedback_analysis')
