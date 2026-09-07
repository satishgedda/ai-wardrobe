const mongoose = require('mongoose')
const env = require('./env')

async function connectDatabase() {
  if (!env.mongoUri) {
    console.warn('MONGODB_URI is not configured; starting without a database connection.')
    return false
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 1,
  })
  return true
}

function getDatabaseStatus() {
  return {
    configured: Boolean(env.mongoUri),
    connected: mongoose.connection.readyState === 1,
  }
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
}

module.exports = { connectDatabase, getDatabaseStatus, disconnectDatabase }