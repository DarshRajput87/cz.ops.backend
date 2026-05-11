import mongoose from 'mongoose'

const customerReviewSchema = new mongoose.Schema(
  {
    customer_id:  { type: mongoose.Schema.Types.ObjectId },
    source:       { type: String, enum: ['APP', 'PLAYSTORE', 'APPSTORE', 'EMAIL'], required: true },
    review_type:  { type: String, enum: ['BUG', 'ENHANCEMENT', 'PRAISE', 'PERFORMANCE'], required: true },
    rating:       { type: Number, min: 1, max: 5, required: true },
    review_title: { type: String, trim: true },
    review_message: { type: String, required: true, trim: true },
    sentiment:    { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
    detected_tags: [{ type: String }],
    ai_analysis: {
      issue_type:           { type: String },
      department:           { type: String },
      priority:             { type: String },
      confidence_score:     { type: Number },
      enhancement_detected: { type: Boolean },
      duplicate_possible:   { type: Boolean },
      summary:              { type: String },
    },
    related_ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    app_version:  { type: String },
    device_info: {
      os:           { type: String },
      os_version:   { type: String },
      device_model: { type: String },
    },
    session_context: {
      booking_id:  { type: mongoose.Schema.Types.ObjectId },
      charger_id:  { type: mongoose.Schema.Types.ObjectId },
      station_id:  { type: String },
    },
    status: {
      type:    String,
      enum:    ['pending', 'processing', 'analyzed', 'ticket_created', 'ignored', 'failed'],
      default: 'pending',
      index:   true,
    },
    error_message: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection:  'customer_reviews',
  }
)

customerReviewSchema.index({ created_at: -1 })
customerReviewSchema.index({ status: 1, created_at: 1 })

export const CustomerReview = mongoose.model('CustomerReview', customerReviewSchema, 'customer_reviews')
