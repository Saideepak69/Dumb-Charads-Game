import { db } from './database'
import { supabase, type User } from './supabase'

// Generate a random username for anonymous users
const generateRandomUsername = (): string => {
  const adjectives = ["Cool", "Fast", "Smart", "Brave", "Happy", "Lucky", "Swift", "Bright", "Bold", "Quick"]
  const nouns = ["Artist", "Player", "Gamer", "Drawer", "Painter", "Creator", "Master", "Hero", "Star", "Ace"]
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
  const randomNumber = Math.floor(Math.random() * 999) + 1
  return `${randomAdjective}${randomNoun}${randomNumber}`
}

export class AuthService {
  async createAnonymousUser(): Promise<User> {
    const username = generateRandomUsername()
    
    try {
      // Check if username exists, if so generate a new one
      let finalUsername = username
      let attempts = 0
      while (attempts < 5) {
        const existingUser = await db.getUserByUsername(finalUsername)
        if (!existingUser) break
        finalUsername = generateRandomUsername()
        attempts++
      }

      const user = await db.createUser(finalUsername)
      
      // Store in localStorage
      localStorage.setItem('current_user', JSON.stringify(user))
      
      return user
    } catch (error) {
      console.error('Failed to create anonymous user:', error)
      throw error
    }
  }

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem('current_user')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to get current user:', error)
    }
    return null
  }

  async refreshUser(userId: string): Promise<User | null> {
    try {
      const user = await db.getUser(userId)
      if (user) {
        localStorage.setItem('current_user', JSON.stringify(user))
      }
      return user
    } catch (error) {
      console.error('Failed to refresh user:', error)
      return null
    }
  }

  clearUser(): void {
    localStorage.removeItem('current_user')
  }
}

export const authService = new AuthService()
