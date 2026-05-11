export function formatTicketResponse(ticket) {
  if (!ticket) return null

  return {
    id:               ticket._id,
    ticketId:         ticket.ticket_id,
    title:            ticket.title,
    description:      ticket.description,
    status:           ticket.status,
    priority:         ticket.priority,
    department:       ticket.department_tag,
    tags:             ticket.issue_tags,
    customer:         ticket.customer,
    assignedTo:       ticket.assigned_to ? {
      id:   ticket.assigned_to._id,
      name: ticket.assigned_to.name,
      email:ticket.assigned_to.email
    } : null,
    createdBy:        ticket.created_by ? {
      id:   ticket.created_by._id,
      name: ticket.created_by.name
    } : null,
    relatedEntities:  ticket.related_entities,
    isEscalated:      ticket.is_escalated,
    createdAt:        ticket.createdAt,
    updatedAt:        ticket.updatedAt,
    resolvedAt:       ticket.resolved_at,
    closedAt:         ticket.closed_at,
    resolutionNote:   ticket.resolution_note,
  }
}

export function formatTicketList(tickets) {
  return tickets.map(formatTicketResponse)
}
