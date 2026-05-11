import { Server } from 'socket.io'
import { socketCorsOptions } from './cors.js'

let io

export function initSocket(server) {
  io = new Server(server, { cors: socketCorsOptions })

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    // Join room based on user role (for targeted notifications later)
    socket.on('join_role_room', (role) => {
      socket.join(`role:${role}`)
      console.log(`Socket ${socket.id} joined role:${role}`)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id)
    })
  })

  return io
}

export function getSocket() {
  return io
}

export function emitToAll(event, data) {
  if (io) io.emit(event, data)
}

export function emitToRole(role, event, data) {
  if (io) io.to(`role:${role}`).emit(event, data)
}
