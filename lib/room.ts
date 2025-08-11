interface RoomPlayer {
  id: string
  name: string
  score: number
  isHost: boolean
  isDrawing: boolean
  hasGuessed: boolean
}

interface GameRoom {
  code: string
  name: string
  host: string
  hostName: string
  players: RoomPlayer[]
  maxPlayers: number
  isActive: boolean
  gameState?: any
  createdAt: string
  isPublic: boolean // New field to mark rooms as public for quick join
}

class RoomService {
  private rooms: Map<string, GameRoom> = new Map()

  generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  async createRoom(hostId: string, hostName: string, isPublic = true): Promise<{ room: GameRoom; code: string }> {
    const code = this.generateRoomCode()

    // Ensure unique code
    while (this.rooms.has(code)) {
      const newCode = this.generateRoomCode()
      if (!this.rooms.has(newCode)) {
        break
      }
    }

    const room: GameRoom = {
      code,
      name: `${hostName}'s Room`,
      host: hostId,
      hostName,
      players: [
        {
          id: hostId,
          name: hostName,
          score: 0,
          isHost: true,
          isDrawing: false,
          hasGuessed: false,
        },
      ],
      maxPlayers: 8,
      isActive: false,
      isPublic,
      createdAt: new Date().toISOString(),
    }

    this.rooms.set(code, room)
    return { room, code }
  }

  async joinRoom(code: string, playerId: string, playerName: string): Promise<GameRoom> {
    const room = this.rooms.get(code.toUpperCase())

    if (!room) {
      throw new Error("Room not found")
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error("Room is full")
    }

    if (room.players.some((p) => p.id === playerId)) {
      throw new Error("You are already in this room")
    }

    if (room.isActive) {
      throw new Error("Game is already in progress")
    }

    const newPlayer: RoomPlayer = {
      id: playerId,
      name: playerName,
      score: 0,
      isHost: false,
      isDrawing: false,
      hasGuessed: false,
    }

    room.players.push(newPlayer)
    this.rooms.set(code, room)

    return room
  }

  async joinRandomRoom(playerId: string, playerName: string): Promise<GameRoom> {
    // Get all public rooms that are not active and not full
    const availableRooms = Array.from(this.rooms.values()).filter(
      (room) =>
        room.isPublic &&
        !room.isActive &&
        room.players.length < room.maxPlayers &&
        room.players.length >= 1 && // Has at least the host
        !room.players.some((p) => p.id === playerId), // Player not already in room
    )

    if (availableRooms.length === 0) {
      throw new Error("No available rooms found. Try creating a new room or joining with a specific code.")
    }

    // Sort by number of players (prefer rooms with more players but not full)
    availableRooms.sort((a, b) => b.players.length - a.players.length)

    // Join the room with the most players
    const targetRoom = availableRooms[0]
    return this.joinRoom(targetRoom.code, playerId, playerName)
  }

  async leaveRoom(code: string, playerId: string): Promise<GameRoom | null> {
    const room = this.rooms.get(code.toUpperCase())

    if (!room) {
      return null
    }

    room.players = room.players.filter((p) => p.id !== playerId)

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(code)
      return null
    }

    // If host left, assign new host
    if (room.host === playerId && room.players.length > 0) {
      const newHost = room.players[0]
      newHost.isHost = true
      room.host = newHost.id
      room.hostName = newHost.name
    }

    this.rooms.set(code, room)
    return room
  }

  getRoom(code: string): GameRoom | null {
    return this.rooms.get(code.toUpperCase()) || null
  }

  getRooms(): GameRoom[] {
    return Array.from(this.rooms.values())
  }

  getPublicRooms(): GameRoom[] {
    return Array.from(this.rooms.values()).filter((room) => room.isPublic && !room.isActive)
  }
}

export const roomService = new RoomService()
export type { GameRoom, RoomPlayer }
