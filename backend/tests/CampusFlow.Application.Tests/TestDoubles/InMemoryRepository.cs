using System.Linq.Expressions;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;

namespace CampusFlow.Application.Tests.TestDoubles;

/// <summary>
/// A simple in-memory stand-in for a MongoDB-backed repository, used so service unit tests
/// can exercise real LINQ predicates without spinning up a database.
/// </summary>
public class InMemoryRepository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly List<T> Items = new();

    public Task<T?> GetByIdAsync(string id, CancellationToken ct = default) =>
        Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

    public Task<List<T>> GetAllAsync(CancellationToken ct = default) =>
        Task.FromResult(Items.ToList());

    public Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        Task.FromResult(Items.AsQueryable().Where(predicate).ToList());

    public Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        Task.FromResult(Items.AsQueryable().Where(predicate).FirstOrDefault());

    public Task<T> CreateAsync(T entity, CancellationToken ct = default)
    {
        Items.Add(entity);
        return Task.FromResult(entity);
    }

    public Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        var index = Items.FindIndex(x => x.Id == entity.Id);
        if (index >= 0)
        {
            Items[index] = entity;
        }

        return Task.CompletedTask;
    }

    public Task DeleteAsync(string id, CancellationToken ct = default)
    {
        Items.RemoveAll(x => x.Id == id);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        Task.FromResult(Items.AsQueryable().Any(predicate));

    public void Seed(params T[] entities) => Items.AddRange(entities);
}
