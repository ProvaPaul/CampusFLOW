using System.Linq.Expressions;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;
using MongoDB.Driver;

namespace CampusFlow.Infrastructure.Repositories;

public class MongoRepository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly IMongoCollection<T> Collection;

    public MongoRepository(IMongoCollection<T> collection)
    {
        Collection = collection;
    }

    public async Task<T?> GetByIdAsync(string id, CancellationToken ct = default) =>
        await Collection.Find(x => x.Id == id).FirstOrDefaultAsync(ct);

    public async Task<List<T>> GetAllAsync(CancellationToken ct = default) =>
        await Collection.Find(FilterDefinition<T>.Empty).ToListAsync(ct);

    public async Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        await Collection.Find(predicate).ToListAsync(ct);

    public async Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        await Collection.Find(predicate).FirstOrDefaultAsync(ct);

    public async Task<T> CreateAsync(T entity, CancellationToken ct = default)
    {
        await Collection.InsertOneAsync(entity, cancellationToken: ct);
        return entity;
    }

    public async Task UpdateAsync(T entity, CancellationToken ct = default) =>
        await Collection.ReplaceOneAsync(x => x.Id == entity.Id, entity, cancellationToken: ct);

    public async Task DeleteAsync(string id, CancellationToken ct = default) =>
        await Collection.DeleteOneAsync(x => x.Id == id, ct);

    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        await Collection.Find(predicate).AnyAsync(ct);
}
