import { loginService, listUsersService, createUserService } from './auth.service.js'

export async function listUsers(req, res) {
  try {
    const users = await listUsersService()
    res.json({ success: true, data: users })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body
    const user = await createUserService({ name, email, password, role })
    res.status(201).json({ success: true, data: user })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const result = await loginService({ email, password })
    res.json(result)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' })
  }
}
