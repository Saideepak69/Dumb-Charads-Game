interface User {
  id: string
  email: string
  username: string
  avatar?: string
  gamesPlayed: number
  totalScore: number
  createdAt: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

// Persistent user storage using localStorage
const getUsersFromStorage = (): User[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem("app_users")
  if (stored) {
    return JSON.parse(stored)
  }
  // Return default demo users if no stored users
  return [
    {
      id: "1",
      email: "alice@example.com",
      username: "alice",
      gamesPlayed: 25,
      totalScore: 1250,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      email: "bob@example.com",
      username: "bob",
      gamesPlayed: 18,
      totalScore: 890,
      createdAt: "2024-02-01",
    },
  ]
}

const saveUsersToStorage = (users: User[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("app_users", JSON.stringify(users))
  }
}

// Get users from persistent storage
let users: User[] = getUsersFromStorage()

// Simulated authentication functions
export const authService = {
  async login(email: string, password: string, rememberMe = false): Promise<{ user: User; token: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Refresh users from storage to get latest data
    users = getUsersFromStorage()

    const user = users.find((u) => u.email === email)
    if (!user || password !== "password123") {
      throw new Error("Invalid email or password")
    }

    const token = `token_${user.id}_${Date.now()}`

    // Store in localStorage or sessionStorage based on rememberMe
    if (rememberMe) {
      localStorage.setItem("auth_token", token)
      localStorage.setItem("user_data", JSON.stringify(user))
      localStorage.setItem("remember_me", "true")
    } else {
      sessionStorage.setItem("auth_token", token)
      sessionStorage.setItem("user_data", JSON.stringify(user))
      localStorage.removeItem("remember_me")
    }

    return { user, token }
  },

  async signup(
    email: string,
    username: string,
    password: string,
    rememberMe = false,
  ): Promise<{ user: User; token: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Refresh users from storage to get latest data
    users = getUsersFromStorage()

    // Check if user already exists
    if (users.find((u) => u.email === email)) {
      throw new Error("User with this email already exists")
    }

    if (users.find((u) => u.username === username)) {
      throw new Error("Username is already taken")
    }

    const newUser: User = {
      id: `${Date.now()}`,
      email,
      username,
      gamesPlayed: 0,
      totalScore: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }

    users.push(newUser)
    // Save updated users array to localStorage
    saveUsersToStorage(users)

    const token = `token_${newUser.id}_${Date.now()}`

    // Store in localStorage or sessionStorage based on rememberMe
    if (rememberMe) {
      localStorage.setItem("auth_token", token)
      localStorage.setItem("user_data", JSON.stringify(newUser))
      localStorage.setItem("remember_me", "true")
    } else {
      sessionStorage.setItem("auth_token", token)
      sessionStorage.setItem("user_data", JSON.stringify(newUser))
      localStorage.removeItem("remember_me")
    }

    return { user: newUser, token }
  },

  async logout(): Promise<void> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Clear both localStorage and sessionStorage
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    localStorage.removeItem("remember_me")
    sessionStorage.removeItem("auth_token")
    sessionStorage.removeItem("user_data")
  },

  getCurrentUser(): User | null {
    // Check localStorage first (for remembered sessions)
    let userData = localStorage.getItem("user_data")
    if (userData) {
      return JSON.parse(userData)
    }

    // Then check sessionStorage (for current session)
    userData = sessionStorage.getItem("user_data")
    if (userData) {
      return JSON.parse(userData)
    }

    return null
  },

  getToken(): string | null {
    // Check localStorage first
    let token = localStorage.getItem("auth_token")
    if (token) {
      return token
    }

    // Then check sessionStorage
    token = sessionStorage.getItem("auth_token")
    return token
  },

  isRemembered(): boolean {
    return localStorage.getItem("remember_me") === "true"
  },

  // Update user data in storage
  updateUser(user: User): void {
    const isRemembered = this.isRemembered()
    const storage = isRemembered ? localStorage : sessionStorage
    storage.setItem("user_data", JSON.stringify(user))

    // Also update in the users array and save to localStorage
    users = getUsersFromStorage()
    const userIndex = users.findIndex((u) => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex] = user
      saveUsersToStorage(users)
    }
  },
}
