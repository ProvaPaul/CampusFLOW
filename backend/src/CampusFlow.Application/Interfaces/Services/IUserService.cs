using CampusFlow.Application.DTOs.Users;

namespace CampusFlow.Application.Interfaces.Services;

public interface IUserService
{
    Task<List<UserDto>> GetAllAsync(CancellationToken ct = default);

    Task<UserDto> GetByIdAsync(string id, CancellationToken ct = default);

    Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default);

    Task<UserDto> UpdateAsync(string id, UpdateUserRequest request, CancellationToken ct = default);

    Task ResetPasswordAsync(string id, ResetPasswordRequest request, CancellationToken ct = default);

    Task DeleteAsync(string id, CancellationToken ct = default);
}
