import { supabase, hasSupabaseCredentials, type User, type Room, type RoomPlayer, type Guess } from "./supabase"

const WORDS = [
  "elephant",
  "pizza",
  "rainbow",
  "guitar",
  "butterfly",
  "mountain",
  "bicycle",
  "castle",
  "octopus",
  "sunflower",
  "rocket",
  "penguin",
  "hamburger",
  "lighthouse",
  "dinosaur",
  "umbrella",
  "airplane",
  "flower",
  "house",
  "car",
  "tree",
  "cat",
  "dog",
  "fish",
  "bird",
  "sun",
  "moon",
  "star",
  "heart",
  "apple",
  "banana",
  "cake",
  "book",
  "phone",
  "computer",
  "chair",
]

// Mock data for when Supabase is not available
const mockUsers: User[] = []
const mockRooms: (Room & { players: (RoomPlayer & { users: User })[] })[] = []
const mockGuesses: (Guess & { users: User })[] = []

export class DatabaseService {
  private checkSupabase() {
    if (!hasSupabaseCredentials || !supabase) {
      console.warn("Supabase not configured, using mock data for development")
      return false
    }
    return true
  }

  // User operations
  async createUser(username: string, email?: string): Promise<User> {
    if (!this.checkSupabase()) {
      // Mock implementation
      const user: User = {
        id: `mock_${Date.now()}_${Math.random()}`,
        username,
        email,
        games_played: 0,
        total_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockUsers.push(user)
      return user
    }

    const { data, error } = await supabase!.from("users").insert([{ username, email }]).select().single()

    if (error) throw error
    return data
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.checkSupabase()) {
      return mockUsers.find((u) => u.id === id) || null
    }

    const { data, error } = await supabase!.from("users").select("*").eq("id", id).single()

    if (error) return null
    return data
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!this.checkSupabase()) {
      return mockUsers.find((u) => u.username === username) || null
    }

    const { data, error } = await supabase!.from("users").select("*").eq("username", username).single()

    if (error) return null
    return data
  }

  async updateUserStats(userId: string, scoreToAdd: number): Promise<void> {
    if (!this.checkSupabase()) {
      const user = mockUsers.find((u) => u.id === userId)
      if (user) {
        user.games_played += 1
        user.total_score += scoreToAdd
        user.updated_at = new Date().toISOString()
      }
      return
    }

    const { error } = await supabase!
      .from("users")
      .update({
        games_played: supabase!.sql`games_played + 1`,
        total_score: supabase!.sql`total_score + ${scoreToAdd}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error
  }

  // Room operations
  async createRoom(hostId: string, hostUsername: string, isPublic = true): Promise<{ room: Room; code: string }> {
    const code = this.generateRoomCode()

    if (!this.checkSupabase()) {
      // Mock implementation
      const room: Room = {
        id: `mock_room_${Date.now()}`,
        code,
        name: `${hostUsername}'s Room`,
        host_id: hostId,
        max_players: 8,
        is_active: false,
        is_public: isPublic,
        current_word: WORDS[Math.floor(Math.random() * WORDS.length)],
        time_left: 600,
        round_number: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const hostUser = mockUsers.find((u) => u.id === hostId)
      const roomWithPlayers = {
        ...room,
        players: hostUser
          ? [
              {
                id: `mock_player_${Date.now()}`,
                room_id: room.id,
                user_id: hostId,
                score: 0,
                is_drawing: false,
                has_guessed: false,
                joined_at: new Date().toISOString(),
                users: hostUser,
              },
            ]
          : [],
      }

      mockRooms.push(roomWithPlayers)
      return { room, code }
    }

    const { data: room, error: roomError } = await supabase!
      .from("rooms")
      .insert([
        {
          code,
          name: `${hostUsername}'s Room`,
          host_id: hostId,
          is_public: isPublic,
          current_word: WORDS[Math.floor(Math.random() * WORDS.length)],
        },
      ])
      .select()
      .single()

    if (roomError) throw roomError

    // Add host as first player
    await this.joinRoom(room.id, hostId)

    return { room, code }
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomPlayer> {
    if (!this.checkSupabase()) {
      const user = mockUsers.find((u) => u.id === userId)
      if (!user) throw new Error("User not found")

      const player: RoomPlayer & { users: User } = {
        id: `mock_player_${Date.now()}_${Math.random()}`,
        room_id: roomId,
        user_id: userId,
        score: 0,
        is_drawing: false,
        has_guessed: false,
        joined_at: new Date().toISOString(),
        users: user,
      }

      const room = mockRooms.find((r) => r.id === roomId)
      if (room) {
        room.players.push(player)
      }

      return player
    }

    const { data, error } = await supabase!
      .from("room_players")
      .insert([{ room_id: roomId, user_id: userId }])
      .select(`
        *,
        users (*)
      `)
      .single()

    if (error) throw error
    return data
  }

  async joinRoomByCode(code: string, userId: string): Promise<Room> {
    if (!this.checkSupabase()) {
      const room = mockRooms.find((r) => r.code === code.toUpperCase() && !r.is_active)
      if (!room) throw new Error("Room not found or game already started")

      if (room.players.length >= room.max_players) {
        throw new Error("Room is full")
      }

      if (room.players.some((p) => p.user_id === userId)) {
        throw new Error("You are already in this room")
      }

      await this.joinRoom(room.id, userId)
      return room
    }

    // Get room
    const { data: room, error: roomError } = await supabase!
      .from("rooms")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", false)
      .single()

    if (roomError) throw new Error("Room not found or game already started")

    // Check if room is full
    const { count } = await supabase!.from("room_players").select("*", { count: "exact" }).eq("room_id", room.id)

    if (count && count >= room.max_players) {
      throw new Error("Room is full")
    }

    // Check if user already in room
    const { data: existingPlayer } = await supabase!
      .from("room_players")
      .select("*")
      .eq("room_id", room.id)
      .eq("user_id", userId)
      .single()

    if (existingPlayer) {
      throw new Error("You are already in this room")
    }

    // Join room
    await this.joinRoom(room.id, userId)
    return room
  }

  async joinRandomRoom(userId: string): Promise<Room> {
    if (!this.checkSupabase()) {
      const availableRooms = mockRooms.filter(
        (room) =>
          room.is_public &&
          !room.is_active &&
          room.players.length > 0 &&
          room.players.length < room.max_players &&
          !room.players.some((p) => p.user_id === userId),
      )

      if (availableRooms.length === 0) {
        throw new Error("No available rooms found")
      }

      const targetRoom = availableRooms[0]
      await this.joinRoom(targetRoom.id, userId)
      return targetRoom
    }

    // Get available public rooms
    const { data: rooms, error } = await supabase!
      .from("rooms")
      .select(`
        *,
        room_players (count)
      `)
      .eq("is_public", true)
      .eq("is_active", false)
      .gt("room_players.count", 0)
      .lt("room_players.count", supabase!.sql`max_players`)

    if (error || !rooms || rooms.length === 0) {
      throw new Error("No available rooms found")
    }

    // Sort by player count (prefer fuller rooms)
    const sortedRooms = rooms.sort((a, b) => (b.room_players?.length || 0) - (a.room_players?.length || 0))
    const targetRoom = sortedRooms[0]

    await this.joinRoom(targetRoom.id, userId)
    return targetRoom
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    if (!this.checkSupabase()) {
      const roomIndex = mockRooms.findIndex((r) => r.id === roomId)
      if (roomIndex !== -1) {
        const room = mockRooms[roomIndex]
        room.players = room.players.filter((p) => p.user_id !== userId)

        if (room.players.length === 0) {
          mockRooms.splice(roomIndex, 1)
        } else if (room.host_id === userId && room.players.length > 0) {
          // Assign new host
          room.host_id = room.players[0].user_id
        }
      }
      return
    }

    const { error } = await supabase!.from("room_players").delete().eq("room_id", roomId).eq("user_id", userId)

    if (error) throw error

    // Check if room is empty and delete if so
    const { count } = await supabase!.from("room_players").select("*", { count: "exact" }).eq("room_id", roomId)

    if (count === 0) {
      await supabase!.from("rooms").delete().eq("id", roomId)
    }
  }

  async getRoomWithPlayers(roomId: string): Promise<Room & { players: (RoomPlayer & { users: User })[] }> {
    if (!this.checkSupabase()) {
      const room = mockRooms.find((r) => r.id === roomId)
      if (!room) throw new Error("Room not found")
      return room
    }

    const { data: room, error: roomError } = await supabase!
      .from("rooms")
      .select(`
        *,
        room_players (
          *,
          users (*)
        )
      `)
      .eq("id", roomId)
      .single()

    if (roomError) throw roomError
    return room as any
  }

  async startGame(roomId: string): Promise<void> {
    if (!this.checkSupabase()) {
      const room = mockRooms.find((r) => r.id === roomId)
      if (!room) throw new Error("Room not found")

      if (room.players.length < 2) {
        throw new Error("Need at least 2 players to start")
      }

      const randomDrawer = room.players[Math.floor(Math.random() * room.players.length)]

      room.is_active = true
      room.current_drawer_id = randomDrawer.user_id
      room.time_left = 600
      room.round_number = 1

      // Reset all players
      room.players.forEach((player) => {
        player.is_drawing = player.user_id === randomDrawer.user_id
        player.has_guessed = false
      })

      return
    }

    // Get random drawer
    const { data: players } = await supabase!.from("room_players").select("user_id").eq("room_id", roomId)

    if (!players || players.length < 2) {
      throw new Error("Need at least 2 players to start")
    }

    const randomDrawer = players[Math.floor(Math.random() * players.length)]

    // Update room and players
    await supabase!
      .from("rooms")
      .update({
        is_active: true,
        current_drawer_id: randomDrawer.user_id,
        time_left: 600,
        round_number: 1,
      })
      .eq("id", roomId)

    // Reset all players
    await supabase!
      .from("room_players")
      .update({
        is_drawing: false,
        has_guessed: false,
      })
      .eq("room_id", roomId)

    // Set drawer
    await supabase!
      .from("room_players")
      .update({
        is_drawing: true,
      })
      .eq("room_id", roomId)
      .eq("user_id", randomDrawer.user_id)
  }

  // Guess operations
  async submitGuess(roomId: string, userId: string, guess: string): Promise<{ isCorrect: boolean; points: number }> {
    if (!this.checkSupabase()) {
      const room = mockRooms.find((r) => r.id === roomId)
      if (!room) throw new Error("Room not found")

      const isCorrect = guess.toLowerCase().trim() === room.current_word?.toLowerCase()
      const points = isCorrect ? Math.max(10, Math.floor(room.time_left / 10)) : 0

      const user = mockUsers.find((u) => u.id === userId)
      const mockGuess: Guess & { users: User } = {
        id: `mock_guess_${Date.now()}`,
        room_id: roomId,
        user_id: userId,
        guess: guess.trim(),
        is_correct: isCorrect,
        created_at: new Date().toISOString(),
        users: user!,
      }

      mockGuesses.push(mockGuess)

      if (isCorrect) {
        const player = room.players.find((p) => p.user_id === userId)
        if (player) {
          player.score += points
          player.has_guessed = true
        }
        await this.updateUserStats(userId, points)
      }

      return { isCorrect, points }
    }

    // Get current room state
    const { data: room } = await supabase!.from("rooms").select("current_word, time_left").eq("id", roomId).single()

    if (!room) throw new Error("Room not found")

    const isCorrect = guess.toLowerCase().trim() === room.current_word?.toLowerCase()
    const points = isCorrect ? Math.max(10, Math.floor(room.time_left / 10)) : 0

    // Insert guess
    await supabase!.from("guesses").insert([
      {
        room_id: roomId,
        user_id: userId,
        guess: guess.trim(),
        is_correct: isCorrect,
      },
    ])

    // Update player score if correct
    if (isCorrect) {
      await supabase!
        .from("room_players")
        .update({
          score: supabase!.sql`score + ${points}`,
          has_guessed: true,
        })
        .eq("room_id", roomId)
        .eq("user_id", userId)

      // Update user total score
      await this.updateUserStats(userId, points)
    }

    return { isCorrect, points }
  }

  async getGuesses(roomId: string): Promise<(Guess & { users: User })[]> {
    if (!this.checkSupabase()) {
      return mockGuesses.filter((g) => g.room_id === roomId)
    }

    const { data, error } = await supabase!
      .from("guesses")
      .select(`
        *,
        users (*)
      `)
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data as any
  }

  // Drawing operations
  async saveDrawingStroke(roomId: string, userId: string, strokeData: any): Promise<void> {
    if (!this.checkSupabase()) {
      // In mock mode, just emit the event directly
      window.dispatchEvent(new CustomEvent("drawingUpdate", { detail: strokeData }))
      return
    }

    const { error } = await supabase!.from("drawing_strokes").insert([
      {
        room_id: roomId,
        user_id: userId,
        stroke_data: strokeData,
      },
    ])

    if (error) throw error
  }

  async clearDrawing(roomId: string): Promise<void> {
    if (!this.checkSupabase()) {
      return
    }

    const { error } = await supabase!.from("drawing_strokes").delete().eq("room_id", roomId)

    if (error) throw error
  }

  // Utility functions
  private generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Real-time subscriptions
  subscribeToRoom(roomId: string, callback: (payload: any) => void) {
    if (!this.checkSupabase()) {
      // Return a mock subscription
      return {
        unsubscribe: () => {},
      }
    }

    return supabase!
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${roomId}`,
        },
        callback,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        callback,
      )
      .subscribe()
  }

  subscribeToGuesses(roomId: string, callback: (payload: any) => void) {
    if (!this.checkSupabase()) {
      return {
        unsubscribe: () => {},
      }
    }

    return supabase!
      .channel(`guesses:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "guesses",
          filter: `room_id=eq.${roomId}`,
        },
        callback,
      )
      .subscribe()
  }

  subscribeToDrawing(roomId: string, callback: (payload: any) => void) {
    if (!this.checkSupabase()) {
      return {
        unsubscribe: () => {},
      }
    }

    return supabase!
      .channel(`drawing:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "drawing_strokes",
          filter: `room_id=eq.${roomId}`,
        },
        callback,
      )
      .subscribe()
  }
}

export const db = new DatabaseService()
