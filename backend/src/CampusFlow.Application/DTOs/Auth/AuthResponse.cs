using CampusFlow.Application.DTOs.Users;

namespace CampusFlow.Application.DTOs.Auth;

public record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);
