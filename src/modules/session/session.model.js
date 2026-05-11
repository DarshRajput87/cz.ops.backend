import mongoose from 'mongoose'

const { Schema } = mongoose
const loose = { strict: false }

function m(name, schema, coll) {
  return mongoose.models[name] ?? mongoose.model(name, schema, coll)
}

export const SessionDoc        = m('SessionDoc',        new Schema({}, loose), 'bookings')
export const InprogressDoc     = m('InprogressDoc',     new Schema({}, loose), 'ocpi_inprogress_sessions')
export const FaultyDoc         = m('FaultyDoc',         new Schema({}, loose), 'ocpi_faulty_sessions')
export const InvoiceDoc        = m('InvoiceDoc',        new Schema({}, loose), 'invoices')
export const CdrDoc            = m('CdrDoc',            new Schema({}, loose), 'cdrs')
export const SessionHistoryDoc = m('SessionHistoryDoc', new Schema({}, loose), 'session_history')
